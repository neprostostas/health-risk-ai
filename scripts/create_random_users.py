#!/usr/bin/env python3
"""
Скрипт для створення 10 випадкових користувачів у базі даних з аватарками.
"""

import random
import sys
import urllib.request
import time
from datetime import datetime, timedelta
from pathlib import Path

# Додаємо корінь проекту до шляху
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from src.service.auth_utils import get_password_hash
from src.service.avatar_utils import save_avatar
from src.service.db import get_session, init_db
from src.service.models import User
from src.service.repositories import create_user

# Списки для генерації випадкових даних (англійською мовою)
FIRST_NAMES_MALE = [
    "Alexander", "James", "Michael", "David", "William",
    "John", "Robert", "Daniel", "Matthew", "Christopher",
    "Andrew", "Joseph", "Joshua", "Ryan", "Nicholas"
]

FIRST_NAMES_FEMALE = [
    "Emily", "Sarah", "Jessica", "Ashley", "Amanda",
    "Jennifer", "Nicole", "Elizabeth", "Michelle", "Lauren",
    "Stephanie", "Rachel", "Samantha", "Olivia", "Emma"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones",
    "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee"
]

DOMAINS = ["gmail.com", "ukr.net", "mail.ua", "i.ua", "yahoo.com"]


def generate_random_date_of_birth():
    """Генерує випадкову дату народження між 18 та 80 роками."""
    today = datetime.utcnow()
    min_age = 18
    max_age = 80
    min_date = today - timedelta(days=max_age * 365)
    max_date = today - timedelta(days=min_age * 365)
    
    time_between = max_date - min_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return min_date + timedelta(days=random_days)


def download_cat_avatar():
    """Завантажує випадкове зображення кота з Cataas.com."""
    try:
        # Cataas.com API - випадковий кіт з розміром 400x400
        url = "https://cataas.com/cat?width=400&height=400"
        
        # Додаємо невелику затримку, щоб отримати різні зображення
        time.sleep(0.5)
        
        with urllib.request.urlopen(url, timeout=10) as response:
            image_data = response.read()
            return image_data
    except Exception as e:
        print(f"⚠️  Помилка завантаження аватарки: {e}")
        return None


def generate_random_user(index: int):
    """Генерує випадкові дані для користувача."""
    gender = random.choice(["male", "female"])
    
    if gender == "male":
        first_name = random.choice(FIRST_NAMES_MALE)
    else:
        first_name = random.choice(FIRST_NAMES_FEMALE)
    
    last_name = random.choice(LAST_NAMES)
    display_name = f"{first_name} {last_name}"
    
    # Генеруємо унікальний email
    email = f"{first_name.lower()}.{last_name.lower()}.{index}@{random.choice(DOMAINS)}"
    
    # Випадковий пароль (для тестування використовуємо простий)
    password = "Test1234!"
    
    date_of_birth = generate_random_date_of_birth()
    
    # Випадковий колір для аватару (якщо не вдасться завантажити)
    colors = ["#5A64F1", "#F15E6F", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3"]
    avatar_color = random.choice(colors)
    
    return {
        "email": email,
        "hashed_password": get_password_hash(password),
        "display_name": display_name,
        "first_name": first_name,
        "last_name": last_name,
        "date_of_birth": date_of_birth,
        "gender": gender,
        "avatar_type": "generated",  # Буде змінено на "uploaded" якщо вдасться завантажити
        "avatar_color": avatar_color,
        "is_active": True,
    }


def main():
    """Створює 10 випадкових користувачів у базі даних."""
    print("🔧 Ініціалізація бази даних...")
    init_db()
    
    print("👥 Створення 10 випадкових користувачів...")
    
    created_count = 0
    skipped_count = 0
    
    # Генеруємо користувачів
    for i in range(1, 11):
        user_data = generate_random_user(i)
        
        # Створюємо сесію
        session_gen = get_session()
        session = next(session_gen)
        
        try:
            # Перевіряємо, чи не існує вже користувач з таким email
            from src.service.repositories import get_user_by_email
            existing = get_user_by_email(session, user_data["email"])
            if existing:
                print(f"⏭️  Користувач {i}: {user_data['email']} вже існує, пропускаємо")
                skipped_count += 1
                continue
            
            # Створюємо користувача
            user = User(**user_data)
            created_user = create_user(session, user)
            
            # Завантажуємо та зберігаємо аватарку
            print(f"📸 Завантаження аватарки для {created_user.display_name}...", end=" ")
            avatar_data = download_cat_avatar()
            
            if avatar_data:
                try:
                    avatar_url, avatar_path = save_avatar(created_user.id, avatar_data, ".jpg")
                    # Оновлюємо користувача з URL аватарки
                    created_user.avatar_url = avatar_url
                    created_user.avatar_type = "uploaded"
                    session.add(created_user)
                    session.commit()
                    session.refresh(created_user)
                    print("✅")
                except Exception as e:
                    print(f"⚠️  (помилка збереження: {e})")
            else:
                print("⚠️  (використано generated)")
            
            print(f"✅ Користувач {i}: {created_user.display_name} ({created_user.email})")
            created_count += 1
            
        except Exception as e:
            print(f"❌ Помилка при створенні користувача {i}: {e}")
            session.rollback()
        finally:
            session.close()
    
    print(f"\n📊 Підсумок:")
    print(f"   ✅ Створено: {created_count}")
    print(f"   ⏭️  Пропущено: {skipped_count}")
    print(f"   📝 Всього: {created_count + skipped_count}")


if __name__ == "__main__":
    main()

