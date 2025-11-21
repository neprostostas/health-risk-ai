"""
Маршрути для аутентифікації користувачів та роботи з профілем.
"""

import secrets
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlmodel import select, Session

from .auth_utils import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_password_hash,
    require_current_user,
    verify_password,
)
from .i18n import get_accept_language, t
from .avatar_utils import AVATARS_DIR, delete_avatar, save_avatar, validate_image_file
from .db import get_session
from .models import PasswordResetToken, PredictionHistory, User
from .repositories import (
    add_prediction_history,
    block_user,
    delete_prediction,
    get_all_prediction_history,
    get_user_by_email,
    is_user_blocked,
    list_prediction_history,
    unblock_user,
    update_user_profile,
)
from .schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    PredictionHistoryItem,
    PredictionHistoryResponse,
    PredictionHistoryStats,
    ResetPasswordRequest,
    TokenResponse,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
    UserUpdateRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])
users_router = APIRouter(prefix="/users", tags=["users"])


def _build_profile_response(user: User) -> UserProfileResponse:
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        first_name=user.first_name,
        last_name=user.last_name,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        avatar_url=user.avatar_url,
        avatar_type=user.avatar_type or "generated",
        avatar_color=user.avatar_color,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def _issue_token_for_user(user: User) -> TokenResponse:
    access_token = create_access_token(
        subject=user.email,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenResponse(access_token=access_token, user=_build_profile_response(user))


def _build_history_response(session: Session, user: User, limit: int) -> PredictionHistoryResponse:
    limit = max(1, min(limit, 100))
    items = [
        PredictionHistoryItem(
            id=entry.id,
            target=entry.target,
            model_name=entry.model_name,
            probability=entry.probability,
            risk_bucket=entry.risk_bucket,
            inputs=entry.inputs,
            created_at=entry.created_at,
        )
        for entry in list_prediction_history(session, user.id, limit)
    ]
    return PredictionHistoryResponse(items=items)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: UserRegisterRequest,
    request: Request,
    session: Session = Depends(get_session),
) -> TokenResponse:
    """
    Реєстрація нового користувача.
    
    Валідує дані, перевіряє унікальність email, хешує пароль та створює користувача в БД.
    """
    lang = get_accept_language(request.headers)
    
    try:
        # Нормалізація email до нижнього регістру
        email = payload.email.lower().strip()
        
        # Базова валідація email (Pydantic вже валідує, але перевіряємо ще раз)
        if not email or "@" not in email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.register.invalidEmailFormat", lang=lang),
            )
        
        # Перевірка унікальності email
        existing = get_user_by_email(session, email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=t("auth.api.register.emailExists", lang=lang),
            )
        
        # Валідація імені та прізвища
        first_name = payload.first_name.strip()
        last_name = payload.last_name.strip()
        if len(first_name) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.register.firstNameRequired", lang=lang),
            )
        if len(last_name) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.register.lastNameRequired", lang=lang),
            )
        
        # Валідація статі
        if payload.gender not in ["male", "female"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.register.invalidGender", lang=lang),
            )
        
        # Валідація дати народження
        date_of_birth = None
        if payload.date_of_birth:
            try:
                from datetime import datetime as dt
                date_of_birth = dt.fromisoformat(payload.date_of_birth)
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("auth.api.register.invalidDateOfBirthFormat", lang=lang),
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.register.dateOfBirthRequired", lang=lang),
            )
        
        # display_name використовуємо з first_name для сумісності
        display_name = first_name
        
        # Перевірка мінімальної довжини пароля (вже валідується Pydantic)
        if len(payload.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.register.passwordTooShort", lang=lang),
            )
        
        # Перевірка максимальної довжини пароля (bcrypt обмеження 72 байти)
        password_bytes = payload.password.encode("utf-8")
        if len(password_bytes) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.register.passwordTooLong", lang=lang),
            )
        
        # Хешування пароля
        try:
            hashed_password = get_password_hash(payload.password)
        except ValueError as e:
            # Обробка помилок bcrypt (наприклад, пароль занадто довгий)
            error_msg = str(e).lower()
            if "cannot be longer than 72" in error_msg or "72 bytes" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("auth.api.register.passwordTooLong", lang=lang),
                ) from e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=t("auth.api.register.passwordHashingError", lang=lang),
            ) from e
        
        # Створення нового користувача
        user = User(
            email=email,
            hashed_password=hashed_password,
            display_name=display_name,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            gender=payload.gender,
            avatar_color="#5A64F1",
            avatar_type="generated",
            is_active=True,
        )
        
        # Додавання користувача до сесії та збереження в БД
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # Перевірка, що користувач успішно створений
        if user.id is None:
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=t("auth.api.register.userSaveError", lang=lang),
            )
        
        # Повернення токену та даних користувача
        return _issue_token_for_user(user)
        
    except HTTPException:
        # Передаємо HTTPException далі без змін
        raise
    except IntegrityError as e:
        # Обробка помилок унікальності з БД
        session.rollback()
        error_msg = str(e).lower()
        if "unique" in error_msg or "email" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=t("auth.api.register.emailExists", lang=lang),
            ) from e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("auth.api.register.userDataSaveError", lang=lang),
        ) from e
    except Exception as e:
        # Загальна обробка неочікуваних помилок
        session.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("auth.api.register.registrationError", lang=lang),
        ) from e


