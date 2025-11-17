#!/usr/bin/env python3
"""
Інтерактивний скрипт для видалення користувачів з бази даних.
"""

import sys
from pathlib import Path

# Додаємо корінь проекту до шляху
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from src.service.avatar_utils import delete_avatar
from src.service.db import get_session, init_db
from src.service.models import (
    AssistantMessage,
    Chat,
    ChatMessage,
    PasswordResetToken,
    PredictionHistory,
    User,
)
from sqlmodel import select


def get_user_by_id(session, user_id: int):
    """Отримує користувача за ID."""
    return session.get(User, user_id)


def delete_user_data(session, user_id: int):
    """Видаляє всі дані, пов'язані з користувачем."""
    deleted_items = {
        "predictions": 0,
        "assistant_messages": 0,
        "chat_messages": 0,
        "chats": 0,
        "avatar": False,
    }
    
    # Видаляємо історію прогнозів
    predictions = session.exec(
        select(PredictionHistory).where(PredictionHistory.user_id == user_id)
    ).all()
    for pred in predictions:
        session.delete(pred)
        deleted_items["predictions"] += 1
    
    # Видаляємо повідомлення асистента
    assistant_msgs = session.exec(
        select(AssistantMessage).where(AssistantMessage.user_id == user_id)
    ).all()
    for msg in assistant_msgs:
        session.delete(msg)
        deleted_items["assistant_messages"] += 1
    
    # Видаляємо токени відновлення пароля
    reset_tokens = session.exec(
        select(PasswordResetToken).where(PasswordResetToken.user_id == user_id)
    ).all()
    for token in reset_tokens:
        session.delete(token)
    
    # Видаляємо чати та повідомлення в чатах
    # Знаходимо всі чати, де користувач є учасником
    user_chats = session.exec(
        select(Chat).where(
            (Chat.user1_id == user_id) | (Chat.user2_id == user_id)
        )
    ).all()
    
    for chat in user_chats:
        # Видаляємо всі повідомлення в чаті
        chat_messages = session.exec(
            select(ChatMessage).where(ChatMessage.chat_id == chat.id)
        ).all()
        for msg in chat_messages:
            session.delete(msg)
            deleted_items["chat_messages"] += 1
        
        # Видаляємо сам чат
        session.delete(chat)
        deleted_items["chats"] += 1
    
    # Видаляємо аватарку
    if delete_avatar(user_id):
        deleted_items["avatar"] = True
    
    return deleted_items


def main():
    """Інтерактивний скрипт для видалення користувачів."""
    print("🔧 Ініціалізація бази даних...")
    init_db()
    
    print("\n🗑️  Скрипт видалення користувачів")
    print("=" * 50)
    
    # Запитуємо діапазон ID
    try:
        start_id = input("Введіть початковий ID користувача (включно): ").strip()
        if not start_id:
            print("❌ Помилка: початковий ID не може бути порожнім")
            return
        
        end_id = input("Введіть кінцевий ID користувача (включно): ").strip()
        if not end_id:
            print("❌ Помилка: кінцевий ID не може бути порожнім")
            return
        
        start_id = int(start_id)
        end_id = int(end_id)
        
        if start_id > end_id:
            print("❌ Помилка: початковий ID не може бути більшим за кінцевий")
            return
        
        if start_id < 1 or end_id < 1:
            print("❌ Помилка: ID повинні бути додатніми числами")
            return
            
    except ValueError:
        print("❌ Помилка: введіть коректні числа")
        return
    
    # Отримуємо список користувачів для видалення
    session_gen = get_session()
    session = next(session_gen)
    
    try:
        users_to_delete = []
        for user_id in range(start_id, end_id + 1):
            user = get_user_by_id(session, user_id)
            if user:
                users_to_delete.append(user)
        
        if not users_to_delete:
            print(f"\n⚠️  Користувачі з ID від {start_id} до {end_id} не знайдені в базі даних.")
            return
        
        # Показуємо список користувачів
        print(f"\n📋 Знайдено {len(users_to_delete)} користувачів для видалення:")
        print("-" * 50)
        for user in users_to_delete:
            print(f"  ID {user.id}: {user.display_name} ({user.email})")
        print("-" * 50)
        
        # Підтвердження
        confirm = input(f"\n⚠️  Ви впевнені, що хочете видалити {len(users_to_delete)} користувачів? (yes/no): ").strip().lower()
        
        if confirm not in ["yes", "y", "так", "т"]:
            print("❌ Видалення скасовано.")
            return
        
        # Видаляємо користувачів
        print(f"\n🗑️  Видалення користувачів...")
        deleted_count = 0
        total_deleted = {
            "predictions": 0,
            "assistant_messages": 0,
            "chat_messages": 0,
            "chats": 0,
            "avatars": 0,
        }
        
        for user in users_to_delete:
            try:
                # Видаляємо всі пов'язані дані
                deleted_data = delete_user_data(session, user.id)
                
                # Видаляємо самого користувача
                session.delete(user)
                session.commit()
                
                deleted_count += 1
                total_deleted["predictions"] += deleted_data["predictions"]
                total_deleted["assistant_messages"] += deleted_data["assistant_messages"]
                total_deleted["chat_messages"] += deleted_data["chat_messages"]
                total_deleted["chats"] += deleted_data["chats"]
                if deleted_data["avatar"]:
                    total_deleted["avatars"] += 1
                
                print(f"  ✅ Видалено: {user.display_name} (ID {user.id})")
                
            except Exception as e:
                print(f"  ❌ Помилка при видаленні користувача {user.id}: {e}")
                session.rollback()
        
        print(f"\n📊 Підсумок видалення:")
        print(f"   👥 Користувачів: {deleted_count}")
        print(f"   📈 Прогнозів: {total_deleted['predictions']}")
        print(f"   💬 Повідомлень асистента: {total_deleted['assistant_messages']}")
        print(f"   💬 Повідомлень у чатах: {total_deleted['chat_messages']}")
        print(f"   💬 Чатів: {total_deleted['chats']}")
        print(f"   🖼️  Аватарок: {total_deleted['avatars']}")
        print(f"\n✅ Готово!")
        
    except Exception as e:
        print(f"❌ Помилка: {e}")
        session.rollback()
    finally:
        session.close()


if __name__ == "__main__":
    main()

