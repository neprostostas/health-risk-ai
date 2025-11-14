"""
Модуль для агрегації та підсумкування результатів навчання моделей.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import pandas as pd

# Налаштування шляхів
PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = PROJECT_ROOT / "artifacts/models"
OUTPUT_DIR = PROJECT_ROOT / "artifacts"
SUMMARY_CSV = OUTPUT_DIR / "leaderboards_summary.csv"
SUMMARY_MD = OUTPUT_DIR / "summary.md"

# Цільові змінні
TARGETS = ["diabetes_present", "obesity_present"]


def load_leaderboard(target: str) -> pd.DataFrame:
    """
    Завантажує лідерборд для цільової змінної.
    
    Args:
        target: Назва цільової змінної
    
    Returns:
        DataFrame з лідербордом
    """
    leaderboard_path = MODELS_DIR / target / "leaderboard.csv"
    
    if not leaderboard_path.exists():
        print(f"⚠️ Лідерборд не знайдено для {target}: {leaderboard_path}")
        return pd.DataFrame()
    
    df = pd.read_csv(leaderboard_path)
    df["target"] = target
    
    return df


def load_champion(target: str) -> Dict:
    """
    Завантажує метадані чемпіона для цільової змінної.
    
    Args:
        target: Назва цільової змінної
    
    Returns:
        Словник з метаданими чемпіона або None
    """
    champion_path = MODELS_DIR / target / "champion.json"
    
    if not champion_path.exists():
        print(f"⚠️ Метадані чемпіона не знайдено для {target}: {champion_path}")
        return None
    
    with open(champion_path, "r", encoding="utf-8") as f:
        champion_data = json.load(f)
    
    return champion_data


def build_summary_dataframe() -> pd.DataFrame:
    """
    Побудова об'єднаного DataFrame з результатами всіх моделей.
    
    Returns:
        DataFrame з результатами для всіх targets
    """
    all_data = []
    
    for target in TARGETS:
        # Завантаження лідерборду
        leaderboard = load_leaderboard(target)
        
        if leaderboard.empty:
            continue
        
        # Додавання колонки path (відносний шлях до моделі)
        leaderboard["path"] = leaderboard["model"].apply(
            lambda m: str(MODELS_DIR / target / m / "model.joblib")
        )
        
        # Завантаження метаданих чемпіона
        champion = load_champion(target)
        
        if champion:
            # Додавання рядка для чемпіона з правильним шляхом
            champion_row = {
                "target": target,
                "model": champion["model_name"],
                "roc_auc": champion["metrics"].get("roc_auc", None),
                "avg_precision": champion["metrics"].get("avg_precision", None),
                "accuracy": champion["metrics"].get("accuracy", None),
                "precision": champion["metrics"].get("precision", None),
                "recall": champion["metrics"].get("recall", None),
                "f1": champion["metrics"].get("f1", None),
                "brier": champion["metrics"].get("brier", None),
                "path": champion["path"],
            }
            
            # Перевірка, чи чемпіон вже є в лідерборді
            if champion["model_name"] not in leaderboard["model"].values:
                all_data.append(champion_row)
        
        # Додавання даних з лідерборду
        all_data.extend(leaderboard.to_dict("records"))
    
    # Створення об'єднаного DataFrame
    if not all_data:
        return pd.DataFrame()
    
    summary_df = pd.DataFrame(all_data)
    
    # Впорядкування колонок
    expected_columns = [
        "target",
        "model",
        "roc_auc",
        "avg_precision",
        "accuracy",
        "precision",
        "recall",
        "f1",
        "brier",
        "path",
    ]
    
    # Додавання відсутніх колонок
    for col in expected_columns:
        if col not in summary_df.columns:
            summary_df[col] = None
    
    # Вибір та впорядкування колонок
    summary_df = summary_df[expected_columns]
    
    return summary_df


def generate_markdown_report(summary_df: pd.DataFrame) -> str:
    """
    Генерація Markdown звіту з результатами.
    
    Args:
        summary_df: DataFrame з результатами
    
    Returns:
        Рядок з Markdown звітом
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    md_lines = [
        "# Звіт про результати навчання моделей машинного навчання",
        "",
        f"**Дата створення:** {timestamp}",
        "",
        "---",
        "",
    ]
    
    # Секції для кожного target
    for target in TARGETS:
        target_data = summary_df[summary_df["target"] == target].copy()
        
        if target_data.empty:
            continue
        
        # Заголовок секції
        target_display = target.replace("_", " ").title()
        md_lines.append(f"## {target_display}")
        md_lines.append("")
        
        # Сортування за roc_auc (спадання), потім за avg_precision (спадання)
        target_data_sorted = target_data.sort_values(
            by=["roc_auc", "avg_precision"], ascending=[False, False], na_position="last"
        )
        
        # Топ-3 моделі
        top_3 = target_data_sorted.head(3)
        
        if not top_3.empty:
            md_lines.append("### Топ-3 моделі")
            md_lines.append("")
            
            # Створення таблиці
            table_columns = ["Модель", "ROC-AUC", "Avg Precision", "Accuracy", "F1"]
            md_lines.append("| " + " | ".join(table_columns) + " |")
            md_lines.append("| " + " | ".join(["---"] * len(table_columns)) + " |")
            
            for _, row in top_3.iterrows():
                model_name = row["model"]
                roc_auc = f"{row['roc_auc']:.4f}" if pd.notna(row["roc_auc"]) else "N/A"
                avg_precision = (
                    f"{row['avg_precision']:.4f}" if pd.notna(row["avg_precision"]) else "N/A"
                )
                accuracy = f"{row['accuracy']:.4f}" if pd.notna(row["accuracy"]) else "N/A"
                f1 = f"{row['f1']:.4f}" if pd.notna(row["f1"]) else "N/A"
                
                md_lines.append(f"| {model_name} | {roc_auc} | {avg_precision} | {accuracy} | {f1} |")
            
            md_lines.append("")
        
        # Чемпіон
        champion = load_champion(target)
        
        if champion:
            md_lines.append("### Чемпіон")
            md_lines.append("")
            
            champion_metrics = champion["metrics"]
            champion_name = champion["model_name"]
            champion_path = champion["path"]
            
            md_lines.append(f"**Модель:** {champion_name}")
            md_lines.append("")
            md_lines.append("**Метрики:**")
            md_lines.append("")
            
            metrics_list = [
                ("ROC-AUC", "roc_auc"),
                ("Average Precision", "avg_precision"),
                ("Accuracy", "accuracy"),
                ("Precision", "precision"),
                ("Recall", "recall"),
                ("F1", "f1"),
                ("Brier Score", "brier"),
            ]
            
            for metric_name, metric_key in metrics_list:
                value = champion_metrics.get(metric_key)
                if value is not None:
                    if isinstance(value, float):
                        md_lines.append(f"- **{metric_name}:** {value:.4f}")
                    else:
                        md_lines.append(f"- **{metric_name}:** {value}")
            
            md_lines.append("")
            md_lines.append(f"**Шлях до моделі:** `{champion_path}`")
            md_lines.append("")
        
        md_lines.append("---")
        md_lines.append("")
    
    return "\n".join(md_lines)


