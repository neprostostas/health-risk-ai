"""
ORM моделі для користувачів та історії прогнозів.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON
from sqlmodel import Column, Field, Relationship, SQLModel


class TimestampedBase(SQLModel):
    """Базовий клас із полями часу."""

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Дата створення запису",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Дата останнього оновлення запису",
    )

    def touch(self) -> None:
        """Оновлює поле updated_at."""
        self.updated_at = datetime.utcnow()


class PredictionHistory(SQLModel, table=True):
    """Збережена історія прогнозів користувача."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    target: str = Field(nullable=False, description="Назва цілі (діабет, ожиріння)")
    model_name: Optional[str] = Field(default=None, description="Використана модель")
    probability: float = Field(nullable=False, description="Ймовірність, 0..1")
    risk_bucket: str = Field(nullable=False, description="Категорія ризику (low, medium, high)")
    inputs: dict = Field(
        sa_column=Column("inputs", SQLITE_JSON, nullable=False),
        description="Вхідні параметри прогнозу",
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    user: Optional["User"] = Relationship(back_populates="history")


class User(TimestampedBase, table=True):
    """Модель користувача системи."""

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False, description="Електронна пошта")
    hashed_password: str = Field(nullable=False, description="Хеш пароля")
    display_name: str = Field(nullable=False, description="Ім'я відображення")
    first_name: Optional[str] = Field(default=None, description="Ім'я")
    last_name: Optional[str] = Field(default=None, description="Прізвище")
    date_of_birth: Optional[datetime] = Field(default=None, description="Дата народження")
    gender: Optional[str] = Field(default=None, description="Стать (male/female/other)")
    avatar_url: Optional[str] = Field(default=None, description="URL завантаженого аватару (опційно)")
    avatar_type: str = Field(default="generated", nullable=False, description="Тип аватару: 'generated' або 'uploaded'")
    avatar_color: Optional[str] = Field(default=None, description="Колір для аватару за замовчуванням")
    is_active: bool = Field(default=True, nullable=False)

    history: list[PredictionHistory] = Relationship(back_populates="user")


class PasswordResetToken(SQLModel, table=True):
    """Токен для відновлення пароля."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    token: str = Field(unique=True, index=True, nullable=False, description="Унікальний токен")
    expires_at: datetime = Field(nullable=False, description="Час закінчення токену")
    used: bool = Field(default=False, nullable=False, description="Чи використано токен")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


PredictionHistory.model_rebuild()  # ensure forward refs
User.model_rebuild()
PasswordResetToken.model_rebuild()


