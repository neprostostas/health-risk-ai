"""
Маршрути для чатів між користувачами.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..auth_utils import require_current_user
from ..db import get_session
from ..models import Chat, ChatMessage, User
from ..repositories import (
    add_chat_message,
    delete_chat,
    get_blocked_user_ids,
    get_blocked_users_with_timestamps,
    get_chat_by_uuid,
    get_chat_messages,
    get_last_chat_message,
    get_or_create_chat,
    get_unread_count,
    get_unread_count_for_chat,
    get_user_chats,
    is_user_blocked,
    list_all_users,
    mark_messages_as_read,
    reorder_chats,
    toggle_chat_pin,
)
from ..schemas import (
    ChatDetailResponse,
    ChatListItem,
    ChatMessageItem,
    CreateChatRequest,
    ReorderChatsRequest,
    SendMessageRequest,
    UserListItem,
)

# Chat API router - will be mounted at /api/chats in main app
# Routes defined here will be accessible at /api/chats/* (e.g., /api/chats, /api/chats/unread-count)
router = APIRouter(prefix="/chats", tags=["chats"])


def _build_user_list_item(user: User, is_blocked: bool = False, blocked_at: Optional[datetime] = None) -> UserListItem:
    """Створює UserListItem з User."""
    return UserListItem(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        first_name=user.first_name,
        last_name=user.last_name,
        avatar_url=user.avatar_url,
        avatar_type=user.avatar_type or "generated",
        avatar_color=user.avatar_color,
        is_active=user.is_active,
        is_blocked=is_blocked,
        blocked_at=blocked_at,
    )


def _build_chat_message_item(msg: ChatMessage) -> ChatMessageItem:
    """Створює ChatMessageItem з ChatMessage."""
    return ChatMessageItem(
        id=msg.id,
        sender_id=msg.sender_id,
        content=msg.content,
        created_at=msg.created_at,
        read_at=msg.read_at,
    )


@router.get("/users", response_model=List[UserListItem])
async def list_users(
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
) -> List[UserListItem]:
    """Повертає список всіх активних користувачів (окрім поточного).
    
    Включає заблокованих користувачів з позначкою is_blocked=True.
    Заблоковані користувачі включаються навіть якщо вони не в основному списку активних.
    """
    # Отримуємо основний список активних користувачів
    users = list_all_users(session, exclude_user_id=current_user.id)
    blocked_user_ids = get_blocked_user_ids(session, current_user.id)
    blocked_timestamps = get_blocked_users_with_timestamps(session, current_user.id)
    
    # Створюємо словник для швидкого пошуку
    user_dict = {user.id: user for user in users}
    
    # Додаємо заблокованих користувачів, яких немає в основному списку
    for blocked_id in blocked_user_ids:
        if blocked_id not in user_dict:
            # Завантажуємо заблокованого користувача, навіть якщо він не активний
            blocked_user = session.get(User, blocked_id)
            if blocked_user and blocked_user.id != current_user.id:
                user_dict[blocked_id] = blocked_user
    
    # Формуємо результат з правильним прапорцем is_blocked та blocked_at
    result = []
    for user in user_dict.values():
        is_blocked = user.id in blocked_user_ids
        blocked_at = blocked_timestamps.get(user.id) if is_blocked else None
        result.append(_build_user_list_item(user, is_blocked=is_blocked, blocked_at=blocked_at))
    
    # Сортуємо за display_name
    result.sort(key=lambda u: u.display_name)
    
    return result


@router.get("/unread-count", response_model=dict)
async def get_unread_messages_count(
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Повертає загальну кількість непрочитаних повідомлень для користувача."""
    count = get_unread_count(session, current_user.id)
    return {"count": count}


@router.get("", response_model=List[ChatListItem])
async def list_chats(
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
) -> List[ChatListItem]:
    """Повертає список всіх чатів користувача."""
    chats = get_user_chats(session, current_user.id)
    result = []
    
    for chat in chats:
        # Визначаємо іншого користувача (завантажуємо вручну, оскільки relationships не визначені)
        other_user_id = chat.user2_id if chat.user1_id == current_user.id else chat.user1_id
        other_user = session.get(User, other_user_id)
        if not other_user:
            continue
        
        # Отримуємо останнє повідомлення
        last_msg = get_last_chat_message(session, chat.id)
        last_message = _build_chat_message_item(last_msg) if last_msg else None
        
        # Отримуємо кількість непрочитаних
        unread = get_unread_count_for_chat(session, chat.id, current_user.id)
        
        result.append(
            ChatListItem(
                id=chat.id,
                uuid=chat.uuid,
                other_user=_build_user_list_item(
                    other_user,
                    is_blocked=is_user_blocked(session, current_user.id, other_user.id)
                ),
                last_message=last_message,
                unread_count=unread,
                updated_at=chat.updated_at,
                is_pinned=chat.is_pinned,
                order=chat.order,
            )
        )
    
    return result


