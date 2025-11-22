"""
Unit-тести для Pydantic схем (валідація даних).
"""

import pytest
from pydantic import ValidationError

from src.service.schemas import (
    PredictRequest,
    PredictResponse,
    UserRegisterRequest,
    UserLoginRequest,
)


class TestPredictRequest:
    """Тести для схеми PredictRequest."""
    
    def test_valid_request(self):
        """Тест: валідний запит проходить валідацію."""
        data = {
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
            "BPXSY1": 130,
            "BPXDI1": 85,
            "LBXGLU": 95,
            "LBXTC": 200,
        }
        
        request = PredictRequest(**data)
        
        assert request.RIDAGEYR == 45
        assert request.RIAGENDR == 1
        assert request.BMXBMI == 28.5
    
    def test_optional_fields(self):
        """Тест: опціональні поля можуть бути None."""
        data = {
            "RIDAGEYR": 45,
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
        }
        
        request = PredictRequest(**data)
        
        assert request.BPXSY1 is None
        assert request.BPXDI1 is None
        assert request.LBXGLU is None
    
    def test_gender_validation(self):
        """Тест: валідація статі (тільки 1 або 2)."""
        # Валідні значення
        request1 = PredictRequest(RIDAGEYR=45, RIAGENDR=1, BMXBMI=28.5)
        assert request1.RIAGENDR == 1
        
        request2 = PredictRequest(RIDAGEYR=45, RIAGENDR=2, BMXBMI=28.5)
        assert request2.RIAGENDR == 2
        
        # Невалідне значення
        with pytest.raises(ValidationError):
            PredictRequest(RIDAGEYR=45, RIAGENDR=3, BMXBMI=28.5)
    
    def test_age_bounds(self):
        """Тест: вік повинен бути в межах 0-120."""
        # Валідні значення
        request1 = PredictRequest(RIDAGEYR=0, RIAGENDR=1, BMXBMI=28.5)
        assert request1.RIDAGEYR == 0
        
        request2 = PredictRequest(RIDAGEYR=120, RIAGENDR=1, BMXBMI=28.5)
        assert request2.RIDAGEYR == 120
        
        # Невалідні значення
        with pytest.raises(ValidationError):
            PredictRequest(RIDAGEYR=-1, RIAGENDR=1, BMXBMI=28.5)
        
        with pytest.raises(ValidationError):
            PredictRequest(RIDAGEYR=121, RIAGENDR=1, BMXBMI=28.5)
    
    def test_bmi_bounds(self):
        """Тест: ІМТ повинен бути в межах 10-60."""
        # Валідні значення
        request1 = PredictRequest(RIDAGEYR=45, RIAGENDR=1, BMXBMI=10.0)
        assert request1.BMXBMI == 10.0
        
        request2 = PredictRequest(RIDAGEYR=45, RIAGENDR=1, BMXBMI=60.0)
        assert request2.BMXBMI == 60.0
        
        # Невалідні значення
        with pytest.raises(ValidationError):
            PredictRequest(RIDAGEYR=45, RIAGENDR=1, BMXBMI=9.9)
        
        with pytest.raises(ValidationError):
            PredictRequest(RIDAGEYR=45, RIAGENDR=1, BMXBMI=60.1)
    
    def test_validate_required_fields(self):
        """Тест: перевірка обов'язкових полів."""
        # Всі поля присутні
        request1 = PredictRequest(RIDAGEYR=45, RIAGENDR=1, BMXBMI=28.5)
        missing1 = request1.validate_required_fields()
        assert len(missing1) == 0
        
        # Відсутнє поле
        request2 = PredictRequest(RIDAGEYR=45, RIAGENDR=1, BMXBMI=None)
        missing2 = request2.validate_required_fields()
        assert "BMXBMI" in missing2
        
        # Відсутні кілька полів
        request3 = PredictRequest(RIDAGEYR=None, RIAGENDR=1, BMXBMI=None)
        missing3 = request3.validate_required_fields()
        assert "RIDAGEYR" in missing3
        assert "BMXBMI" in missing3


