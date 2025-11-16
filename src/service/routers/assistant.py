"""
Маршрути для «Чату з асистентом здоровʼя».
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.service.auth_utils import require_current_user
from src.service.db import get_session
from src.service.models import PredictionHistory, User
from src.service.repositories import add_message, get_user_messages, delete_user_messages
from src.service.services.assistant_llm import (
    build_assistant_prompt,
    build_health_context,
    call_ollama,
)

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.get("/history")
def get_history(
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> List[Dict[str, Any]]:
    """Повертає останні N повідомлень чату для поточного користувача."""
    messages = get_user_messages(session, current_user.id, limit=limit)
    return [
        {
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@router.post("/chat")
def chat(
    payload: Dict[str, Any],
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> Dict[str, Any]:
    """Приймає повідомлення користувача, викликає LLM та повертає відповідь."""
    user_message = (payload.get("message") or "").strip()
    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Повідомлення не може бути порожнім.",
        )

    # Опційно: id прогнозу, на основі якого варто будувати контекст
    prediction_id: Optional[int] = None
    try:
        raw_id = payload.get("prediction_id")
        if raw_id is not None:
            prediction_id = int(raw_id)
    except Exception:
        prediction_id = None

    # Перевіримо, що prediction_id (якщо задано) належить користувачу
    if prediction_id is not None:
        stmt = (
            select(PredictionHistory)
            .where(
                PredictionHistory.id == prediction_id,
                PredictionHistory.user_id == current_user.id,
            )
            .limit(1)
        )
        if session.exec(stmt).first() is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Обраний прогноз недоступний.",
            )

    # 1) Зберігаємо повідомлення користувача
    add_message(
        session,
        user_id=current_user.id,
        role="user",
        content=user_message,
        prediction_id=prediction_id,
    )

    # 2) Будуємо контекст за вибраним (або останнім) прогнозом
    context = build_health_context(session, current_user.id, prediction_id=prediction_id)

    # 3) Формуємо підказ для моделі
    prompt = build_assistant_prompt(context, user_message)

    # 4) Виклик Ollama
    answer = call_ollama(prompt)

    # 5) Зберігаємо відповідь асистента
    msg = add_message(
        session,
        user_id=current_user.id,
        role="assistant",
        content=answer,
        prediction_id=prediction_id,
    )

    # 6) Повертаємо відповідь
    return {
        "answer": msg.content,
        "created_at": msg.created_at.isoformat(),
        "role": "assistant",
    }


@router.delete("/history")
def clear_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_current_user),
) -> Dict[str, Any]:
    """Видаляє всю переписку з асистентом для поточного користувача."""
    deleted = delete_user_messages(session, current_user.id)
    return {"deleted": deleted}


