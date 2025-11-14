"""
Модуль дослідницького аналізу даних (EDA) для набору NHANES.
"""

import os
from pathlib import Path
from io import StringIO

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

# Налаштування шляхів
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "datasets/processed/health_dataset.csv"
OUTPUT_DIR = PROJECT_ROOT / "artifacts/eda"
SUMMARY_FILE = OUTPUT_DIR / "summary.txt"

# Налаштування стилю для графіків
sns.set_style("whitegrid")
plt.rcParams["figure.figsize"] = (12, 8)
plt.rcParams["font.size"] = 10


def load_data(data_path: Path = DATA_PATH) -> pd.DataFrame:
    """Завантажує оброблений датасет NHANES."""
    print(f"📊 Завантаження даних з {data_path}...")
    df = pd.read_csv(data_path, encoding="utf-8")
    return df


def print_basic_info(df: pd.DataFrame, output_buffer: StringIO) -> None:
    """Виводить базову інформацію про датасет."""
    print("\n" + "=" * 80)
    print("БАЗОВА ІНФОРМАЦІЯ ПРО ДАТАСЕТ")
    print("=" * 80)
    
    shape_info = f"Розмір датасету: {df.shape[0]} рядків, {df.shape[1]} колонок"
    print(shape_info)
    output_buffer.write(shape_info + "\n")
    
    print("\nНазви колонок:")
    output_buffer.write("\nНазви колонок:\n")
    for i, col in enumerate(df.columns, 1):
        col_info = f"  {i}. {col}"
        print(col_info)
        output_buffer.write(col_info + "\n")


def print_missing_values(df: pd.DataFrame, output_buffer: StringIO) -> None:
    """Виводить інформацію про пропущені значення."""
    print("\n" + "=" * 80)
    print("АНАЛІЗ ПРОПУЩЕНИХ ЗНАЧЕНЬ")
    print("=" * 80)
    
    missing = df.isnull().sum()
    missing_pct = (missing / len(df)) * 100
    
    output_buffer.write("\nАНАЛІЗ ПРОПУЩЕНИХ ЗНАЧЕНЬ\n")
    output_buffer.write("=" * 80 + "\n")
    
    for col in df.columns:
        miss_count = missing[col]
        miss_pct_val = missing_pct[col]
        info = f"{col}: {miss_count} пропусків ({miss_pct_val:.2f}%)"
        print(info)
        output_buffer.write(info + "\n")


def print_basic_statistics(df: pd.DataFrame, output_buffer: StringIO) -> None:
    """Виводить базову статистику для числових колонок."""
    print("\n" + "=" * 80)
    print("БАЗОВА СТАТИСТИКА")
    print("=" * 80)
    
    numeric_cols = df.select_dtypes(include=["float64", "int64"]).columns
    stats = df[numeric_cols].describe()
    
    output_buffer.write("\nБАЗОВА СТАТИСТИКА\n")
    output_buffer.write("=" * 80 + "\n")
    
    print(stats)
    output_buffer.write(str(stats) + "\n")


