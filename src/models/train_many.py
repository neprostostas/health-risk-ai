"""
Модуль навчання множини моделей машинного навчання для прогнозування ризиків здоров'я.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
    precision_recall_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.svm import SVC

# Опціональні імпорти для XGBoost та LightGBM
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("⚠️ XGBoost не встановлено. Модель XGBoost буде пропущено.")

try:
    from lightgbm import LGBMClassifier
    LIGHTGBM_AVAILABLE = True
except (ImportError, OSError, Exception):
    LIGHTGBM_AVAILABLE = False
    print("⚠️ LightGBM не доступний. Модель LightGBM буде пропущено.")

# Налаштування шляхів
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "datasets/processed/health_dataset.csv"
MODELS_DIR = PROJECT_ROOT / "artifacts/models"

# Цільові змінні
TARGETS = ["diabetes_present", "obesity_present"]

# Базові ознаки (LBXGLU може бути відсутня в датасеті)
BASE_FEATURES = ["RIDAGEYR", "RIAGENDR", "BMXBMI", "BPXSY1", "BPXDI1", "LBXTC"]
# LBXGLU додамо, якщо вона існує в датасеті

# Налаштування для навчання
TEST_SIZE = 0.2
RANDOM_STATE = 42

# Налаштування графіків
plt.rcParams["figure.figsize"] = (10, 8)
plt.rcParams["font.size"] = 10


def load_and_prepare_data(
    data_path: Path, target: str, features: List[str]
) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    """
    Завантажує дані та готує їх для навчання.
    
    Args:
        data_path: Шлях до CSV файлу з даними
        target: Назва цільової змінної
        features: Список ознак для використання
    
    Returns:
        Кортеж (X, y, available_features)
    """
    print(f"📊 Завантаження даних з {data_path}...")
    df = pd.read_csv(data_path, encoding="utf-8")
    
    # Перевірка наявності ознак
    available_features = [f for f in features if f in df.columns]
    missing_features = [f for f in features if f not in df.columns]
    
    if missing_features:
        print(f"⚠️ Відсутні ознаки: {missing_features}")
    
    # Додавання LBXGLU, якщо вона є в датасеті
    if "LBXGLU" in df.columns and "LBXGLU" not in available_features:
        available_features.append("LBXGLU")
    
    # Перевірка наявності цільової змінної
    if target not in df.columns:
        raise ValueError(f"Цільова змінна '{target}' не знайдена в датасеті")
    
    # Видалення рядків з пропущеними значеннями в обраних ознаках та цільовій змінній
    required_cols = available_features + [target]
    df_clean = df[required_cols].dropna()
    
    print(f"✅ Завантажено {len(df_clean)} рядків з {len(available_features)} ознаками")
    
    X = df_clean[available_features]
    y = df_clean[target]
    
    return X, y, available_features


def create_preprocessing_pipeline(numeric_features: List[str], categorical_features: List[str]) -> ColumnTransformer:
    """
    Створює пайплайн попередньої обробки даних.
    
    Args:
        numeric_features: Список числових ознак
        categorical_features: Список категоріальних ознак
    
    Returns:
        ColumnTransformer для попередньої обробки
    """
    # Пайплайн для числових ознак: імпутація медіаною -> стандартизація
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    
    # Пайплайн для категоріальних ознак: імпутація найчастішим значенням -> one-hot encoding
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False, drop="first")),
        ]
    )
    
    # Об'єднання трансформерів
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ],
        remainder="drop",
    )
    
    return preprocessor


def get_models() -> Dict[str, object]:
    """
    Повертає словник з моделями для навчання.
    
    Returns:
        Словник з назвами моделей та їх екземплярами
    """
    models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
        "RandomForest": RandomForestClassifier(
            n_estimators=300, max_depth=None, n_jobs=-1, random_state=RANDOM_STATE
        ),
        "SVC": SVC(
            kernel="rbf", probability=True, C=2.0, gamma="scale", random_state=RANDOM_STATE
        ),
        "KNN": KNeighborsClassifier(n_neighbors=15),
        "MLP": MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation="relu",
            max_iter=300,
            random_state=RANDOM_STATE,
        ),
    }
    
    # Додавання XGBoost, якщо доступний
    if XGBOOST_AVAILABLE:
        models["XGBoost"] = XGBClassifier(
            n_estimators=400,
            learning_rate=0.05,
            max_depth=4,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="logloss",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
    
    # Додавання LightGBM, якщо доступний
    if LIGHTGBM_AVAILABLE:
        models["LightGBM"] = LGBMClassifier(
            n_estimators=400,
            learning_rate=0.05,
            max_depth=-1,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=RANDOM_STATE,
            n_jobs=-1,
            verbose=-1,
        )
    
    return models


def get_predict_proba(model, X: np.ndarray) -> np.ndarray:
    """
    Отримує ймовірності передбачень від моделі.
    
    Args:
        model: Навчена модель
        X: Вхідні дані
    
    Returns:
        Масив ймовірностей передбачень
    """
    if hasattr(model, "predict_proba"):
        return model.predict_proba(X)[:, 1]
    elif hasattr(model, "decision_function"):
        # Перетворення decision_function на ймовірності через сигмоїду
        decision = model.decision_function(X)
        # Нормалізація до діапазону [0, 1]
        proba = 1 / (1 + np.exp(-decision))
        return proba
    else:
        raise ValueError("Модель не підтримує predict_proba або decision_function")


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> Dict[str, float]:
    """
    Обчислює метрики якості моделі.
    
    Args:
        y_true: Справжні значення
        y_pred: Передбачені значення (бінарні)
        y_proba: Передбачені ймовірності
    
    Returns:
        Словник з метриками
    """
    metrics = {
        "roc_auc": roc_auc_score(y_true, y_proba),
        "avg_precision": average_precision_score(y_true, y_proba),
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "brier": brier_score_loss(y_true, y_proba),
    }
    
    return metrics


def plot_roc_curve(y_true: np.ndarray, y_proba: np.ndarray, save_path: Path) -> None:
    """
    Побудова та збереження ROC-кривої.
    
    Args:
        y_true: Справжні значення
        y_proba: Передбачені ймовірності
        save_path: Шлях для збереження графіка
    """
    fpr, tpr, _ = roc_curve(y_true, y_proba)
    roc_auc = roc_auc_score(y_true, y_proba)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color="darkorange", lw=2, label=f"ROC крива (AUC = {roc_auc:.3f})")
    plt.plot([0, 1], [0, 1], color="navy", lw=2, linestyle="--", label="Випадкова модель")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("Частка хибнопозитивних (False Positive Rate)")
    plt.ylabel("Частка істиннопозитивних (True Positive Rate)")
    plt.title("ROC-крива")
    plt.legend(loc="lower right")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.close()


def plot_pr_curve(y_true: np.ndarray, y_proba: np.ndarray, save_path: Path) -> None:
    """
    Побудова та збереження Precision-Recall кривої.
    
    Args:
        y_true: Справжні значення
        y_proba: Передбачені ймовірності
        save_path: Шлях для збереження графіка
    """
    precision, recall, _ = precision_recall_curve(y_true, y_proba)
    avg_precision = average_precision_score(y_true, y_proba)
    
    plt.figure(figsize=(8, 6))
    plt.plot(recall, precision, color="blue", lw=2, label=f"PR крива (AP = {avg_precision:.3f})")
    plt.xlabel("Повнота (Recall)")
    plt.ylabel("Точність (Precision)")
    plt.title("Precision-Recall крива")
    plt.legend(loc="lower left")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.close()


def plot_calibration_curve(y_true: np.ndarray, y_proba: np.ndarray, save_path: Path) -> None:
    """
    Побудова та збереження кривої калібрування.
    
    Args:
        y_true: Справжні значення
        y_proba: Передбачені ймовірності
        save_path: Шлях для збереження графіка
    """
    fraction_of_positives, mean_predicted_value = calibration_curve(y_true, y_proba, n_bins=10)
    
    plt.figure(figsize=(8, 6))
    plt.plot(mean_predicted_value, fraction_of_positives, "s-", label="Модель")
    plt.plot([0, 1], [0, 1], "k--", label="Ідеальна калібровка")
    plt.xlabel("Середня передбачена ймовірність")
    plt.ylabel("Частка позитивних")
    plt.title("Крива калібрування")
    plt.legend(loc="upper left")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.close()


def plot_feature_importance(importances: Dict[str, float], save_path: Path) -> None:
    """
    Побудова та збереження графіка важливості ознак.
    
    Args:
        importances: Словник з назвами ознак та їх важливістю
        save_path: Шлях для збереження графіка
    """
    features = list(importances.keys())
    values = list(importances.values())
    
    # Сортування за важливістю
    sorted_indices = np.argsort(values)[::-1]
    features = [features[i] for i in sorted_indices]
    values = [values[i] for i in sorted_indices]
    
    plt.figure(figsize=(10, 6))
    plt.barh(range(len(features)), values)
    plt.yticks(range(len(features)), features)
    plt.xlabel("Важливість ознаки")
    plt.title("Важливість ознак (Permutation Importance)")
    plt.gca().invert_yaxis()
    plt.grid(True, alpha=0.3, axis="x")
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.close()


def train_model_for_target(
    X: pd.DataFrame,
    y: pd.Series,
    target: str,
    models: Dict[str, object],
    available_features: List[str],
) -> Dict[str, Dict]:
    """
    Навчає всі моделі для однієї цільової змінної.
    
    Args:
        X: Ознаки
        y: Цільова змінна
        target: Назва цільової змінної
        models: Словник з моделями
        available_features: Список доступних ознак
    
    Returns:
        Словник з результатами навчання
    """
    print(f"\n{'='*80}")
    print(f"Навчання моделей для цільової змінної: {target}")
    print(f"{'='*80}")
    
    # Розділення на тренувальну та тестову вибірки
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    
    print(f"Розмір тренувальної вибірки: {len(X_train)}")
    print(f"Розмір тестової вибірки: {len(X_test)}")
    
    # Визначення типів ознак
    numeric_features = [f for f in available_features if f != "RIAGENDR"]
    categorical_features = [f for f in available_features if f == "RIAGENDR"]
    
    # Створення пайплайну попередньої обробки
    preprocessor = create_preprocessing_pipeline(numeric_features, categorical_features)
    
    # Створення директорії для результатів
    target_dir = MODELS_DIR / target
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Результати навчання
    results = {}
    leaderboard_data = []
    
    # Навчання кожної моделі
    for model_name, model in models.items():
        print(f"\n🔹 Навчання моделі: {model_name}")
        
        try:
            # Створення повного пайплайну
            pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])
            
            # Навчання моделі
            pipeline.fit(X_train, y_train)
            
            # Передбачення на тестовій вибірці
            y_pred = pipeline.predict(X_test)
            
            # Отримання ймовірностей через pipeline
            try:
                y_proba = pipeline.predict_proba(X_test)[:, 1]
            except Exception:
                # Fallback для моделей без predict_proba
                X_test_transformed = pipeline.named_steps["preprocessor"].transform(X_test)
                y_proba = get_predict_proba(pipeline.named_steps["model"], X_test_transformed)
            
            # Збереження трансформованих даних для permutation importance
            X_test_transformed = pipeline.named_steps["preprocessor"].transform(X_test)
            
            # Обчислення метрик
            metrics = compute_metrics(y_test, y_pred, y_proba)
            
            print(f"  ROC-AUC: {metrics['roc_auc']:.4f}")
            print(f"  Average Precision: {metrics['avg_precision']:.4f}")
            print(f"  F1: {metrics['f1']:.4f}")
            
            # Збереження метрик
            model_dir = target_dir / model_name
            model_dir.mkdir(parents=True, exist_ok=True)
            
            with open(model_dir / "metrics.json", "w", encoding="utf-8") as f:
                json.dump(metrics, f, indent=2, ensure_ascii=False)
            
            # Побудова та збереження графіків
            plot_roc_curve(y_test, y_proba, model_dir / "roc.png")
            plot_pr_curve(y_test, y_proba, model_dir / "pr.png")
            plot_calibration_curve(y_test, y_proba, model_dir / "calibration.png")
            
            # Збереження моделі
            joblib.dump(pipeline, model_dir / "model.joblib")
            
            # Додавання до лідерборду
            leaderboard_data.append(
                {
                    "model": model_name,
                    "roc_auc": metrics["roc_auc"],
                    "avg_precision": metrics["avg_precision"],
                    "accuracy": metrics["accuracy"],
                    "precision": metrics["precision"],
                    "recall": metrics["recall"],
                    "f1": metrics["f1"],
                    "brier": metrics["brier"],
                }
            )
            
            results[model_name] = {
                "pipeline": pipeline,
                "metrics": metrics,
                "X_test": X_test,
                "y_test": y_test,
                "X_test_transformed": X_test_transformed,
            }
            
            print(f"  ✅ Модель збережено у {model_dir}")
            
        except Exception as e:
            print(f"  ❌ Помилка при навчанні {model_name}: {str(e)}")
            continue
    
    # Створення лідерборду
    if leaderboard_data:
        leaderboard = pd.DataFrame(leaderboard_data)
        leaderboard = leaderboard.sort_values(
            by=["roc_auc", "avg_precision"], ascending=[False, False]
        )
        leaderboard.to_csv(target_dir / "leaderboard.csv", index=False)
        
        print(f"\n📊 Лідерборд для {target}:")
        print(leaderboard[["model", "roc_auc", "avg_precision", "f1"]].head(3).to_string(index=False))
        
        # Визначення чемпіона
        champion_row = leaderboard.iloc[0]
        champion_name = champion_row["model"]
        
        # Знаходження метрик чемпіона
        champion_metrics = None
        for item in leaderboard_data:
            if item["model"] == champion_name:
                champion_metrics = item
                break
        
        if champion_metrics is None:
            champion_metrics = champion_row.to_dict()
        
        # Збереження метаданих чемпіона
        champion_metadata = {
            "model_name": champion_name,
            "path": str(target_dir / champion_name / "model.joblib"),
            "metrics": champion_metrics,
        }
        
        with open(target_dir / "champion.json", "w", encoding="utf-8") as f:
            json.dump(champion_metadata, f, indent=2, ensure_ascii=False)
        
        print(f"\n🏆 Чемпіон для {target}: {champion_name}")
        print(f"   ROC-AUC: {champion_metrics['roc_auc']:.4f}")
        print(f"   Average Precision: {champion_metrics['avg_precision']:.4f}")
        
        # Обчислення важливості ознак для чемпіона
        if champion_name in results:
            print(f"\n🔍 Обчислення важливості ознак для чемпіона...")
            try:
                champion_pipeline = results[champion_name]["pipeline"]
                X_test_champ = results[champion_name]["X_test"]
                y_test_champ = results[champion_name]["y_test"]
                X_test_transformed_champ = results[champion_name]["X_test_transformed"]
                
                # Отримання назв трансформованих ознак
                preprocessor = champion_pipeline.named_steps["preprocessor"]
                
                # Отримання назв ознак після трансформації
                try:
                    # Спробувати отримати назви ознак через get_feature_names_out
                    if hasattr(preprocessor, "get_feature_names_out"):
                        feature_names = list(preprocessor.get_feature_names_out(available_features))
                    else:
                        # Fallback: використання оригінальних назв ознак
                        feature_names = numeric_features.copy()
                        if categorical_features:
                            # Для категоріальних ознак додаємо закодовані назви
                            # OneHotEncoder з drop='first' створює n-1 колонок
                            for i in range(len(categorical_features)):
                                # Зазвичай створюється одна колонка для RIAGENDR (якщо drop='first')
                                feature_names.append(f"RIAGENDR_encoded")
                except Exception as e:
                    # Якщо не вдалося отримати назви, використовуємо оригінальні
                    feature_names = numeric_features.copy()
                    if categorical_features:
                        feature_names.append("RIAGENDR_encoded")
                    print(f"  ⚠️ Використано fallback для назв ознак: {str(e)}")
                
                # Перевірка кількості ознак
                n_features_transformed = X_test_transformed_champ.shape[1]
                if len(feature_names) != n_features_transformed:
                    # Якщо кількість не співпадає, створюємо загальні назви
                    feature_names = [f"feature_{i}" for i in range(n_features_transformed)]
                
                # Permutation importance
                model = champion_pipeline.named_steps["model"]
                perm_importance = permutation_importance(
                    model, X_test_transformed_champ, y_test_champ, n_repeats=10, random_state=RANDOM_STATE, n_jobs=-1
                )
                
                # Створення словника важливості ознак
                importances_dict = {
                    feature_names[i]: float(perm_importance.importances_mean[i])
                    for i in range(min(len(feature_names), len(perm_importance.importances_mean)))
                }
                
                # Збереження важливості ознак
                with open(target_dir / "champion_importance.json", "w", encoding="utf-8") as f:
                    json.dump(importances_dict, f, indent=2, ensure_ascii=False)
                
                # Побудова графіка важливості ознак
                plot_feature_importance(importances_dict, target_dir / "champion_importance.png")
                
                print(f"  ✅ Важливість ознак збережено")
                
            except Exception as e:
                print(f"  ⚠️ Помилка при обчисленні важливості ознак: {str(e)}")
                import traceback
                traceback.print_exc()
    
    return results


def main() -> None:
    """Головна функція для запуску навчання всіх моделей."""
    print("=" * 80)
    print("ЗАПУСК НАВЧАННЯ МОДЕЛЕЙ МАШИННОГО НАВЧАННЯ")
    print("=" * 80)
    
    # Створення директорії для моделей
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Навчання для кожної цільової змінної
    all_results = {}
    models = get_models()
    
    for target in TARGETS:
        # Завантаження та підготовка даних
        X, y, available_features = load_and_prepare_data(DATA_PATH, target, BASE_FEATURES)
        
        # Навчання моделей
        results = train_model_for_target(X, y, target, models, available_features)
        all_results[target] = results
    
    # Фінальне повідомлення
    print("\n" + "=" * 80)
    print("✅ Навчання завершено. Лідерборди та чемпіони збережено у artifacts/models/")
    print("=" * 80)
    
    # Виведення шляхів до лідербордів та чемпіонів
    for target in TARGETS:
        target_dir = MODELS_DIR / target
        leaderboard_path = target_dir / "leaderboard.csv"
        champion_path = target_dir / "champion.json"
        
        if leaderboard_path.exists():
            print(f"\n📊 {target}:")
            print(f"   Лідерборд: {leaderboard_path}")
            if champion_path.exists():
                print(f"   Чемпіон: {champion_path}")


if __name__ == "__main__":
    main()

