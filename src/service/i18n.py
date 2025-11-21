"""
Модуль інтернаціоналізації (i18n) для бекенду.

Надає функції для локалізації повідомлень на основі JSON файлів.
"""

import json
from pathlib import Path
from typing import Dict, Optional

# Шлях до директорії з файлами локалізації
LOCALES_DIR = Path(__file__).resolve().parent / "web" / "locales"

# Підтримувані мови
SUPPORTED_LANGUAGES = ["uk", "en"]
DEFAULT_LANGUAGE = "uk"

# Кеш перекладів
_translations_cache: Dict[str, Dict] = {}


def _load_translations(lang: str) -> Dict:
    """Завантажує переклади для вказаної мови."""
    if lang in _translations_cache:
        return _translations_cache[lang]
    
    json_path = LOCALES_DIR / f"{lang}.json"
    
    if not json_path.exists():
        # Якщо файл не знайдено, повертаємо порожній словник
        _translations_cache[lang] = {}
        return {}
    
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            translations = json.load(f)
            _translations_cache[lang] = translations
            return translations
    except (json.JSONDecodeError, IOError) as e:
        # У випадку помилки повертаємо порожній словник
        print(f"Warning: Failed to load translations for {lang}: {e}")
        _translations_cache[lang] = {}
        return {}


def _get_nested_value(obj: Dict, key: str) -> Optional[str]:
    """Отримує значення з вкладених словників за допомогою dot-notation ключа."""
    if not obj or not key:
        return None
    
    parts = key.split(".")
    current = obj
    
    for part in parts:
        if not isinstance(current, dict):
            return None
        if part not in current:
            return None
        current = current[part]
    
    return current if isinstance(current, str) else None


def t(key: str, lang: str = DEFAULT_LANGUAGE, **kwargs) -> str:
    """
    Перекладає ключ на вказану мову.
    
    Args:
        key: Ключ перекладу в форматі dot-notation (наприклад, "auth.login.errors.invalidCredentials")
        lang: Код мови (за замовчуванням "uk")
        **kwargs: Змінні для інтерполяції (наприклад, name="John" для "Hello {{name}}")
    
    Returns:
        Перекладений текст або сам ключ, якщо переклад не знайдено
    """
    if not key:
        return ""
    
    # Завантажуємо переклади для вказаної мови
    translations = _load_translations(lang)
    
    # Спробуємо знайти переклад
    value = _get_nested_value(translations, key)
    
    # Якщо не знайдено, спробуємо українську як fallback
    if value is None and lang != DEFAULT_LANGUAGE:
        uk_translations = _load_translations(DEFAULT_LANGUAGE)
        value = _get_nested_value(uk_translations, key)
    
    # Якщо все ще не знайдено, повертаємо ключ
    if value is None:
        return key
    
    # Інтерполяція змінних
    if kwargs:
        for var_key, var_value in kwargs.items():
            value = value.replace(f"{{{{{var_key}}}}}", str(var_value))
    
    return value


def get_accept_language(request_headers: Optional[Dict] = None) -> str:
    """
    Визначає мову з заголовка Accept-Language або повертає мову за замовчуванням.
    
    Args:
        request_headers: Словник з заголовками запиту (опціонально)
    
    Returns:
        Код мови (uk або en)
    """
    if not request_headers:
        return DEFAULT_LANGUAGE
    
    accept_language = request_headers.get("accept-language", "")
    
    # Простий парсинг Accept-Language
    # Формат: "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7"
    if "uk" in accept_language.lower():
        return "uk"
    elif "en" in accept_language.lower():
        return "en"
    
    return DEFAULT_LANGUAGE

