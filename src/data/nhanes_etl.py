"""
ETL-пайплайн для підготовки фінального датасету NHANES.
"""

import math
import os
from pathlib import Path
from typing import Dict, List

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DATA_PATHS: Dict[str, Path] = {
    "demographics": PROJECT_ROOT / "datasets/raw/demographic.csv",
    "diet": PROJECT_ROOT / "datasets/raw/diet.csv",
    "examination": PROJECT_ROOT / "datasets/raw/examination.csv",
    "labs": PROJECT_ROOT / "datasets/raw/labs.csv",
    "medications": PROJECT_ROOT / "datasets/raw/medications.csv",
    "questionnaire": PROJECT_ROOT / "datasets/raw/questionnaire.csv",
}
JOIN_KEY = "SEQN"
FEATURE_COLUMNS: List[str] = [
    "SEQN",
    "RIDAGEYR",
    "RIAGENDR",
    "BMXBMI",
    "BPXSY1",
    "BPXDI1",
    "LBXGLU",
    "LBXTC",
    "DIQ010",
]
NUMERIC_COLUMNS: List[str] = [
    "SEQN",
    "RIDAGEYR",
    "RIAGENDR",
    "BMXBMI",
    "BPXSY1",
    "BPXDI1",
    "LBXGLU",
    "LBXTC",
    "DIQ010",
]
TARGET_COLUMNS = ["obesity_present", "diabetes_present"]
OUTPUT_PATH = PROJECT_ROOT / "datasets/processed/health_dataset.csv"


def read_raw_tables() -> Dict[str, pd.DataFrame]:
    """Зчитує сирі таблиці NHANES з усіх джерел."""
    # Зчитування усіх CSV-файлів з резервним кодуванням
    tables: Dict[str, pd.DataFrame] = {}
    for name, path in RAW_DATA_PATHS.items():
        if not path.exists():
            raise FileNotFoundError(f"Не знайдено файл {path} для таблиці '{name}'")
        try:
            tables[name] = pd.read_csv(path, encoding="utf-8")
        except UnicodeDecodeError:
            tables[name] = pd.read_csv(path, encoding="latin-1")
    return tables


def merge_tables(tables: Dict[str, pd.DataFrame], join_key: str = JOIN_KEY) -> pd.DataFrame:
    """Об'єднує таблиці за спільним ключем SEQN."""
    # Поетапне об'єднання даних зовнішніми злиттями
    dataframes = list(tables.values())
    if not dataframes:
        return pd.DataFrame()

    merged = dataframes[0]
    for df in dataframes[1:]:
        merged = merged.merge(df, on=join_key, how="outer")
    return merged


def select_features(df: pd.DataFrame, features: List[str]) -> pd.DataFrame:
    """Обирає лише важливі ознаки."""
    # Відбір необхідних колонок, які присутні у датасеті
    available_features = [col for col in features if col in df.columns]
    return df.loc[:, available_features].copy()


def clean_data(df: pd.DataFrame, join_key: str, numeric_columns: List[str]) -> pd.DataFrame:
    """Очищує дані: дублікати, пропуски та типи."""
    # Прибирання дублікатів за ключем SEQN
    cleaned = df.drop_duplicates(subset=[join_key])

    # Видалення рядків з понад 50% пропусків
    columns_to_check = [col for col in numeric_columns if col in cleaned.columns]
    if columns_to_check:
        na_counts = cleaned[columns_to_check].isna().sum(axis=1)
        threshold = len(columns_to_check) / 2
        cleaned = cleaned.loc[na_counts <= threshold].copy()

    # Конвертація числових колонок у float
    for column in columns_to_check:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")

    return cleaned


def derive_targets(df: pd.DataFrame) -> pd.DataFrame:
    """Генерує цільові змінні на основі бізнес-правил."""
    enriched = df.copy()

    # Формування ознаки ожиріння
    if "BMXBMI" in enriched.columns:
        enriched["obesity_present"] = enriched["BMXBMI"].ge(30).fillna(False).astype(int)
    else:
        enriched["obesity_present"] = pd.NA

    # Формування ознаки діабету
    if "DIQ010" in enriched.columns:
        enriched["diabetes_present"] = (enriched["DIQ010"] == 1).fillna(False).astype(int)
    else:
        enriched["diabetes_present"] = pd.NA

    return enriched


def save_dataset(df: pd.DataFrame, output_path: Path = OUTPUT_PATH) -> None:
    """Зберігає фінальний датасет на диск."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False, encoding="utf-8")

    absolute_path = output_path.resolve()
    rows, cols = df.shape
    print(
        f"✅ Обробку завершено: збережено {rows} рядків і {cols} колонок у файлі {absolute_path}"
    )


def run_etl() -> None:
    """Запускає повний процес ETL для NHANES."""
    # Зчитування даних
    raw_tables = read_raw_tables()
    # Об'єднання таблиць
    merged = merge_tables(raw_tables, JOIN_KEY)
    # Вибір ключових ознак
    selected = select_features(merged, FEATURE_COLUMNS)
    # Очищення даних
    cleaned = clean_data(selected, JOIN_KEY, NUMERIC_COLUMNS)
    # Створення цільових ознак
    enriched = derive_targets(cleaned)
    # Збереження результату
    save_dataset(enriched, OUTPUT_PATH)


if __name__ == "__main__":
    run_etl()
