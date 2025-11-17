"""
FastAPI сервіс для обслуговування каліброваних чемпіонських моделей.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, Optional

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from starlette.requests import Request as StarletteRequest
from fastapi.staticfiles import StaticFiles
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split
from sqlmodel import Session

from src.service.auth_utils import get_current_user
from src.service.db import get_session, init_db
from src.service.models import User
from src.service.routes_auth import router as auth_router
from src.service.routes_auth import save_history_entry, users_router
from src.service.routers.assistant import router as assistant_router
from src.service.routers.chats import router as chats_router

from src.service.model_registry import (
    get_feature_schema,
    get_model_versions,
    load_champion,
    load_model,
)
from src.service.schemas import (
    ExplainResponse,
    FeatureImpact,
    MetadataResponse,
    PredictRequest,
    PredictResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Обробка подій життєвого циклу додатку."""
    # Startup: ініціалізація БД
    init_db()
    yield
    # Shutdown: очищення ресурсів (якщо потрібно)
    # Поки що нічого не робимо при завершенні


# Створення FastAPI додатку
app = FastAPI(
    title="Health Risk AI API",
    description="API для прогнозування ризиків здоров'я з використанням моделей машинного навчання",
    version="1.0.0",
    lifespan=lifespan,
)

# HTML routes must be defined BEFORE API routers to take precedence
# This ensures /chats serves HTML page, not API endpoint
@app.get("/chats", response_class=HTMLResponse)
async def serve_chats_page():
    """
    HTML route for /chats - serves SPA page only.
    Does NOT handle JSON/API requests - those are under /api/chats.
    
    IMPORTANT: This route does NOT enforce authentication on the backend.
    - HTML requests don't include Authorization header (token is in localStorage)
    - Frontend will handle auth checks and redirects via initializeAuth/showSectionForPath
    - Backend auth is enforced only on /api/chats* endpoints which require Authorization header
    
    This allows authenticated users to reload /chats and stay on /chats,
    while unauthenticated users will be redirected to /login by the frontend.
    """
    # Always return SPA HTML - let frontend handle authentication and routing
    print("🖥️ Видача сторінки /chats (HTML SPA)")
    return serve_frontend()

