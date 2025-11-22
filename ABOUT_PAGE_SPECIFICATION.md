# Специфікація сторінки "Про систему" (/about)

## 1. Структура нової сторінки /about

### 1.1. HTML структура

```
<section id="page-about" class="page" aria-labelledby="page-title" hidden>
  <div class="about-page">
    <!-- Всі блоки контенту -->
  </div>
</section>
```

### 1.2. CSS класи

- `.about-page` - основний контейнер
- `.about-page__header` - заголовок сторінки
- `.about-page__section` - окремий контентний блок
- `.about-page__nav` - внутрішня навігація (anchor links)
- `.about-page__card` - карточки для інформації (використовувати `.glass-card`)

### 1.3. Структура блоків

1. **Header** - заголовок та підзаголовок
2. **Quick Navigation** - швидка навігація по секціям (anchor links)
3. **Main Idea** - основна ідея системи
4. **Architecture** - архітектура системи
5. **Data & Processing** - дані та їх обробка
6. **Risk Prediction** - прогнозування ризиків
7. **Interactive Features** - інтерактивні елементи
8. **Technical Info** - технічна інформація
9. **Limitations** - важливі обмеження
10. **Contact/Authorship** - контакти та авторство

---

## 2. Зміни у фронтенді (структурні)

### 2.1. Маршрутизація

**Файл: `app.js`**

#### 2.1.1. Додати в ROUTE_SECTIONS:

```javascript
const ROUTE_SECTIONS = {
  '/': 'page-form',
  '/form': 'page-form',
  '/diagrams': 'page-diagrams',
  '/reports': 'page-report',
  '/profile': 'page-profile',
  '/history': 'page-history',
  '/assistant': 'page-assistant',
  '/chats': 'page-chats',
  '/api-status': 'page-api-status',
  '/api-status/history': 'page-api-status-history',
  '/about': 'page-about',  // ← ДОДАТИ
  // ... інші маршрути
};
```

#### 2.1.2. Додати в publicRoutes (якщо є):

```javascript
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',  // ← ДОДАТИ (публічна сторінка)
];
```

#### 2.1.3. Обробка маршруту в showSectionForPath():

Додати обробку `/about` аналогічно іншим маршрутам, але без перевірки авторизації.

### 2.2. Навігація

**Файл: `index.html`**

#### 2.2.1. Додати в Sidebar (після останнього пункту меню):

```html
<li class="sidebar-nav__item">
  <a href="/about" class="sidebar-nav__link" data-i18n="layout.nav.about">
    <span class="icon" data-lucide="info"></span>
    <span>Про систему</span>
  </a>
</li>
```

**Альтернатива:** Додати в Footer, якщо це краще підходить дизайну.

### 2.3. Анімації та стилі

**Використати існуючі:**
- `.page` - базова стилізація сторінки
- `.glass-card` - карточки зі скляним ефектом
- Анімації появи через `requestAnimationFrame` (як в інших сторінках)
- Адаптивність через існуючі media queries

---

## 3. Контент та структура сторінки

### 3.1. Блок: Заголовок

**HTML структура:**
```html
<div class="about-page__header">
  <h1 class="about-page__title" data-i18n="about.title">Про систему</h1>
  <p class="about-page__subtitle" data-i18n="about.subtitle">
    Автоматизована система оцінки й прогнозування ризиків для здоров'я
  </p>
</div>
```

**Ключі локалізації:**
- `about.title` - "Про систему" / "About System"
- `about.subtitle` - підзаголовок

### 3.2. Блок: Швидка навігація (Anchor Navigation)

**HTML структура:**
```html
<nav class="about-page__nav">
  <a href="#main-idea" data-i18n="about.nav.mainIdea">Що це?</a>
  <a href="#how-it-works" data-i18n="about.nav.howItWorks">Як працює?</a>
  <a href="#architecture" data-i18n="about.nav.architecture">Архітектура</a>
  <a href="#models" data-i18n="about.nav.models">Моделі</a>
  <a href="#ai-assistant" data-i18n="about.nav.aiAssistant">AI-асистент</a>
  <a href="#limitations" data-i18n="about.nav.limitations">Обмеження</a>
  <a href="#technical" data-i18n="about.nav.technical">Технічні деталі</a>
</nav>
```

