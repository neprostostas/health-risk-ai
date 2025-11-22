"""
Unit-тести для логіки прогнозування.
"""

import pytest
import numpy as np
from pathlib import Path

from src.service.model_registry import load_champion


class TestPredictionLogic:
    """Тести для логіки прогнозування."""
    
    @pytest.mark.skipif(
        not Path("artifacts/models/diabetes_present/champion_calibrated.joblib").exists(),
        reason="Моделі не знайдено. Запустіть навчання моделей спочатку.",
    )
    def test_prediction_output_range(self):
        """Тест: вихід моделі в межах 0-1."""
        model, metadata = load_champion("diabetes_present")
        
        # Створюємо тестові дані
        import pandas as pd
        test_data = pd.DataFrame([{
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": 130,
            "BPXDI1": 85,
            "LBXGLU": 95,
            "LBXTC": 200,
            "LBXTR": 150,
        }])
        
        # Робимо прогноз
        prediction = model.predict_proba(test_data)[0]
        
        # Перевіряємо, що ймовірність в межах 0-1
        assert 0 <= prediction[1] <= 1
        assert 0 <= prediction[0] <= 1
        assert abs(prediction[0] + prediction[1] - 1.0) < 1e-6  # Сума = 1
    
    @pytest.mark.skipif(
        not Path("artifacts/models/diabetes_present/champion_calibrated.joblib").exists(),
        reason="Моделі не знайдено. Запустіть навчання моделей спочатку.",
    )
    def test_prediction_deterministic(self):
        """Тест: детермінізм - однаковий вхід дає однаковий вихід."""
        model, metadata = load_champion("diabetes_present")
        
        import pandas as pd
        test_data = pd.DataFrame([{
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": 130,
            "BPXDI1": 85,
            "LBXGLU": 95,
            "LBXTC": 200,
            "LBXTR": 150,
        }])
        
        # Робимо прогноз двічі
        prediction1 = model.predict_proba(test_data)[0]
        prediction2 = model.predict_proba(test_data)[0]
        
        # Результати повинні бути однаковими
        np.testing.assert_array_almost_equal(prediction1, prediction2, decimal=10)
    
    @pytest.mark.skipif(
        not Path("artifacts/models/diabetes_present/champion_calibrated.joblib").exists(),
        reason="Моделі не знайдено. Запустіть навчання моделей спочатку.",
    )
    def test_prediction_realistic_data(self):
        """Тест: прогноз на реалістичних даних."""
        model, metadata = load_champion("diabetes_present")
        
        import pandas as pd
        
        # Реалістичні дані для людини з високим ризиком діабету
        high_risk_data = pd.DataFrame([{
            "RIDAGEYR": 55,
            "RIAGENDR": 1,
            "BMXBMI": 32.0,
            "BPXSY1": 145,
            "BPXDI1": 95,
            "LBXGLU": 140,
            "LBXTC": 250,
            "LBXTR": 200,
        }])
        
        # Реалістичні дані для людини з низьким ризиком
        low_risk_data = pd.DataFrame([{
            "RIDAGEYR": 30,
            "RIAGENDR": 2,
            "BMXBMI": 22.0,
            "BPXSY1": 110,
            "BPXDI1": 70,
            "LBXGLU": 85,
            "LBXTC": 180,
            "LBXTR": 100,
        }])
        
        high_risk_pred = model.predict_proba(high_risk_data)[0][1]
        low_risk_pred = model.predict_proba(low_risk_data)[0][1]
        
        # Високий ризик повинен давати вищу ймовірність
        assert high_risk_pred > low_risk_pred
        
        # Обидва результати в межах 0-1
        assert 0 <= high_risk_pred <= 1
        assert 0 <= low_risk_pred <= 1