@router.post("/login", response_model=TokenResponse)
def login_user(
    payload: UserLoginRequest,
    request: Request,
    session: Session = Depends(get_session),
) -> TokenResponse:
    lang = get_accept_language(request.headers)
    
    try:
        email = payload.email.lower().strip()
        password = payload.password.strip()
        
        # Перевірка, що поля не порожні
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.login.emailEmpty", lang=lang),
            )
        if not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.login.passwordEmpty", lang=lang),
            )
        
        user = get_user_by_email(session, email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=t("auth.api.login.invalidCredentials", lang=lang),
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=t("auth.api.login.accountDeactivated", lang=lang),
            )
        return _issue_token_for_user(user)
    except HTTPException:
        raise
    except ValidationError as e:
        # Обробка помилок валідації Pydantic
        errors = []
        for error in e.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            msg = error["msg"]
            if "email" in field.lower():
                if "field required" in msg.lower():
                    errors.append(t("auth.api.login.emailEmpty", lang=lang))
                elif "value is not a valid email address" in msg.lower():
                    errors.append(t("auth.api.register.invalidEmailFormat", lang=lang))
                else:
                    errors.append(f"{t('auth.api.login.validationError', lang=lang)}: {msg}")
            elif "password" in field.lower():
                if "field required" in msg.lower():
                    errors.append(t("auth.api.login.passwordEmpty", lang=lang))
                elif "string_type" in msg.lower() or "type_error" in msg.lower():
                    errors.append(f"{t('auth.api.login.validationError', lang=lang)}: {msg}")
                else:
                    errors.append(f"{t('auth.api.login.validationError', lang=lang)}: {msg}")
            else:
                errors.append(f"{t('auth.api.login.validationError', lang=lang)}: {msg}")
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="; ".join(errors) if errors else t("auth.api.login.validationError", lang=lang),
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("auth.api.login.loginError", lang=lang),
        ) from e


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout_user(request: Request):
    """Логаут реалізується на клієнті. Повертаємо підтвердження."""
    lang = get_accept_language(request.headers)
    return {"message": t("auth.logout.message", lang=lang)}


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> dict:
    """
    Змінює пароль для залогіненого користувача.
    
    Вимогає поточний пароль, новий пароль та підтвердження нового пароля.
    """
    lang = get_accept_language(request.headers)
    
    try:
        # Перевірка, що confirm_new_password вказано
        if not payload.confirm_new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.changePassword.confirmPasswordRequired", lang=lang),
            )
        # Перевірка поточного пароля
        if not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.changePassword.invalidCurrentPassword", lang=lang),
            )
        
        # Перевірка, що новий пароль відрізняється від поточного
        if verify_password(payload.new_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.changePassword.passwordMustDiffer", lang=lang),
            )
        
        # Перевірка мінімальної довжини пароля
        if len(payload.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.changePassword.passwordTooShort", lang=lang),
            )
        
        # Перевірка максимальної довжини пароля (bcrypt обмеження 72 байти)
        password_bytes = payload.new_password.encode("utf-8")
        if len(password_bytes) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.changePassword.passwordTooLong", lang=lang),
            )
        
        # Хешування нового пароля
        try:
            new_hashed_password = get_password_hash(payload.new_password)
        except ValueError as e:
            error_msg = str(e).lower()
            if "cannot be longer than 72" in error_msg or "72 bytes" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("auth.api.changePassword.passwordTooLong", lang=lang),
                ) from e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=t("auth.api.changePassword.passwordHashingError", lang=lang),
            ) from e
        
        # Оновлення пароля
        current_user.hashed_password = new_hashed_password
        current_user.touch()
        session.add(current_user)
        session.commit()
        
        return {"message": t("auth.api.changePassword.passwordChanged", lang=lang)}
        
    except HTTPException:
        raise
    except ValidationError as e:
        # Обробка помилок валідації Pydantic
        errors = []
        for error in e.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            msg = error["msg"]
            if "password" in field.lower():
                if "min_length" in msg:
                    errors.append(t("auth.api.changePassword.passwordTooShort", lang=lang))
                elif "Паролі не співпадають" in str(error):
                    errors.append(t("profile.changePassword.passwordsNotMatch", lang=lang))
                else:
                    errors.append(f"{t('auth.api.changePassword.validationError', lang=lang)}: {msg}")
            else:
                errors.append(f"{t('auth.api.changePassword.validationError', lang=lang)}: {msg}")
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="; ".join(errors) if errors else t("auth.api.changePassword.validationError", lang=lang),
        ) from e
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("auth.api.changePassword.changePasswordError", lang=lang),
        ) from e


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    session: Session = Depends(get_session),
) -> dict:
    """
    Ініціює процес відновлення пароля.
    
    Генерує токен для відновлення пароля та симулює відправку інструкцій.
    Не розкриває, чи існує користувач з такою електронною поштою.
    """
    lang = get_accept_language(request.headers)
    
    try:
        email = payload.email.lower().strip()
        
        # Шукаємо користувача (але не розкриваємо результат для безпеки)
        user = get_user_by_email(session, email)
        
        if user:
            # Генеруємо безпечний токен
            token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(hours=24)  # Токен дійсний 24 години
            
            # Зберігаємо токен
            reset_token = PasswordResetToken(
                user_id=user.id,
                token=token,
                expires_at=expires_at,
                used=False,
            )
            session.add(reset_token)
            session.commit()
            
            # Для розробки виводимо токен в консоль та включаємо в відповідь
            reset_link = f"/reset-password?token={token}"
            
            # У реальному додатку тут була б відправка email
            # Для розробки повертаємо токен
            return {
                "reset_token": token,  # Тільки для розробки - для копіювання посилання
            }
        else:
            # Для дипломної версії повертаємо помилку, що користувача не знайдено
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=t("auth.api.forgotPassword.userNotFound", lang=lang),
            )
            
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        # Повертаємо generic повідомлення навіть при помилці
        return {
            "message": t("auth.api.forgotPassword.instructionsSent", lang=lang),
        }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    session: Session = Depends(get_session),
) -> dict:
    """
    Встановлює новий пароль через токен відновлення.
    
    Перевіряє токен, валідує новий пароль та оновлює пароль користувача.
    """
    lang = get_accept_language(request.headers)
    
    try:
        # Перевірка, що confirm_new_password вказано
        if not payload.confirm_new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.resetPassword.confirmPasswordRequired", lang=lang),
            )
        # Знаходимо токен
        statement = select(PasswordResetToken).where(
            PasswordResetToken.token == payload.token
        )
        reset_token = session.exec(statement).first()
        
        if not reset_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.resetPassword.invalidToken", lang=lang),
            )
        
        # Перевірка, чи токен використано
        if reset_token.used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.resetPassword.tokenUsed", lang=lang),
            )
        
        # Перевірка, чи токен не прострочений
        if datetime.utcnow() > reset_token.expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.resetPassword.tokenExpired", lang=lang),
            )
        
        # Знаходимо користувача
        user = session.get(User, reset_token.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=t("auth.api.resetPassword.userNotFound", lang=lang),
            )
        
        # Перевірка, що новий пароль відрізняється від поточного
        if verify_password(payload.new_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.resetPassword.passwordSameAsOld", lang=lang),
            )
        
        # Перевірка мінімальної довжини пароля
        if len(payload.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.resetPassword.passwordTooShort", lang=lang),
            )
        
        # Перевірка максимальної довжини пароля (bcrypt обмеження 72 байти)
        password_bytes = payload.new_password.encode("utf-8")
        if len(password_bytes) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.api.resetPassword.passwordTooLong", lang=lang),
            )
        
        # Хешування нового пароля
        try:
            new_hashed_password = get_password_hash(payload.new_password)
        except ValueError as e:
            error_msg = str(e).lower()
            if "cannot be longer than 72" in error_msg or "72 bytes" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("auth.api.resetPassword.passwordTooLong", lang=lang),
                ) from e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=t("auth.api.resetPassword.passwordHashingError", lang=lang),
            ) from e
        
        # Оновлення пароля користувача
        user.hashed_password = new_hashed_password
        user.touch()
        session.add(user)
        
        # Позначаємо токен як використаний
        reset_token.used = True
        session.add(reset_token)
        
        session.commit()
        
        return {"message": t("auth.api.resetPassword.passwordUpdated", lang=lang)}
        
    except HTTPException:
        raise
    except ValidationError as e:
        # Обробка помилок валідації Pydantic
        errors = []
        for error in e.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            msg = error["msg"]
            if "password" in field.lower():
                if "min_length" in msg:
                    errors.append(t("auth.api.resetPassword.passwordTooShort", lang=lang))
                elif "Паролі не співпадають" in str(error):
                    errors.append(t("profile.changePassword.passwordsNotMatch", lang=lang))
                else:
                    errors.append(f"{t('auth.api.resetPassword.validationError', lang=lang)}: {msg}")
            else:
                errors.append(f"{t('auth.api.resetPassword.validationError', lang=lang)}: {msg}")
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="; ".join(errors) if errors else t("auth.api.resetPassword.validationError", lang=lang),
        ) from e
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("auth.api.resetPassword.resetPasswordError", lang=lang),
        ) from e


