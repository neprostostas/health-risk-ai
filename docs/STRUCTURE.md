# Структура проєкту HealthRisk.AI

Нижче наведена повна структура файлів і директорій проєкту (без node_modules, dist, cache тощо).

```
health-risk-ai/
├── .coverage
├── .gitignore
├── .dev/
│   ├── api.log
│   └── ollama.log
├── .vscode/
│   └── settings.json
├── artifacts/
│   ├── eda/
│   │   ├── age_bmi_scatter.png
│   │   ├── bmi_box_gender.png
│   │   ├── bmi_hist.png
│   │   ├── bp_dist.png
│   │   ├── chol_bmi_scatter.png
│   │   ├── correlations_heatmap.png
│   │   ├── diabetes_age.png
│   │   ├── obesity_gender.png
│   │   └── summary.txt
│   ├── leaderboards_summary.csv
│   ├── models/
│   │   ├── diabetes_present/
│   │   │   ├── calibration_after.png
│   │   │   ├── calibration_before.png
│   │   │   ├── champion_calibrated.joblib
│   │   │   ├── champion_importance.json
│   │   │   ├── champion_importance.png
│   │   │   ├── champion.json
│   │   │   ├── KNN/
│   │   │   │   ├── calibration.png
│   │   │   │   ├── metrics.json
│   │   │   │   ├── model.joblib
│   │   │   │   ├── pr.png
│   │   │   │   └── roc.png
│   │   │   ├── leaderboard.csv
│   │   │   ├── LogisticRegression/
│   │   │   │   ├── calibration.png
│   │   │   │   ├── metrics.json
│   │   │   │   ├── model.joblib
│   │   │   │   ├── pr.png
│   │   │   │   └── roc.png
│   │   │   ├── metrics_before_after.json
│   │   │   ├── MLP/
│   │   │   │   ├── calibration.png
│   │   │   │   ├── metrics.json
│   │   │   │   ├── model.joblib
│   │   │   │   ├── pr.png
│   │   │   │   └── roc.png
│   │   │   ├── RandomForest/
│   │   │   │   ├── calibration.png
│   │   │   │   ├── metrics.json
│   │   │   │   ├── model.joblib
│   │   │   │   ├── pr.png
│   │   │   │   └── roc.png
│   │   │   ├── SVC/
│   │   │   │   ├── calibration.png
│   │   │   │   ├── metrics.json
│   │   │   │   ├── model.joblib
│   │   │   │   ├── pr.png
│   │   │   │   └── roc.png
│   │   │   └── XGBoost/
│   │   │       ├── calibration.png
│   │   │       ├── metrics.json
│   │   │       ├── model.joblib
│   │   │       ├── pr.png
│   │   │       └── roc.png
│   │   └── obesity_present/
│   │       ├── calibration_after.png
│   │       ├── calibration_before.png
│   │       ├── champion_calibrated.joblib
│   │       ├── champion_importance.json
│   │       ├── champion_importance.png
│   │       ├── champion.json
│   │       ├── KNN/
│   │       │   ├── calibration.png
│   │       │   ├── metrics.json
│   │       │   ├── model.joblib
│   │       │   ├── pr.png
│   │       │   └── roc.png
│   │       ├── leaderboard.csv
│   │       ├── LogisticRegression/
│   │       │   ├── calibration.png
│   │       │   ├── metrics.json
│   │       │   ├── model.joblib
│   │       │   ├── pr.png
│   │       │   └── roc.png
│   │       ├── metrics_before_after.json
│   │       ├── MLP/
│   │       │   ├── calibration.png
│   │       │   ├── metrics.json
│   │       │   ├── model.joblib
│   │       │   ├── pr.png
│   │       │   └── roc.png
│   │       ├── RandomForest/
│   │       │   ├── calibration.png
│   │       │   ├── metrics.json
│   │       │   ├── model.joblib
│   │       │   ├── pr.png
│   │       │   └── roc.png
│   │       ├── SVC/
│   │       │   ├── calibration.png
│   │       │   ├── metrics.json
│   │       │   ├── model.joblib
│   │       │   ├── pr.png
│   │       │   └── roc.png
│   │       └── XGBoost/
│   │           ├── calibration.png
│   │           ├── metrics.json
│   │           ├── model.joblib
│   │           ├── pr.png
│   │           └── roc.png
│   └── summary.md
├── certs/
│   ├── localhost.crt
│   └── localhost.key
├── configs/
│   └── nhanes.yaml
├── data/
│   ├── app.db
│   └── avatars/
│       ├── 1_1763249426705.jpg
│       ├── 13_1763330371342.jpg
│       ├── 14_1763330372384.jpg
│       ├── 15_1763330373335.jpg
│       ├── 16_1763330374403.jpg
│       ├── 17_1763330375303.jpg
│       ├── 18_1763330376199.jpg
│       ├── 19_1763330377208.jpg
│       ├── 20_1763330378155.jpg
│       ├── 21_1763330379166.jpg
│       ├── 22_1763330380085.jpg
│       ├── 23_1763330420342.jpg
│       ├── 24_1763330421348.jpg
│       ├── 25_1763330422259.jpg
│       ├── 26_1763330423247.jpg
│       ├── 27_1763330424886.jpg
│       ├── 28_1763330425822.jpg
│       ├── 29_1763330426934.jpg
│       ├── 30_1763330427864.jpg
│       ├── 31_1763330428949.jpg
│       └── 32_1763330429941.jpg
├── datasets/
│   ├── processed/
│   │   └── health_dataset.csv
│   └── raw/
│       ├── demographic.csv
│       ├── diet.csv
│       ├── examination.csv
│       ├── labs.csv
│       ├── medications.csv
│       └── questionnaire.csv
├── htmlcov/
│   ├── class_index.html
│   ├── coverage_html_cb_bcae5fc4.js
│   ├── favicon_32_cb_58284776.png
│   ├── function_index.html
│   ├── index.html
│   ├── keybd_closed_cb_ce680311.png
│   ├── status.json
│   ├── style_cb_8432e98f.css
│   ├── z_38da4c5e8ec58f69___init___py.html
│   ├── z_38da4c5e8ec58f69_api_py.html
│   ├── z_38da4c5e8ec58f69_auth_utils_py.html
│   ├── z_38da4c5e8ec58f69_avatar_utils_py.html
│   ├── z_38da4c5e8ec58f69_db_py.html
│   ├── z_38da4c5e8ec58f69_i18n_py.html
│   ├── z_38da4c5e8ec58f69_model_registry_py.html
│   ├── z_38da4c5e8ec58f69_models_py.html
│   ├── z_38da4c5e8ec58f69_repositories_py.html
│   ├── z_38da4c5e8ec58f69_routes_auth_py.html
│   ├── z_38da4c5e8ec58f69_schemas_py.html
│   ├── z_405c5b8266849f5c_assistant_py.html
│   ├── z_405c5b8266849f5c_chats_py.html
│   ├── z_4b5638387f7b821e___init___py.html
│   ├── z_4b5638387f7b821e_main_py.html
│   ├── z_c491fc8e7f435b94___init___py.html
│   ├── z_c491fc8e7f435b94_explore_data_py.html
│   ├── z_defad1a87623d8bf___init___py.html
│   ├── z_defad1a87623d8bf_calibrate_champions_py.html
│   ├── z_defad1a87623d8bf_summarize_leaderboards_py.html
│   ├── z_defad1a87623d8bf_train_many_py.html
│   ├── z_e5ccf62099f28249___init___py.html
│   ├── z_e5ccf62099f28249_nhanes_etl_py.html
│   └── z_f7551ef1a961e057_assistant_llm_py.html
├── Makefile
├── pyrightconfig.json
├── pytest.ini
├── README.md
├── requirements.txt
├── scripts/
│   ├── cli.py
│   ├── create_random_users.py
│   ├── delete_users.py
│   └── update_passwords.py
├── src/
│   ├── analysis/
│   │   ├── __init__.py
│   │   └── explore_data.py (≈ 360 рядків)
│   ├── data/
│   │   ├── __init__.py
│   │   └── nhanes_etl.py
│   ├── health_risk_ai/
│   │   ├── __init__.py
│   │   ├── data/
│   │   │   └── nhanes_etl.py
│   │   └── main.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── calibrate_champions.py (≈ 376 рядків)
│   │   ├── summarize_leaderboards.py (≈ 325 рядків)
│   │   └── train_many.py (≈ 631 рядок)
│   └── service/
│       ├── __init__.py
│       ├── api.py (≈ 921 рядок)
│       ├── auth_utils.py
│       ├── avatar_utils.py
│       ├── db.py
│       ├── i18n.py
│       ├── model_registry.py
│       ├── models.py
│       ├── repositories.py (≈ 462 рядки)
│       ├── routers/
│       │   ├── assistant.py
│       │   └── chats.py
│       ├── routes_auth.py (≈ 1101 рядок)
│       ├── schemas.py (≈ 301 рядок)
│       ├── services/
│       │   └── assistant_llm.py
│       └── web/
│           ├── app.css
│           ├── app.js (≈ 14667 рядків)
│           ├── data/
│           │   └── analytics_summary.json
│           ├── fonts/
│           │   ├── DejaVuSans-Bold.ttf
│           │   └── DejaVuSans.ttf
│           ├── i18n.js
│           ├── images/
│           │   └── favicon.ico
│           ├── index.html
│           └── locales/
│               ├── en.json (≈ 1631 рядок)
│               └── uk.json (≈ 1743 рядки)
└── tests/
    ├── __init__.py
    ├── README.md
    ├── backend/
    │   ├── __init__.py
    │   ├── e2e/
    │   │   ├── __init__.py
    │   │   └── test_user_journey.py
    │   ├── experimental/
    │   │   └── __init__.py
    │   ├── integration/
    │   │   ├── __init__.py
    │   │   ├── test_auth_flow.py
    │   │   └── test_predictions_api.py
    │   └── unit/
    │       ├── __init__.py
    │       ├── test_auth_utils.py
    │       └── test_schemas.py
    ├── conftest.py
    ├── frontend/
    │   ├── __init__.py
    │   ├── e2e/
    │   │   └── __init__.py
    │   ├── integration/
    │   │   └── __init__.py
    │   └── unit/
    │       ├── __init__.py
    │       └── test_placeholder.py
    ├── ml/
    │   ├── __init__.py
    │   ├── experimental/
    │   │   ├── __init__.py
    │   │   ├── test_extreme_values.py
    │   │   ├── test_missing_data.py
    │   │   └── test_sensitivity.py
    │   ├── metrics/
    │   │   └── __init__.py
    │   └── unit/
    │       ├── __init__.py
    │       ├── test_model_loading.py
    │       └── test_prediction_logic.py
    └── utils/
        ├── __init__.py
        ├── fixtures.py
        └── test_data_generators.py
```

## Примітки

- Великі файли позначені з приблизною кількістю рядків у дужках
- Технічні директорії (node_modules, __pycache__, .git, .venv, тощо) виключені з документації
- htmlcov/ містить звіти про покриття коду тестами
- artifacts/models/ містить навчені моделі машинного навчання для діабету та ожиріння
- data/avatars/ містить згенеровані аватари користувачів