def calculate_health_metrics(df: pd.DataFrame, output_buffer: StringIO) -> None:
    """Розраховує метрики здоров'я та відсотки."""
    print("\n" + "=" * 80)
    print("МЕТРИКИ ЗДОРОВ'Я")
    print("=" * 80)
    
    output_buffer.write("\nМЕТРИКИ ЗДОРОВ'Я\n")
    output_buffer.write("=" * 80 + "\n")
    
    # Відсоток людей з ожирінням
    if "obesity_present" in df.columns:
        obesity_count = (df["obesity_present"] == 1).sum()
        obesity_pct = (obesity_count / len(df)) * 100
        info = f"Люди з ожирінням: {obesity_count} ({obesity_pct:.2f}%)"
        print(info)
        output_buffer.write(info + "\n")
    
    # Відсоток людей з діабетом
    if "diabetes_present" in df.columns:
        diabetes_count = (df["diabetes_present"] == 1).sum()
        diabetes_pct = (diabetes_count / len(df)) * 100
        info = f"Люди з діабетом: {diabetes_count} ({diabetes_pct:.2f}%)"
        print(info)
        output_buffer.write(info + "\n")
    
    # Середні значення для груп з ожирінням та без
    if "obesity_present" in df.columns and "RIDAGEYR" in df.columns:
        print("\nСередні значення для груп з ожирінням та без:")
        output_buffer.write("\nСередні значення для груп з ожирінням та без:\n")
        
        for group_name, group_val in [("Без ожиріння", 0), ("З ожирінням", 1)]:
            group_df = df[df["obesity_present"] == group_val]
            if len(group_df) > 0:
                metrics = []
                if "RIDAGEYR" in df.columns:
                    metrics.append(f"Вік: {group_df['RIDAGEYR'].mean():.2f}")
                if "BMXBMI" in df.columns:
                    metrics.append(f"ІМТ: {group_df['BMXBMI'].mean():.2f}")
                if "LBXGLU" in df.columns:
                    metrics.append(f"Глюкоза: {group_df['LBXGLU'].mean():.2f}")
                if "LBXTC" in df.columns:
                    metrics.append(f"Холестерин: {group_df['LBXTC'].mean():.2f}")
                
                info = f"{group_name}: {', '.join(metrics)}"
                print(info)
                output_buffer.write(info + "\n")
    
    # Середні значення для груп з діабетом та без
    if "diabetes_present" in df.columns:
        print("\nСередні значення для груп з діабетом та без:")
        output_buffer.write("\nСередні значення для груп з діабетом та без:\n")
        
        for group_name, group_val in [("Без діабету", 0), ("З діабетом", 1)]:
            group_df = df[df["diabetes_present"] == group_val]
            if len(group_df) > 0:
                metrics = []
                if "RIDAGEYR" in df.columns:
                    metrics.append(f"Вік: {group_df['RIDAGEYR'].mean():.2f}")
                if "BMXBMI" in df.columns:
                    metrics.append(f"ІМТ: {group_df['BMXBMI'].mean():.2f}")
                if "LBXGLU" in df.columns:
                    metrics.append(f"Глюкоза: {group_df['LBXGLU'].mean():.2f}")
                if "LBXTC" in df.columns:
                    metrics.append(f"Холестерин: {group_df['LBXTC'].mean():.2f}")
                
                info = f"{group_name}: {', '.join(metrics)}"
                print(info)
                output_buffer.write(info + "\n")


