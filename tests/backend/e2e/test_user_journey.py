"""
End-to-end тести: повний сценарій користувача.
"""

import pytest
from fastapi import status


class TestUserJourney:
    """Тести для повного сценарію користувача."""
    
    def test_complete_user_flow(self, client, sample_user_data, sample_prediction_data):
        """Тест: повний flow - реєстрація → логін → прогноз → історія."""
        # 1. Реєстрація
        register_response = client.post("/auth/register", json=sample_user_data)
        assert register_response.status_code in [200, 201]
        
        # 2. Логін (використовуємо JSON)
        login_response = client.post(
            "/auth/login",
            json={
                "email": sample_user_data["email"],
                "password": sample_user_data["password"],
            },
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Прогноз (target як query parameter)
        data_copy = sample_prediction_data.copy()
        target = data_copy.pop("target")
        predict_response = client.post(
            f"/predict?target={target}",
            json=data_copy,
            headers=headers,
        )
        assert predict_response.status_code == 200
        prediction_data = predict_response.json()
        assert "probability" in prediction_data
        
        # 4. Перевірка історії (використовуємо /auth/history, бо /history повертає HTML)
        history_response = client.get("/auth/history", headers=headers)
        assert history_response.status_code == 200
        
        # 5. Оновлення профілю
        profile_update = {
            "first_name": "Updated",
            "last_name": "Name",
        }
        profile_response = client.put("/users/me", json=profile_update, headers=headers)
        assert profile_response.status_code == 200
        
        updated_profile = profile_response.json()
        assert updated_profile["first_name"] == "Updated"
    
    def test_prediction_to_history_flow(self, client, auth_headers, sample_prediction_data):
        """Тест: прогноз → збереження в історії → отримання історії."""
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
        prediction = predict_response.json()
        
        # Перевіряємо історію (використовуємо /auth/history, бо /history повертає HTML)
        history_response = client.get("/auth/history", headers=auth_headers)
        assert history_response.status_code == 200
        
        history_data = history_response.json()
        
        # Перевіряємо, що прогноз збережено
        assert "items" in history_data
        assert len(history_data["items"]) > 0
        # Перевіряємо, що останній прогноз відповідає нашому
        last_prediction = history_data["items"][0]
        assert abs(last_prediction.get("probability", 0) - prediction["probability"]) < 0.01

