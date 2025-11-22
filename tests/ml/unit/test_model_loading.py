"""
Unit-тести для завантаження моделей.
"""

import pytest
from pathlib import Path

from src.service.model_registry import (
    load_champion,
    load_model,
    MODEL_KEY_MAP,
)


class TestModelLoading:
    """Тести для завантаження моделей."""
    
    @pytest.mark.skipif(
        not Path("artifacts/models/diabetes_present/champion_calibrated.joblib").exists(),
        reason="Моделі не знайдено. Запустіть навчання моделей спочатку.",
    )
    def test_load_champion_diabetes(self):
        """Тест: завантаження чемпіонської моделі для діабету."""
        model, metadata = load_champion("diabetes_present")
        
        assert model is not None
        assert metadata is not None
        assert "version" in metadata
        assert "model_name" in metadata
    
    @pytest.mark.skipif(
        not Path("artifacts/models/obesity_present/champion_calibrated.joblib").exists(),
        reason="Моделі не знайдено. Запустіть навчання моделей спочатку.",
    )
    def test_load_champion_obesity(self):
        """Тест: завантаження чемпіонської моделі для ожиріння."""
        model, metadata = load_champion("obesity_present")
        
        assert model is not None
        assert metadata is not None
    
    @pytest.mark.skipif(
        not Path("artifacts/models/diabetes_present/champion_calibrated.joblib").exists(),
        reason="Моделі не знайдено. Запустіть навчання моделей спочатку.",
    )
    def test_load_champion_prefer_calibrated(self):
        """Тест: завантаження каліброваної моделі."""
        model, metadata = load_champion("diabetes_present", prefer_calibrated=True)
        
        assert model is not None
        assert metadata is not None
        # Перевіряємо, що це калібрована модель (якщо доступна)
        if "is_calibrated" in metadata:
            assert metadata["is_calibrated"] is True
    
    def test_load_nonexistent_model(self):
        """Тест: спроба завантажити неіснуючу модель."""
        with pytest.raises(Exception):  # FileNotFoundError або інша помилка
            load_champion("nonexistent_target")
    
    @pytest.mark.skipif(
        not Path("artifacts/models/diabetes_present/XGBoost/model.joblib").exists(),
        reason="Моделі не знайдено. Запустіть навчання моделей спочатку.",
    )
    def test_load_specific_model(self):
        """Тест: завантаження конкретної моделі."""
        model, metadata = load_model("diabetes_present", "xgb")
        
        assert model is not None
        assert metadata is not None
        assert metadata["model_name"] == "XGBoost"
    
    def test_model_key_map(self):
        """Тест: перевірка мапінгу ключів моделей."""
        assert "logreg" in MODEL_KEY_MAP
        assert "random_forest" in MODEL_KEY_MAP
        assert "xgb" in MODEL_KEY_MAP
        
        assert MODEL_KEY_MAP["logreg"] == "LogisticRegression"
        assert MODEL_KEY_MAP["xgb"] == "XGBoost"