# Route for /c/:uuid chat URLs (SPA handles routing client-side)
@app.get("/c/{chat_uuid:path}", response_class=HTMLResponse)
async def serve_chat_page(
    chat_uuid: str,
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Повертає сторінку конкретного чату (SPA обробить роутинг та автентифікацію).
    Для неавтентифікованих користувачів перенаправляє на /login.
    """
    # Якщо користувач не автентифікований, перенаправляємо на /login
    if not current_user:
        print(f"🔄 Перенаправлення неавтентифікованого користувача з /c/{chat_uuid} на /login")
        return RedirectResponse(url="/login", status_code=302)
    
    print(f"🖥️ Видача сторінки /c/{chat_uuid}")
    return serve_frontend()

# Now include API routers (these will handle /chats API endpoints with proper prefixes)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(assistant_router)
# Mount chats API router under /api prefix
# This ensures clean separation: /chats = HTML, /api/chats = JSON API
app.include_router(chats_router, prefix="/api")

# Allowlist of valid routes that should NOT be redirected to /login
# This list is built from actual routes defined in this project
ALLOWLISTED_ROUTES = {
    "/",  # Root - handled separately with auth check
    "/app",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/profile",
    "/history",
    "/api-status",
    "/diagrams",
    "/assistant",
    "/form",
    "/chats",
}

# Routes that start with these prefixes are also allowlisted
ALLOWLISTED_PREFIXES = (
    "/c/",  # Chat UUID routes - handled separately with auth check
    "/auth/",
    "/users/",
    "/chats/",  # API endpoints
    "/assistant/",  # API endpoints
    "/static/",
    "/app/static/",
)

# Middleware для нормалізації URL (видалення подвійних слешів) та редіректу
class PathNormalizationMiddleware(BaseHTTPMiddleware):
    """
    Нормалізує URL шляхи, видаляючи подвійні та множинні слеші.
    Якщо нормалізований path відрізняється від оригінального, редіректить на нормалізований URL.
    """
    
    async def dispatch(self, request: StarletteRequest, call_next: ASGIApp):
        # Отримуємо оригінальний path
        original_path = request.url.path
        original_query = request.url.query
        
        # Нормалізуємо path: видаляємо подвійні та множинні слеші
        import re
        normalized_path = re.sub(r"/+", "/", original_path)
        
        # Видаляємо trailing slash, якщо це не просто "/"
        if normalized_path != "/" and normalized_path.endswith("/"):
            normalized_path = normalized_path.rstrip("/")
        
        # Якщо path не починається з "/", додаємо
        if not normalized_path.startswith("/"):
            normalized_path = f"/{normalized_path}"
        
        # Якщо path змінився, редіректимо на нормалізований URL
        if normalized_path != original_path:
            # Будуємо новий URL з нормалізованим path та оригінальним query string
            new_url = normalized_path
            if original_query:
                new_url = f"{normalized_path}?{original_query}"
            
            print(f"🔄 [Middleware] Redirecting: '{original_path}' → '{normalized_path}'")
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url=new_url, status_code=301)  # 301 Permanent Redirect
        
        # Якщо path не змінився, продовжуємо обробку
        response = await call_next(request)
        return response

# Додаємо middleware для нормалізації path (перед CORS)
app.add_middleware(PathNormalizationMiddleware)

# Увімкнення CORS для локального доступу
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:8000", "http://127.0.0.1:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Шлях до веб-ресурсів та монтування статичних файлів
WEB_DIR = Path(__file__).resolve().parent / "web"
app.mount("/app/static", StaticFiles(directory=WEB_DIR, html=False), name="app_static")

# Шлях до аватарів та монтування статичних файлів для аватарів
from src.service.avatar_utils import AVATARS_DIR
AVATARS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/avatars", StaticFiles(directory=AVATARS_DIR, html=False), name="avatars_static")


def serve_frontend() -> FileResponse:
    """Повертає єдину HTML-сторінку інтерфейсу."""
    if not WEB_DIR.exists():
        raise HTTPException(status_code=404, detail="Веб-інтерфейс недоступний")
    return FileResponse(WEB_DIR / "index.html")


@app.get("/app", response_class=HTMLResponse)
async def serve_app():
    """Повертає головну сторінку веб-інтерфейсу."""
    print("🖥️ Видача веб-інтерфейсу /app")
    return serve_frontend()


@app.get("/", response_class=HTMLResponse)
async def serve_root(
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Обробляє кореневий шлях "/".
    Для неавтентифікованих користувачів перенаправляє на /login.
    Для автентифікованих повертає головну сторінку.
    
    Примітка: URL з фрагментами (наприклад, http://127.0.0.1:8000//#$^^:::,kdd./login)
    не відправляють фрагмент на сервер, тому браузер відправить тільки "/" або "//" (після нормалізації "/").
    Це правильно обробляється як кореневий шлях.
    """
    # Якщо користувач не автентифікований, перенаправляємо на /login
    if not current_user:
        print("🔄 Перенаправлення неавтентифікованого користувача з / на /login")
        return RedirectResponse(url="/login", status_code=302)
    
    print("🖥️ Видача веб-інтерфейсу /")
    return serve_frontend()


@app.get("/login", response_class=HTMLResponse)
async def serve_login_page():
    print("🖥️ Видача сторінки /login")
    return serve_frontend()


@app.get("/register", response_class=HTMLResponse)
async def serve_register_page():
    print("🖥️ Видача сторінки /register")
    return serve_frontend()


@app.get("/profile", response_class=HTMLResponse)
async def serve_profile_page():
    print("🖥️ Видача сторінки /profile")
    return serve_frontend()


@app.get("/history", response_class=HTMLResponse)
async def serve_history_page():
    """Повертає сторінку історії прогнозів."""
    print("🖥️ Видача сторінки /history")
    return serve_frontend()


@app.get("/api-status", response_class=HTMLResponse)
async def serve_api_status_page():
    """Повертає сторінку статусу API."""
    print("🖥️ Видача сторінки /api-status")
    return serve_frontend()


@app.get("/diagrams", response_class=HTMLResponse)
async def serve_diagrams_page():
    print("🖥️ Видача сторінки /diagrams")
    return serve_frontend()


@app.get("/assistant", response_class=HTMLResponse)
async def serve_assistant_page():
    """Повертає сторінку чату з асистентом."""
    print("🖥️ Видача сторінки /assistant")
    return serve_frontend()

@app.get("/form", response_class=HTMLResponse)
async def serve_form_page():
    print("🖥️ Видача сторінки /form")
    return serve_frontend()


@app.get("/forgot-password", response_class=HTMLResponse)
async def serve_forgot_password_page():
    """Повертає сторінку відновлення пароля."""
    print("🖥️ Видача сторінки /forgot-password")
    return serve_frontend()


@app.get("/reset-password", response_class=HTMLResponse)
async def serve_reset_password_page():
    """Повертає сторінку встановлення нового пароля."""
    print("🖥️ Видача сторінки /reset-password")
    return serve_frontend()


# Налаштування ризикових категорій
RISK_THRESHOLDS = {"low": 0.2, "medium": 0.5, "high": 1.0}

# Доступні цільові змінні
AVAILABLE_TARGETS = ["diabetes_present", "obesity_present"]


def get_risk_bucket(probability: float) -> str:
    """
    Визначає категорію ризику на основі ймовірності.
    
    Args:
        probability: Ймовірність позитивного класу
    
    Returns:
        Категорія ризику (low, medium, high)
    """
    if probability < RISK_THRESHOLDS["low"]:
        return "low"
    elif probability < RISK_THRESHOLDS["medium"]:
        return "medium"
    else:
        return "high"


def calculate_top_factors_simple(
    pipeline, X: pd.DataFrame, y_proba: float, feature_names: list
) -> list[FeatureImpact]:
    """
    Обчислює топ факторів на основі нормалізованих значень ознак.
    
    Це спрощений підхід: використовуємо абсолютні значення ознак,
    нормалізовані до діапазону [0, 1], як проксі для впливу на прогноз.
    
    Args:
        pipeline: Навчена модель
        X: Вхідні дані
        y_proba: Передбачена ймовірність
        feature_names: Список назв ознак
    
    Returns:
        Список топ факторів з їх впливом
    """
    try:
        impacts = []
        
        # Обчислення впливу для кожної ознаки
        for feat_name in feature_names:
            if feat_name in X.columns:
                value = X[feat_name].iloc[0]
                
                if pd.notna(value):
                    # Нормалізація значення для числових ознак
                    if feat_name == "RIAGENDR":
                        # Для категоріальної ознаки використовуємо просте значення
                        impact_val = float(value)
                    else:
                        # Для числових ознак використовуємо абсолютне значення
                        # Нормалізуємо до діапазону [0, 1] на основі типових діапазонів
                        if feat_name == "RIDAGEYR":
                            impact_val = abs(value) / 100.0  # Нормалізація віку
                        elif feat_name == "BMXBMI":
                            impact_val = abs(value) / 50.0  # Нормалізація ІМТ
                        elif feat_name == "BPXSY1":
                            impact_val = abs(value) / 200.0  # Нормалізація систолічного тиску
                        elif feat_name == "BPXDI1":
                            impact_val = abs(value) / 150.0  # Нормалізація діастолічного тиску
                        elif feat_name == "LBXGLU":
                            impact_val = abs(value) / 200.0  # Нормалізація глюкози
                        elif feat_name == "LBXTC":
                            impact_val = abs(value) / 300.0  # Нормалізація холестерину
                        else:
                            impact_val = abs(value)
                    
                    impacts.append(FeatureImpact(feature=feat_name, impact=float(impact_val)))
        
        # Сортування за впливом (за спаданням)
        impacts.sort(key=lambda x: x.impact, reverse=True)
        
        return impacts[:5]  # Повертаємо топ-5 факторів
    
    except Exception as e:
        # У разі помилки повертаємо порожній список
        print(f"⚠️ Помилка при обчисленні топ факторів: {str(e)}")
        return []


@app.get("/health")
async def health_check():
    """
    Перевірка стану сервісу.
    
    Returns:
        Стан сервісу з додатковою інформацією
    """
    print("✅ Перевірка стану сервісу")
    from datetime import datetime
    
    # Отримуємо список маршрутів
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            methods = list(route.methods) if route.methods else []
            if "GET" in methods or "POST" in methods or "PUT" in methods or "DELETE" in methods:
                routes.append({
                    "path": route.path,
                    "methods": [m for m in methods if m != "HEAD" and m != "OPTIONS"]
                })
    
    return {
        "status": "ok",
        "message": "Сервіс працює нормально",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "routes": routes[:20],  # Обмежуємо кількість для продуктивності
        "total_routes": len(routes)
    }


@app.get("/metadata", response_model=MetadataResponse)
async def get_metadata():
    """
    Отримання метаданих API та моделей.
    
    Returns:
        Метадані API
    """
    print("📊 Запит метаданих")
    
    feature_schema = get_feature_schema()
    model_versions = get_model_versions()
    
    return MetadataResponse(
        targets=AVAILABLE_TARGETS,
        feature_schema=feature_schema,
        model_versions=model_versions,
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(
    target: str = Query(..., description="Цільова змінна"),
    model: Optional[str] = Query(None, description="Обрана модель (auto, logreg, random_forest тощо)"),
    request: PredictRequest = ...,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Прогнозування ризику для заданої цільової змінної.
    
    Args:
        target: Назва цільової змінної
        request: Дані для прогнозування
    
    Returns:
        Результат прогнозування
    """
    # Валідація target
    if target not in AVAILABLE_TARGETS:
        raise HTTPException(
            status_code=400,
            detail=f"Невідомий target: {target}. Доступні: {AVAILABLE_TARGETS}",
        )
    
    # Валідація обов'язкових полів
    missing_fields = request.validate_required_fields()
    if missing_fields:
        raise HTTPException(
            status_code=422,
            detail=f"Відсутні обов'язкові поля: {', '.join(missing_fields)}",
        )
    
    print(f"🔮 Прогнозування для {target}")
    
    try:
        # Завантаження моделі
        if model and model != "auto":
            pipeline, metadata = load_model(target, model)
        else:
            pipeline, metadata = load_champion(target, prefer_calibrated=True)
        
        # Підготовка даних
        feature_schema = get_feature_schema()
        feature_names = [feat["name"] for feat in feature_schema]
        
        # Створення DataFrame з одного рядка
        data = {}
        input_values = {}
        for feat_name in feature_names:
            value = getattr(request, feat_name, None)
            if value is not None:
                data[feat_name] = [value]
                input_values[feat_name] = value
            else:
                data[feat_name] = [None]
                input_values[feat_name] = None
        
        X = pd.DataFrame(data)
        
        # Передбачення ймовірності
        y_proba = pipeline.predict_proba(X)[0, 1]
        # Захист від екстремальних 0/1: м'який клємп у (0,1) для кращого UX і стабільних bucket'ів
        y_proba = max(0.0001, min(0.9999, float(y_proba)))
        
        # Визначення категорії ризику
        risk_bucket = get_risk_bucket(y_proba)
        
        # Обчислення топ факторів
        top_factors = calculate_top_factors_simple(pipeline, X, y_proba, feature_names)
        
        # Формування відповіді
        model_label = metadata.get("model_name", metadata.get("model_name_raw", "unknown"))
        response = PredictResponse(
            target=target,
            probability=float(y_proba),
            risk_bucket=risk_bucket,
            model_name=model_label,
            version=metadata.get("version", "1.0.0"),
            is_calibrated=metadata.get("is_calibrated", False),
            top_factors=top_factors,
            note="Топ фактори розраховані на основі абсолютних нормалізованих значень ознак",
        )
        
        if current_user:
            try:
                # Серіалізуємо top_factors у прості словники, щоб зберегти у JSON
                def _serialize_top_factors(items):
                    serializable = []
                    if not items:
                        return serializable
                    for it in items:
                        try:
                            if hasattr(it, "model_dump"):
                                data = it.model_dump()
                            elif hasattr(it, "dict"):
                                data = it.dict()
                            else:
                                data = {
                                    "feature": getattr(it, "feature", None),
                                    "impact": float(getattr(it, "impact", 0.0)),
                                }
                            # Примусово перетворюємо impact на float для надійності
                            if "impact" in data:
                                data["impact"] = float(data["impact"])
                            serializable.append(data)
                        except Exception:
                            # Fallback на безпечний формат
                            serializable.append({
                                "feature": str(getattr(it, "feature", "unknown")),
                                "impact": float(getattr(it, "impact", 0.0)),
                            })
                    return serializable
                
                top_factors_json = _serialize_top_factors(getattr(response, "top_factors", []))
                save_history_entry(
                    session=session,
                    user=current_user,
                    target=target,
                    model_name=model_label,
                    probability=float(y_proba),
                    risk_bucket=risk_bucket,
                    inputs={
                        **input_values,
                        "target": target,
                        "model": model or "auto",
                        # Зберігаємо top_factors у серіалізованому вигляді (list[dict])
                        "top_factors": top_factors_json,
                    },
                )
            except Exception as history_error:  # noqa: B902
                # Не перериваємо повернення відповіді, але логеруємо у консоль.
                print(f"⚠️ Не вдалося зберегти історію прогнозу: {history_error}")
        
        print(f"✅ Прогнозування завершено: probability={y_proba:.4f}, risk={risk_bucket}")
        
        return response
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Модель не знайдено: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка при прогнозуванні: {str(e)}")


@app.post("/explain", response_model=ExplainResponse)
async def explain_model(target: str = Query(..., description="Цільова змінна")):
    """
    Пояснення моделі через permutation importance.
    
    Args:
        target: Назва цільової змінної
    
    Returns:
        Важливість ознак
    """
    if target not in AVAILABLE_TARGETS:
        raise HTTPException(
            status_code=400,
            detail=f"Невідомий target: {target}. Доступні: {AVAILABLE_TARGETS}",
        )
    
    print(f"🔍 Пояснення моделі для {target}")
    
    try:
        # Завантаження моделі
        pipeline, metadata = load_champion(target, prefer_calibrated=True)
        
        # Завантаження тестових даних
        PROJECT_ROOT = Path(__file__).resolve().parents[2]
        DATA_PATH = PROJECT_ROOT / "datasets/processed/health_dataset.csv"
        
        df = pd.read_csv(DATA_PATH, encoding="utf-8")
        
        # Підготовка даних
        feature_schema = get_feature_schema()
        feature_names = [feat["name"] for feat in feature_schema if feat["name"] in df.columns]
        feature_names = [f for f in feature_names if f != target]
        
        # Видалення пропущених значень
        required_cols = feature_names + [target]
        df_clean = df[required_cols].dropna()
        
        # Вибір випадкової вибірки (n=256)
        sample_size = min(256, len(df_clean))
        df_sample = df_clean.sample(n=sample_size, random_state=42)
        
        X_sample = df_sample[feature_names]
        y_sample = df_sample[target]
        
        # Трансформація даних
        preprocessor = pipeline.named_steps["preprocessor"]
        X_transformed = preprocessor.transform(X_sample)
        
        # Отримання моделі
        model = pipeline.named_steps["model"]
        
        # Обчислення permutation importance
        perm_importance = permutation_importance(
            model, X_transformed, y_sample, n_repeats=3, random_state=42, n_jobs=-1
        )
        
        # Отримання назв ознак після трансформації
        try:
            if hasattr(preprocessor, "get_feature_names_out"):
                transformed_feature_names = list(preprocessor.get_feature_names_out(feature_names))
            else:
                # Fallback: використання оригінальних назв
                transformed_feature_names = feature_names
        except Exception:
            transformed_feature_names = feature_names
        
        # Формування списку важливості ознак
        importances = []
        for i, feat_name in enumerate(transformed_feature_names[: len(perm_importance.importances_mean)]):
            importances.append(
                FeatureImpact(
                    feature=feat_name,
                    impact=float(perm_importance.importances_mean[i]),
                )
            )
        
        # Сортування за важливістю
        importances.sort(key=lambda x: x.impact, reverse=True)
        
        response = ExplainResponse(
            target=target,
            feature_importances=importances,
            method="permutation_importance",
        )
        
        print(f"✅ Пояснення моделі завершено для {target}")
        
        return response
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Модель не знайдено: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка при поясненні моделі: {str(e)}")


# Placeholder для майбутнього веб-інтерфейсу
# app.mount("/app", StaticFiles(directory="static"), name="static")


@app.get("/health-risk/latest")
async def get_latest_health_risk(
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Повертає останній збережений прогноз ризику для поточного користувача.
    
    Якщо даних немає — повертає 204 No Content.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Необхідна автентифікація.")
    from sqlmodel import select
    from src.service.models import PredictionHistory
    stmt = (
        select(PredictionHistory)
        .where(PredictionHistory.user_id == current_user.id)
        .order_by(PredictionHistory.created_at.desc())
        .limit(1)
    )
    last = session.exec(stmt).first()
    if not last:
        return JSONResponse(status_code=204, content=None)
    # top_factors можуть бути в inputs.top_factors
    top_factors = []
    if isinstance(last.inputs, dict):
        top_factors = last.inputs.get("top_factors") or []
    return {
        "id": last.id,
        "target": last.target,
        "probability": last.probability,
        "risk_bucket": last.risk_bucket,
        "model_name": last.model_name,
        "top_factors": top_factors,
        "created_at": last.created_at.isoformat(),
    }


# Helper function to check if a path is in the allowlist
def is_path_allowlisted(path: str) -> bool:
    """
    Перевіряє, чи path знаходиться в allowlist.
    Повертає True, якщо path дозволений, False - якщо потрібно редіректити на /login.
    """
    # Перевіряємо точний збіг
    if path in ALLOWLISTED_ROUTES:
        return True
    
    # Перевіряємо префікси
    for prefix in ALLOWLISTED_PREFIXES:
        if path.startswith(prefix):
            return True
    
    # Перевіряємо статичні файли за розширенням
    static_extensions = (".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot")
    if path.lower().endswith(static_extensions):
        return True
    
    return False

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def catch_all_route(
    path: str,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Глобальний catch-all route для всіх невідомих маршрутів та всіх HTTP методів.
    
    Обробляє:
    - Невідомі шляхи (наприклад, /abc, /random/path)
    - Шляхи, які після нормалізації стають невідомими
    - URL з фрагментами (браузер не відправляє фрагмент на сервер)
    
    Логіка:
    1. Path вже нормалізований middleware (подвійні слеші видалені)
    2. Перевіряємо allowlist
    3. Якщо НЕ в allowlist → редірект на /login для неавтентифікованих
    4. Якщо в allowlist → це помилка (роут мав би бути оброблений раніше)
    """
    # Отримуємо нормалізований path з request (після middleware)
    normalized_path = request.url.path
    
    # Додаткова нормалізація на випадок, якщо middleware не спрацював
    import re
    normalized_path = re.sub(r"/+", "/", normalized_path)
    # Видаляємо trailing slash, якщо це не просто "/"
    if normalized_path != "/" and normalized_path.endswith("/"):
        normalized_path = normalized_path.rstrip("/")
    
    # Якщо path не починається з "/", додаємо
    if not normalized_path.startswith("/"):
        normalized_path = f"/{normalized_path}"
    
    # Логуємо для діагностики
    print(f"🔍 [Catch-all] Path: '{normalized_path}' | Method: {request.method} | Authenticated: {current_user is not None}")
    
    # Перевіряємо allowlist
    if is_path_allowlisted(normalized_path):
        # Якщо path в allowlist, але дійшов до catch-all - це помилка
        # (роут мав би бути оброблений раніше)
        print(f"⚠️ [Catch-all] Path '{normalized_path}' is in allowlist but reached catch-all - returning 404")
        raise HTTPException(status_code=404, detail="Маршрут не знайдено")
    
    # Path НЕ в allowlist - редіректимо на /login для неавтентифікованих
    # Для автентифікованих (GET) повертаємо HTML (SPA обробить)
    if request.method == "GET":
        if not current_user:
            print(f"🔄 [Catch-all] Redirecting unauthenticated user from '{normalized_path}' to /login")
            return RedirectResponse(url="/login", status_code=302)
        
        # Для автентифікованих користувачів повертаємо HTML (SPA обробить роутинг)
        print(f"🖥️ [Catch-all] Serving HTML for authenticated user at '{normalized_path}'")
        return serve_frontend()
    
    # Для не-GET методів повертаємо 404
    raise HTTPException(status_code=404, detail="Маршрут не знайдено")


if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Запуск FastAPI сервісу...")
    # Запускаємо на localhost, щоб браузер вважав походження безпечним (для мікрофона)
    uvicorn.run(app, host="127.0.0.1", port=8000)

