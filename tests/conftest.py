"""
Загальні фікстури та конфігурація для всіх тестів.
"""

import os
import tempfile
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

# Додаємо корінь проєкту до PYTHONPATH
import sys
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.service.api import app
from src.service.db import get_session


@pytest.fixture(scope="function")
def test_db() -> Generator[Session, None, None]:
    """
    Створює тимчасову тестову базу даних для кожного тесту.
    """
    # Створюємо тимчасову БД в пам'яті або файл
    db_file = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
    db_file.close()
    
    test_db_url = f"sqlite:///{db_file.name}"
    engine = create_engine(
        test_db_url,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    
    # Імпортуємо моделі для створення таблиць
    from src.service.models import (
        User,
        PredictionHistory,
        PasswordResetToken,
        AssistantMessage,
        Chat,
        ChatMessage,
        UserBlock,
    )
    
    # Створюємо таблиці
    SQLModel.metadata.create_all(engine)
    
    # Створюємо сесію
    with Session(engine) as session:
        yield session
    
    # Очищаємо після тесту
    os.unlink(db_file.name)


@pytest.fixture(scope="function")
def client(test_db: Session) -> Generator[TestClient, None, None]:
    """
    Створює тестовий клієнт FastAPI з підміною БД.
    """
    from typing import Iterator
    
    def override_get_session() -> Iterator[Session]:
        yield test_db
    
    app.dependency_overrides[get_session] = override_get_session
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Очищаємо підміни після тесту
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data() -> dict:
    """Тестові дані користувача для реєстрації."""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "confirm_password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User",
        "date_of_birth": "1990-01-01",
        "gender": "male",
    }


@pytest.fixture
def sample_prediction_data() -> dict:
    """Тестові дані для прогнозування (діабет)."""
    return {
        "target": "diabetes_present",
        "RIDAGEYR": 45,
        "RIAGENDR": 1,  # Чоловік
        "BMXBMI": 28.5,
        "BPXSY1": 130,
        "BPXDI1": 85,
        "LBXGLU": 95,
        "LBXTC": 200,
        "LBXTR": 150,
    }


@pytest.fixture
def sample_prediction_data_obesity() -> dict:
    """Тестові дані для прогнозування (ожиріння)."""
    return {
        "target": "obesity_present",
        "RIDAGEYR": 35,
        "RIAGENDR": 2,  # Жінка
        "BMXBMI": 32.0,
        "BPXSY1": 125,
        "BPXDI1": 80,
        "LBXGLU": 90,
        "LBXTC": 190,
        "LBXTR": 140,
    }


@pytest.fixture
def auth_headers(client, sample_user_data: dict) -> dict:
    """
    Створює користувача, логінить його та повертає заголовки з токеном.
    """
    # Реєстрація
    register_response = client.post("/auth/register", json=sample_user_data)
    assert register_response.status_code in [200, 201, 400, 409]  # 400/409 якщо вже існує
    
    # Логін (використовуємо JSON, не form data)
    login_response = client.post(
        "/auth/login",
        json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"],
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}

