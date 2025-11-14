"""
CRUD допоміжні функції для роботи з базою даних.
"""

from typing import List, Optional

from sqlmodel import Session, select

from .models import PredictionHistory, User


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """Повертає користувача за email."""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def create_user(session: Session, user: User) -> User:
    """Створює нового користувача."""
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def update_user_profile(session: Session, user: User, **kwargs) -> User:
    """Оновлює поля профілю користувача."""
    for key, value in kwargs.items():
        if value is not None:
            setattr(user, key, value)
    user.touch()
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def add_prediction_history(
    session: Session,
    user_id: int,
    target: str,
    model_name: Optional[str],
    probability: float,
    risk_bucket: str,
    inputs: dict,
) -> PredictionHistory:
    """Додає запис про прогноз."""
    history = PredictionHistory(
        user_id=user_id,
        target=target,
        model_name=model_name,
        probability=probability,
        risk_bucket=risk_bucket,
        inputs=inputs,
    )
    session.add(history)
    session.commit()
    session.refresh(history)
    return history


def list_prediction_history(session: Session, user_id: int, limit: int = 50) -> List[PredictionHistory]:
    """Повертає історію прогнозів користувача."""
    statement = (
        select(PredictionHistory)
        .where(PredictionHistory.user_id == user_id)
        .order_by(PredictionHistory.created_at.desc())
        .limit(limit)
    )
    return list(session.exec(statement))


def delete_prediction(session: Session, user_id: int, prediction_id: int) -> bool:
    """Видаляє запис історії, якщо він належить користувачу."""
    statement = select(PredictionHistory).where(
        PredictionHistory.id == prediction_id,
        PredictionHistory.user_id == user_id,
    )
    history = session.exec(statement).first()
    if not history:
        return False
    session.delete(history)
    session.commit()
    return True


