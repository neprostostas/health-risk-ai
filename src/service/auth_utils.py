"""
Допоміжні функції для аутентифікації та авторизації.
"""

from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from .db import get_session
from .models import User

SECRET_KEY = "change_this_secret_to_env_variable"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


class TokenData(BaseModel):
    """Дані, що вбудовуються у JWT токен."""

    sub: EmailStr
    exp: datetime


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Перевіряє відповідність пароля хешу."""
    try:
        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Генерує хеш для пароля за допомогою bcrypt.
    
    Обмежує довжину пароля до 72 байтів (обмеження bcrypt).
    """
    # Bcrypt має обмеження 72 байти для пароля
    password_bytes = password.encode("utf-8")
    
    # Перевірка та обмеження довжини
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Генерація salt та хешування
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Створює JWT токен."""
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> TokenData:
    """Розкодовує токен та повертає вміст."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenData(**payload)
    except JWTError as exc:  # noqa: B904
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недійсний або прострочений токен. Увійдіть повторно.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> Optional[User]:
    """
    Повертає поточного користувача.

    Якщо токен відсутній або некоректний — повертає None (для необов'язкової аутентифікації).
    """
    if not token:
        return None

    token_data = decode_token(token)
    statement = select(User).where(User.email == token_data.sub, User.is_active.is_(True))
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Користувач не знайдений або неактивний.",
        )
    return user


async def require_current_user(user: Optional[User] = Depends(get_current_user)) -> User:
    """Гарантує, що користувач аутентифікований."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Потрібно увійти до системи.",
        )
    return user