@router.post("", response_model=ChatDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    payload: CreateChatRequest,
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
) -> ChatDetailResponse:
    """Створює новий чат або повертає існуючий між двома користувачами."""
    if payload.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не можна створити чат з самим собою.",
        )
    
    # Перевіряємо, чи поточний користувач не заблокований
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ваш обліковий запис заблоковано. Ви не можете створювати чати.",
        )
    
    # Перевіряємо, чи існує користувач
    other_user = session.get(User, payload.user_id)
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Користувач не знайдений.",
        )
    
    # Перевіряємо, чи інший користувач не заблокований
    if not other_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Неможливо створити чат. Користувач заблокований.",
        )
    
    # Створюємо або отримуємо чат
    chat = get_or_create_chat(session, current_user.id, payload.user_id)
    
    # Отримуємо повідомлення
    messages = get_chat_messages(session, chat.id)
    unread = get_unread_count_for_chat(session, chat.id, current_user.id)
    
    return ChatDetailResponse(
        id=chat.id,
        uuid=chat.uuid,
        other_user=_build_user_list_item(
            other_user,
            is_blocked=is_user_blocked(session, current_user.id, other_user.id)
        ),
        messages=[_build_chat_message_item(msg) for msg in messages],
        unread_count=unread,
    )


@router.get("/{chat_uuid}", response_model=ChatDetailResponse)
async def get_chat(
    chat_uuid: str,
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
) -> ChatDetailResponse:
    """Отримує детальну інформацію про чат за UUID."""
    # Перевіряємо, чи поточний користувач не заблокований
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ваш обліковий запис заблоковано.",
        )
    
    chat = get_chat_by_uuid(session, chat_uuid, current_user.id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чат не знайдено.",
        )
    
    # Визначаємо іншого користувача (завантажуємо вручну, оскільки relationships не визначені)
    other_user_id = chat.user2_id if chat.user1_id == current_user.id else chat.user1_id
    other_user = session.get(User, other_user_id)
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Користувач не знайдено.",
        )
    
    # Отримуємо повідомлення
    messages = get_chat_messages(session, chat.id)
    unread = get_unread_count_for_chat(session, chat.id, current_user.id)
    
    # Позначаємо повідомлення як прочитані
    if unread > 0:
        mark_messages_as_read(session, chat.id, current_user.id)
        unread = 0
    
    return ChatDetailResponse(
        id=chat.id,
        uuid=chat.uuid,
        other_user=_build_user_list_item(
            other_user,
            is_blocked=is_user_blocked(session, current_user.id, other_user.id)
        ),
        messages=[_build_chat_message_item(msg) for msg in messages],
        unread_count=unread,
    )


@router.post("/{chat_uuid}/messages", response_model=ChatMessageItem, status_code=status.HTTP_201_CREATED)
async def send_message(
    chat_uuid: str,
    payload: SendMessageRequest,
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
) -> ChatMessageItem:
    """Відправляє повідомлення в чат."""
    # Перевіряємо, чи поточний користувач не заблокований
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ваш обліковий запис заблоковано. Ви не можете відправляти повідомлення.",
        )
    
    chat = get_chat_by_uuid(session, chat_uuid, current_user.id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чат не знайдено.",
        )
    
    # Перевіряємо, чи користувач є учасником
    if chat.user1_id != current_user.id and chat.user2_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Немає доступу до цього чату.",
        )
    
    # Отримуємо іншого користувача
    other_user_id = chat.user2_id if chat.user1_id == current_user.id else chat.user1_id
    other_user = session.get(User, other_user_id)
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Користувач не знайдений.",
        )
    
    # Перевіряємо, чи користувачі не заблоковані один одним
    if is_user_blocked(session, current_user.id, other_user_id) or is_user_blocked(session, other_user_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Не можна відправляти повідомлення заблокованому користувачу.",
        )
    
    # Перевіряємо, чи інший користувач не заблокований (глобальний статус)
    if not other_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Неможливо відправити повідомлення. Користувач заблокований.",
        )
    
    message = add_chat_message(session, chat.id, current_user.id, payload.content)
    return _build_chat_message_item(message)


@router.post("/{chat_uuid}/read", response_model=dict)
async def mark_chat_as_read(
    chat_uuid: str,
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Позначає всі повідомлення в чаті як прочитані."""
    chat = get_chat_by_uuid(session, chat_uuid, current_user.id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чат не знайдено.",
        )
    
    count = mark_messages_as_read(session, chat.id, current_user.id)
    return {"marked_read": count}


@router.delete("/{chat_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_endpoint(
    chat_uuid: str,
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
):
    """Видаляє чат та всі його повідомлення."""
    success = delete_chat(session, chat_uuid, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чат не знайдено.",
        )


@router.patch("/{chat_uuid}/pin", response_model=dict)
async def toggle_pin_chat(
    chat_uuid: str,
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Закріплює або відкріплює чат."""
    chat = toggle_chat_pin(session, chat_uuid, current_user.id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чат не знайдено.",
        )
    return {"is_pinned": chat.is_pinned, "order": chat.order}


@router.patch("/reorder", response_model=dict)
async def reorder_chats_endpoint(
    payload: ReorderChatsRequest,
    current_user: User = Depends(require_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Оновлює порядок чатів."""
    # Конвертуємо список ChatOrderItem в список словників для репозиторію
    chat_orders = [{"uuid": item.uuid, "order": item.order} for item in payload.chats]
    success = reorder_chats(session, current_user.id, chat_orders)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не вдалося оновити порядок чатів.",
        )
    return {"success": True}