@users_router.get("/me", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(require_current_user)) -> UserProfileResponse:
    return _build_profile_response(current_user)


@users_router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    payload: UserUpdateRequest,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> UserProfileResponse:
    """
    Оновлює профіль користувача.
    
    Не змінює avatar_type при оновленні інших полів.
    """
    lang = get_accept_language(request.headers)
    from datetime import datetime as dt
    
    # Не оновлюємо avatar_url напряму, щоб не перезаписати тип аватару
    # avatar_url оновлюється через окремі endpoints для аватару
    update_data = {}
    
    # first_name обов'язкове (новий підхід)
    if payload.first_name:
        update_data["first_name"] = payload.first_name.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("auth.api.profile.firstNameRequired", lang=lang),
        )
    
    # display_name опційне (для сумісності зі старими користувачами)
    # Якщо не передано display_name, використовуємо first_name як display_name
    if payload.display_name is not None:
        update_data["display_name"] = payload.display_name
    else:
        # Якщо display_name не передано, оновлюємо його з first_name для сумісності
        update_data["display_name"] = update_data["first_name"]
    
    # Додаємо інші поля (None або порожній рядок означає очищення поля)
    if payload.last_name is not None:
        update_data["last_name"] = payload.last_name.strip() if payload.last_name else None
    if payload.gender is not None:
        update_data["gender"] = payload.gender if payload.gender else None
    if payload.avatar_color is not None:
        update_data["avatar_color"] = payload.avatar_color
    
    # Обробляємо date_of_birth якщо він є (конвертуємо з рядка в datetime)
    if payload.date_of_birth is not None:
        if payload.date_of_birth:
            try:
                update_data["date_of_birth"] = dt.fromisoformat(payload.date_of_birth)
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("auth.api.profile.invalidDateOfBirthFormat", lang=lang),
                )
        else:
            # Порожня дата означає очищення
            update_data["date_of_birth"] = None
    
    if update_data:
        updated = update_user_profile(session, current_user, **update_data)
    else:
        updated = current_user
    
    return _build_profile_response(updated)


