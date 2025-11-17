"""
CRUD допоміжні функції для роботи з базою даних.
"""

from typing import List, Optional

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from .models import AssistantMessage, Chat, ChatMessage, PredictionHistory, User
from collections import defaultdict


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


def get_user_messages(session: Session, user_id: int, limit: int = 50) -> List[AssistantMessage]:
    """Повертає останні N повідомлень асистента для користувача, у порядку від старих до нових."""
    limit = max(1, min(limit, 200))
    stmt = (
        select(AssistantMessage)
        .where(AssistantMessage.user_id == user_id)
        .order_by(AssistantMessage.created_at.asc())
        .limit(limit)
    )
    return list(session.exec(stmt))


def add_message(
    session: Session,
    *,
    user_id: int,
    role: str,
    content: str,
    prediction_id: Optional[int] = None,
) -> AssistantMessage:
    """Додає повідомлення в історію чату асистента для користувача."""
    msg = AssistantMessage(
        user_id=user_id,
        role=role,
        content=content,
        prediction_id=prediction_id,
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return msg


def delete_user_messages(session: Session, user_id: int) -> int:
    """Видаляє всю історію повідомлень асистента для користувача. Повертає кількість видалених."""
    statement = select(AssistantMessage).where(AssistantMessage.user_id == user_id)
    messages = list(session.exec(statement))
    count = 0
    for m in messages:
        session.delete(m)
        count += 1
    session.commit()
    return count


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


def get_all_prediction_history(session: Session, user_id: int) -> List[PredictionHistory]:
    """Повертає всю історію прогнозів користувача (без ліміту)."""
    statement = (
        select(PredictionHistory)
        .where(PredictionHistory.user_id == user_id)
        .order_by(PredictionHistory.created_at.desc())
    )
    return list(session.exec(statement))


# ========== Chat functions ==========

def list_all_users(session: Session, exclude_user_id: Optional[int] = None) -> List[User]:
    """Повертає список всіх активних користувачів, окрім exclude_user_id."""
    statement = select(User).where(User.is_active == True)
    if exclude_user_id:
        statement = statement.where(User.id != exclude_user_id)
    statement = statement.order_by(User.display_name.asc())
    return list(session.exec(statement))


def get_or_create_chat(session: Session, user1_id: int, user2_id: int) -> Chat:
    """Отримує існуючий чат між двома користувачами або створює новий."""
    # Перевіряємо обидва варіанти (user1-user2 та user2-user1)
    statement = select(Chat).where(
        ((Chat.user1_id == user1_id) & (Chat.user2_id == user2_id)) |
        ((Chat.user1_id == user2_id) & (Chat.user2_id == user1_id))
    )
    chat = session.exec(statement).first()
    if chat:
        return chat
    
    # Створюємо новий чат (завжди з меншим ID як user1)
    if user1_id > user2_id:
        user1_id, user2_id = user2_id, user1_id
    
    chat = Chat(user1_id=user1_id, user2_id=user2_id)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return chat


def get_chat_by_uuid(session: Session, chat_uuid: str, user_id: int) -> Optional[Chat]:
    """Отримує чат за UUID, якщо користувач є учасником."""
    statement = select(Chat).where(
        Chat.uuid == chat_uuid,
        ((Chat.user1_id == user_id) | (Chat.user2_id == user_id))
    )
    return session.exec(statement).first()


def get_user_chats(session: Session, user_id: int) -> List[Chat]:
    """
    Повертає всі чати користувача, які мають хоча б одне повідомлення,
    відсортовані за останнім повідомленням.
    """
    # Знаходимо всі чати користувача, які мають хоча б одне повідомлення
    # Використовуємо JOIN з distinct для надійної фільтрації
    statement = (
        select(Chat)
        .join(ChatMessage, Chat.id == ChatMessage.chat_id)
        .where((Chat.user1_id == user_id) | (Chat.user2_id == user_id))
        .distinct()
        .order_by(Chat.updated_at.desc())
    )
    return list(session.exec(statement))


def get_chat_messages(session: Session, chat_id: int, limit: int = 100) -> List[ChatMessage]:
    """Повертає повідомлення чату, відсортовані за часом створення."""
    statement = (
        select(ChatMessage)
        .options(selectinload(ChatMessage.sender))
        .where(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    return list(session.exec(statement))


def get_last_chat_message(session: Session, chat_id: int) -> Optional[ChatMessage]:
    """Повертає останнє повідомлення чату."""
    statement = (
        select(ChatMessage)
        .options(selectinload(ChatMessage.sender))
        .where(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(1)
    )
    return session.exec(statement).first()


def add_chat_message(
    session: Session,
    chat_id: int,
    sender_id: int,
    content: str,
) -> ChatMessage:
    """Додає повідомлення в чат та оновлює updated_at чату."""
    message = ChatMessage(
        chat_id=chat_id,
        sender_id=sender_id,
        content=content,
    )
    session.add(message)
    
    # Оновлюємо updated_at чату
    chat = session.get(Chat, chat_id)
    if chat:
        chat.touch()
        session.add(chat)
    
    session.commit()
    session.refresh(message)
    return message


def mark_messages_as_read(session: Session, chat_id: int, user_id: int) -> int:
    """Позначає всі непрочитані повідомлення в чаті як прочитані для користувача."""
    from datetime import datetime
    statement = select(ChatMessage).where(
        ChatMessage.chat_id == chat_id,
        ChatMessage.sender_id != user_id,  # Тільки повідомлення від іншого користувача
        ChatMessage.read_at.is_(None)
    )
    messages = list(session.exec(statement))
    count = 0
    now = datetime.utcnow()
    for msg in messages:
        msg.read_at = now
        session.add(msg)
        count += 1
    session.commit()
    return count


def get_unread_count(session: Session, user_id: int) -> int:
    """Повертає загальну кількість непрочитаних повідомлень для користувача."""
    statement = select(ChatMessage).where(
        ChatMessage.sender_id != user_id,
        ChatMessage.read_at.is_(None)
    )
    # Фільтруємо тільки чати, де користувач є учасником
    all_messages = list(session.exec(statement))
    user_chat_ids = {c.id for c in get_user_chats(session, user_id)}
    unread = [m for m in all_messages if m.chat_id in user_chat_ids]
    return len(unread)


def get_unread_count_for_chat(session: Session, chat_id: int, user_id: int) -> int:
    """Повертає кількість непрочитаних повідомлень в конкретному чаті для користувача."""
    statement = select(ChatMessage).where(
        ChatMessage.chat_id == chat_id,
        ChatMessage.sender_id != user_id,
        ChatMessage.read_at.is_(None)
    )
    return len(list(session.exec(statement)))

