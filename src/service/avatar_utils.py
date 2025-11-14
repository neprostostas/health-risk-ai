"""
Утиліти для роботи з аватарами користувачів.
"""

import io
import shutil
from pathlib import Path
from typing import Optional

from PIL import Image


# Шлях до директорії для зберігання аватарів
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
AVATARS_DIR = DATA_DIR / "avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)

# Максимальний розмір файлу (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024

# Дозволені формати зображень
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/jpg"}


def get_avatar_path(user_id: int, extension: str) -> Path:
    """Повертає шлях до файлу аватару для користувача."""
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Недозволений формат файлу: {extension}")
    return AVATARS_DIR / f"{user_id}{extension}"


def get_avatar_url(user_id: int, extension: str) -> str:
    """Повертає URL для доступу до аватару."""
    filename = f"{user_id}{extension}"
    return f"/static/avatars/{filename}"


def save_avatar(user_id: int, file_content: bytes, extension: str) -> tuple[str, Path]:
    """
    Зберігає файл аватару.
    
    Returns:
        Tuple з URL та Path до збереженого файлу
    """
    # Перевірка розміру
    if len(file_content) > MAX_FILE_SIZE:
        raise ValueError("Файл занадто великий. Максимальний розмір: 5MB.")
    
    # Перевірка формату
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Недозволений формат файлу. Дозволені: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Отримуємо шлях до файлу
    avatar_path = get_avatar_path(user_id, extension)
    
    # Зберігаємо файл
    with open(avatar_path, "wb") as f:
        f.write(file_content)
    
    # Перевіряємо та обробляємо зображення (оптимізація)
    try:
        with Image.open(avatar_path) as img:
            # Конвертуємо в RGB, якщо потрібно
            if img.mode != "RGB":
                img = img.convert("RGB")
            
            # Змінюємо розмір, якщо зображення занадто велике (максимум 512x512)
            max_size = (512, 512)
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Зберігаємо оптимізоване зображення
            if extension.lower() == ".png":
                img.save(avatar_path, "PNG", optimize=True)
            else:
                img.save(avatar_path, "JPEG", quality=85, optimize=True)
    except Exception as e:
        # Якщо не вдалося обробити, видаляємо файл
        if avatar_path.exists():
            avatar_path.unlink()
        raise ValueError(f"Не вдалося обробити зображення: {str(e)}")
    
    # Повертаємо URL та шлях
    avatar_url = get_avatar_url(user_id, extension)
    return avatar_url, avatar_path


def delete_avatar(user_id: int, extension: Optional[str] = None) -> bool:
    """
    Видаляє файл аватару.
    
    Якщо extension не вказано, спробує видалити всі можливі варіанти.
    """
    deleted = False
    if extension:
        # Видаляємо конкретний файл
        avatar_path = get_avatar_path(user_id, extension)
        if avatar_path.exists():
            avatar_path.unlink()
            deleted = True
    else:
        # Видаляємо всі можливі варіанти
        for ext in ALLOWED_EXTENSIONS:
            avatar_path = get_avatar_path(user_id, ext)
            if avatar_path.exists():
                avatar_path.unlink()
                deleted = True
    
    return deleted


def validate_image_file(content_type: str, content: bytes) -> tuple[str, bytes]:
    """
    Валідує файл зображення.
    
    Returns:
        Tuple з розширенням файлу та валідованим контентом
    """
    # Перевірка MIME типу
    if content_type not in ALLOWED_MIME_TYPES:
        raise ValueError(f"Недозволений тип файлу. Дозволені: {', '.join(ALLOWED_MIME_TYPES)}")
    
    # Визначаємо розширення
    extension_map = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
    }
    extension = extension_map.get(content_type, ".jpg")
    
    # Перевірка розміру
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("Файл занадто великий. Максимальний розмір: 5MB.")
    
    # Перевірка, що це дійсно зображення
    try:
        Image.open(io.BytesIO(content)).verify()
    except Exception:
        raise ValueError("Файл не є валідним зображенням.")
    
    return extension, content

