"""
Модуль для калібрування чемпіонських моделей машинного навчання.
"""

import json
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

# Налаштування шляхів
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "datasets/processed/health_dataset.csv"
MODELS_DIR = PROJECT_ROOT / "artifacts/models"

# Цільові змінні
TARGETS = ["diabetes_present", "obesity_present"]

# Базові ознаки
BASE_FEATURES = ["RIDAGEYR", "RIAGENDR", "BMXBMI", "BPXSY1", "BPXDI1", "LBXTC"]
# LBXGLU додамо, якщо вона існує в датасеті

# Налаштування для навчання
TEST_SIZE = 0.2
RANDOM_STATE = 42

# Налаштування графіків
plt.rcParams["figure.figsize"] = (10, 8)
plt.rcParams["font.size"] = 10


def load_champion(target: str) -> Tuple[object, Dict]:
    """
    Завантажує чемпіонську модель та її метадані.
    
    Args:
        target: Назва цільової змінної
    
    Returns:
        Кортеж (pipeline, metadata)
    """
    champion_path = MODELS_DIR / target / "champion.json"
    
    if not champion_path.exists():
        raise FileNotFoundError(f"Метадані чемпіона не знайдено: {champion_path}")
    
    with open(champion_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    
    model_path = Path(metadata["path"])
    
    if not model_path.exists():
        raise FileNotFoundError(f"Модель чемпіона не знайдено: {model_path}")
    
    pipeline = joblib.load(model_path)
    
    return pipeline, metadata


def load_and_prepare_data(target: str) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    """
    Завантажує та готує дані для навчання.
    
    Args:
        target: Назва цільової змінної
    
    Returns:
        Кортеж (X_train, X_test, y_train, y_test, available_features)
    """
    print(f"📊 Завантаження даних для {target}...")
    df = pd.read_csv(DATA_PATH, encoding="utf-8")
    
    # Перевірка наявності ознак
    available_features = [f for f in BASE_FEATURES if f in df.columns]
    
    # Додавання LBXGLU, якщо вона є в датасеті
    if "LBXGLU" in df.columns and "LBXGLU" not in available_features:
        available_features.append("LBXGLU")
    
    if target not in df.columns:
        raise ValueError(f"Цільова змінна '{target}' не знайдена в датасеті")
    
    # Видалення рядків з пропущеними значеннями
    required_cols = available_features + [target]
    df_clean = df[required_cols].dropna()
    
    print(f"✅ Завантажено {len(df_clean)} рядків з {len(available_features)} ознаками")
    
    X = df_clean[available_features]
    y = df_clean[target]
    
    # Розділення на тренувальну та тестову вибірки
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    
    return X_train, X_test, y_train, y_test, available_features


def evaluate_model(
    pipeline: object, X: pd.DataFrame, y: pd.Series, title: str = ""
) -> Dict[str, float]:
    """
    Оцінює модель та обчислює метрики.
    
    Args:
        pipeline: Навчена модель
        X: Ознаки
        y: Цільова змінна
        title: Заголовок для виведення
    
    Returns:
        Словник з метриками
    """
    # Передбачення ймовірностей
    y_proba = pipeline.predict_proba(X)[:, 1]
    
    # Обчислення метрик
    roc_auc = roc_auc_score(y, y_proba)
    avg_precision = average_precision_score(y, y_proba)
    brier = brier_score_loss(y, y_proba)
    
    metrics = {
        "roc_auc": float(roc_auc),
        "avg_precision": float(avg_precision),
        "brier": float(brier),
    }
    
    if title:
        print(f"📊 {title}: Brier={brier:.4f}, ROC-AUC={roc_auc:.4f}, AUPRC={avg_precision:.4f}")
    
    return metrics, y_proba


def plot_calibration_curve(
    y_true: np.ndarray, y_proba: np.ndarray, title: str, save_path: Path
) -> None:
    """
    Побудова та збереження кривої калібрування.
    
    Args:
        y_true: Справжні значення
        y_proba: Передбачені ймовірності
        title: Заголовок графіка
        save_path: Шлях для збереження
    """
    fraction_of_positives, mean_predicted_value = calibration_curve(
        y_true, y_proba, n_bins=10
    )
    
    plt.figure(figsize=(8, 6))
    plt.plot(
        mean_predicted_value,
        fraction_of_positives,
        "s-",
        label="Модель",
        linewidth=2,
        markersize=8,
    )
    plt.plot([0, 1], [0, 1], "k--", label="Ідеальна калібровка", linewidth=2)
    plt.xlabel("Ймовірність моделі")
    plt.ylabel("Фактична частка позитивних випадків")
    plt.title(title)
    plt.legend(loc="upper left")
    plt.grid(True, alpha=0.3)
    plt.xlim([0, 1])
    plt.ylim([0, 1])
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.close()


def calibrate_model(
    pipeline: object, X_train: pd.DataFrame, y_train: pd.Series, X_val: pd.DataFrame, y_val: pd.Series, methods: list = ["isotonic", "sigmoid"]
) -> Tuple[object, str]:
    """
    Калібрує модель за допомогою CalibratedClassifierCV.
    
    Args:
        pipeline: Навчена модель (pipeline)
        X_train: Тренувальні дані
        y_train: Тренувальні цільові значення
        X_val: Валідаційні дані для вибору методу
        y_val: Валідаційні цільові значення
        methods: Список методів калібрування для тестування
    
    Returns:
        Кортеж (калібрована модель, найкращий метод)
    """
    # Отримання фінального естиматора з pipeline
    base_estimator = pipeline.named_steps["model"]
    preprocessor = pipeline.named_steps["preprocessor"]
    
    # Трансформація даних
    X_train_transformed = preprocessor.transform(X_train)
    X_val_transformed = preprocessor.transform(X_val)
    
    # Тестування методів калібрування
    best_method = None
    best_brier = float("inf")
    best_calibrated = None
    
    for method in methods:
        try:
            # Створення каліброваної моделі
            calibrated = CalibratedClassifierCV(base_estimator, method=method, cv=5, n_jobs=-1)
            
            # Навчання каліброваної моделі на тренувальних даних
            calibrated.fit(X_train_transformed, y_train)
            
            # Оцінка на валідаційній вибірці
            y_proba_cal = calibrated.predict_proba(X_val_transformed)[:, 1]
            brier = brier_score_loss(y_val, y_proba_cal)
            
            if brier < best_brier:
                best_brier = brier
                best_method = method
                best_calibrated = calibrated
        except Exception as e:
            print(f"⚠️ Помилка при калібруванні методом {method}: {str(e)}")
            continue
    
    if best_calibrated is None:
        raise ValueError("Не вдалося створити калібровану модель")
    
    # Переобучення найкращої каліброваної моделі на всіх тренувальних даних
    # Використовуємо cv=3 для переобучення на всіх даних
    final_calibrated = CalibratedClassifierCV(base_estimator, method=best_method, cv=5, n_jobs=-1)
    final_calibrated.fit(X_train_transformed, y_train)
    
    # Створення нового pipeline з каліброваною моделлю
    from sklearn.pipeline import Pipeline
    
    calibrated_pipeline = Pipeline(
        steps=[("preprocessor", preprocessor), ("model", final_calibrated)]
    )
    
    return calibrated_pipeline, best_method


def calibrate_champion_for_target(target: str) -> None:
    """
    Калібрує чемпіонську модель для однієї цільової змінної.
    
    Args:
        target: Назва цільової змінної
    """
    print(f"\n{'='*80}")
    print(f"🔄 Калібрування моделі для цілі {target}...")
    print(f"{'='*80}")
    
    # Завантаження чемпіонської моделі
    pipeline, metadata = load_champion(target)
    
    # Завантаження та підготовка даних
    X_train, X_test, y_train, y_test, available_features = load_and_prepare_data(target)
    
    # Розділення тренувальних даних на train та validation для вибору методу калібрування
    X_train_cal, X_val_cal, y_train_cal, y_val_cal = train_test_split(
        X_train, y_train, test_size=0.2, random_state=RANDOM_STATE, stratify=y_train
    )
    
    # Оцінка некаліброваної моделі
    print("\n📊 Оцінка некаліброваної моделі:")
    metrics_before, y_proba_before = evaluate_model(
        pipeline, X_test, y_test, "До калібрування"
    )
    
    # Побудова графіка калібрування до калібрування
    target_dir = MODELS_DIR / target
    plot_calibration_curve(
        y_test.values,
        y_proba_before,
        "Крива калібрування (До калібрування)",
        target_dir / "calibration_before.png",
    )
    print(f"✅ Збережено графік: calibration_before.png")
    
    # Калібрування моделі
    print("\n🔧 Калібрування моделі...")
    calibrated_pipeline, best_method = calibrate_model(
        pipeline, X_train_cal, y_train_cal, X_val_cal, y_val_cal
    )
    print(f"➡️ Обраний метод калібрування: {best_method}")
    
    # Оцінка каліброваної моделі
    print("\n📊 Оцінка каліброваної моделі:")
    metrics_after, y_proba_after = evaluate_model(
        calibrated_pipeline, X_test, y_test, "Після калібрування"
    )
    
    # Побудова графіка калібрування після калібрування
    plot_calibration_curve(
        y_test.values,
        y_proba_after,
        "Крива калібрування (Після калібрування)",
        target_dir / "calibration_after.png",
    )
    print(f"✅ Збережено графік: calibration_after.png")
    
    # Збереження метрик до/після
    metrics_comparison = {
        "before": metrics_before,
        "after": metrics_after,
        "improvement": {
            "brier": metrics_before["brier"] - metrics_after["brier"],
            "roc_auc": metrics_after["roc_auc"] - metrics_before["roc_auc"],
            "avg_precision": metrics_after["avg_precision"] - metrics_before["avg_precision"],
        },
        "calibration_method": best_method,
    }
    
    with open(target_dir / "metrics_before_after.json", "w", encoding="utf-8") as f:
        json.dump(metrics_comparison, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Збережено метрики: metrics_before_after.json")
    
    # Збереження каліброваної моделі
    calibrated_model_path = target_dir / "champion_calibrated.joblib"
    joblib.dump(calibrated_pipeline, calibrated_model_path)
    
    print(f"✅ Збережено калібровану модель: champion_calibrated.joblib")
    
    # Виведення покращення
    print("\n📈 Покращення метрик:")
    print(
        f"   Brier score: {metrics_before['brier']:.4f} → {metrics_after['brier']:.4f} "
        f"({metrics_comparison['improvement']['brier']:+.4f})"
    )
    print(
        f"   ROC-AUC: {metrics_before['roc_auc']:.4f} → {metrics_after['roc_auc']:.4f} "
        f"({metrics_comparison['improvement']['roc_auc']:+.4f})"
    )
    print(
        f"   AUPRC: {metrics_before['avg_precision']:.4f} → {metrics_after['avg_precision']:.4f} "
        f"({metrics_comparison['improvement']['avg_precision']:+.4f})"
    )
    
    print(f"\n💾 Збережено: champion_calibrated.joblib, calibration_*.png, metrics_before_after.json")


def main() -> None:
    """Головна функція для запуску калібрування чемпіонських моделей."""
    print("=" * 80)
    print("ЗАПУСК КАЛІБРУВАННЯ ЧЕМПІОНСЬКИХ МОДЕЛЕЙ")
    print("=" * 80)
    
    # Калібрування для кожної цільової змінної
    for target in TARGETS:
        try:
            calibrate_champion_for_target(target)
        except Exception as e:
            print(f"❌ Помилка при калібруванні для {target}: {str(e)}")
            import traceback
            traceback.print_exc()
            continue
    
    print("\n" + "=" * 80)
    print("✅ Калібрування завершено")
    print("=" * 80)


if __name__ == "__main__":
    # Запуск калібрування для обох цілей
    main()

