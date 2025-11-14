# Health Risk AI

Це універсальна система оцінки та прогнозування ризиків для здоров'я з використанням методів штучного інтелекту (NHANES dataset).

## Структура проєкту

```
health-risk-ai/
├── src/
│   └── health_risk_ai/
│       ├── __init__.py
│       └── main.py
├── configs/
├── datasets/
│   └── raw/
├── artifacts/
├── tests/
└── requirements.txt
```

## Встановлення

```bash
pip install -r requirements.txt
```

## Використання

```bash
python -m src.health_risk_ai.main
```


## Запуск API та веб-інтерфейсу

```bash
python3 -m src.service.api
```

Після запуску відкрийте у браузері `http://localhost:8000/app`, щоб скористатися веб-інтерфейсом.