@users_router.post("/me/avatar", response_model=UserProfileResponse)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> UserProfileResponse:
    """
    Завантажує аватар користувача.
    
    Приймає файл зображення (PNG, JPG, JPEG) та зберігає його.
    """
    lang = get_accept_language(request.headers)
    
    try:
        # Читаємо вміст файлу
        content = await file.read()
        content_type = file.content_type or ""
        
        # Валідуємо файл
        try:
            extension, validated_content = validate_image_file(content_type, content)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            ) from e
        
        # Видаляємо старий аватар, якщо він існує
        # Видаляємо всі можливі файли аватара користувача (назви можуть відрізнятися)
        if current_user.avatar_type == "uploaded":
            delete_avatar(current_user.id)  # Видаляємо всі файли без вказання розширення
        
        # Зберігаємо новий аватар
        try:
            avatar_url, avatar_path = save_avatar(current_user.id, validated_content, extension)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            ) from e
        
        # Оновлюємо користувача
        updated = update_user_profile(
            session,
            current_user,
            avatar_url=avatar_url,
            avatar_type="uploaded",
        )
        
        return _build_profile_response(updated)
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("auth.api.profile.avatarUploadError", lang=lang),
        ) from e


@users_router.delete("/me/avatar", response_model=UserProfileResponse)
async def delete_user_avatar(
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> UserProfileResponse:
    """
    Видаляє завантажений аватар та повертається до згенерованого.
    """
    lang = get_accept_language(request.headers)
    
    try:
        # Видаляємо файл аватару, якщо він існує
        if current_user.avatar_type == "uploaded" and current_user.avatar_url:
            delete_avatar(current_user.id)
        
        # Оновлюємо користувача, повертаючись до згенерованого аватару
        updated = update_user_profile(
            session,
            current_user,
            avatar_url=None,
            avatar_type="generated",
        )
        
        return _build_profile_response(updated)
        
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("auth.api.profile.avatarDeleteError", lang=lang),
        ) from e