def create_visualizations(df: pd.DataFrame) -> None:
    """Створює всі візуалізації та зберігає їх у файли."""
    print("\n" + "=" * 80)
    print("СТВОРЕННЯ ВІЗУАЛІЗАЦІЙ")
    print("=" * 80)
    
    # 1. Гістограма ІМТ
    if "BMXBMI" in df.columns:
        plt.figure(figsize=(10, 6))
        plt.hist(df["BMXBMI"].dropna(), bins=50, edgecolor="black", alpha=0.7)
        plt.xlabel("Індекс маси тіла (ІМТ)")
        plt.ylabel("Частота")
        plt.title("Розподіл індексу маси тіла (ІМТ)")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "bmi_hist.png", dpi=300, bbox_inches="tight")
        plt.close()
        print("✅ Збережено: bmi_hist.png")
    
    # 2. Боксплот ІМТ за статтю
    if "BMXBMI" in df.columns and "RIAGENDR" in df.columns:
        plt.figure(figsize=(10, 6))
        df_clean = df[["BMXBMI", "RIAGENDR"]].dropna()
        df_clean["Стать"] = df_clean["RIAGENDR"].map({1: "Чоловік", 2: "Жінка"})
        sns.boxplot(data=df_clean, x="Стать", y="BMXBMI")
        plt.xlabel("Стать")
        plt.ylabel("Індекс маси тіла (ІМТ)")
        plt.title("Розподіл ІМТ за статтю")
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "bmi_box_gender.png", dpi=300, bbox_inches="tight")
        plt.close()
        print("✅ Збережено: bmi_box_gender.png")
    
    # 3. Діаграма розсіювання Вік vs ІМТ
    if "RIDAGEYR" in df.columns and "BMXBMI" in df.columns:
        plt.figure(figsize=(10, 6))
        df_clean = df[["RIDAGEYR", "BMXBMI"]].dropna()
        plt.scatter(df_clean["RIDAGEYR"], df_clean["BMXBMI"], alpha=0.5, s=10)
        plt.xlabel("Вік (роки)")
        plt.ylabel("Індекс маси тіла (ІМТ)")
        plt.title("Залежність між віком та ІМТ")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "age_bmi_scatter.png", dpi=300, bbox_inches="tight")
        plt.close()
        print("✅ Збережено: age_bmi_scatter.png")
    
    # 4. Розподіли артеріального тиску
    if "BPXSY1" in df.columns and "BPXDI1" in df.columns:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        df_clean_sys = df["BPXSY1"].dropna()
        ax1.hist(df_clean_sys, bins=50, edgecolor="black", alpha=0.7, color="skyblue")
        ax1.set_xlabel("Систолічний тиск (мм рт.ст.)")
        ax1.set_ylabel("Частота")
        ax1.set_title("Розподіл систолічного артеріального тиску")
        ax1.grid(True, alpha=0.3)
        
        df_clean_dia = df["BPXDI1"].dropna()
        ax2.hist(df_clean_dia, bins=50, edgecolor="black", alpha=0.7, color="lightcoral")
        ax2.set_xlabel("Діастолічний тиск (мм рт.ст.)")
        ax2.set_ylabel("Частота")
        ax2.set_title("Розподіл діастолічного артеріального тиску")
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "bp_dist.png", dpi=300, bbox_inches="tight")
        plt.close()
        print("✅ Збережено: bp_dist.png")
    
    # 5. Гістограма глюкози за наявністю діабету
    if "LBXGLU" in df.columns and "diabetes_present" in df.columns:
        plt.figure(figsize=(10, 6))
        df_clean = df[["LBXGLU", "diabetes_present"]].dropna()
        if len(df_clean) > 0:
            for label, val in [("Без діабету", 0), ("З діабетом", 1)]:
                data = df_clean[df_clean["diabetes_present"] == val]["LBXGLU"]
                if len(data) > 0:
                    plt.hist(data, bins=50, alpha=0.6, label=label, edgecolor="black")
            plt.xlabel("Рівень глюкози (мг/дл)")
            plt.ylabel("Частота")
            plt.title("Розподіл рівня глюкози за наявністю діабету")
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(OUTPUT_DIR / "glucose_hist.png", dpi=300, bbox_inches="tight")
            plt.close()
            print("✅ Збережено: glucose_hist.png")
        else:
            print("⚠️ Пропущено: glucose_hist.png (немає даних про глюкозу)")
    else:
        print("⚠️ Пропущено: glucose_hist.png (колонка LBXGLU відсутня в датасеті)")
    
    # 6. Діаграма розсіювання Холестерин vs ІМТ з лінією регресії
    if "LBXTC" in df.columns and "BMXBMI" in df.columns:
        plt.figure(figsize=(10, 6))
        df_clean = df[["LBXTC", "BMXBMI"]].dropna()
        plt.scatter(df_clean["BMXBMI"], df_clean["LBXTC"], alpha=0.5, s=10)
        
        # Лінія регресії
        z = np.polyfit(df_clean["BMXBMI"], df_clean["LBXTC"], 1)
        p = np.poly1d(z)
        plt.plot(df_clean["BMXBMI"], p(df_clean["BMXBMI"]), "r--", alpha=0.8, linewidth=2)
        
        plt.xlabel("Індекс маси тіла (ІМТ)")
        plt.ylabel("Загальний холестерин (мг/дл)")
        plt.title("Залежність між холестерином та ІМТ")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "chol_bmi_scatter.png", dpi=300, bbox_inches="tight")
        plt.close()
        print("✅ Збережено: chol_bmi_scatter.png")
    
    # 7. Countplot ожиріння за статтю
    if "obesity_present" in df.columns and "RIAGENDR" in df.columns:
        plt.figure(figsize=(10, 6))
        df_clean = df[["obesity_present", "RIAGENDR"]].dropna()
        df_clean["Ожиріння"] = df_clean["obesity_present"].map({0: "Ні", 1: "Так"})
        df_clean["Стать"] = df_clean["RIAGENDR"].map({1: "Чоловік", 2: "Жінка"})
        sns.countplot(data=df_clean, x="Стать", hue="Ожиріння")
        plt.xlabel("Стать")
        plt.ylabel("Кількість")
        plt.title("Розподіл ожиріння за статтю")
        plt.legend(title="Ожиріння")
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "obesity_gender.png", dpi=300, bbox_inches="tight")
        plt.close()
        print("✅ Збережено: obesity_gender.png")
    
    # 8. Barplot діабету за віковими групами
    if "diabetes_present" in df.columns and "RIDAGEYR" in df.columns:
        plt.figure(figsize=(10, 6))
        df_clean = df[["diabetes_present", "RIDAGEYR"]].dropna().copy()
        df_clean["Вікова група"] = pd.cut(
            df_clean["RIDAGEYR"],
            bins=[0, 30, 50, 120],
            labels=["<30", "30-50", ">50"]
        )
        diabetes_by_age = df_clean.groupby("Вікова група")["diabetes_present"].mean() * 100
        diabetes_by_age.plot(kind="bar", color="steelblue", edgecolor="black")
        plt.xlabel("Вікова група")
        plt.ylabel("Відсоток людей з діабетом (%)")
        plt.title("Розподіл діабету за віковими групами")
        plt.xticks(rotation=0)
        plt.grid(True, alpha=0.3, axis="y")
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "diabetes_age.png", dpi=300, bbox_inches="tight")
        plt.close()
        print("✅ Збережено: diabetes_age.png")
    
    # 9. Теплокарта кореляцій
    numeric_cols = df.select_dtypes(include=["float64", "int64"]).columns
    if len(numeric_cols) > 1:
        plt.figure(figsize=(12, 10))
        corr_matrix = df[numeric_cols].corr()
        sns.heatmap(
            corr_matrix,
            annot=True,
            fmt=".2f",
            cmap="coolwarm",
            center=0,
            square=True,
            linewidths=1,
            cbar_kws={"label": "Коефіцієнт кореляції"}
        )
        plt.title("Теплокарта кореляцій між числовими ознаками")
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / "correlations_heatmap.png", dpi=300, bbox_inches="tight")
        plt.close()
        print("✅ Збережено: correlations_heatmap.png")


def main() -> None:
    """Головна функція для запуску повного EDA."""
    # Створення директорії для результатів
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Буфер для збереження текстового звіту
    summary_buffer = StringIO()
    
    # Завантаження даних
    df = load_data()
    
    # Виконання аналізу
    print_basic_info(df, summary_buffer)
    print_missing_values(df, summary_buffer)
    print_basic_statistics(df, summary_buffer)
    calculate_health_metrics(df, summary_buffer)
    
    # Створення візуалізацій
    create_visualizations(df)
    
    # Збереження текстового звіту
    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        f.write(summary_buffer.getvalue())
    
    print("\n" + "=" * 80)
    print("✅ Аналіз даних завершено. Усі графіки та результати збережено у папці artifacts/eda/")
    print("=" * 80)


if __name__ == "__main__":
    main()

