"""
Pydantic схеми для валідації вхідних та вихідних даних API.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class PredictRequest(BaseModel):
    """Схема запиту на прогнозування."""
    
    RIDAGEYR: Optional[float] = Field(None, description="Вік особи (роки)", ge=0, le=120)
    RIAGENDR: Optional[int] = Field(None, description="Стать")
    BMXBMI: Optional[float] = Field(None, description="Індекс маси тіла (ІМТ)", ge=10, le=60)
    BPXSY1: Optional[float] = Field(None, description="Систолічний артеріальний тиск (мм рт.ст.)", ge=50, le=250)
    BPXDI1: Optional[float] = Field(None, description="Діастолічний артеріальний тиск (мм рт.ст.)", ge=30, le=150)
    LBXGLU: Optional[float] = Field(None, description="Рівень глюкози в крові (мг/дл)", ge=50, le=500)
    LBXTC: Optional[float] = Field(None, description="Загальний холестерин (мг/дл)", ge=100, le=400)
    
    @field_validator("RIAGENDR")
    @classmethod
    def validate_gender(cls, v):
        """Валідація статі."""
        if v is not None and v not in [1, 2]:
            raise ValueError("RIAGENDR повинен бути 1 (чоловік) або 2 (жінка)")
        return v
    
    def validate_required_fields(self) -> List[str]:
        """
        Перевіряє наявність обов'язкових полів.
        
        Returns:
            Список відсутніх обов'язкових полів
        """
        required_fields = ["RIDAGEYR", "RIAGENDR", "BMXBMI"]
        missing = [field for field in required_fields if getattr(self, field) is None]
        return missing


class FeatureImpact(BaseModel):
    """Вплив ознаки на прогноз."""
    
    feature: str = Field(..., description="Назва ознаки")
    impact: float = Field(..., description="Вплив ознаки на прогноз (абсолютне значення)")


class PredictResponse(BaseModel):
    """Схема відповіді на прогнозування."""
    
    target: str = Field(..., description="Цільова змінна")
    probability: float = Field(..., description="Ймовірність позитивного класу", ge=0, le=1)
    risk_bucket: str = Field(..., description="Категорія ризику (low, medium, high)")
    model_name: str = Field(..., description="Назва використаної моделі")
    version: str = Field(..., description="Версія моделі")
    is_calibrated: bool = Field(..., description="Чи використовується калібрована модель")
    top_factors: List[FeatureImpact] = Field(..., description="Топ факторів, що впливають на прогноз")
    note: Optional[str] = Field(None, description="Примітка про методику розрахунку факторів")


class MetadataResponse(BaseModel):
    """Схема відповіді з метаданими API."""
    
    targets: List[str] = Field(..., description="Доступні цільові змінні")
    feature_schema: List[dict] = Field(..., description="Схема ознак для введення")
    model_versions: dict = Field(..., description="Версії моделей для кожного target")


class ExplainResponse(BaseModel):
    """Схема відповіді для пояснення моделі."""
    
    target: str = Field(..., description="Цільова змінна")
    feature_importances: List[FeatureImpact] = Field(..., description="Важливість ознак")
    method: str = Field(..., description="Метод обчислення важливості")


class UserBase(BaseModel):
    """Базова інформація про користувача."""

    email: EmailStr
    display_name: str = Field(..., min_length=2, max_length=80)
    first_name: Optional[str] = Field(None, max_length=50, description="Ім'я")
    last_name: Optional[str] = Field(None, max_length=50, description="Прізвище")
    date_of_birth: Optional[datetime] = Field(None, description="Дата народження")
    gender: Optional[str] = Field(None, description="Стать (male/female/other)")
    avatar_url: Optional[str] = None
    avatar_type: str = Field(default="generated", description="Тип аватару: 'generated' або 'uploaded'")
    avatar_color: Optional[str] = None


class UserRegisterRequest(BaseModel):
    """Запит на реєстрацію користувача."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    first_name: str = Field(..., min_length=1, max_length=50, description="Ім'я (обов'язкове)")
    last_name: str = Field(..., min_length=1, max_length=50, description="Прізвище (обов'язкове)")
    date_of_birth: str = Field(..., description="Дата народження у форматі YYYY-MM-DD (обов'язкова)")
    gender: str = Field(..., description="Стать (обов'язкова): male або female")

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        """Валідація статі - тільки male або female."""
        if v not in ["male", "female"]:
            raise ValueError("Стать повинна бути: male або female")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Паролі не співпадають.")
        return self


class UserLoginRequest(BaseModel):
    """Запит на вхід користувача."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class UserProfileResponse(UserBase):
    """Відповідь із профілем користувача."""

    id: int
    created_at: datetime
    updated_at: datetime


class UserUpdateRequest(BaseModel):
    """Запит оновлення профілю."""

    display_name: Optional[str] = Field(None, min_length=2, max_length=80, description="Ім'я профілю (застаріле, використовуйте first_name)")
    first_name: str = Field(..., min_length=1, max_length=50, description="Ім'я (обов'язкове)")
    last_name: Optional[str] = Field(None, max_length=50, description="Прізвище")
    date_of_birth: Optional[str] = Field(None, description="Дата народження у форматі YYYY-MM-DD")
    gender: Optional[str] = Field(None, description="Стать (male/female/other)")
    avatar_color: Optional[str] = None

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        """Валідація статі - тільки male або female."""
        if v is not None and v not in ["male", "female"]:
            raise ValueError("Стать повинна бути: male або female")
        return v


class ChangePasswordRequest(BaseModel):
    """Запит на зміну пароля."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_new_password: Optional[str] = Field(None, min_length=8, max_length=128)

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("Паролі не співпадають.")
        return self


class ForgotPasswordRequest(BaseModel):
    """Запит на відновлення пароля."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Запит на встановлення нового пароля через токен."""

    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_new_password: Optional[str] = Field(None, min_length=8, max_length=128)

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("Паролі не співпадають.")
        return self


class TokenResponse(BaseModel):
    """Відповідь із токеном доступу."""

    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


class PredictionHistoryItem(BaseModel):
    """Елемент історії прогнозів."""

    id: int
    target: str
    model_name: Optional[str]
    probability: float
    risk_bucket: str
    inputs: dict
    created_at: datetime


class PredictionHistoryResponse(BaseModel):
    """Відповідь зі списком історії прогнозів."""

    items: List[PredictionHistoryItem]


class PredictionHistoryStats(BaseModel):
    """Статистика історії прогнозів для діаграм."""

    total_predictions: int
    by_target: dict = Field(..., description="Кількість прогнозів по кожній цілі")
    by_risk_bucket: dict = Field(..., description="Кількість прогнозів по кожній категорії ризику")
    by_model: dict = Field(..., description="Кількість прогнозів по кожній моделі")
    by_target_and_risk: dict = Field(..., description="Кількість прогнозів по комбінації ціль-ризик")
    time_series: List[dict] = Field(..., description="Часова серія прогнозів з датами та ймовірностями")