@router.get("/history", response_model=PredictionHistoryResponse)
async def get_history(
    limit: int = 20,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> PredictionHistoryResponse:
    return _build_history_response(session, current_user, limit)


@router.delete("/history/{prediction_id}", status_code=status.HTTP_200_OK)
async def delete_history_entry(
    prediction_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
):
    lang = get_accept_language(request.headers)
    deleted = delete_prediction(session, current_user.id, prediction_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.api.history.entryNotFound", lang=lang),
        )
    return {"message": t("auth.api.history.entryDeleted", lang=lang)}


def save_history_entry(
    session: Session,
    user: User,
    *,
    target: str,
    model_name: Optional[str],
    probability: float,
    risk_bucket: str,
    inputs: dict,
) -> None:
    """Допоміжна функція для збереження історії з інших маршрутів."""
    add_prediction_history(
        session=session,
        user_id=user.id,
        target=target,
        model_name=model_name,
        probability=probability,
        risk_bucket=risk_bucket,
        inputs=inputs,
    )


@users_router.patch("/me", response_model=UserProfileResponse)
async def patch_profile(
    payload: UserUpdateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> UserProfileResponse:
    """
    Оновлює профіль користувача (PATCH).
    
    Не змінює avatar_type при оновленні інших полів.
    """
    update_data = {
        "display_name": payload.display_name,
        "avatar_color": payload.avatar_color,
    }
    # Видаляємо None значення
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    if update_data:
        updated = update_user_profile(session, current_user, **update_data)
    else:
        updated = current_user
    
    return _build_profile_response(updated)


@users_router.patch("/{user_id}/block", response_model=dict)
async def block_user_endpoint(
    user_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> dict:
    """
    Блокує користувача.
    Користувач може блокувати інших користувачів.
    """
    lang = get_accept_language(request.headers)
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("auth.api.users.cannotBlockSelf", lang=lang),
        )
    
    target_user = session.get(User, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.api.users.userNotFound", lang=lang),
        )
    
    # Перевіряємо, чи вже заблоковано
    if is_user_blocked(session, current_user.id, user_id):
        return {
            "user_id": user_id,
            "is_blocked": True,
            "message": t("auth.api.users.userAlreadyBlocked", lang=lang),
        }
    
    # Блокуємо користувача
    block_user(session, current_user.id, user_id)
    
    return {
        "user_id": user_id,
        "is_blocked": True,
        "message": t("auth.api.users.userBlocked", lang=lang),
    }


@users_router.patch("/{user_id}/unblock", response_model=dict)
async def unblock_user_endpoint(
    user_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> dict:
    """
    Розблоковує користувача.
    """
    lang = get_accept_language(request.headers)
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("auth.api.users.cannotUnblockSelf", lang=lang),
        )
    
    target_user = session.get(User, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.api.users.userNotFound", lang=lang),
        )
    
    # Розблоковуємо користувача
    unblocked = unblock_user(session, current_user.id, user_id)
    
    if not unblocked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.api.users.userNotBlocked", lang=lang),
        )
    
    return {
        "user_id": user_id,
        "is_blocked": False,
        "message": t("auth.api.users.userUnblocked", lang=lang),
    }


@users_router.get("/me/history", response_model=PredictionHistoryResponse)
async def users_history(
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> PredictionHistoryResponse:
    """Повертає історію прогнозів користувача."""
    return _build_history_response(session, current_user, limit)


@users_router.get("/me/history/stats", response_model=PredictionHistoryStats)
async def users_history_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> PredictionHistoryStats:
    """Повертає статистику історії прогнозів користувача для діаграм."""
    from collections import defaultdict
    from datetime import datetime
    
    # Отримуємо всю історію (без ліміту)
    history = get_all_prediction_history(session, current_user.id)
    
    # Ініціалізуємо структури для підрахунку
    by_target = defaultdict(int)
    by_risk_bucket = defaultdict(int)
    by_model = defaultdict(int)
    by_target_and_risk = defaultdict(int)
    time_series = []
    
    # Обробляємо кожен запис
    for entry in history:
        by_target[entry.target] += 1
        by_risk_bucket[entry.risk_bucket] += 1
        model_key = entry.model_name or "unknown"
        by_model[model_key] += 1
        by_target_and_risk[f"{entry.target}:{entry.risk_bucket}"] += 1
        
        # Додаємо до часової серії
        time_series.append({
            "date": entry.created_at.isoformat(),
            "target": entry.target,
            "probability": entry.probability,
            "risk_bucket": entry.risk_bucket,
        })
    
    # Сортуємо часову серію за датою (від старіших до новіших)
    time_series.sort(key=lambda x: x["date"])
    
    return PredictionHistoryStats(
        total_predictions=len(history),
        by_target=dict(by_target),
        by_risk_bucket=dict(by_risk_bucket),
        by_model=dict(by_model),
        by_target_and_risk=dict(by_target_and_risk),
        time_series=time_series,
    )


@users_router.delete("/me/history/{prediction_id}", status_code=status.HTTP_200_OK)
async def users_delete_history_entry(
    prediction_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
):
    lang = get_accept_language(request.headers)
    deleted = delete_prediction(session, current_user.id, prediction_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.api.history.entryNotFound", lang=lang),
        )
    return {"message": t("auth.api.history.entryDeleted", lang=lang)}


@users_router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_account(
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> dict:
    """
    Видаляє обліковий запис поточного користувача.
    
    Видаляє:
    - Всю історію прогнозів користувача
    - Токени відновлення пароля
    - Завантажений аватар (якщо є)
    - Самого користувача з бази даних
    
    Ця дія незворотна. Тільки автентифікований користувач може видалити свій власний обліковий запис.
    """
    lang = get_accept_language(request.headers)
    
    try:
        user_id = current_user.id
        
        # Видаляємо всю історію прогнозів користувача
        history_statement = select(PredictionHistory).where(PredictionHistory.user_id == user_id)
        history_entries = session.exec(history_statement).all()
        for entry in history_entries:
            session.delete(entry)
        
        # Видаляємо токени відновлення пароля
        token_statement = select(PasswordResetToken).where(PasswordResetToken.user_id == user_id)
        reset_tokens = session.exec(token_statement).all()
        for token in reset_tokens:
            session.delete(token)
        
        # Видаляємо завантажений аватар, якщо він існує
        if current_user.avatar_type == "uploaded" and current_user.avatar_url:
            try:
                delete_avatar(user_id)
            except Exception as e:
                # Логуємо помилку, але не блокуємо видалення облікового запису
                pass
        
        # Видаляємо користувача
        session.delete(current_user)
        session.commit()
        
        return {"detail": t("auth.api.account.deleted", lang=lang)}
        
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        # Не розкриваємо деталі помилки для безпеки
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=t("auth.api.account.deleteError", lang=lang),
        ) from e


