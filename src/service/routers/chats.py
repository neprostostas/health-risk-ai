"""
Маршрути для чатів між користувачами.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..auth_utils import require_current_user
from ..db import get_session
from ..models import Chat, ChatMessage, User
from ..repositories import (
    add_chat_message,
    get_chat_by_uuid,
    get_chat_messages,
    get_last_chat_message,
    get_or_create_chat,
    get_unread_count,
    get_unread_count_for_chat,
    get_user_chats,
    list_all_users,
    mark_messages_as_read,
)
from ..schemas import (
    ChatDetailResponse,
    ChatListItem,
    ChatMessageItem,
    CreateChatRequest,
    SendMessageRequest,
    UserListItem,
)

# Chat API router - will be mounted at /api/chats in main app
# Routes defined here will be accessible at /api/chats/* (e.g., /api/chats, /api/chats/unread-count)
router = APIRouter(prefix="/chats", tags=["chats"])


def _build_user_list_item(user: User) -> UserListItem:
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
    """Повертає список всіх активних користувачів (окрім поточного)."""
    users = list_all_users(session, exclude_user_id=current_user.id)
    return [_build_user_list_item(user) for user in users]


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
                other_user=_build_user_list_item(other_user),
                last_message=last_message,
                unread_count=unread,
                updated_at=chat.updated_at,
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
    
    # Перевіряємо, чи існує користувач
    other_user = session.get(User, payload.user_id)
    if not other_user or not other_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Користувач не знайдений.",
        )
    
    # Створюємо або отримуємо чат
    chat = get_or_create_chat(session, current_user.id, payload.user_id)
    
    # Отримуємо повідомлення
    messages = get_chat_messages(session, chat.id)
    unread = get_unread_count_for_chat(session, chat.id, current_user.id)
    
    return ChatDetailResponse(
        id=chat.id,
        uuid=chat.uuid,
        other_user=_build_user_list_item(other_user),
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
        other_user=_build_user_list_item(other_user),
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

