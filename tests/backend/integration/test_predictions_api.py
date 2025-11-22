"""
Інтеграційні тести для API прогнозування.
"""

import pytest
from fastapi import status


class TestPredictionsAPI:
    """Тести для API прогнозування."""
    
    def test_predict_diabetes(self, client, sample_prediction_data):
        """Тест: прогноз діабету."""
        # target передається як query parameter, не в body
        data_copy = sample_prediction_data.copy()
        target = data_copy.pop("target")
        response = client.post(
            f"/predict?target={target}",
            json=data_copy,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "target" in data
        assert "probability" in data
        assert "risk_bucket" in data
        assert "model_name" in data
        
        assert data["target"] == "diabetes_present"
        assert 0 <= data["probability"] <= 1
        assert data["risk_bucket"] in ["low", "medium", "high"]
    
    def test_predict_obesity(self, client, sample_prediction_data_obesity):
        """Тест: прогноз ожиріння."""
        # target передається як query parameter, не в body
        data_copy = sample_prediction_data_obesity.copy()
        target = data_copy.pop("target")
        response = client.post(
            f"/predict?target={target}",
            json=data_copy,
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["target"] == "obesity_present"
        assert 0 <= data["probability"] <= 1
        assert data["risk_bucket"] in ["low", "medium", "high"]
    
    def test_predict_missing_required_fields(self, client):
        """Тест: прогноз без обов'язкових полів."""
        incomplete_data = {
            "RIDAGEYR": 45,
            # Відсутні RIAGENDR та BMXBMI
        }
        
        response = client.post("/predict?target=diabetes_present", json=incomplete_data)
        
        # Може бути 422 (validation error) або 400 (business logic error)
        assert response.status_code in [400, 422]
    
    def test_predict_invalid_values(self, client):
        """Тест: прогноз з невалідними значеннями."""
        invalid_data = {
            "RIDAGEYR": 200,  # Занадто великий вік
            "RIAGENDR": 1,
            "BMXBMI": 28.5,
        }
        
        response = client.post("/predict?target=diabetes_present", json=invalid_data)
        
        assert response.status_code in [400, 422]
    
    def test_predict_with_auth_saves_history(self, client, auth_headers, sample_prediction_data):
        """Тест: прогноз з авторизацією зберігається в історії."""
        # target передається як query parameter
        data_copy = sample_prediction_data.copy()
        target = data_copy.pop("target")
        # Робимо прогноз
        predict_response = client.post(
            f"/predict?target={target}",
            json=data_copy,
            headers=auth_headers,
        )
        
        assert predict_response.status_code == 200
        
        # Перевіряємо історію (використовуємо /auth/history, бо /history повертає HTML)
        history_response = client.get("/auth/history", headers=auth_headers)
        
        assert history_response.status_code == 200
        history_data = history_response.json()
        
        # Перевіряємо, що прогноз збережено
        assert "items" in history_data
        assert len(history_data["items"]) > 0
    
    def test_predict_explain(self, client, sample_prediction_data):
        """Тест: отримання пояснення прогнозу."""
        # explain очікує target як query parameter
        target = sample_prediction_data.get("target", "diabetes_present")
        response = client.post(f"/explain?target={target}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "target" in data
        assert "feature_importances" in data
        assert "method" in data
        
        # Перевіряємо, що є важливість ознак
        assert len(data["feature_importances"]) > 0

