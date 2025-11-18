"""
Реєстр моделей для завантаження та кешування чемпіонських моделей.
"""

import json
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
from sklearn.pipeline import Pipeline

# Налаштування шляхів
PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = PROJECT_ROOT / "artifacts/models"

# Кеш моделей в пам'яті
_MODEL_CACHE: Dict[str, Tuple[Pipeline, Dict]] = {}
_SPECIFIC_MODEL_CACHE: Dict[str, Tuple[Pipeline, Dict]] = {}

# Мапінг ключів моделей до назв директорій
MODEL_KEY_MAP: Dict[str, str] = {
    "logreg": "LogisticRegression",
    "random_forest": "RandomForest",
    "xgb": "XGBoost",
    "lgbm": "LightGBM",
    "svm": "SVC",
    "knn": "KNN",
    "mlp": "MLP",
}

# Людські назви моделей для інтерфейсу
MODEL_LABELS: Dict[str, str] = {
    "LogisticRegression": "Логістична регресія",
    "RandomForest": "Random Forest",
    "XGBoost": "XGBoost",
    "LightGBM": "LightGBM",
    "SVC": "SVM",
    "KNN": "K-Nearest Neighbors",
    "MLP": "Нейромережа (MLP)",
}


def load_champion(target: str, prefer_calibrated: bool = True) -> Tuple[Pipeline, Dict]:
    """
    Завантажує чемпіонську модель для цільової змінної.
    
    Args:
        target: Назва цільової змінної
        prefer_calibrated: Чи віддавати перевагу каліброваній моделі
    
    Returns:
        Кортеж (pipeline, metadata)
    """
    # Перевірка кешу
    cache_key = f"{target}_{prefer_calibrated}"
    if cache_key in _MODEL_CACHE:
        return _MODEL_CACHE[cache_key]
    
    # Завантаження метаданих
    champion_path = MODELS_DIR / target / "champion.json"
    
    if not champion_path.exists():
        raise FileNotFoundError(f"Метадані чемпіона не знайдено: {champion_path}")
    
    with open(champion_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    raw_name = metadata.get("model_name")
    if raw_name:
        metadata["model_name_raw"] = raw_name
        metadata["model_name"] = MODEL_LABELS.get(raw_name, raw_name)
        for key, folder in MODEL_KEY_MAP.items():
            if folder == raw_name:
                metadata["model_key"] = key
                break
    metadata.setdefault("version", "champion")

    # Спроба завантажити калібровану модель
    if prefer_calibrated:
        calibrated_path = MODELS_DIR / target / "champion_calibrated.joblib"
        if calibrated_path.exists():
            pipeline = joblib.load(calibrated_path)
            metadata["is_calibrated"] = True
            metadata["model_path"] = str(calibrated_path)
            _MODEL_CACHE[cache_key] = (pipeline, metadata)
            return pipeline, metadata
    
    # Fallback до звичайної моделі
    model_path = Path(metadata["path"])
    if not model_path.exists():
        raise FileNotFoundError(f"Модель чемпіона не знайдено: {model_path}")
    
    pipeline = joblib.load(model_path)
    metadata["is_calibrated"] = False
    metadata["model_path"] = str(model_path)
    _MODEL_CACHE[cache_key] = (pipeline, metadata)
    
    return pipeline, metadata


def _read_metrics(model_dir: Path) -> Dict:
    """Зчитує метрики моделі з файлу metrics.json, якщо доступно."""
    metrics_path = model_dir / "metrics.json"
    if metrics_path.exists():
        with open(metrics_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_model(target: str, model_key: str) -> Tuple[Pipeline, Dict]:
    """
    Завантажує конкретну модель для цільової змінної за ключем.
    
    Args:
        target: Назва цільової змінної
        model_key: Ключ моделі (logreg, random_forest тощо)
    
    Returns:
        Кортеж (pipeline, metadata)
    """
    if model_key not in MODEL_KEY_MAP:
        raise ValueError(f"Невідомий ключ моделі: {model_key}")

    model_folder = MODEL_KEY_MAP[model_key]
    cache_key = f"{target}_{model_folder}"

    if cache_key in _SPECIFIC_MODEL_CACHE:
        return _SPECIFIC_MODEL_CACHE[cache_key]

    model_dir = MODELS_DIR / target / model_folder
    model_path = model_dir / "model.joblib"

    if not model_path.exists():
        raise FileNotFoundError(f"Модель {model_folder} не знайдено за шляхом: {model_path}")

    pipeline = joblib.load(model_path)

    metadata = {
        "model_name": MODEL_LABELS.get(model_folder, model_folder),
        "model_key": model_key,
        "model_path": str(model_path),
        "is_calibrated": False,
        "metrics": _read_metrics(model_dir),
        "version": "custom",
    }

    _SPECIFIC_MODEL_CACHE[cache_key] = (pipeline, metadata)

    return pipeline, metadata


def get_feature_schema() -> List[Dict]:
    """
    Повертає схему ознак для валідації вхідних даних.
    
    Returns:
        Список словників з описом ознак
    """
    schema = [
        {
            "name": "RIDAGEYR",
            "dtype": "float",
            "description": "Вік особи (роки)",
            "required": True,
            "min": 0,
            "max": 120,
        },
        {
            "name": "RIAGENDR",
            "dtype": "int",
            "description": "Стать",
            "required": True,
            "allowed_values": [1, 2],
        },
        {
            "name": "BMXBMI",
            "dtype": "float",
            "description": "Індекс маси тіла (ІМТ)",
            "required": True,
            "min": 10,
            "max": 60,
        },
        {
            "name": "BPXSY1",
            "dtype": "float",
            "description": "Систолічний артеріальний тиск (мм рт.ст.)",
            "required": False,
            "min": 50,
            "max": 250,
        },
        {
            "name": "BPXDI1",
            "dtype": "float",
            "description": "Діастолічний артеріальний тиск (мм рт.ст.)",
            "required": False,
            "min": 30,
            "max": 150,
        },
        {
            "name": "LBXGLU",
            "dtype": "float",
            "description": "Рівень глюкози в крові (мг/дл)",
            "required": False,
            "min": 50,
            "max": 500,
        },
        {
            "name": "LBXTC",
            "dtype": "float",
            "description": "Загальний холестерин (мг/дл)",
            "required": False,
            "min": 100,
            "max": 400,
        },
    ]
    
    return schema


def get_model_versions() -> Dict[str, Dict]:
    """
    Отримує версії моделей для всіх targets.
    
    Returns:
        Словник з версіями моделей для кожного target
    """
    versions = {}
    targets = ["diabetes_present", "obesity_present"]
    
    for target in targets:
        champion_path = MODELS_DIR / target / "champion.json"
        if champion_path.exists():
            with open(champion_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
                raw_name = metadata.get("model_name")
                display_name = MODEL_LABELS.get(raw_name, raw_name)
                model_key = None
                for key, folder in MODEL_KEY_MAP.items():
                    if folder == raw_name:
                        model_key = key
                        break
                versions[target] = {
                    "model_name": display_name,
                    "model_key": model_key,
                    "is_calibrated": (MODELS_DIR / target / "champion_calibrated.joblib").exists(),
                    "metrics": metadata.get("metrics", {}),
                }
    
    return versions