class TestPredictResponse:
    """Тести для схеми PredictResponse."""
    
    def test_valid_response(self):
        """Тест: валідна відповідь проходить валідацію."""
        from src.service.schemas import FeatureImpact
        
        data = {
            "target": "diabetes_present",
            "probability": 0.75,
            "risk_bucket": "high",
            "model_name": "XGBoost",
            "version": "1.0",
            "is_calibrated": True,
            "top_factors": [
                FeatureImpact(feature="BMXBMI", impact=0.15),
                FeatureImpact(feature="LBXGLU", impact=0.12),
            ],
        }
        
        response = PredictResponse(**data)
        
        assert response.target == "diabetes_present"
        assert response.probability == 0.75
        assert response.risk_bucket == "high"
        assert len(response.top_factors) == 2
    
    def test_probability_bounds(self):
        """Тест: ймовірність повинна бути в межах 0-1."""
        from src.service.schemas import FeatureImpact
        
        # Валідні значення
        response1 = PredictResponse(
            target="diabetes_present",
            probability=0.0,
            risk_bucket="low",
            model_name="XGBoost",
            version="1.0",
            is_calibrated=False,
            top_factors=[],
        )
        assert response1.probability == 0.0
        
        response2 = PredictResponse(
            target="diabetes_present",
            probability=1.0,
            risk_bucket="high",
            model_name="XGBoost",
            version="1.0",
            is_calibrated=False,
            top_factors=[],
        )
        assert response2.probability == 1.0
        
        # Невалідні значення
        with pytest.raises(ValidationError):
            PredictResponse(
                target="diabetes_present",
                probability=-0.1,
                risk_bucket="low",
                model_name="XGBoost",
                version="1.0",
                is_calibrated=False,
                top_factors=[],
            )
        
        with pytest.raises(ValidationError):
            PredictResponse(
                target="diabetes_present",
                probability=1.1,
                risk_bucket="high",
                model_name="XGBoost",
                version="1.0",
                is_calibrated=False,
                top_factors=[],
            )


class TestUserRegisterRequest:
    """Тести для схеми UserRegisterRequest."""
    
    def test_valid_registration(self):
        """Тест: валідні дані реєстрації."""
        data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "confirm_password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User",
            "date_of_birth": "1990-01-01",
            "gender": "male",
        }
        
        request = UserRegisterRequest(**data)
        
        assert request.email == "test@example.com"
        assert request.first_name == "Test"
        assert request.last_name == "User"
        assert request.gender == "male"
    
    def test_password_mismatch(self):
        """Тест: невідповідність паролів викликає помилку."""
        data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "confirm_password": "DifferentPassword456!",
            "first_name": "Test",
            "last_name": "User",
            "date_of_birth": "1990-01-01",
            "gender": "male",
        }
        
        # Перевірка невідповідності паролів (є валідатор @model_validator)
        with pytest.raises(ValidationError) as exc_info:
            UserRegisterRequest(**data)
        
        # Перевіряємо, що помилка стосується паролів
        errors = exc_info.value.errors()
        assert any("Паролі не співпадають" in str(error.get("msg", "")) for error in errors)
    
    def test_short_password(self):
        """Тест: короткий пароль викликає помилку."""
        data = {
            "email": "test@example.com",
            "password": "Short1!",
            "confirm_password": "Short1!",
            "first_name": "Test",
            "last_name": "User",
            "date_of_birth": "1990-01-01",
        }
        
        with pytest.raises(ValidationError):
            UserRegisterRequest(**data)
    
    def test_invalid_email(self):
        """Тест: невалідний email викликає помилку."""
        data = {
            "email": "not-an-email",
            "password": "TestPassword123!",
            "confirm_password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User",
            "date_of_birth": "1990-01-01",
        }
        
        with pytest.raises(ValidationError):
            UserRegisterRequest(**data)

