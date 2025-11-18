"""
ORM моделі для користувачів та історії прогнозів.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON
from sqlalchemy import Column as SAColumn
from sqlalchemy import ForeignKey
from sqlalchemy import Text
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


class AssistantMessage(SQLModel, table=True):
    """Повідомлення чату асистента здоровʼя, повʼязані з користувачем.
    
    Зберігає роль (user/assistant), вміст повідомлення та часові мітки.
    Опційно може посилатися на конкретний прогноз для більш точного контексту.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    role: str = Field(nullable=False, description="Роль автора: user або assistant")
    content: str = Field(sa_column=SAColumn(Text, nullable=False), description="Текст повідомлення")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    prediction_id: Optional[int] = Field(
        default=None,
        foreign_key="predictionhistory.id",
        description="Опційний звʼязок з конкретним прогнозом"
    )

AssistantMessage.model_rebuild()


class Chat(SQLModel, table=True):
    """Чат між двома користувачами."""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    uuid: str = Field(
        unique=True,
        index=True,
        nullable=False,
        default_factory=lambda: str(uuid.uuid4()),
        description="Унікальний ідентифікатор чату для URL"
    )
    user1_id: int = Field(foreign_key="user.id", index=True, nullable=False, description="ID першого учасника")
    user2_id: int = Field(foreign_key="user.id", index=True, nullable=False, description="ID другого учасника")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    is_pinned: bool = Field(default=False, nullable=False, description="Чи закріплений чат")
    order: int = Field(default=0, nullable=False, description="Порядок відображення чату (для drag and drop)")
    
    # Relationships для user1 та user2 не визначені тут, оскільки SQLModel не підтримує
    # foreign_keys в Relationship() для кількох foreign keys до однієї таблиці.
    # Завантаження користувачів виконується через selectinload в репозиторіях.
    messages: list["ChatMessage"] = Relationship(back_populates="chat")
    
    def touch(self) -> None:
        """Оновлює поле updated_at."""
        self.updated_at = datetime.utcnow()


class ChatMessage(SQLModel, table=True):
    """Повідомлення в чаті між користувачами."""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: int = Field(foreign_key="chat.id", index=True, nullable=False)
    sender_id: int = Field(foreign_key="user.id", index=True, nullable=False, description="ID відправника")
    content: str = Field(sa_column=SAColumn(Text, nullable=False), description="Текст повідомлення")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    read_at: Optional[datetime] = Field(default=None, description="Час прочитання повідомлення")
    
    chat: Optional[Chat] = Relationship(back_populates="messages")
    sender: Optional["User"] = Relationship()


Chat.model_rebuild()
ChatMessage.model_rebuild()


class UserBlock(SQLModel, table=True):
    """Зв'язок блокування між користувачами.
    
    Якщо user_id заблокував blocked_user_id, то вони не можуть:
    - Створювати нові чати
    - Відправляти повідомлення один одному
    - Бачити один одного в активних чатах
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False, description="ID користувача, який заблокував")
    blocked_user_id: int = Field(foreign_key="user.id", index=True, nullable=False, description="ID заблокованого користувача")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, description="Дата блокування")
    
    # Унікальний індекс для пари (user_id, blocked_user_id)
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


UserBlock.model_rebuild()


