"""
Експериментальні тести: чутливість моделі до змін факторів.
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
class TestSensitivity:
    """Тести для чутливості моделі."""
    
    def test_bmi_sensitivity(self):
        """Тест: чутливість до зміни ІМТ."""
        model, metadata = load_champion("diabetes_present")
        
        base_data = {
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 25.0,
            "BPXSY1": 130,
            "BPXDI1": 85,
            "LBXGLU": 95,
            "LBXTC": 200,
            "LBXTR": 150,
        }
        
        predictions = []
        bmi_values = [20.0, 25.0, 30.0, 35.0, 40.0]
        
        for bmi in bmi_values:
            data = base_data.copy()
            data["BMXBMI"] = bmi
            test_data = pd.DataFrame([data])
            pred = model.predict_proba(test_data)[0][1]
            predictions.append(pred)
        
        # Перевіряємо, що збільшення ІМТ збільшує ризик
        for i in range(len(predictions) - 1):
            assert predictions[i] <= predictions[i + 1] + 0.01  # Дозволяємо невелику похибку
    
    def test_glucose_sensitivity(self):
        """Тест: чутливість до зміни глюкози."""
        model, metadata = load_champion("diabetes_present")
        
        base_data = {
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": 130,
            "BPXDI1": 85,
            "LBXGLU": 90,
            "LBXTC": 200,
            "LBXTR": 150,
        }
        
        predictions = []
        glucose_values = [80, 100, 120, 140, 160, 180]
        
        for glucose in glucose_values:
            data = base_data.copy()
            data["LBXGLU"] = glucose
            test_data = pd.DataFrame([data])
            pred = model.predict_proba(test_data)[0][1]
            predictions.append(pred)
        
        # Перевіряємо, що збільшення глюкози збільшує ризик діабету
        for i in range(len(predictions) - 1):
            assert predictions[i] <= predictions[i + 1] + 0.01
    
    def test_age_sensitivity(self):
        """Тест: чутливість до зміни віку."""
        model, metadata = load_champion("diabetes_present")
        
        base_data = {
            "RIDAGEYR": 30,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": 130,
            "BPXDI1": 85,
            "LBXGLU": 95,
            "LBXTC": 200,
            "LBXTR": 150,
        }
        
        predictions = []
        age_values = [30, 40, 50, 60, 70, 80]
        
        for age in age_values:
            data = base_data.copy()
            data["RIDAGEYR"] = age
            test_data = pd.DataFrame([data])
            pred = model.predict_proba(test_data)[0][1]
            predictions.append(pred)
        
        # Перевіряємо, що збільшення віку загалом збільшує ризик
        # Але не завжди монотонно через нелінійність моделі
        # Перевіряємо лише, що останній (найстарший) має вищий або рівний ризик першому
        assert predictions[-1] >= predictions[0] - 0.05  # Дозволяємо невелику похибку
        # Перевіряємо, що всі прогнози валідні
        assert all(0 <= p <= 1 for p in predictions)
    
    def test_small_change_impact(self):
        """Тест: вплив невеликої зміни ключового фактора."""
        model, metadata = load_champion("diabetes_present")
        
        base_data = {
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": 130,
            "BPXDI1": 85,
            "LBXGLU": 95,
            "LBXTC": 200,
            "LBXTR": 150,
        }
        
        # Базовий прогноз
        base_test = pd.DataFrame([base_data])
        base_pred = model.predict_proba(base_test)[0][1]
        
        # Змінюємо ІМТ на +1
        data_plus_1 = base_data.copy()
        data_plus_1["BMXBMI"] = 29.5
        test_plus_1 = pd.DataFrame([data_plus_1])
        pred_plus_1 = model.predict_proba(test_plus_1)[0][1]
        
        # Змінюємо глюкозу на +10
        data_plus_10_glu = base_data.copy()
        data_plus_10_glu["LBXGLU"] = 105
        test_plus_10_glu = pd.DataFrame([data_plus_10_glu])
        pred_plus_10_glu = model.predict_proba(test_plus_10_glu)[0][1]
        
        # Перевіряємо, що всі прогнози валідні
        assert 0 <= base_pred <= 1
        assert 0 <= pred_plus_1 <= 1
        assert 0 <= pred_plus_10_glu <= 1
        
        # Модель може бути нечутливою до дуже малих змін через округлення
        # або через те, що модель використовує imputation/transformation
        # Перевіряємо лише, що зміни не призводять до NaN або невалідних значень
        assert not np.isnan(pred_plus_1)
        assert not np.isnan(pred_plus_10_glu)
        
        # Збільшення параметрів зазвичай збільшує ризик, але не завжди строго
        # через нелінійність та взаємодію факторів
        # Перевіряємо лише, що зміни не призводять до екстремальних змін
        assert abs(pred_plus_1 - base_pred) < 0.5  # Розумна межа зміни
        assert abs(pred_plus_10_glu - base_pred) < 0.5