**JavaScript логіка:**
- Плавний скрол до секції при кліку
- Підсвітка активної секції при скролі
- Використати `scrollIntoView({ behavior: 'smooth' })`

### 3.3. Блок: Основна ідея

**ID секції:** `#main-idea`

**Підблоки:**
1. **Що таке HealthRisk.AI**
   - Короткий опис системи
   - Призначення

2. **Для чого створений**
   - Мета проєкту
   - Цільова аудиторія

3. **Які задачі вирішує**
   - Оцінка ризиків здоров'я
   - Візуалізація даних
   - Освітня функція

4. **Користь для користувача**
   - Персоналізовані прогнози
   - Історія змін
   - Рекомендації

5. **Що система НЕ робить**
   - ⚠️ Не є медичною діагностикою
   - ⚠️ Не замінює лікаря
   - ⚠️ Не призначає лікування

**HTML структура:**
```html
<section id="main-idea" class="about-page__section">
  <div class="glass-card">
    <h2 data-i18n="about.mainIdea.title">Основна ідея</h2>
    <!-- Підблоки -->
  </div>
</section>
```

**Ключі локалізації:**
- `about.mainIdea.title`
- `about.mainIdea.whatIs`
- `about.mainIdea.purpose`
- `about.mainIdea.tasks`
- `about.mainIdea.benefits`
- `about.mainIdea.notMedical`

### 3.4. Блок: Архітектура системи

**ID секції:** `#architecture`

**Підблоки:**

#### 3.4.1. Frontend
- SPA (single-page application)
- Діаграми та візуалізації
- Історія прогнозів
- Профіль користувача
- Генерація PDF
- AI-чат-асистент
- Інтерактивні сторінки статистики

#### 3.4.2. Backend
- FastAPI framework
- Маршрути `/api/*`
- Обробка прогнозування
- Логіка аутентифікації
- Статистика системи
- Логування

#### 3.4.3. ML-моделі
- Логістична регресія
- Random Forest
- XGBoost
- Модель прогнозування ризику діабету
- Модель прогнозування ризику ожиріння
- Фактори, що враховуються
- Спосіб тренування (опціонально)

#### 3.4.4. AI-асистент
- Внутрішня інтеграція з Ollama
- Модель LLM (назва моделі, напр. "llama3")
- Призначення
- Як працює
- Обмеження

#### 3.4.5. База даних
- SQLite / PostgreSQL (вказати реальне)
- Що зберігається:
  - Історія прогнозів
  - Користувачі
  - Чати
  - Логування
- Структура (концепція, не код)

**HTML структура:**
```html
<section id="architecture" class="about-page__section">
  <div class="glass-card">
    <h2 data-i18n="about.architecture.title">Архітектура системи</h2>
    <div class="about-architecture">
      <div class="about-architecture__block">
        <h3 data-i18n="about.architecture.frontend.title">Frontend</h3>
        <!-- Деталі -->
      </div>
      <div class="about-architecture__block">
        <h3 data-i18n="about.architecture.backend.title">Backend</h3>
        <!-- Деталі -->
      </div>
      <!-- Інші блоки -->
    </div>
  </div>
</section>
```

**Ключі локалізації:**
- `about.architecture.*` - всі підблоки

### 3.5. Блок: Дані та їхня обробка

**ID секції:** `#data-processing`

**Підблоки:**
1. Які дані використовуються
2. Джерела даних (NHANES dataset)
3. Стандартизовані медичні показники
4. Нормалізація даних
5. Значущі параметри
6. Розрахунок важливості факторів

**HTML структура:**
```html
<section id="data-processing" class="about-page__section">
  <div class="glass-card">
    <h2 data-i18n="about.data.title">Дані та їхня обробка</h2>
    <!-- Підблоки -->
  </div>
</section>
```

### 3.6. Блок: Прогнозування ризиків

**ID секції:** `#risk-prediction`

**Підблоки:**
1. Як працює прогнозування
2. Фактори, що враховуються
3. Що таке "Ризик ожиріння"
4. Що таке "Ризик діабету"
5. Які значення показує система
6. Що означає рівень ризику (низький, помірний, високий)
7. Як інтерпретувати графіки

**HTML структура:**
```html
<section id="risk-prediction" class="about-page__section">
  <div class="glass-card">
    <h2 data-i18n="about.riskPrediction.title">Прогнозування ризиків</h2>
    <!-- Підблоки -->
  </div>
</section>
```

