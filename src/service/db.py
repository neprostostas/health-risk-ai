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
                conn.execute(text("ALTER TABLE user ADD COLUMN avatar_type VARCHAR"))
                conn.execute(text("UPDATE user SET avatar_type = 'generated' WHERE avatar_type IS NULL"))
                conn.commit()
            
            # Додаємо нові поля для профілю
            new_fields = {
                "first_name": "VARCHAR",
                "last_name": "VARCHAR",
                "date_of_birth": "DATETIME",
                "gender": "VARCHAR",
            }
            
            for field_name, field_type in new_fields.items():
                if field_name not in columns:
                    conn.execute(text(f"ALTER TABLE user ADD COLUMN {field_name} {field_type}"))
                    conn.commit()

        # Перевіряємо та додаємо відсутні колонки до таблиці chat
        if "chat" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("chat")]
            
            # Додаємо is_pinned якщо відсутня
            if "is_pinned" not in columns:
                conn.execute(text("ALTER TABLE chat ADD COLUMN is_pinned BOOLEAN DEFAULT 0"))
                conn.commit()
            
            # Додаємо order якщо відсутня
            if "order" not in columns:
                conn.execute(text("ALTER TABLE chat ADD COLUMN \"order\" INTEGER DEFAULT 0"))
                conn.commit()
        
        # Створюємо таблицю userblock якщо відсутня
        if "userblock" not in inspector.get_table_names():
            conn.execute(text("""
                CREATE TABLE userblock (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    blocked_user_id INTEGER NOT NULL,
                    created_at DATETIME NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES user(id),
                    FOREIGN KEY (blocked_user_id) REFERENCES user(id)
                )
            """))
            conn.execute(text("CREATE INDEX ix_userblock_user_id ON userblock(user_id)"))
            conn.execute(text("CREATE INDEX ix_userblock_blocked_user_id ON userblock(blocked_user_id)"))
            conn.execute(text("CREATE UNIQUE INDEX ix_userblock_unique ON userblock(user_id, blocked_user_id)"))
            conn.commit()


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
        UserBlock,
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


