"""
Модуль для налаштування підключення до бази даних та керування сесіями.
"""

from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{(DATA_DIR / 'app.db').as_posix()}"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def migrate_add_missing_columns() -> None:
    """Додає відсутні колонки до існуючих таблиць."""
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        # Перевіряємо та додаємо відсутні колонки до таблиці user
        if "user" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("user")]
            
            # Додаємо avatar_type якщо відсутня
            if "avatar_type" not in columns:
                print("🔧 Додавання колонки avatar_type до таблиці user...")
                conn.execute(text("ALTER TABLE user ADD COLUMN avatar_type VARCHAR"))
                conn.execute(text("UPDATE user SET avatar_type = 'generated' WHERE avatar_type IS NULL"))
                conn.commit()
                print("✅ Колонка avatar_type додана до таблиці user")
            
            # Додаємо нові поля для профілю
            new_fields = {
                "first_name": "VARCHAR",
                "last_name": "VARCHAR",
                "date_of_birth": "DATETIME",
                "gender": "VARCHAR",
            }
            
            for field_name, field_type in new_fields.items():
                if field_name not in columns:
                    print(f"🔧 Додавання колонки {field_name} до таблиці user...")
                    conn.execute(text(f"ALTER TABLE user ADD COLUMN {field_name} {field_type}"))
                    conn.commit()
                    print(f"✅ Колонка {field_name} додана до таблиці user")


def init_db() -> None:
    """Створює всі таблиці, якщо вони ще не існують."""
    # Імпортуємо моделі, щоб вони були зареєстровані в метаданих
    from .models import (  # noqa: F401
        AssistantMessage,
        Chat,
        ChatMessage,
        PasswordResetToken,
        PredictionHistory,
        User,
    )
    
    # Створюємо нові таблиці
    SQLModel.metadata.create_all(bind=engine)
    
    # Виконуємо міграції для додавання відсутніх колонок
    migrate_add_missing_columns()


def get_session() -> Iterator[Session]:
    """Повертає генератор сесії для залежностей FastAPI."""
    with Session(engine) as session:
        yield session


@contextmanager
def session_scope() -> Iterator[Session]:
    """Контекстний менеджер для виконання операцій у межах однієї транзакції."""
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


