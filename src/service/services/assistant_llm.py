"""
Сервіс інтеграції з LLM (Ollama) для «Чату з асистентом».

Функції:
- build_health_context: формує короткий контекст про останній ризик користувача
- build_assistant_prompt: конструює повний підказ (prompt) для моделі
- call_ollama: викликає локальний Ollama та повертає текст відповіді
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

import json
import requests
from sqlmodel import Session, select

from src.service.models import PredictionHistory, User

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3"


def format_percentage(prob: float) -> str:
    """Повертає відсоткове представлення з одним знаком після коми."""
    try:
        return f"{prob * 100:.1f}%"
    except Exception:
        return "—"


def build_health_context(session: Session, user_id: int, prediction_id: Optional[int] = None) -> str:
    """Будує короткий український контекст про стан користувача.
    
    Якщо prediction_id передано — використовуємо відповідний запис історії користувача.
    Інакше — беремо останній прогноз.
    
    Включає: ціль, ймовірність, категорію ризику, ключові фактори (якщо є).
    Якщо прогнозів немає — повертає порожній рядок (вищий рівень обробить цей випадок).
    """
    if prediction_id:
        stmt = (
            select(PredictionHistory)
            .where(
                PredictionHistory.id == prediction_id,
                PredictionHistory.user_id == user_id,
            )
            .limit(1)
        )
        last: Optional[PredictionHistory] = session.exec(stmt).first()
    else:
        stmt = (
            select(PredictionHistory)
            .where(PredictionHistory.user_id == user_id)
            .order_by(PredictionHistory.created_at.desc())
            .limit(1)
        )
        last = session.exec(stmt).first()
    if not last:
        return ""
    target_label = {
        "diabetes_present": "Ризик діабету",
        "obesity_present": "Ризик ожиріння",
    }.get(last.target, last.target)

    prob_text = format_percentage(last.probability)
    bucket_label = {
        "low": "низький",
        "medium": "помірний",
        "high": "високий",
    }.get(last.risk_bucket, last.risk_bucket)

    # Витягуємо 3–5 факторів з inputs.top_factors, якщо вони збережені
    top_factors = []
    if isinstance(last.inputs, dict):
        tf = last.inputs.get("top_factors") or []
        for item in tf[:5]:
            # очікуємо структуру з полями feature/impact
            feature = item.get("feature", "фактор")
            top_factors.append(feature)

    factors_text = ", ".join(top_factors) if top_factors else "фактори не визначені"
    created_at = last.created_at.isoformat()

    return (
        f"Останній прогноз: {target_label}. "
        f"Ймовірність: {prob_text}. Категорія ризику: {bucket_label}. "
        f"Ключові фактори: {factors_text}. "
        f"Час обчислення: {created_at} UTC."
    )


def build_assistant_prompt(context: str, user_message: str) -> str:
    """Формує повний підказ для LLM з інструкціями та контекстом.
    
    Інструкції гарантують, що відповідь не міститиме діагнозів чи призначень.
    """
    system_block = (
        "Ти освітній асистент здоровʼя в системі прогнозування ризиків. "
        "Ти пояснюєш результати моделей ризику простими словами, допомагаєш зрозуміти "
        "фактори ризику та які питання варто обговорити з лікарем. "
        "Ти не ставиш діагнози, не призначаєш лікування і не рекомендуєш конкретні ліки. "
        "Відповідай українською мовою, структуровано, з короткими абзацами."
    )
    if not context:
        context_block = (
            "Контекст: у користувача ще немає розрахованих ризиків. "
            "Поясни, що спочатку потрібно пройти оцінку ризику у головному розділі застосунку."
        )
    else:
        context_block = f"Контекст користувача: {context}"

    return (
        f"{system_block}\n\n"
        f"{context_block}\n\n"
        f"Запит користувача: {user_message}\n\n"
        "Відповідай чітко й коротко, у 3–6 абзацах. Уникай медичних призначень."
    )


def call_ollama(prompt: str) -> str:
    """Викликає локальний Ollama та повертає текст відповіді.
    
    У разі помилки повертає дружнє українське повідомлення.
    """
    try:
        # Явно вимикаємо стрімінг, щоб отримати один JSON-об'єкт
        payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
        resp = requests.post(OLLAMA_URL, json=payload, timeout=60)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        if "application/json" in content_type:
            data = resp.json()
            text = (data or {}).get("response") or ""
            if not text:
                return "На жаль, не вдалося отримати відповідь від мовної моделі."
            return text.strip()
        else:
            # Деякі версії можуть повертати NDJSON рядками — спробуємо зібрати фрагменти
            aggregated: list[str] = []
            for line in resp.text.splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    part = obj.get("response")
                    if part:
                        aggregated.append(part)
                except Exception:
                    # Ігноруємо невалідні рядки
                    continue
            joined = "".join(aggregated).strip()
            if joined:
                return joined
            return "Сталася помилка під час обробки відповіді мовної моделі."
    except requests.RequestException as e:
        print(f"❌ Помилка запиту до Ollama: {e}")
        return "Сталася помилка під час звернення до мовної моделі. Спробуйте ще раз пізніше."


