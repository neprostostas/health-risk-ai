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

## Чат з асистентом (Ollama)

Сторінка `/assistant` додає «Чат з асистентом здоровʼя», який пояснює результати ризиків простими словами українською. Асистент не ставить діагнозів і не призначає лікування.

Як це працює:
- На бекенді додано маршрути:
  - `GET /assistant/history` — повертає останні повідомлення чату.
  - `POST /assistant/chat` — приймає запит користувача, формує контекст з останнього прогнозу та звертається до Ollama.
- Окремий сервіс `services/assistant_llm.py`:
  - `build_health_context(session, user_id)` — короткий контекст (ймовірність, категорія ризику, ключові фактори).
  - `build_assistant_prompt(context, user_message)` — інструкції для LLM та блоки з контекстом.
  - `call_ollama(prompt)` — запит до `http://localhost:11434/api/generate` з моделлю `llama3`.
- На фронтенді додано розділ `page-assistant` з панеллю «Мій стан» і чат-панеллю.

Запуск Ollama локально (коротко):
1. Встановіть Ollama: див. офіційні інструкції (`https://ollama.com`).
2. Завантажте модель: `ollama pull llama3` (або `llama3:8b`).
3. Запустіть Ollama (звичайно на `http://localhost:11434`).

Обмеження:
- Асистент не є медичною консультацією.
- Якщо немає жодного прогнозу, асистент попросить спершу пройти оцінку ризику в застосунку.
