"""
Інтеграційні тести для автентифікації (реєстрація, логін, профіль).
"""

import pytest
from fastapi import status


class TestRegistration:
    """Тести для реєстрації користувача."""
    
    def test_register_success(self, client, sample_user_data):
        """Тест: успішна реєстрація."""
        response = client.post("/auth/register", json=sample_user_data)
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert "access_token" in data or "message" in data
    
    def test_register_duplicate_email(self, client, sample_user_data):
        """Тест: реєстрація з існуючим email."""
        # Перша реєстрація
        client.post("/auth/register", json=sample_user_data)
        
        # Друга реєстрація з тим самим email
        response = client.post("/auth/register", json=sample_user_data)
        
        # Може бути 400 або 409 (Conflict)
        assert response.status_code in [400, 409]
    
    def test_register_invalid_email(self, client, sample_user_data):
        """Тест: реєстрація з невалідним email."""
        data = sample_user_data.copy()
        data["email"] = "not-an-email"
        
        response = client.post("/auth/register", json=data)
        
        assert response.status_code == 422  # Validation error


class TestLogin:
    """Тести для логіну."""
    
    def test_login_success(self, client, sample_user_data):
        """Тест: успішний логін."""
        # Спочатку реєстрація
        client.post("/auth/register", json=sample_user_data)
        
        # Потім логін (використовуємо JSON, не form data)
        response = client.post(
            "/auth/login",
            json={
                "email": sample_user_data["email"],
                "password": sample_user_data["password"],
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client, sample_user_data):
        """Тест: логін з неправильним паролем."""
        # Реєстрація
        client.post("/auth/register", json=sample_user_data)
        
        # Логін з неправильним паролем (використовуємо JSON)
        response = client.post(
            "/auth/login",
            json={
                "email": sample_user_data["email"],
                "password": "WrongPassword123!",
            },
        )
        
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client):
        """Тест: логін неіснуючого користувача."""
        response = client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "SomePassword123!",
            },
        )
        
        assert response.status_code == 401


class TestProfile:
    """Тести для профілю користувача."""
    
    def test_get_profile(self, client, auth_headers):
        """Тест: отримання профілю."""
        response = client.get("/users/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "display_name" in data
    
    def test_get_profile_unauthorized(self, client):
        """Тест: отримання профілю без авторизації."""
        response = client.get("/users/me")
        
        assert response.status_code == 401
    
    def test_update_profile(self, client, auth_headers):
        """Тест: оновлення профілю."""
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
        }
        
        response = client.put("/users/me", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "Name"