### 3.7. Блок: Інтерактивні елементи

**ID секції:** `#interactive-features`

**Підблоки:**
1. Діаграми профілю
2. Історія прогнозів
3. Аналіз факторів
4. PDF-звіти
5. Статус системи та статус моделей
6. Чат з AI-асистентом

**HTML структура:**
```html
<section id="interactive-features" class="about-page__section">
  <div class="glass-card">
    <h2 data-i18n="about.interactive.title">Інтерактивні елементи</h2>
    <!-- Підблоки з іконками -->
  </div>
</section>
```

### 3.8. Блок: Технічна інформація

**ID секції:** `#technical`

**Підблоки:**

#### 3.8.1. Статус системи
- Статус API (динамічний, з API)
- Статус Ollama (динамічний, з API)
- Статус БД (динамічний, з API)
- Час відповіді (динамічний)

#### 3.8.2. Версії
- Версія системи (статична або з API)
- Дата останнього оновлення

#### 3.8.3. Інструменти
- jsPDF
- Chart.js
- FastAPI
- Ollama
- SQLite/PostgreSQL
- Python ML stack

**HTML структура:**
```html
<section id="technical" class="about-page__section">
  <div class="glass-card">
    <h2 data-i18n="about.technical.title">Технічна інформація</h2>
    <div class="about-technical">
      <div class="about-technical__status">
        <!-- Динамічні статуси -->
      </div>
      <div class="about-technical__tools">
        <!-- Список інструментів -->
      </div>
    </div>
  </div>
</section>
```

**JavaScript логіка:**
- Завантажити статуси з API при відкритті сторінки
- Оновити статуси при зміні мови (якщо потрібно)

### 3.9. Блок: Важливі обмеження

**ID секції:** `#limitations`

**HTML структура:**
```html
<section id="limitations" class="about-page__section about-page__section--warning">
  <div class="glass-card">
    <h2 data-i18n="about.limitations.title">Важливі обмеження</h2>
    <div class="about-limitations">
      <div class="about-limitations__item">
        <span class="icon" data-lucide="alert-triangle"></span>
        <p data-i18n="about.limitations.notMedical">Не є медичною діагностикою</p>
      </div>
      <!-- Інші обмеження -->
    </div>
  </div>
</section>
```

**Ключі локалізації:**
- `about.limitations.*`

### 3.10. Блок: Контакти / Авторство

**ID секції:** `#contact`

**HTML структура:**
```html
<section id="contact" class="about-page__section">
  <div class="glass-card">
    <h2 data-i18n="about.contact.title">Контакти та авторство</h2>
    <div class="about-contact">
      <div class="about-contact__author">
        <p data-i18n="about.contact.author">Автор: Кінаш Станіслав Андрійович</p>
        <p data-i18n="about.contact.group">Група: КНУС-23</p>
      </div>
      <!-- Контактні дані, GitHub тощо -->
    </div>
  </div>
</section>
```

---

## 4. Локалізація

### 4.1. Структура ключів

**Файли:**
- `locales/uk.json`
- `locales/en.json`

