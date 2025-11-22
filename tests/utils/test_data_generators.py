"""
Генератори тестових даних для різних сценаріїв.
"""

import random
from typing import Dict, Any, List, Optional


def generate_realistic_prediction_data(
    target: str = "diabetes_present",
    age: Optional[int] = None,
    gender: Optional[int] = None,
    bmi: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Генерує реалістичні дані для прогнозування.
    
    Args:
        target: Цільова змінна (diabetes_present або obesity_present)
        age: Вік (якщо None - випадковий від 18 до 80)
        gender: Стать (1 - чоловік, 2 - жінка, якщо None - випадково)
        bmi: ІМТ (якщо None - випадковий від 18 до 35)
    
    Returns:
        Словник з даними для прогнозування
    """
    if age is None:
        age = random.randint(18, 80)
    if gender is None:
        gender = random.choice([1, 2])
    if bmi is None:
        bmi = round(random.uniform(18.0, 35.0), 1)
    
    # Генеруємо реалістичні значення на основі віку та статі
    base_systolic = 110 + (age // 10) * 5 + random.randint(-10, 10)
    base_diastolic = 70 + (age // 20) * 3 + random.randint(-5, 5)
    
    base_glucose = 85 + random.randint(-10, 15)
    if target == "diabetes_present":
        # Для діабету трохи вищі значення
        base_glucose += random.randint(5, 20)
    
    base_cholesterol = 180 + random.randint(-30, 40)
    base_triglycerides = 120 + random.randint(-30, 50)
    
    return {
        "target": target,
        "RIDAGEYR": age,
        "RIAGENDR": gender,
        "BMXBMI": bmi,
        "BPXSY1": max(70, min(200, base_systolic)),
        "BPXDI1": max(40, min(120, base_diastolic)),
        "LBXGLU": max(50, min(300, base_glucose)),
        "LBXTC": max(100, min(400, base_cholesterol)),
        "LBXTR": max(50, min(500, base_triglycerides)),
    }


def generate_extreme_cases() -> List[Dict[str, Any]]:
    """
    Генерує список екстремальних випадків для тестування.
    
    Returns:
        Список словників з екстремальними даними
    """
    cases = []
    
    # Максимальні значення
    cases.append({
        "name": "maximum_values",
        "data": {
            "target": "diabetes_present",
            "RIDAGEYR": 120,
            "RIAGENDR": 1,
            "BMXBMI": 60.0,
            "BPXSY1": 250,
            "BPXDI1": 150,
            "LBXGLU": 400,
            "LBXTC": 500,
            "LBXTR": 600,
        }
    })
    
    # Мінімальні значення
    cases.append({
        "name": "minimum_values",
        "data": {
            "target": "diabetes_present",
            "RIDAGEYR": 1,
            "RIAGENDR": 1,
            "BMXBMI": 10.0,
            "BPXSY1": 50,
            "BPXDI1": 30,
            "LBXGLU": 40,
            "LBXTC": 80,
            "LBXTR": 30,
        }
    })
    
    # Неконсистентні дані (дитина з параметрами дорослого)
    cases.append({
        "name": "inconsistent_child_adult",
        "data": {
            "target": "diabetes_present",
            "RIDAGEYR": 5,
            "RIAGENDR": 1,
            "BMXBMI": 35.0,  # Високий ІМТ для дитини
            "BPXSY1": 180,  # Високий тиск для дитини
            "BPXDI1": 120,
            "LBXGLU": 200,  # Висока глюкоза
            "LBXTC": 300,
            "LBXTR": 400,
        }
    })
    
    # Дорослий з параметрами дитини
    cases.append({
        "name": "inconsistent_adult_child",
        "data": {
            "target": "diabetes_present",
            "RIDAGEYR": 50,
            "RIAGENDR": 1,
            "BMXBMI": 12.0,  # Дуже низький ІМТ для дорослого
            "BPXSY1": 70,  # Низький тиск
            "BPXDI1": 40,
            "LBXGLU": 60,  # Низька глюкоза
            "LBXTC": 100,
            "LBXTR": 50,
        }
    })
    
    return cases


def generate_missing_data_cases() -> List[Dict[str, Any]]:
    """
    Генерує випадки з пропущеними даними.
    
    Returns:
        Список словників з даними, що містять None/пропущені значення
    """
    base_data = generate_realistic_prediction_data()
    
    cases = []
    
    # Всі поля заповнені (контрольний випадок)
    cases.append({
        "name": "all_fields_present",
        "data": base_data.copy(),
    })
    
    # Один пропущений ключовий параметр
    for field in ["BMXBMI", "BPXSY1", "LBXGLU"]:
        data = base_data.copy()
        data[field] = None
        cases.append({
            "name": f"missing_{field}",
            "data": data,
        })
    
    # Кілька пропущених параметрів
    data = base_data.copy()
    data["BMXBMI"] = None
    data["BPXDI1"] = None
    data["LBXTC"] = None
    cases.append({
        "name": "missing_multiple",
        "data": data,
    })
    
    # Всі опціональні поля пропущені
    data = base_data.copy()
    data["BPXSY1"] = None
    data["BPXDI1"] = None
    data["LBXGLU"] = None
    data["LBXTC"] = None
    data["LBXTR"] = None
    cases.append({
        "name": "missing_all_optional",
        "data": data,
    })
    
    return cases


def generate_sensitivity_test_cases(
    base_data: Dict[str, Any],
    factor: str,
    variations: List[float],
) -> List[Dict[str, Any]]:
    """
    Генерує варіації базових даних для тестування чутливості.
    
    Args:
        base_data: Базові дані
        factor: Назва фактора для зміни (наприклад, "BMXBMI")
        variations: Список варіацій (наприклад, [-2, -1, 0, 1, 2])
    
    Returns:
        Список словників з варіаціями даних
    """
    cases = []
    
    for variation in variations:
        data = base_data.copy()
        if factor in data and data[factor] is not None:
            if isinstance(data[factor], (int, float)):
                data[factor] = data[factor] + variation
            else:
                data[factor] = variation
        
        cases.append({
            "name": f"{factor}_variation_{variation:+g}",
            "data": data,
            "variation": variation,
        })
    
    return cases

