"""
Модуль ETL для підготовки набору даних NHANES.
"""

import math
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import yaml


def get_project_root() -> Path:
    """Визначає корінь проєкту (директорію з configs/ та datasets/)."""
    current = Path(__file__).resolve()
    # Піднімаємося від src/health_risk_ai/data/nhanes_etl.py до кореня проєкту
    while current.parent != current:
        if (current / "configs").exists() and (current / "datasets").exists():
            return current
        current = current.parent
    # Якщо не знайдено, повертаємо поточну робочу директорію
    return Path.cwd()


PROJECT_ROOT = get_project_root()
CONFIG_PATH = PROJECT_ROOT / "configs/nhanes.yaml"
OUTPUT_PATH = PROJECT_ROOT / "datasets/processed/health_dataset.csv"


def load_config(config_path: Path = CONFIG_PATH) -> Dict[str, Any]:
    """Завантажує конфігурацію NHANES з YAML файлу."""
    # Зчитування конфігураційного файлу
    with open(config_path, "r", encoding="utf-8") as config_stream:
        config: Dict[str, Any] = yaml.safe_load(config_stream)
    return config


def read_nhanes_tables(config: Dict[str, Any]) -> Dict[str, pd.DataFrame]:
    """Зчитує сирі таблиці NHANES згідно конфігурації."""
    # Зчитування CSV-файлів
    tables: Dict[str, pd.DataFrame] = {}
    local_paths: Dict[str, str] = config.get("local_paths", {})
    for table_name, relative_path in local_paths.items():
        table_path = PROJECT_ROOT / Path(relative_path)
        if not table_path.exists():
            raise FileNotFoundError(
                f"Не вдалося знайти файл для таблиці '{table_name}': {table_path}"
            )
        try:
            tables[table_name] = pd.read_csv(table_path, encoding="utf-8")
        except UnicodeDecodeError:
            tables[table_name] = pd.read_csv(table_path, encoding="latin-1")
    return tables


def merge_tables(tables: Dict[str, pd.DataFrame], join_key: str) -> pd.DataFrame:
    """Об'єднує таблиці за спільним ключем."""
    # Об'єднання за ключем SEQN
    dataframes: List[pd.DataFrame] = list(tables.values())
    if not dataframes:
        return pd.DataFrame()

    merged_df = dataframes[0]
    for additional_df in dataframes[1:]:
        merged_df = merged_df.merge(additional_df, on=join_key, how="outer")
    return merged_df


def select_features(
    df: pd.DataFrame, feature_names: List[str], join_key: Optional[str] = None
) -> pd.DataFrame:
    """Обирає перелік необхідних ознак."""
    # Вибір необхідних ознак
    if df.empty:
        return df

    unique_features = list(dict.fromkeys(feature_names))
    columns_to_keep = [col for col in unique_features if col in df.columns]

    if join_key and join_key in df.columns and join_key not in columns_to_keep:
        columns_to_keep.insert(0, join_key)

    if not columns_to_keep:
        return df

    return df.loc[:, columns_to_keep]


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Виконує базове очищення даних."""
    # Прибирання дублікатів
    clean_df = df.drop_duplicates()
    # Видалення рядків з надмірною кількістю пропусків
    if clean_df.empty:
        return clean_df

    column_count = len(clean_df.columns)
    min_non_null = max(1, column_count - math.floor(column_count / 2))
    clean_df = clean_df.dropna(thresh=min_non_null)
    return clean_df


def derive_targets(df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
    """Формує цільові змінні на основі конфігурації."""
    # Обчислення похідних цілей (наприклад, ожиріння)
    targets_config = config.get("targets", {})
    processed_df = df.copy()

    for target_name, target_config in targets_config.items():
        target_type = target_config.get("type")

        if target_type == "derived":
            formula = target_config.get("formula", "")
            tokens = formula.split()
            if len(tokens) != 3:
                raise ValueError(
                    f"Непідтримувана формула для цілі '{target_name}': {formula}"
                )
            column_name, operator, value_token = tokens

            if column_name not in processed_df.columns:
                processed_df[target_name] = pd.NA
                continue

            try:
                comparison_value = float(value_token)
                numeric_series = pd.to_numeric(processed_df[column_name], errors="coerce")
            except ValueError as exc:
                raise ValueError(
                    f"Не вдалося обробити значення '{value_token}' у формулі '{formula}'"
                ) from exc

            if operator == ">=":
                mask = numeric_series >= comparison_value
            elif operator == ">":
                mask = numeric_series > comparison_value
            elif operator == "<=":
                mask = numeric_series <= comparison_value
            elif operator == "<":
                mask = numeric_series < comparison_value
            elif operator == "==":
                mask = numeric_series == comparison_value
            else:
                raise ValueError(
                    f"Непідтримуваний оператор '{operator}' у формулі '{formula}'"
                )

            processed_df[target_name] = mask.fillna(False).astype(int)
        elif target_type == "from_column":
            source_column = target_config.get("column")
            if source_column and source_column in processed_df.columns:
                processed_df[target_name] = processed_df[source_column]
            else:
                processed_df[target_name] = pd.NA
        else:
            raise ValueError(f"Непідтримуваний тип цільової змінної: {target_type}")

    # Заповнення цілей з наявних колонок
    return processed_df


def save_processed_dataset(df: pd.DataFrame, output_path: Path = OUTPUT_PATH) -> None:
    """Зберігає оброблений набір даних у файл."""
    # Створення директорії, якщо вона не існує
    output_dir = output_path.parent
    os.makedirs(output_dir, exist_ok=True)
    
    # Збереження обробленого набору даних
    df.to_csv(output_path, index=False)
    
    # Повідомлення про успішне збереження
    print(f"Оброблений датасет успішно збережено за шляхом: {output_path}")


def run_etl(config_path: Path = CONFIG_PATH) -> None:
    """Запускає повний цикл ETL для набору NHANES."""
    # Завантаження конфігурації
    config = load_config(config_path)
    # Зчитування сирих таблиць
    nhanes_tables = read_nhanes_tables(config)
    # Об'єднання таблиць
    merged_df = merge_tables(nhanes_tables, config.get("join_key", "SEQN"))
    # Вибір ознак
    selected_df = select_features(
        merged_df, config.get("features", {}).get("keep", []), config.get("join_key")
    )
    # Очищення даних
    cleaned_df = clean_data(selected_df)
    # Формування цільових змінних
    enriched_df = derive_targets(cleaned_df, config)
    # Збереження результату
    save_processed_dataset(enriched_df, OUTPUT_PATH)
    absolute_path = OUTPUT_PATH.resolve()
    print(f"✅ Обробку даних завершено. Файл збережено у {absolute_path}")


if __name__ == "__main__":
    run_etl()