def print_summary(summary_df: pd.DataFrame) -> None:
    """
    Виведення підсумку результатів у консоль.
    
    Args:
        summary_df: DataFrame з результатами
    """
    print("\n" + "=" * 80)
    print("ПІДСУМОК РЕЗУЛЬТАТІВ НАВЧАННЯ МОДЕЛЕЙ")
    print("=" * 80)
    
    for target in TARGETS:
        target_data = summary_df[summary_df["target"] == target].copy()
        
        if target_data.empty:
            print(f"\n⚠️ Немає даних для {target}")
            continue
        
        # Сортування за roc_auc (спадання), потім за avg_precision (спадання)
        target_data_sorted = target_data.sort_values(
            by=["roc_auc", "avg_precision"], ascending=[False, False], na_position="last"
        )
        
        # Топ-1 модель
        top_1 = target_data_sorted.iloc[0]
        
        print(f"\n📊 {target}:")
        print(f"   🏆 Топ-1 модель: {top_1['model']}")
        print(f"   ROC-AUC: {top_1['roc_auc']:.4f}" if pd.notna(top_1["roc_auc"]) else "   ROC-AUC: N/A")
        print(
            f"   Average Precision: {top_1['avg_precision']:.4f}"
            if pd.notna(top_1["avg_precision"])
            else "   Average Precision: N/A"
        )
        print(f"   Шлях: {top_1['path']}")


def main() -> None:
    """Головна функція для агрегації результатів."""
    print("🔍 Агрегація результатів навчання моделей...")
    
    # Створення директорії для результатів
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Побудова об'єднаного DataFrame
    summary_df = build_summary_dataframe()
    
    if summary_df.empty:
        print("⚠️ Не знайдено даних для агрегації")
        return
    
    # Збереження CSV
    summary_df.to_csv(SUMMARY_CSV, index=False, encoding="utf-8")
    print(f"✅ CSV збережено: {SUMMARY_CSV}")
    
    # Генерація та збереження Markdown звіту
    md_report = generate_markdown_report(summary_df)
    
    with open(SUMMARY_MD, "w", encoding="utf-8") as f:
        f.write(md_report)
    
    print(f"✅ Markdown звіт збережено: {SUMMARY_MD}")
    
    # Виведення підсумку у консоль
    print_summary(summary_df)
    
    print("\n" + "=" * 80)
    print("✅ Агрегацію результатів завершено")
    print("=" * 80)


if __name__ == "__main__":
    main()

