"""
Unit-тести для auth_utils (хешування паролів, JWT токени).
"""

import pytest
from datetime import timedelta

from src.service.auth_utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)


class TestPasswordHashing:
    """Тести для хешування та перевірки паролів."""
    
    def test_hash_password(self):
        """Тест: пароль хешується коректно."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")  # bcrypt формат
    
    def test_verify_correct_password(self):
        """Тест: правильний пароль проходить перевірку."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_incorrect_password(self):
        """Тест: неправильний пароль не проходить перевірку."""
        password = "TestPassword123!"
        wrong_password = "WrongPassword456!"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False
    
    def test_hash_different_passwords_different_hashes(self):
        """Тест: різні паролі дають різні хеші."""
        password1 = "Password1"
        password2 = "Password2"
        
        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)
        
        assert hash1 != hash2
    
    def test_hash_same_password_different_hashes(self):
        """Тест: той самий пароль дає різні хеші (через salt)."""
        password = "SamePassword"
        
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Хеші повинні бути різними через випадковий salt
        assert hash1 != hash2
        # Але обидва повинні проходити перевірку
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True
    
    def test_hash_long_password(self):
        """Тест: дуже довгий пароль обрізається до 72 байтів."""
        long_password = "A" * 100
        hashed = get_password_hash(long_password)
        
        # Хеш повинен бути створений без помилок
        assert len(hashed) > 0
        # Перевірка повинна працювати (хоча пароль обрізаний)
        assert verify_password(long_password[:72], hashed) is True


class TestJWTTokens:
    """Тести для JWT токенів."""
    
    def test_create_token(self):
        """Тест: токен створюється коректно."""
        email = "test@example.com"
        token = create_access_token(email)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_valid_token(self):
        """Тест: валідний токен розкодовується коректно."""
        email = "test@example.com"
        token = create_access_token(email)
        
        token_data = decode_token(token)
        
        assert token_data.sub == email
        assert token_data.exp is not None
    
    def test_decode_invalid_token(self):
        """Тест: невалідний токен викликає помилку."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(Exception):  # HTTPException або JWTError
            decode_token(invalid_token)
    
    def test_token_expires(self):
        """Тест: токен з коротким терміном дії створюється коректно."""
        email = "test@example.com"
        expires_delta = timedelta(minutes=5)
        token = create_access_token(email, expires_delta=expires_delta)
        
        token_data = decode_token(token)
        assert token_data.sub == email
    
    def test_token_default_expiration(self):
        """Тест: токен має дефолтний термін дії."""
        email = "test@example.com"
        token = create_access_token(email)
        
        token_data = decode_token(token)
        
        # Перевіряємо, що exp встановлено
        assert token_data.exp is not None
        # Перевіряємо, що exp в майбутньому
        from datetime import datetime, timezone
        # exp може бути offset-aware або offset-naive, порівнюємо правильно
        exp_time = token_data.exp
        now = datetime.utcnow()
        # Якщо exp_time має timezone, перетворюємо now на UTC з timezone
        if exp_time.tzinfo is not None:
            now = datetime.now(timezone.utc)
        assert exp_time > now

