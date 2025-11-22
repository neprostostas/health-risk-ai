"""
Експериментальні тести: обробка пропущених даних.
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path

from src.service.model_registry import load_champion


@pytest.mark.skipif(
    not Path("artifacts/models/diabetes_present/champion_calibrated.joblib").exists(),
    reason="Моделі не знайдено. Запустіть навчання моделей спочатку.",
)
class TestMissingData:
    """Тести для обробки пропущених даних."""
    
    def test_missing_optional_field(self):
        """Тест: пропущене опціональне поле (LBXGLU)."""
        model, metadata = load_champion("diabetes_present")
        
        # Дані з пропущеним LBXGLU
        test_data = pd.DataFrame([{
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": 130,
            "BPXDI1": 85,
            "LBXGLU": np.nan,  # Пропущене значення
            "LBXTC": 200,
            "LBXTR": 150,
        }])
        
        # Модель повинна обробити пропущене значення (через imputer)
        prediction = model.predict_proba(test_data)[0]
        
        assert 0 <= prediction[1] <= 1
        assert not np.isnan(prediction[1])
        assert not np.isinf(prediction[1])
    
    def test_missing_multiple_optional_fields(self):
        """Тест: кілька пропущених опціональних полів."""
        model, metadata = load_champion("diabetes_present")
        
        test_data = pd.DataFrame([{
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": np.nan,
            "BPXDI1": np.nan,
            "LBXGLU": np.nan,
            "LBXTC": np.nan,
            "LBXTR": np.nan,
        }])
        
        # Модель повинна працювати навіть з багатьма пропущеними значеннями
        prediction = model.predict_proba(test_data)[0]
        
        assert 0 <= prediction[1] <= 1
        assert not np.isnan(prediction[1])
    
    def test_missing_vs_present_comparison(self):
        """Тест: порівняння прогнозу з пропущеними та заповненими даними."""
        model, metadata = load_champion("diabetes_present")
        
        # Дані з усіма полями
        complete_data = pd.DataFrame([{
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": 130,
            "BPXDI1": 85,
            "LBXGLU": 95,
            "LBXTC": 200,
            "LBXTR": 150,
        }])
        
        # Дані з пропущеним LBXGLU
        missing_data = complete_data.copy()
        missing_data["LBXGLU"] = np.nan
        
        pred_complete = model.predict_proba(complete_data)[0][1]
        pred_missing = model.predict_proba(missing_data)[0][1]
        
        # Обидва прогнози валідні
        assert 0 <= pred_complete <= 1
        assert 0 <= pred_missing <= 1
        
        # Прогнози можуть відрізнятися, але не надто сильно
        # (модель використовує imputation)
        assert abs(pred_complete - pred_missing) < 0.3  # Розумна різниця
    
    def test_all_optional_missing(self):
        """Тест: всі опціональні поля пропущені (тільки обов'язкові)."""
        model, metadata = load_champion("diabetes_present")
        
        test_data = pd.DataFrame([{
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": np.nan,
            "BPXDI1": np.nan,
            "LBXGLU": np.nan,
            "LBXTC": np.nan,
            "LBXTR": np.nan,
        }])
        
        prediction = model.predict_proba(test_data)[0]
        
        assert 0 <= prediction[1] <= 1
        assert not np.isnan(prediction[1])

