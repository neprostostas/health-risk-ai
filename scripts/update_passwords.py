#!/usr/bin/env python3
"""
Скрипт для оновлення паролів для всіх користувачів, окрім вказаних email адрес.
"""

import sys
from pathlib import Path

# Додаємо корінь проекту до шляху
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from src.service.auth_utils import get_password_hash
from src.service.db import get_session, init_db
from src.service.models import User
from sqlmodel import select

# Email адреси, для яких НЕ потрібно оновлювати пароль
EXCLUDED_EMAILS = {"neprostostas.gg@gmail.com", "stas@gmail.com"}

# Новий пароль для всіх інших користувачів
NEW_PASSWORD = "12345678"


def update_passwords():
    """Оновлює паролі для всіх користувачів, окрім виключених."""
    # Ініціалізуємо БД
    init_db()
    
    # Отримуємо сесію
    session = next(get_session())
    
    try:
        # Отримуємо всіх користувачів
        statement = select(User)
        users = session.exec(statement).all()
        
        updated_count = 0
        skipped_count = 0
        
        print(f"Знайдено {len(users)} користувачів у базі даних.\n")
        
        # Хешуємо новий пароль один раз
        hashed_password = get_password_hash(NEW_PASSWORD)
        
        for user in users:
            if user.email in EXCLUDED_EMAILS:
                print(f"⏭️  Пропущено: {user.email} (в списку виключених)")
                skipped_count += 1
                continue
            
            # Оновлюємо пароль
            user.hashed_password = hashed_password
            user.touch()
            session.add(user)
            
            print(f"✅ Оновлено пароль для: {user.email}")
            updated_count += 1
        
        # Зберігаємо зміни
        session.commit()
        
        print(f"\n{'='*60}")
        print(f"✅ Оновлено паролів: {updated_count}")
        print(f"⏭️  Пропущено користувачів: {skipped_count}")
        print(f"📝 Новий пароль для оновлених користувачів: {NEW_PASSWORD}")
        print(f"{'='*60}")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Помилка при оновленні паролів: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    print("🔐 Оновлення паролів користувачів\n")
    update_passwords()