**Структура:**
```json
{
  "about": {
    "title": "Про систему",
    "subtitle": "Автоматизована система оцінки й прогнозування ризиків для здоров'я",
    "nav": {
      "mainIdea": "Що це?",
      "howItWorks": "Як працює?",
      "architecture": "Архітектура",
      "models": "Моделі",
      "aiAssistant": "AI-асистент",
      "limitations": "Обмеження",
      "technical": "Технічні деталі"
    },
    "mainIdea": {
      "title": "Основна ідея",
      "whatIs": { "title": "...", "content": "..." },
      "purpose": { "title": "...", "content": "..." },
      "tasks": { "title": "...", "content": "..." },
      "benefits": { "title": "...", "content": "..." },
      "notMedical": { "title": "...", "content": "..." }
    },
    "architecture": {
      "title": "Архітектура системи",
      "frontend": { "title": "...", "items": [...] },
      "backend": { "title": "...", "items": [...] },
      "mlModels": { "title": "...", "items": [...] },
      "aiAssistant": { "title": "...", "items": [...] },
      "database": { "title": "...", "items": [...] }
    },
    "data": {
      "title": "Дані та їхня обробка",
      "usedData": "...",
      "sources": "...",
      "normalization": "...",
      "factors": "..."
    },
    "riskPrediction": {
      "title": "Прогнозування ризиків",
      "howItWorks": "...",
      "factors": "...",
      "obesityRisk": "...",
      "diabetesRisk": "...",
      "riskLevels": {
        "low": "...",
        "medium": "...",
        "high": "..."
      }
    },
    "interactive": {
      "title": "Інтерактивні елементи",
      "items": [...]
    },
    "technical": {
      "title": "Технічна інформація",
      "status": {
        "api": "Статус API",
        "ollama": "Статус Ollama",
        "database": "Статус БД"
      },
      "version": "Версія системи",
      "lastUpdate": "Дата останнього оновлення",
      "tools": {
        "title": "Використані інструменти",
        "items": [...]
      }
    },
    "limitations": {
      "title": "Важливі обмеження",
      "notMedical": "Не є медичною діагностикою",
      "notDoctor": "Не замінює лікаря",
      "recommendatory": "Прогнози є рекомендаційними",
      "educational": "Система для освітнього та аналітичного використання"
    },
    "contact": {
      "title": "Контакти та авторство",
      "author": "Автор: Кінаш Станіслав Андрійович",
      "group": "Група: КНУС-23"
    }
  },
  "layout": {
    "nav": {
      "about": "Про систему"  // ← ДОДАТИ
    }
  }
}
```

### 4.2. Застосування локалізації

- Всі тексти через `data-i18n`
- Динамічні тексти через `window.i18n.t()`
- Оновлення при зміні мови через `languageChanged` event

---

## 5. Компоненти UI та інтерактивні елементи

### 5.1. Анімації появи блоків

**JavaScript логіка:**
```javascript
// При активації сторінки
function showAboutPage() {
  const page = document.getElementById('page-about');
  if (!page) return;
  
  page.hidden = false;
  
  // Анімація появи секцій
  const sections = page.querySelectorAll('.about-page__section');
  sections.forEach((section, index) => {
    setTimeout(() => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
      section.style.transition = 'opacity 0.5s, transform 0.5s';
      
      requestAnimationFrame(() => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      });
    }, index * 100);
  });
}
```

### 5.2. Anchor-навігація

**JavaScript логіка:**
```javascript
// Обробка кліків по anchor links
document.querySelectorAll('.about-page__nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Підсвітка активної секції при скролі
function updateActiveNavItem() {
  const sections = document.querySelectorAll('.about-page__section[id]');
  const navLinks = document.querySelectorAll('.about-page__nav a');
  
  let current = '';
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 100) {
      current = section.id;
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveNavItem);
```

### 5.3. Міні-інфографіка

**Використати іконки Lucide:**
- `brain` - AI-асистент
- `database` - База даних
- `server` - Backend
- `monitor` - Frontend
- `trending-up` - ML-моделі
- `activity` - Статистика

### 5.4. Статусні бейджі для моделей

**HTML структура:**
```html
<div class="about-model-status">
  <span class="badge badge--success" data-i18n="about.models.status.active">
    Модель активна
  </span>
</div>
```

**JavaScript логіка:**
- Завантажити статуси моделей з API
- Оновити бейджі динамічно

### 5.5. Версія системи / Останній commit

**HTML структура:**
```html
<div class="about-version">
  <span data-i18n="about.technical.version">Версія:</span>
  <span id="about-system-version">1.0.0</span>
</div>
```

**JavaScript логіка:**
- Завантажити версію з API (`/health` endpoint)
- Або статично встановити

---

## 6. Логіка маршруту та захист

### 6.1. Додати в publicRoutes

**Файл: `app.js`**

```javascript
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',  // ← ДОДАТИ
];
```

### 6.2. Обробка маршруту

**Файл: `app.js`**

В функції `showSectionForPath()`:

```javascript
function showSectionForPath(path) {
  // ... існуючий код ...
  
  // Обробка /about
  if (path === '/about') {
    activateSection('page-about');
    initializeAboutPage(); // Якщо потрібна ініціалізація
    return;
  }
  
  // ... інші маршрути ...
}
```

### 6.3. Перевірка авторизації

**НЕ потрібна для `/about`** - сторінка публічна.

### 6.4. Ініціалізація сторінки

**Файл: `app.js`**

