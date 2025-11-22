"""
Додаткові фікстури для тестів.
"""

import secrets
from typing import Dict, Any
import pytest


@pytest.fixture
def auth_headers(client, sample_user_data: dict) -> Dict[str, str]:
    """
    Створює користувача, логінить його та повертає заголовки з токеном.
    """
    # Реєстрація
    register_response = client.post("/auth/register", json=sample_user_data)
    assert register_response.status_code in [200, 201, 400]  # 400 якщо вже існує
    
    # Логін
    login_response = client.post(
        "/auth/login",
        data={
            "username": sample_user_data["email"],
            "password": sample_user_data["password"],
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def random_email() -> str:
    """Генерує випадкову email адресу для тестів."""
    return f"test_{secrets.token_hex(8)}@example.com"


@pytest.fixture
def extreme_prediction_data() -> Dict[str, Any]:
    """Екстремальні дані для тестування граничних випадків."""
    return {
        "target": "diabetes_present",
        "RIDAGEYR": 120,  # Дуже великий вік
        "RIAGENDR": 1,
        "BMXBMI": 50.0,  # Дуже високий ІМТ
        "BPXSY1": 250,  # Дуже високий тиск
        "BPXDI1": 150,
        "LBXGLU": 300,  # Дуже висока глюкоза
        "LBXTC": 400,
        "LBXTR": 500,
    }


@pytest.fixture
def minimal_prediction_data() -> Dict[str, Any]:
    """Мінімальні дані для тестування граничних випадків."""
    return {
        "target": "diabetes_present",
        "RIDAGEYR": 5,  # Дуже малий вік
        "RIAGENDR": 1,
        "BMXBMI": 10.0,  # Дуже низький ІМТ
        "BPXSY1": 70,  # Дуже низький тиск
        "BPXDI1": 40,
        "LBXGLU": 50,  # Дуже низька глюкоза
        "LBXTC": 100,
        "LBXTR": 50,
    }


@pytest.fixture
def missing_data_prediction() -> Dict[str, Any]:
    """Дані з пропущеними значеннями."""
    return {
        "target": "diabetes_present",
        "RIDAGEYR": 45,
        "RIAGENDR": 1,
        "BMXBMI": None,  # Пропущене значення
        "BPXSY1": 130,
        "BPXDI1": None,  # Пропущене значення
        "LBXGLU": 95,
        "LBXTC": None,
        "LBXTR": 150,
    }