```javascript
function initializeAboutPage() {
  // Завантажити статуси системи (якщо потрібно)
  // Ініціалізувати anchor-навігацію
  // Ініціалізувати скрол-спай
  // Застосувати локалізацію
}
```

---

## 7. Інструкції для реалізації

### Крок 1: Додати маршрут
1. Додати `/about` в `ROUTE_SECTIONS`
2. Додати `/about` в `publicRoutes`
3. Додати обробку в `showSectionForPath()`

### Крок 2: Створити HTML секцію
1. Додати `<section id="page-about">` в `index.html`
2. Створити структуру з усіма блоками
3. Додати `data-i18n` атрибути

### Крок 3: Додати навігацію
1. Додати пункт меню в Sidebar
2. Або додати в Footer (за дизайном)

### Крок 4: Додати локалізацію
1. Додати всі ключі в `locales/uk.json`
2. Додати всі ключі в `locales/en.json`
3. Перевірити, що немає hardcoded текстів

### Крок 5: Додати стилі
1. Використати існуючі `.glass-card` стилі
2. Додати специфічні стилі для `.about-page__*`
3. Забезпечити адаптивність

### Крок 6: Додати JavaScript логіку
1. Створити `initializeAboutPage()`
2. Додати anchor-навігацію
3. Додати анімації появи
4. Додати завантаження статусів (якщо потрібно)
5. Додати обробник зміни мови

### Крок 7: Тестування
1. Перевірити маршрутизацію
2. Перевірити локалізацію (UA/EN)
3. Перевірити анімації
4. Перевірити anchor-навігацію
5. Перевірити адаптивність
6. Перевірити темну/світлу тему
7. Перевірити, що сторінка публічна (без логіну)

---

## 8. Додаткові рекомендації

### 8.1. Дизайн
- Використати існуючі компоненти (`.glass-card`, `.badge`)
- Дотримуватися стилю інших сторінок
- Використати іконки Lucide для візуалізації

### 8.2. Продуктивність
- Ліниве завантаження статусів (тільки при відкритті сторінки)
- Кешування статусів (якщо можливо)

### 8.3. Доступність
- Правильні `aria-label` для anchor links
- Семантичний HTML
- Правильні заголовки (h1, h2, h3)

### 8.4. SEO (якщо потрібно)
- Мета-теги для сторінки
- Структуровані дані (Schema.org)

---

## 9. Чеклист реалізації

- [ ] Додано маршрут `/about` в `ROUTE_SECTIONS`
- [ ] Додано `/about` в `publicRoutes`
- [ ] Створено HTML секцію `page-about`
- [ ] Додано всі контентні блоки
- [ ] Додано anchor-навігацію
- [ ] Додано пункт меню в Sidebar/Footer
- [ ] Додано всі ключі локалізації в `uk.json`
- [ ] Додано всі ключі локалізації в `en.json`
- [ ] Додано стилі для сторінки
- [ ] Додано JavaScript логіку (ініціалізація, anchor-nav, анімації)
- [ ] Додано завантаження статусів (якщо потрібно)
- [ ] Додано обробник зміни мови
- [ ] Протестовано маршрутизацію
- [ ] Протестовано локалізацію
- [ ] Протестовано анімації
- [ ] Протестовано адаптивність
- [ ] Протестовано темну/світлу тему
- [ ] Перевірено, що сторінка публічна

---

## 10. Приклади контенту (для локалізації)

### 10.1. Основна ідея (приклад)

**Українська:**
- "HealthRisk.AI — це автоматизована система, яка допомагає оцінити ризики для здоров'я на основі медичних показників."
- "Система створена для освітніх та аналітичних цілей, щоб допомогти користувачам зрозуміти свої ризики здоров'я."

**Англійська:**
- "HealthRisk.AI is an automated system that helps assess health risks based on medical indicators."
- "The system is created for educational and analytical purposes to help users understand their health risks."

### 10.2. Архітектура (приклад)

**Українська:**
- "Frontend: Single-page application (SPA) з інтерактивними діаграмами, історією прогнозів та AI-чат-асистентом."
- "Backend: FastAPI framework з маршрутами для прогнозування, аутентифікації та статистики системи."

**Англійська:**
- "Frontend: Single-page application (SPA) with interactive charts, prediction history, and AI chat assistant."
- "Backend: FastAPI framework with routes for prediction, authentication, and system statistics."

---

**Кінець специфікації**

