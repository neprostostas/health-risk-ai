const API_BASE = "";
const API_STATUS_INTERVAL = 10000;
const AUTH_TOKEN_KEY = "hr_auth_token";
const SIDEBAR_COLLAPSED_KEY = "hr_sidebar_collapsed";
const DEFAULT_AVATAR_COLOR = "#5A64F1";

let metadataCache = null;
let factorsChart = null;
let chartsRendered = false;
let apiStatusTimer = null;
let currentTheme = "light";
const predictionStore = {};
let latestPredictionKey = null;
let pendingPredictionContext = null;
let analyticsCache = null;
let analyticsLoadError = null;
let historyStatsCache = null;
const dashboardCharts = {};
let insightsInitialized = false;
let queuedFormInputs = null;
let pendingRouteAfterAuth = null;

const authState = {
  token: null,
  user: null,
  history: [],
  initialized: false,
};

const ROUTE_SECTIONS = {
  "/app": "page-form",
  "/diagrams": "page-insights",
  "/login": "page-login",
  "/register": "page-register",
  "/profile": "page-profile",
  "/history": "page-history",
  "/api-status": "page-api-status",
  "/forgot-password": "page-forgot-password",
  "/reset-password": "page-reset-password",
};

const ROUTE_ALIASES = {
  "/": "/app",
  "/form": "/app",
};

const SECTION_TO_ROUTE = {
  "page-form": "/app",
  "page-insights": "/diagrams",
  "page-login": "/login",
  "page-register": "/register",
  "page-profile": "/profile",
  "page-history": "/history",
  "page-api-status": "/api-status",
  "page-forgot-password": "/forgot-password",
  "page-reset-password": "/reset-password",
};

const inputRefs = {};
const liveIndicators = {
  bmi: null,
  glucose: null,
  bp: null,
};

const factorInfo = {
  RIDAGEYR: {
    name: "Вік",
    desc: "Вік учасника у повних роках. Допомагає зрозуміти вікові ризики.",
    unit: "роки",
  },
  RIAGENDR: {
    name: "Стать",
    desc: "1 — чоловік, 2 — жінка.",
  },
  BMXBMI: {
    name: "Індекс маси тіла (BMI)",
    desc: "Розраховується як маса, поділена на квадрат зросту. Понад 25 свідчить про надмірну вагу.",
    unit: "кг/м²",
  },
  BPXSY1: {
    name: "Систолічний тиск",
    desc: "Верхній показник артеріального тиску (тиск під час скорочення серця).",
    unit: "мм рт. ст.",
  },
  BPXDI1: {
    name: "Діастолічний тиск",
    desc: "Нижній показник артеріального тиску (тиск у стані розслаблення серця).",
    unit: "мм рт. ст.",
  },
  LBXGLU: {
    name: "Глюкоза натще",
    desc: "Вимірюється натщесерце. Допомагає виявити переддіабет та діабет.",
    unit: "мг/дл",
  },
  LBXTC: {
    name: "Загальний холестерин",
    desc: "Сукупний рівень холестерину в крові. Важливо для оцінки ризику серцево-судинних захворювань.",
    unit: "мг/дл",
  },
};

const TARGET_LABELS = {
  diabetes_present: "Ризик діабету",
  obesity_present: "Ризик ожиріння",
};

const HEALTH_THRESHOLDS = {
  BMXBMI: {
    normal: 25,
    overweight: 30,
    obesity: 35,
  },
  LBXGLU: {
    normal: 100,
    prediabetes: 126,
  },
  LBXTC: {
    optimal: 200,
    borderline: 240,
  },
  BPXSY1: {
    normal: 120,
    elevated: 130,
    stage1: 140,
  },
  BPXDI1: {
    normal: 80,
    stage1: 90,
  },
};

const SEVERITY_COLORS = {
  normal: "rgba(63, 194, 114, 0.85)",
  warning: "rgba(245, 182, 73, 0.85)",
  danger: "rgba(241, 94, 111, 0.85)",
  info: "rgba(116, 137, 255, 0.85)",
};

const ANALYTICS_ENDPOINT = "/app/static/data/analytics_summary.json";

const targetSelect = document.getElementById("target-select");
const modelSelect = document.getElementById("model-select");
const featuresContainer = document.getElementById("features-container");
const form = document.getElementById("predict-form");
const submitButton = document.getElementById("submit-button");
const demoButton = document.getElementById("demo-button");
const errorBox = document.getElementById("form-error");
const resultCard = document.getElementById("result-card");
const probabilityValue = document.getElementById("probability-value");
const riskBadge = document.getElementById("risk-badge");
const riskBarFill = document.getElementById("risk-bar-fill");
const modelName = document.getElementById("model-name");
const modelVersion = document.getElementById("model-version");
const resultNote = document.getElementById("result-note");
const chartEmpty = document.getElementById("chart-empty");
const chartCanvas = document.getElementById("factors-chart");

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
const themeToggleBtn = document.querySelector(".theme-toggle");
const themeIconContainer = document.querySelector(".theme-icon");
const apiStatusDot = document.getElementById("api-status-dot");
const apiStatusText = document.getElementById("api-status-text");
const userPanelGuest = document.getElementById("user-panel-guest");
const userPanelAuth = document.getElementById("user-panel-auth");
// Buttons removed - no longer needed in header
const userPanelLoginBtn = null;
const userPanelRegisterBtn = null;
const userAvatarBtn = document.getElementById("user-avatar-btn");
const userAvatar = document.getElementById("user-avatar");
const userLogoutBtn = document.getElementById("user-logout-btn");
const profileGuestState = document.getElementById("profile-guest-state");
const profileAuthenticated = document.getElementById("profile-authenticated");
const profileAvatar = document.getElementById("profile-avatar");
const profileAvatarLarge = document.getElementById("profile-avatar-large");
const profileNameEl = document.getElementById("profile-name");
const profileEmailEl = document.getElementById("profile-email");
const profileJoinedEl = document.getElementById("profile-joined");
const profileDisplayNameInput = document.getElementById("profile-display-name");
const profileEditFirstNameInput = document.getElementById("profile-edit-first-name");
const profileEditLastNameInput = document.getElementById("profile-edit-last-name");
const profileEditDateOfBirthInput = document.getElementById("profile-edit-date-of-birth");
const profileEditGenderSelect = document.getElementById("profile-edit-gender");
const profileAvatarColorInput = document.getElementById("profile-avatar-color");
const profileEditAvatarColorInput = document.getElementById("profile-edit-avatar-color");
const profileEditAvatarColorGroup = document.getElementById("profile-edit-avatar-color-group");
const profileUpdateForm = document.getElementById("profile-update-form");
const profileEditBtn = document.getElementById("profile-edit-btn");
const profileEditCancelBtn = document.getElementById("profile-edit-cancel-btn");
const profileTabs = document.querySelectorAll(".profile-tab");
const profileTabPanels = document.querySelectorAll(".profile-tab-panel");
const profileInfoFirstName = document.getElementById("profile-info-first-name");
const profileInfoLastName = document.getElementById("profile-info-last-name");
const profileInfoDisplayName = document.getElementById("profile-info-display-name");
const profileInfoDateOfBirth = document.getElementById("profile-info-date-of-birth");
const profileInfoGender = document.getElementById("profile-info-gender");
const profileInfoEmail = document.getElementById("profile-info-email");
const profileAvatarUploadBtnInline = document.getElementById("profile-avatar-upload-btn-inline");
const profileAvatarResetBtnInline = document.getElementById("profile-avatar-reset-btn-inline");
const profileFormActions = document.getElementById("profile-form-actions");
const profileUpdateStatus = document.getElementById("profile-update-status");
const pageTitle = document.getElementById("page-title");

// Зберігаємо оригінальні значення форми для відстеження змін
let originalProfileData = null;

// Флаг для відстеження чи тултіп теми був прихований після кліку
let themeTooltipWasHidden = false;
// Флаг чи тултіп був відновлений після кліку (для постійних обробників)
let themeTooltipRestored = false;
const profilePasswordForm = document.getElementById("profile-password-form");
const profilePasswordStatus = document.getElementById("profile-password-status");
const profilePasswordEmailInput = document.getElementById("profile-password-email");
const loginSuccessBox = document.getElementById("login-success");
const profileCurrentPasswordInput = document.getElementById("profile-current-password");
const profileNewPasswordInput = document.getElementById("profile-new-password");
const profileConfirmPasswordInput = document.getElementById("profile-confirm-password");
const avatarUploadInput = document.getElementById("avatar-upload-input");
const avatarUploadBtn = document.getElementById("avatar-upload-btn");
const avatarResetBtn = document.getElementById("avatar-reset-btn");
const profileHistoryContainer = document.getElementById("profile-history");
const historyContent = document.getElementById("history-content");
const historyTableWrapper = document.getElementById("history-table-wrapper");
const deleteAccountBtn = document.getElementById("delete-account-btn");
const deleteAccountModal = document.getElementById("delete-account-modal");
const deleteAccountModalBackdrop = document.getElementById("delete-account-modal-backdrop");
const deleteAccountCancelBtn = document.getElementById("delete-account-cancel-btn");
const deleteAccountConfirmBtn = document.getElementById("delete-account-confirm-btn");
const deleteAccountError = document.getElementById("delete-account-error");
const forgotPasswordLink = document.getElementById("to-forgot-password");
const forgotPasswordForm = document.getElementById("forgot-password-form");
const forgotPasswordError = document.getElementById("forgot-password-error");
const forgotPasswordSuccess = document.getElementById("forgot-password-success");
const forgotEmailInput = document.getElementById("forgot-email");
const forgotPasswordSubmitBtn = forgotPasswordForm?.querySelector('button[type="submit"]');
const forgotToLoginLink = document.getElementById("forgot-to-login");
const resetPasswordForm = document.getElementById("reset-password-form");
const resetPasswordError = document.getElementById("reset-password-error");
const appLoader = document.getElementById("app-loader");
const historyEmpty = document.getElementById("history-empty");
const historyTableBody = document.getElementById("history-table-body");
const profileLoginShortcut = document.getElementById("profile-login-shortcut");
const profileRegisterShortcut = document.getElementById("profile-register-shortcut");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginErrorBox = document.getElementById("login-error");
const registerErrorBox = document.getElementById("register-error");
const navProfileItem = document.getElementById("nav-profile");
const toRegisterLink = document.getElementById("to-register");
const toLoginLink = document.getElementById("to-login");

const riskLabels = {
  low: "низький",
  medium: "середній",
  high: "високий",
};

// Мапа заголовків сторінок
const pageTitles = {
  "page-form": "Форма прогнозування",
  "page-insights": "Діаграми",
  "page-profile": "Профіль",
  "page-history": "Історія прогнозів",
  "page-api-status": "Статус API",
  "page-login": "Вхід до облікового запису",
  "page-register": "Створення облікового запису",
  "page-forgot-password": "Відновлення пароля",
  "page-reset-password": "Встановлення нового пароля",
};

const riskClasses = {
  low: "risk-low",
  medium: "risk-medium",
  high: "risk-high",
};

const TOOLTIP_TEXTS = {
  RIDAGEYR: "Вік учасника у повних роках.",
  RIAGENDR: "Стать: 1 — чоловік, 2 — жінка.",
  BMXBMI: "Індекс маси тіла (кг/м²). Понад 30 може свідчити про ожиріння.",
  BPXSY1: "Систолічний артеріальний тиск (верхнє значення) у мм рт. ст.",
  BPXDI1: "Діастолічний артеріальний тиск (нижнє значення) у мм рт. ст.",
  LBXGLU: "Рівень глюкози у крові натще (мг/дл).",
  LBXTC: "Рівень загального холестерину (мг/дл).",
};

const TOOLTIP_LIBRARY = {
  "model-help": `Логістична регресія — базова лінійна модель, демонструє вплив кожного показника.
Random Forest — ансамбль дерев рішень, стійкий до шуму.
XGBoost — потужний бустинг для табличних даних.
LightGBM — швидка реалізація градієнтного бустингу.
SVM — шукає оптимальну межу між класами.
KNN — порівнює зі схожими пацієнтами (сусіди).
Нейромережа (MLP) — виявляє складні нелінійні взаємозв’язки.`,
};

function getFeatureName(code) {
  return factorInfo[code]?.name ?? code;
}

function getFeatureDescription(code) {
  return factorInfo[code]?.desc ?? "Показник здоров'я.";
}

function getFeatureUnit(code) {
  return factorInfo[code]?.unit ?? "";
}

function formatMetricValue(feature, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  let decimals = 0;
  if (feature === "BMXBMI") decimals = 1;
  if (feature === "LBXGLU") decimals = 0;
  if (feature === "LBXTC") decimals = 0;
  const formatted = Number.parseFloat(value).toFixed(decimals);
  const unit = getFeatureUnit(feature);
  return unit ? `${formatted} ${unit}` : formatted;
}

function getSeverityColor(level) {
  return SEVERITY_COLORS[level] ?? SEVERITY_COLORS.info;
}

function classifyMetric(feature, value) {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return {
      level: "info",
      label: "Немає даних",
      explanation: "Значення не вказано.",
    };
  }

  if (feature === "BMXBMI") {
    if (numeric < 18.5) {
      return {
        level: "warning",
        label: "Недостатня вага",
        explanation: "Маса тіла нижча за рекомендовану норму.",
      };
    }
    if (numeric < HEALTH_THRESHOLDS.BMXBMI.normal) {
      return {
        level: "normal",
        label: "Норма",
        explanation: "ІМТ знаходиться у здоровому діапазоні 18.5–24.9.",
      };
    }
    if (numeric < HEALTH_THRESHOLDS.BMXBMI.overweight) {
      return {
        level: "warning",
        label: "Надмірна вага",
        explanation: "Показник перевищує норму. Рекомендується звернути увагу на харчування й активність.",
      };
    }
    if (numeric < HEALTH_THRESHOLDS.BMXBMI.obesity) {
      return {
        level: "danger",
        label: "Ожиріння I",
        explanation: "Рівень відповідає ожирінню першого ступеня.",
      };
    }
    return {
      level: "danger",
      label: "Ожиріння II+",
      explanation: "Рівень ІМТ ≥ 35. Потрібна консультація лікаря.",
    };
  }

  if (feature === "BPXSY1") {
    if (numeric < HEALTH_THRESHOLDS.BPXSY1.normal) {
      return {
        level: "normal",
        label: "Норма",
        explanation: "Систолічний тиск у межах безпечного рівня (<120 мм рт. ст.).",
      };
    }
    if (numeric < HEALTH_THRESHOLDS.BPXSY1.elevated) {
      return {
        level: "warning",
        label: "Підвищений",
        explanation: "Верхній тиск 120–129 мм рт. ст. — важливо контролювати.",
      };
    }
    if (numeric < HEALTH_THRESHOLDS.BPXSY1.stage1) {
      return {
        level: "warning",
        label: "Гіпертонія 1 ступеня",
        explanation: "Систолічний тиск 130–139 мм рт. ст.",
      };
    }
    return {
      level: "danger",
      label: "Гіпертонія 2 ступеня",
      explanation: "Систолічний тиск ≥ 140 мм рт. ст. Потрібна медична консультація.",
    };
  }

  if (feature === "BPXDI1") {
    if (numeric < HEALTH_THRESHOLDS.BPXDI1.normal) {
      return {
        level: "normal",
        label: "Норма",
        explanation: "Діастолічний тиск у межах безпечного рівня (<80 мм рт. ст.).",
      };
    }
    if (numeric < HEALTH_THRESHOLDS.BPXDI1.stage1) {
      return {
        level: "warning",
        label: "Підвищений",
        explanation: "Діастолічний тиск 80–89 мм рт. ст.",
      };
    }
    return {
      level: "danger",
      label: "Гіпертонія 2 ступеня",
      explanation: "Діастолічний тиск ≥ 90 мм рт. ст. Потребує уваги.",
    };
  }

  if (feature === "LBXGLU") {
    if (numeric < HEALTH_THRESHOLDS.LBXGLU.normal) {
      return {
        level: "normal",
        label: "Норма",
        explanation: "Глюкоза натще нижча за 100 мг/дл.",
      };
    }
    if (numeric < HEALTH_THRESHOLDS.LBXGLU.prediabetes) {
      return {
        level: "warning",
        label: "Підвищена (переддіабет)",
        explanation: "Глюкоза у діапазоні 100–125 мг/дл.",
      };
    }
    return {
      level: "danger",
      label: "Можливий діабет",
      explanation: "Глюкоза ≥ 126 мг/дл. Порадьтеся з лікарем.",
    };
  }

  if (feature === "LBXTC") {
    if (numeric < HEALTH_THRESHOLDS.LBXTC.optimal) {
      return {
        level: "normal",
        label: "Оптимальний",
        explanation: "Загальний холестерин нижче 200 мг/дл.",
      };
    }
    if (numeric < HEALTH_THRESHOLDS.LBXTC.borderline) {
      return {
        level: "warning",
        label: "Прикордонний рівень",
        explanation: "Холестерин 200–239 мг/дл. Важливо контролювати харчування.",
      };
    }
    return {
      level: "danger",
      label: "Високий рівень",
      explanation: "Холестерин ≥ 240 мг/дл. Підвищений серцево-судинний ризик.",
    };
  }

  return {
    level: "info",
    label: "Значення",
    explanation: "Значення показника.",
  };
}

function getChartStyles() {
  const styles = getComputedStyle(document.body);
  return {
    textPrimary: styles.getPropertyValue("--text-primary")?.trim() || "#1c2333",
    textSecondary: styles.getPropertyValue("--text-secondary")?.trim() || "#4c5472",
    gridColor: styles.getPropertyValue("--border-glass")?.trim() || "rgba(99, 110, 145, 0.25)",
    background: styles.getPropertyValue("--card-bg")?.trim() || "rgba(255,255,255,0.16)",
    accent: "rgba(88, 101, 242, 0.8)",
    accentLight: "rgba(88, 101, 242, 0.35)",
    accentAlt: "rgba(125, 92, 255, 0.8)",
  };
}

function percentToDisplay(probability) {
  if (probability === null || probability === undefined) {
    return 0;
  }
  const safeValue = Math.max(0, Math.min(1, Number.parseFloat(probability)));
  return Number.isNaN(safeValue) ? 0 : Number.parseFloat((safeValue * 100).toFixed(2));
}

function toggleHidden(element, hidden) {
  if (!element) return;
  element.hidden = Boolean(hidden);
}

function toggleChartVisibility(canvasOrId, visible) {
  const canvas = typeof canvasOrId === "string" ? document.getElementById(canvasOrId) : canvasOrId;
  if (!canvas) return;
  const wrapper = canvas.closest(".chart-wrapper") || canvas.parentElement;
  if (wrapper) {
    wrapper.style.display = visible ? "" : "none";
  }
}

function setElementText(id, text) {
  const el = typeof id === "string" ? document.getElementById(id) : id;
  if (el) {
    el.textContent = text;
  }
}

function upsertDashboardChart(chartId, config) {
  const canvas = document.getElementById(chartId);
  if (!canvas) return null;
  if (dashboardCharts[chartId]) {
    dashboardCharts[chartId].destroy();
  }
  dashboardCharts[chartId] = new Chart(canvas.getContext("2d"), config);
  return dashboardCharts[chartId];
}

function destroyDashboardCharts() {
  Object.values(dashboardCharts).forEach((chart) => {
    if (chart) chart.destroy();
  });
}

function getPrediction(target) {
  return predictionStore[target] ?? null;
}

function getLatestPredictionEntry() {
  if (latestPredictionKey && predictionStore[latestPredictionKey]) {
    return { target: latestPredictionKey, data: predictionStore[latestPredictionKey] };
  }
  const entries = Object.entries(predictionStore);
  if (entries.length === 0) return null;
  entries.sort((a, b) => (b[1]?.savedAt ?? 0) - (a[1]?.savedAt ?? 0));
  const [target, data] = entries[0];
  latestPredictionKey = target;
  return { target, data };
}

function formatDateTime(timestamp) {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("uk-UA", { hour12: false });
  } catch (error) {
    return "";
  }
}

async function apiFetch(
  path,
  options = {},
  { skipAuth = false } = {},
) {
  const init = {
    method: "GET",
    ...options,
  };

  const headers = new Headers(init.headers || {});
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth && authState.token) {
    headers.set("Authorization", `Bearer ${authState.token}`);
  }
  init.headers = headers;

  const response = await fetch(`${API_BASE}${path}`, init);
  const contentType = response.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    if (response.status === 401 && !skipAuth) {
      handleUnauthorized();
    }
    const message = data?.detail || data?.message || "Сталася помилка під час запиту.";
    throw new Error(message);
  }
  return data;
}

function setAuthFormError(box, message) {
  if (!box) return;
  if (message) {
    box.textContent = message;
    box.hidden = false;
  } else {
    box.textContent = "";
    box.hidden = true;
  }
}

function normalizePath(pathname) {
  if (!pathname) return "/app";
  let normalized = pathname;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  normalized = normalized.toLowerCase();
  if (ROUTE_ALIASES[normalized]) {
    normalized = ROUTE_ALIASES[normalized];
  }
  if (!ROUTE_SECTIONS[normalized]) {
    return "/app";
  }
  return normalized;
}

function getSectionByPath(pathname) {
  const normalized = normalizePath(pathname);
  return {
    path: normalized,
    section: ROUTE_SECTIONS[normalized] || ROUTE_SECTIONS["/app"],
  };
}

function showSectionForPath(pathname) {
  const { path, section } = getSectionByPath(pathname);
  
  // Auth gating: require authentication for main app pages
  // Але не перешкоджаємо активації сторінки, якщо автентифікація ще не завершена
  // (це дозволить правильно завантажити сторінку при оновленні)
  // Сторінка /api-status доступна всім без автентифікації
  const protectedSections = ["page-form", "page-insights", "page-profile", "page-history"];
  if (protectedSections.includes(section) && !authState.user && authState.initialized) {
    // Тільки якщо автентифікація завершена і користувач не автентифікований - перенаправляємо
    pendingRouteAfterAuth = path;
    return showSectionForPath("/login");
  }
  
  // Якщо автентифікація ще не завершена, все одно активуємо сторінку
  // activateSection обробить випадок, коли користувач не автентифікований
  
  // Redirect authenticated users away from login/register pages (but not forgot/reset password)
  if ((section === "page-login" || section === "page-register") && authState.user && authState.initialized) {
    const redirectTarget = pendingRouteAfterAuth || "/app";
    pendingRouteAfterAuth = null;
    return showSectionForPath(redirectTarget);
  }
  
  // Обробка маршруту reset-password з токеном
  if (section === "page-reset-password") {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (!token) {
      // Якщо токен відсутній, перенаправляємо на forgot-password
      return showSectionForPath("/forgot-password");
    }
  }
  
  activateSection(section);
  return path;
}

function navigateTo(pathname, { replace = false } = {}) {
  const targetPath = showSectionForPath(pathname);
  const currentPath = window.location.pathname;
  if (replace) {
    if (currentPath !== targetPath) {
      history.replaceState({}, "", targetPath);
    }
  } else if (currentPath !== targetPath) {
    history.pushState({}, "", targetPath);
  }
}

function syncRouteFromLocation() {
  const actualPath = showSectionForPath(window.location.pathname);
  if (window.location.pathname !== actualPath) {
    history.replaceState({}, "", actualPath);
  }
}

function persistToken(token) {
  authState.token = token;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

function clearAuthState() {
  persistToken(null);
  authState.user = null;
  authState.history = [];
  pendingRouteAfterAuth = null;
  setProfileStatus("");
  updateUserPanel();
  updateProfileSection();
  renderHistoryTable();
  updateNavigationVisibility();
}

function handleUnauthorized() {
  clearAuthState();
  navigateTo("/login", { replace: true });
}

function handleAuthSuccess(payload, options = {}) {
  if (!payload?.access_token || !payload?.user) return;
  persistToken(payload.access_token);
  authState.user = payload.user;
  authState.history = [];
  updateUserPanel();
  updateProfileSection();
  loadHistory().catch((error) => console.error("Не вдалося оновити історію:", error));
  updateNavigationVisibility();
  refreshIcons();
  
  // After registration or login, always redirect to profile
  const targetRoute = options.navigateToRoute || "/profile";
  pendingRouteAfterAuth = null;
  navigateTo(targetRoute, { replace: true });
}

function getInitials(name) {
  if (!name) return "К";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "К";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "К";
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function applyAvatarStyle(element, user) {
  if (!element) return;
  
  // Перевіряємо тип аватару
  const avatarType = user?.avatar_type || "generated";
  
  if (avatarType === "uploaded" && user?.avatar_url) {
    // Показуємо завантажене фото
    const avatarUrl = user.avatar_url.startsWith("/") 
      ? `${API_BASE}${user.avatar_url}`
      : user.avatar_url;
    
    element.style.backgroundImage = `url(${avatarUrl})`;
    element.style.backgroundSize = "cover";
    element.style.backgroundPosition = "center";
    element.style.backgroundRepeat = "no-repeat";
    element.textContent = ""; // Приховуємо ініціали
  } else {
    // Показуємо згенерований аватар з ініціалами
    const color = user?.avatar_color || DEFAULT_AVATAR_COLOR;
    element.style.background = color;
    element.style.backgroundImage = "none";
    element.textContent = getInitials(user?.display_name || user?.email || "");
  }
}

function formatDateTimeLong(timestamp) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch (error) {
    return "";
  }
}

function formatProbability(probability) {
  if (probability === null || probability === undefined) return "—";
  const value = Math.max(0, Math.min(1, Number.parseFloat(probability)));
  if (Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatTargetLabel(target) {
  return TARGET_LABELS[target] || target;
}

function getRiskColor(bucket) {
  if (bucket === "low") return SEVERITY_COLORS.normal;
  if (bucket === "medium") return SEVERITY_COLORS.warning;
  if (bucket === "high") return SEVERITY_COLORS.danger;
  return SEVERITY_COLORS.info;
}

function updateNavigationVisibility() {
  // Список захищених сторінок, які потребують автентифікації
  const protectedSections = ["page-profile", "page-history", "page-insights", "page-form"];
  
  // Оновлюємо всі кнопки навігації
  navItems.forEach((navItem) => {
    const sectionId = navItem.dataset.section;
    if (!sectionId) return;
    
    const isProtected = protectedSections.includes(sectionId);
    
    if (isProtected) {
      // Для захищених сторінок: ховаємо або блокуємо, якщо користувач не автентифікований
      if (!authState.user) {
        navItem.disabled = true;
        navItem.setAttribute("aria-disabled", "true");
        navItem.style.opacity = "0.5";
        navItem.style.cursor = "not-allowed";
        // Додаємо клас для стилізації
        navItem.classList.add("nav-item--disabled");
      } else {
        navItem.disabled = false;
        navItem.removeAttribute("aria-disabled");
        navItem.style.opacity = "";
        navItem.style.cursor = "";
        navItem.classList.remove("nav-item--disabled");
      }
    } else {
      // Для незахищених сторінок завжди активні
      navItem.disabled = false;
      navItem.removeAttribute("aria-disabled");
      navItem.style.opacity = "";
      navItem.style.cursor = "";
      navItem.classList.remove("nav-item--disabled");
    }
  });
  
  // Спеціальна обробка для кнопок, які повинні бути повністю приховані
  const navProfile = document.getElementById("nav-profile");
  const navHistory = document.getElementById("nav-history");
  
  // Ці кнопки приховуємо повністю, якщо користувач не автентифікований
  if (navProfile) {
    navProfile.hidden = !authState.user;
  }
  if (navHistory) {
    navHistory.hidden = !authState.user;
  }
}

function updateUserPanel() {
  if (!userPanelGuest || !userPanelAuth) return;
  updateNavigationVisibility();
  if (authState.user) {
    // Користувач автентифікований: ховаємо гостя, показуємо авторизованого користувача
    userPanelGuest.setAttribute("hidden", "");
    userPanelGuest.hidden = true;
    userPanelAuth.removeAttribute("hidden");
    userPanelAuth.hidden = false;
    if (userAvatar) {
      applyAvatarStyle(userAvatar, authState.user);
    }
  } else {
    // Користувач НЕ автентифікований: показуємо гостя, ховаємо авторизованого користувача
    userPanelGuest.removeAttribute("hidden");
    userPanelGuest.hidden = false;
    userPanelAuth.setAttribute("hidden", "");
    userPanelAuth.hidden = true;
  }
  refreshIcons();
}

function updateProfileSection() {
  if (!profileGuestState || !profileAuthenticated) return;
  if (authState.user) {
    // Користувач автентифікований: показуємо профіль, ховаємо гостя
    profileGuestState.setAttribute("hidden", "");
    profileGuestState.hidden = true;
    profileAuthenticated.removeAttribute("hidden");
    profileAuthenticated.hidden = false;
    
    const user = authState.user;
    
    // Оновлюємо header (показуємо first_name + last_name)
    if (profileNameEl) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
      profileNameEl.textContent = fullName || user.display_name || user.email;
    }
    if (profileEmailEl) profileEmailEl.textContent = user.email;
    if (profileJoinedEl) {
      profileJoinedEl.textContent = `Зареєстрований: ${formatDateTimeLong(user.created_at) || "сьогодні"}`;
    }
    
    // Оновлюємо аватари
    if (profileAvatar) applyAvatarStyle(profileAvatar, user);
    if (profileAvatarLarge) applyAvatarStyle(profileAvatarLarge, user);
    
    // Оновлюємо preview аватару в формі редагування
    const profileAvatarPreviewImage = document.getElementById("profile-avatar-preview-image");
    if (profileAvatarPreviewImage) {
      applyAvatarStyle(profileAvatarPreviewImage, user);
    }
    
    // Оновлюємо таб "Огляд" (використовуємо first_name)
    if (profileInfoDisplayName) profileInfoDisplayName.textContent = user.first_name || user.display_name || "—";
    if (profileInfoFirstName) profileInfoFirstName.textContent = user.first_name || "—";
    if (profileInfoLastName) profileInfoLastName.textContent = user.last_name || "—";
    if (profileInfoDateOfBirth) {
      if (user.date_of_birth) {
        const date = new Date(user.date_of_birth);
        profileInfoDateOfBirth.textContent = date.toLocaleDateString("uk-UA", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      } else {
        profileInfoDateOfBirth.textContent = "—";
      }
    }
    if (profileInfoGender) {
      const genderMap = { male: "Чоловік", female: "Жінка", other: "Інше" };
      profileInfoGender.textContent = user.gender ? (genderMap[user.gender] || user.gender) : "—";
    }
    if (profileInfoEmail) profileInfoEmail.textContent = user.email || "—";
    
    // Оновлюємо форму редагування
    if (profileEditFirstNameInput) profileEditFirstNameInput.value = user.first_name || "";
    if (profileEditLastNameInput) profileEditLastNameInput.value = user.last_name || "";
    if (profileEditDateOfBirthInput && user.date_of_birth) {
      const date = new Date(user.date_of_birth);
      profileEditDateOfBirthInput.value = date.toISOString().split("T")[0];
    } else if (profileEditDateOfBirthInput) {
      profileEditDateOfBirthInput.value = "";
    }
    if (profileEditGenderSelect) profileEditGenderSelect.value = user.gender || "";
    if (profileEditAvatarColorInput) {
      profileEditAvatarColorInput.value = user.avatar_color || DEFAULT_AVATAR_COLOR;
    }
    
    // Зберігаємо оригінальні значення для відстеження змін
    saveOriginalProfileData();
    
    // Ховаємо кнопки дій при оновленні профілю
    hideProfileFormActions();
    
    // Оновлюємо видимість кольору аватару (показуємо тільки якщо немає фото)
    if (profileEditAvatarColorGroup) {
      if (user.avatar_type === "uploaded" && user.avatar_url) {
        profileEditAvatarColorGroup.setAttribute("hidden", "");
        profileEditAvatarColorGroup.hidden = true;
      } else {
        profileEditAvatarColorGroup.removeAttribute("hidden");
        profileEditAvatarColorGroup.hidden = false;
      }
    }
    
    // Оновлюємо видимість кнопок аватару
    updateAvatarButtons();
    
    // Оновлюємо email для форми пароля
    if (profilePasswordEmailInput && user.email) {
      profilePasswordEmailInput.value = user.email;
    }
    
    setProfileStatus("");
  } else {
    // Користувач НЕ автентифікований: ховаємо профіль, показуємо гостя
    profileGuestState.removeAttribute("hidden");
    profileGuestState.hidden = false;
    profileAuthenticated.setAttribute("hidden", "");
    profileAuthenticated.hidden = true;
  }
}

function updateAvatarButtons() {
  const avatarType = authState.user?.avatar_type || "generated";
  
  // Оновлюємо старий кнопку скидання (якщо існує)
  if (avatarResetBtn) {
    if (avatarType === "uploaded") {
      avatarResetBtn.removeAttribute("hidden");
      avatarResetBtn.hidden = false;
    } else {
      avatarResetBtn.setAttribute("hidden", "");
      avatarResetBtn.hidden = true;
    }
  }
  
  // Оновлюємо inline кнопку скидання (якщо існує)
  if (profileAvatarResetBtnInline) {
    if (avatarType === "uploaded") {
      profileAvatarResetBtnInline.removeAttribute("hidden");
      profileAvatarResetBtnInline.hidden = false;
    } else {
      profileAvatarResetBtnInline.setAttribute("hidden", "");
      profileAvatarResetBtnInline.hidden = true;
    }
  }
}

// Зберігає оригінальні значення форми для відстеження змін
function saveOriginalProfileData() {
  if (!authState.user) return;
  
  const user = authState.user;
  originalProfileData = {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    date_of_birth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split("T")[0] : "",
    gender: user.gender || "",
    avatar_color: user.avatar_color || DEFAULT_AVATAR_COLOR,
  };
}

// Перевіряє чи є зміни в формі профілю
function hasProfileChanges() {
  if (!originalProfileData) return false;
  
  // Отримуємо поточні значення
  const currentData = {
    first_name: profileEditFirstNameInput?.value.trim() || "",
    last_name: profileEditLastNameInput?.value.trim() || "",
    date_of_birth: profileEditDateOfBirthInput?.value || "",
    gender: profileEditGenderSelect?.value || "",
  };
  
  // Для avatar_color перевіряємо тільки якщо поле видиме
  let currentAvatarColor = originalProfileData.avatar_color;
  if (profileEditAvatarColorInput && profileEditAvatarColorGroup && !profileEditAvatarColorGroup.hidden) {
    currentAvatarColor = profileEditAvatarColorInput.value || DEFAULT_AVATAR_COLOR;
  }
  
  // Порівнюємо значення
  return (
    currentData.first_name !== originalProfileData.first_name ||
    currentData.last_name !== originalProfileData.last_name ||
    currentData.date_of_birth !== originalProfileData.date_of_birth ||
    currentData.gender !== originalProfileData.gender ||
    currentAvatarColor !== originalProfileData.avatar_color
  );
}

// Показує кнопки дій форми профілю
function showProfileFormActions() {
  if (profileFormActions) {
    profileFormActions.removeAttribute("hidden");
    profileFormActions.hidden = false;
  }
}

// Ховає кнопки дій форми профілю
function hideProfileFormActions() {
  if (profileFormActions) {
    profileFormActions.setAttribute("hidden", "");
    profileFormActions.hidden = true;
  }
}

// Перевіряє зміни та показує/ховає кнопки
function checkProfileFormChanges() {
  if (hasProfileChanges()) {
    showProfileFormActions();
  } else {
    hideProfileFormActions();
  }
}

function renderHistoryTable() {
  // Перевіряємо елементи для нової сторінки історії
  if (!historyTableBody || !historyEmpty) return;
  
  if (!authState.user) {
    historyTableBody.innerHTML = "";
    if (historyEmpty) {
      historyEmpty.textContent = "Історія доступна лише після входу до системи.";
      historyEmpty.hidden = false;
    }
    if (historyTableWrapper) {
      historyTableWrapper.hidden = true;
    }
    if (historyContent) {
      // Показуємо посилання на вхід якщо користувач не автентифікований
      historyEmpty.innerHTML = `
        <p>Історія доступна лише після входу до системи.</p>
        <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: center;">
          <button type="button" class="button button--ghost" id="history-login-shortcut">Увійти</button>
          <button type="button" class="button" id="history-register-shortcut">Зареєструватися</button>
        </div>
      `;
      refreshIcons();
    }
    return;
  }

  if (!authState.history || authState.history.length === 0) {
    historyTableBody.innerHTML = "";
    if (historyEmpty) {
      historyEmpty.textContent = "Історія поки порожня. Зробіть прогноз, щоб побачити його тут.";
      historyEmpty.hidden = false;
    }
    if (historyTableWrapper) {
      historyTableWrapper.hidden = true;
    }
    return;
  }

  const rows = authState.history
    .map((entry) => {
      const dateLabel = formatDateTimeLong(entry.created_at);
      const targetLabel = formatTargetLabel(entry.target);
      const modelLabel = entry.model_name || "Автоматично";
      const probabilityLabel = formatProbability(entry.probability);
      const riskLabel = riskLabels[entry.risk_bucket] || entry.risk_bucket;
      const color = getRiskColor(entry.risk_bucket);
      return `
        <tr data-id="${entry.id}">
          <td>${dateLabel}</td>
          <td>${targetLabel}</td>
          <td>${modelLabel}</td>
          <td>${probabilityLabel}</td>
          <td><span class="history-actions__pill" style="background:${color};color:#fff;">${riskLabel}</span></td>
          <td class="history-table__actions">
            <div class="history-actions">
              <button type="button" class="history-actions__button" data-action="replay" data-id="${entry.id}">Повторити</button>
              <button type="button" class="history-actions__button history-actions__button--danger" data-action="delete" data-id="${entry.id}">Видалити</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  historyTableBody.innerHTML = rows;
  if (historyEmpty) {
    historyEmpty.hidden = true;
  }
  if (historyTableWrapper) {
    historyTableWrapper.hidden = false;
  }
  refreshIcons();
}

async function loadHistory(limit = 50) {
  if (!authState.token) {
    authState.history = [];
    renderHistoryTable();
    return;
  }
  try {
    console.log("📥 Завантаження історії прогнозів...");
    const data = await apiFetch(`/users/me/history?limit=${limit}`);
    authState.history = Array.isArray(data?.items) ? data.items : [];
    console.log("✅ Історія завантажена:", authState.history.length, "записів");
    if (authState.history.length > 0) {
      console.log("Перший запис:", authState.history[0]);
    }
  } catch (error) {
    console.error("❌ Не вдалося отримати історію прогнозів:", error);
    authState.history = [];
  }
  renderHistoryTable();
}

async function initializeAuth() {
  const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (storedToken) {
    persistToken(storedToken);
    try {
      const profile = await apiFetch("/users/me");
      authState.user = profile;
      await loadHistory();
    } catch (error) {
      console.warn("Сесію не вдалося поновити:", error);
      clearAuthState();
    }
  } else {
    persistToken(null);
    authState.user = null;
    authState.history = [];
  }
  authState.initialized = true;
  updateUserPanel();
  updateProfileSection();
  updateNavigationVisibility();
  renderHistoryTable();
  
  // Синхронізуємо маршрут після завершення автентифікації
  // Це гарантує, що сторінка правильно завантажиться при оновленні
  syncRouteFromLocation();
}

// Функція toggleUserMenu видалена - більше не потрібна

function loadPredictionFromHistory(inputs) {
  if (!inputs) return;
  queuedFormInputs = { ...inputs };
  applyQueuedPredictionInputs();
  navigateTo("/app");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function applyQueuedPredictionInputs() {
  if (!queuedFormInputs) return;
  let applied = false;
  Object.entries(queuedFormInputs).forEach(([key, value]) => {
    if (key === "target" || key === "model") return;
    const input = inputRefs[key];
    if (input) {
      input.value = value ?? "";
      applied = true;
    }
  });
  if (targetSelect && queuedFormInputs.target) {
    targetSelect.value = queuedFormInputs.target;
    applied = true;
  }
  if (modelSelect) {
    const modelValue = queuedFormInputs.model && queuedFormInputs.model !== "" ? queuedFormInputs.model : "auto";
    const optionExists = Array.from(modelSelect.options).some((opt) => opt.value === modelValue);
    modelSelect.value = optionExists ? modelValue : "auto";
    applied = true;
  }
  if (applied) {
    queuedFormInputs = null;
    updateAllIndicators();
  }
}

function setProfileStatus(message, variant = "info") {
  if (!profileUpdateStatus) return;
  if (!message) {
    profileUpdateStatus.textContent = "";
    return;
  }
  profileUpdateStatus.textContent = message;
  profileUpdateStatus.style.color = variant === "error" ? "#b21f2f" : "var(--text-secondary)";
}

function openLoginPage() {
  // Perform real route change using window.location.href
  window.location.href = "/login";
}

function openRegisterPage() {
  // Perform real route change using window.location.href
  window.location.href = "/register";
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  if (!loginForm) return;
  const submitButton = loginForm.querySelector("button[type='submit']");
  const formData = new FormData(loginForm);
  const email = formData.get("email")?.toString().trim() || "";
  const password = formData.get("password")?.toString() || "";
  
  // Клієнтська валідація
  setAuthFormError(loginErrorBox, "");
  if (!email && !password) {
    setAuthFormError(loginErrorBox, "Поля електронної пошти та пароля не можуть бути порожніми.");
    return;
  }
  if (!email) {
    setAuthFormError(loginErrorBox, "Поле електронної пошти не може бути порожнім.");
    return;
  }
  if (!password) {
    setAuthFormError(loginErrorBox, "Поле пароля не може бути порожнім.");
    return;
  }
  
  const payload = { email, password };
  if (submitButton) submitButton.disabled = true;
  
  try {
    const data = await apiFetch(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      { skipAuth: true },
    );
    // Після успішної логінації завжди перенаправляємо на /profile
    handleAuthSuccess(data, { navigateToRoute: "/profile" });
  } catch (error) {
    // Обробка помилок від backend
    const errorMessage = error.message || error.detail || "Не вдалося увійти. Спробуйте ще раз.";
    setAuthFormError(loginErrorBox, errorMessage);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  if (!registerForm) return;
  const submitButton = registerForm.querySelector("button[type='submit']");
  const formData = new FormData(registerForm);
  const firstName = formData.get("first_name")?.toString().trim();
  const lastName = formData.get("last_name")?.toString().trim();
  const dateOfBirth = formData.get("date_of_birth")?.toString().trim();
  const gender = formData.get("gender")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString() ?? "";
  const confirm = formData.get("confirm_password")?.toString() ?? "";

  // Валідація обов'язкових полів
  if (!firstName) {
    setAuthFormError(registerErrorBox, "Ім'я є обов'язковим полем.");
    return;
  }
  if (!lastName) {
    setAuthFormError(registerErrorBox, "Прізвище є обов'язковим полем.");
    return;
  }
  if (!dateOfBirth) {
    setAuthFormError(registerErrorBox, "Дата народження є обов'язковим полем.");
    return;
  }
  if (!gender || !["male", "female"].includes(gender)) {
    setAuthFormError(registerErrorBox, "Будь ласка, оберіть стать.");
    return;
  }

  if (password !== confirm) {
    setAuthFormError(registerErrorBox, "Паролі не співпадають.");
    return;
  }

  if (submitButton) submitButton.disabled = true;
  setAuthFormError(registerErrorBox, "");

  try {
    const data = await apiFetch(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          confirm_password: confirm,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          gender: gender,
        }),
      },
      { skipAuth: true },
    );
    handleAuthSuccess(data, { isRegistration: true });
  } catch (error) {
    setAuthFormError(registerErrorBox, error.message);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  if (!profileEditFirstNameInput || !authState.user) {
    openLoginPage();
    return;
  }
  
  const payload = {};
  
  // Збираємо дані з форми (first_name обов'язкове)
  const firstName = profileEditFirstNameInput.value.trim();
  if (!firstName) {
    setProfileStatus("Ім'я є обов'язковим полем.", "error");
    return;
  }
  payload.first_name = firstName;
  
  // Додаємо інші поля (можуть бути порожніми для очищення)
  if (profileEditLastNameInput) {
    payload.last_name = profileEditLastNameInput.value.trim() || null;
  }
  if (profileEditDateOfBirthInput) {
    payload.date_of_birth = profileEditDateOfBirthInput.value || null;
  }
  if (profileEditGenderSelect) {
    payload.gender = profileEditGenderSelect.value || null;
  }
  if (profileEditAvatarColorInput && !profileEditAvatarColorGroup?.hidden) {
    payload.avatar_color = profileEditAvatarColorInput.value || DEFAULT_AVATAR_COLOR;
  }
  
  setProfileStatus("Збереження...", "info");
  
  const submitButton = event.target.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  
  try {
    const data = await apiFetch("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    authState.user = data;
    updateUserPanel();
    updateProfileSection();
    
    // Оновлюємо оригінальні значення після успішного збереження
    saveOriginalProfileData();
    
    // Ховаємо кнопки дій після збереження
    hideProfileFormActions();
    
    // Переключаємо на таб "Профіль"
    switchProfileTab("profile");
    
    setProfileStatus("Профіль успішно оновлено.", "info");
    
    // Показуємо повідомлення про успіх
    showNotification({
      type: "success",
      title: "Профіль оновлено",
      message: "Ваші дані успішно збережено.",
    });
  } catch (error) {
    setProfileStatus(error.message || "Не вдалося оновити профіль. Спробуйте ще раз.", "error");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

// Функція для перемикання табів профілю
function switchProfileTab(tabName) {
  if (!profileTabs || !profileTabPanels) return;
  
  // Деактивуємо всі таби та панелі
  profileTabs.forEach((tab) => {
    tab.classList.remove("profile-tab--active");
    tab.setAttribute("aria-selected", "false");
  });
  
  profileTabPanels.forEach((panel) => {
    panel.classList.remove("profile-tab-panel--active");
  });
  
  // Активуємо вибраний таб та панель
  const targetTab = Array.from(profileTabs).find(
    (tab) => tab.dataset.tab === tabName
  );
  const targetPanel = document.getElementById(`profile-tab-${tabName}`);
  
  if (targetTab) {
    targetTab.classList.add("profile-tab--active");
    targetTab.setAttribute("aria-selected", "true");
  }
  
  if (targetPanel) {
    targetPanel.classList.add("profile-tab-panel--active");
  }
  
  refreshIcons();
}

async function handleAvatarUpload(event) {
  if (!avatarUploadInput || !authState.user) return;
  
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Перевірка типу файлу
  const validTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (!validTypes.includes(file.type)) {
    setProfileStatus("Недозволений формат файлу. Дозволені: PNG, JPG, JPEG", "error");
    return;
  }
  
  // Перевірка розміру файлу (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    setProfileStatus("Файл занадто великий. Максимальний розмір: 5MB", "error");
    return;
  }
  
  setProfileStatus("Завантаження фото...", "info");
  
  // Додаємо індикатор завантаження
  if (avatarUploadBtn) {
    avatarUploadBtn.disabled = true;
    const originalText = avatarUploadBtn.textContent;
    avatarUploadBtn.textContent = "Завантаження...";
  }
  
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetch(`${API_BASE}/users/me/avatar`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Не вдалося завантажити фото. Спробуйте інший файл.");
    }
    
    const data = await response.json();
    authState.user = data;
    updateUserPanel();
    updateProfileSection();
    updateAvatarButtons();
    setProfileStatus("Фото завантажено успішно.", "info");
    
    // Оновлюємо preview аватару в формі редагування
    const profileAvatarPreviewImage = document.getElementById("profile-avatar-preview-image");
    if (profileAvatarPreviewImage) {
      applyAvatarStyle(profileAvatarPreviewImage, data);
    }
    
    // Оновлюємо видимість кольору аватару після завантаження
    if (profileEditAvatarColorGroup && data.avatar_type === "uploaded" && data.avatar_url) {
      profileEditAvatarColorGroup.setAttribute("hidden", "");
      profileEditAvatarColorGroup.hidden = true;
    }
  } catch (error) {
    setProfileStatus(error.message || "Не вдалося завантажити фото. Спробуйте інший файл.", "error");
  } finally {
    // Скидаємо інпут
    if (avatarUploadInput) {
      avatarUploadInput.value = "";
    }
    if (avatarUploadBtn) {
      avatarUploadBtn.disabled = false;
      avatarUploadBtn.textContent = "Завантажити фото";
    }
  }
}

async function handleAvatarReset() {
  if (!authState.user) return;
  
  const confirmReset = confirm("Ви впевнені, що хочете повернутися до стандартного аватару?");
  if (!confirmReset) return;
  
  setProfileStatus("Скидання аватару...", "info");
  
  if (avatarResetBtn) {
    avatarResetBtn.disabled = true;
  }
  
  try {
    const data = await apiFetch("/users/me/avatar", {
      method: "DELETE",
    });
    authState.user = data;
    updateUserPanel();
    updateProfileSection();
    updateAvatarButtons();
    setProfileStatus("Аватар скинуто до стандартного.", "info");
    
    // Оновлюємо preview аватару в формі редагування
    const profileAvatarPreviewImage = document.getElementById("profile-avatar-preview-image");
    if (profileAvatarPreviewImage) {
      applyAvatarStyle(profileAvatarPreviewImage, data);
    }
    
    // Оновлюємо видимість кольору аватару після скидання
    if (profileEditAvatarColorGroup) {
      profileEditAvatarColorGroup.removeAttribute("hidden");
      profileEditAvatarColorGroup.hidden = false;
    }
  } catch (error) {
    setProfileStatus(error.message || "Не вдалося скинути аватар. Спробуйте пізніше.", "error");
  } finally {
    if (avatarResetBtn) {
      avatarResetBtn.disabled = false;
    }
  }
}

async function handlePasswordChange(event) {
  event.preventDefault();
  if (!profileCurrentPasswordInput || !profileNewPasswordInput || !profileConfirmPasswordInput || !authState.user) {
    openLoginPage();
    return;
  }
  
  const currentPassword = profileCurrentPasswordInput.value;
  const newPassword = profileNewPasswordInput.value;
  const confirmPassword = profileConfirmPasswordInput.value;
  
  // Валідація на клієнті
  if (newPassword !== confirmPassword) {
    setPasswordStatus("Паролі не співпадають.", "error");
    return;
  }
  
  if (newPassword.length < 8) {
    setPasswordStatus("Пароль повинен містити мінімум 8 символів.", "error");
    return;
  }
  
  setPasswordStatus("Оновлення пароля...", "info");
  
  const submitButton = profilePasswordForm?.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
  }
  
  try {
    const response = await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      }),
    });
    
    setPasswordStatus(response.message || "Пароль успішно змінено.", "info");
    
    // Очищаємо поля форми
    if (profileCurrentPasswordInput) profileCurrentPasswordInput.value = "";
    if (profileNewPasswordInput) profileNewPasswordInput.value = "";
    if (profileConfirmPasswordInput) profileConfirmPasswordInput.value = "";
  } catch (error) {
    setPasswordStatus(error.message || "Не вдалося змінити пароль. Спробуйте ще раз.", "error");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function setPasswordStatus(message, type = "info") {
  if (!profilePasswordStatus) return;
  profilePasswordStatus.textContent = message;
  profilePasswordStatus.hidden = false;
  
  // Видаляємо старі класи
  profilePasswordStatus.classList.remove("profile-form__status--error", "profile-form__status--info");
  
  if (type === "error") {
    profilePasswordStatus.classList.add("profile-form__status--error");
  } else {
    profilePasswordStatus.classList.add("profile-form__status--info");
  }
}

async function handleForgotPassword(event) {
  event.preventDefault();
  if (!forgotPasswordForm) return;
  
  const formData = new FormData(forgotPasswordForm);
  const email = formData.get("email")?.toString().trim();
  
  if (!email) {
    setForgotPasswordError("Будь ласка, введіть електронну пошту.");
    return;
  }
  
  const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Надсилання...";
  }
  
  setForgotPasswordError("");
  if (forgotPasswordSuccess) {
    forgotPasswordSuccess.hidden = true;
    forgotPasswordSuccess.textContent = "";
    forgotPasswordSuccess.innerHTML = "";
  }
  
  try {
    const data = await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }, { skipAuth: true });
    
    // Якщо отримано reset_token - користувач існує
    if (data.reset_token) {
      const resetToken = data.reset_token;
      const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;

      let copied = false;

      // Спробуємо скопіювати через Clipboard API (сучасний метод)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(resetUrl);
          copied = true;
          console.log("🔗 Посилання скопійовано в буфер обміну через Clipboard API:", resetUrl);
        } catch (clipboardError) {
          console.warn("Не вдалося скопіювати через Clipboard API:", clipboardError);
        }
      }

      // Fallback: спробуємо через execCommand (старіший метод)
      if (!copied) {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = resetUrl;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand("copy");
          document.body.removeChild(textArea);

          if (successful) {
            copied = true;
            console.log("🔗 Посилання скопійовано в буфер обміну через execCommand:", resetUrl);
          }
        } catch (execCommandError) {
          console.warn("Не вдалося скопіювати через execCommand:", execCommandError);
        }
      }

      // Відкриваємо посилання в новій вкладці
      try {
        window.open(resetUrl, '_blank', 'noopener,noreferrer');
        console.log("🔗 Посилання відкрито в новій вкладці:", resetUrl);
      } catch (openError) {
        console.warn("Не вдалося відкрити посилання в новій вкладці:", openError);
      }

      // Показуємо повідомлення
      if (forgotPasswordSuccess) {
        if (copied) {
          // Якщо успішно скопійовано - показуємо простий текст
          forgotPasswordSuccess.innerHTML = "Посилання для скидання пароля скопійовано у буфер обміну<br>(дипломна версія).";
          forgotPasswordSuccess.hidden = false;
        } else {
          // Якщо не вдалося скопіювати - показуємо URL для ручного копіювання
          const escapedUrl = resetUrl.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
          const messageHTML = `<strong>Посилання для скидання пароля (дипломна версія):</strong><br><br><a href="${escapedUrl}" onclick="navigator.clipboard?.writeText('${escapedUrl}').then(() => alert('Посилання скопійовано!')).catch(() => {}); return false;" style="color: #15803d; text-decoration: underline; cursor: pointer; font-weight: 600; word-break: break-all;">${resetUrl}</a><br><br>Натисніть на посилання вище, щоб скопіювати його.`;
          forgotPasswordSuccess.innerHTML = messageHTML;
          forgotPasswordSuccess.hidden = false;
        }
        // Приховуємо помилку, якщо вона була показана
        if (forgotPasswordError) {
          forgotPasswordError.hidden = true;
        }
      }
      
      // Ховаємо кнопку та робимо поле readonly
      if (forgotPasswordSubmitBtn) {
        forgotPasswordSubmitBtn.hidden = true;
      }
      if (forgotEmailInput) {
        forgotEmailInput.readOnly = true;
      }
      
      console.log("🔐 Токен відновлення пароля:", resetToken);
      console.log("🔗 Посилання для скидання пароля:", resetUrl);
    } else {
      // Якщо reset_token відсутній - користувача не знайдено
      // (Але це не повинно статися, якщо backend правильно повертає помилку)
      const errorMessage = "Користувача з такою електронною поштою не зареєстровано.";
      console.log("❌ reset_token відсутній - користувача не знайдено");
      setForgotPasswordError(errorMessage);
      
      // Приховуємо успішне повідомлення
      if (forgotPasswordSuccess) {
        forgotPasswordSuccess.hidden = true;
        forgotPasswordSuccess.textContent = "";
        forgotPasswordSuccess.innerHTML = "";
      }
      
      // Ховаємо кнопку та робимо поле readonly
      if (forgotPasswordSubmitBtn) {
        forgotPasswordSubmitBtn.hidden = true;
      }
      if (forgotEmailInput) {
        forgotEmailInput.readOnly = true;
      }
    }
  } catch (error) {
    // Помилка - користувача не знайдено або інша помилка
    // apiFetch кидає Error з message, який містить detail з відповіді
    const errorMessage = error.message || error.detail || "Користувача з такою електронною поштою не зареєстровано.";
    console.log("❌ Помилка відновлення пароля:", errorMessage);
    setForgotPasswordError(errorMessage);
    
    // Приховуємо успішне повідомлення, якщо воно було показано
    if (forgotPasswordSuccess) {
      forgotPasswordSuccess.hidden = true;
      forgotPasswordSuccess.textContent = "";
      forgotPasswordSuccess.innerHTML = "";
    }
    
    // Ховаємо кнопку та робимо поле readonly
    if (forgotPasswordSubmitBtn) {
      forgotPasswordSubmitBtn.hidden = true;
    }
    if (forgotEmailInput) {
      forgotEmailInput.readOnly = true;
    }
  } finally {
    // Скидаємо стан кнопки тільки якщо вона видима
    // Якщо кнопка прихована (після помилки або успіху), стан буде скинуто через resetForgotPasswordForm()
    if (submitButton && !submitButton.hidden) {
      submitButton.disabled = false;
      submitButton.textContent = "Надіслати інструкції";
    }
    // Якщо кнопка прихована, але все ще disabled, скидаємо її стан для майбутнього використання
    if (submitButton && submitButton.hidden && submitButton.disabled) {
      submitButton.disabled = false;
      submitButton.textContent = "Надіслати інструкції";
    }
  }
}

function setForgotPasswordError(message) {
  if (!forgotPasswordError) return;
  if (message) {
    forgotPasswordError.textContent = message;
    forgotPasswordError.hidden = false;
    if (forgotPasswordSuccess) {
      forgotPasswordSuccess.hidden = true;
    }
  } else {
    forgotPasswordError.hidden = true;
  }
}

function resetForgotPasswordForm() {
  // Скидаємо стан форми відновлення пароля
  if (forgotEmailInput) {
    forgotEmailInput.readOnly = false;
    forgotEmailInput.value = "";
  }
  if (forgotPasswordSubmitBtn) {
    forgotPasswordSubmitBtn.hidden = false;
    forgotPasswordSubmitBtn.disabled = false;
    forgotPasswordSubmitBtn.textContent = "Надіслати інструкції";
  }
  setForgotPasswordError("");
  if (forgotPasswordSuccess) {
    forgotPasswordSuccess.hidden = true;
    forgotPasswordSuccess.textContent = "";
    forgotPasswordSuccess.innerHTML = "";
  }
  if (forgotPasswordForm) {
    forgotPasswordForm.reset();
  }
}

function setForgotPasswordSuccess(message) {
  if (!forgotPasswordSuccess) return;
  if (message) {
    forgotPasswordSuccess.textContent = message;
    forgotPasswordSuccess.hidden = false;
    if (forgotPasswordError) {
      forgotPasswordError.hidden = true;
    }
  } else {
    forgotPasswordSuccess.hidden = true;
  }
}

async function handleResetPassword(event) {
  event.preventDefault();
  if (!resetPasswordForm) return;
  
  // Отримуємо токен з URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  
  if (!token) {
    setResetPasswordError("Відсутній токен відновлення. Перевірте посилання з email.");
    return;
  }
  
  const formData = new FormData(resetPasswordForm);
  const newPassword = formData.get("new_password")?.toString() || "";
  const confirmPassword = formData.get("confirm_new_password")?.toString() || "";
  
  // Валідація на клієнті
  if (newPassword !== confirmPassword) {
    setResetPasswordError("Паролі не співпадають.");
    return;
  }
  
  if (newPassword.length < 8) {
    setResetPasswordError("Пароль повинен містити мінімум 8 символів.");
    return;
  }
  
  const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Оновлення...";
  }
  
  setResetPasswordError("");
  
  try {
    const data = await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      }),
    }, { skipAuth: true });
    
    // Показуємо повідомлення про успіх
    setResetPasswordError(""); // Очищаємо помилки
    if (resetPasswordError) {
      resetPasswordError.textContent = data.message || "Пароль успішно оновлено!";
      resetPasswordError.style.color = "var(--success-color, #4ade80)";
      resetPasswordError.hidden = false;
    }
    
    // Ховаємо форму та показуємо лоадер
    if (resetPasswordForm) {
      resetPasswordForm.hidden = true;
    }
    showLoader();
    
    // Перенаправляємо на сторінку входу через 2 секунди
    setTimeout(() => {
      hideLoader();
      navigateTo("/login");
      // Очищаємо токен з URL
      window.history.replaceState({}, document.title, "/login");
    }, 2000);
  } catch (error) {
    // Обробка помилок від backend
    const errorMessage = error.message || error.detail || "Не вдалося оновити пароль. Перевірте токен або спробуйте ще раз.";
    setResetPasswordError(errorMessage);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Оновити пароль";
    }
  }
}

function setResetPasswordError(message) {
  if (!resetPasswordError) return;
  if (message) {
    resetPasswordError.textContent = message;
    resetPasswordError.hidden = false;
    resetPasswordError.style.color = ""; // Скидаємо колір для помилок
  } else {
    resetPasswordError.hidden = true;
  }
}

function showLoader() {
  if (appLoader) {
    appLoader.hidden = false;
    appLoader.setAttribute("aria-busy", "true");
  }
}

function hideLoader() {
  if (appLoader) {
    appLoader.hidden = true;
    appLoader.setAttribute("aria-busy", "false");
  }
}

function openForgotPasswordPage() {
  navigateTo("/forgot-password");
}

function openResetPasswordPage(token) {
  navigateTo(`/reset-password?token=${encodeURIComponent(token)}`);
}

async function handleLogout() {
  // Перевіряємо, чи вже не виконується logout (запобігаємо подвійному виклику)
  if (handleLogout.inProgress) {
    console.log("Logout вже виконується, ігноруємо повторний виклик");
    return;
  }
  
  handleLogout.inProgress = true;
  
  try {
    await apiFetch("/auth/logout", { method: "POST" }, { skipAuth: false });
  } catch (error) {
    console.warn("Помилка під час виходу:", error);
  } finally {
    clearAuthState();
    navigateTo("/login", { replace: true });
    handleLogout.inProgress = false;
  }
}

function openDeleteAccountModal() {
  if (!deleteAccountModal) return;
  deleteAccountModal.removeAttribute("hidden");
  deleteAccountModal.hidden = false;
  // Ховаємо помилки при відкритті
  if (deleteAccountError) {
    deleteAccountError.hidden = true;
    deleteAccountError.textContent = "";
  }
  // Фокус на кнопку скасування для доступності
  if (deleteAccountCancelBtn) {
    deleteAccountCancelBtn.focus();
  }
  // Блокуємо скрол сторінки
  document.body.style.overflow = "hidden";
  refreshIcons();
}

function closeDeleteAccountModal() {
  if (!deleteAccountModal) return;
  deleteAccountModal.setAttribute("hidden", "");
  deleteAccountModal.hidden = true;
  // Прибираємо помилки
  if (deleteAccountError) {
    deleteAccountError.hidden = true;
    deleteAccountError.textContent = "";
  }
  // Відновлюємо скрол сторінки
  document.body.style.overflow = "";
  // Розблоковуємо кнопку підтвердження
  if (deleteAccountConfirmBtn) {
    deleteAccountConfirmBtn.disabled = false;
  }
}

async function handleDeleteAccount() {
  if (!deleteAccountConfirmBtn) return;
  
  // Перевіряємо, чи вже не виконується видалення
  if (handleDeleteAccount.inProgress) {
    return;
  }
  
  handleDeleteAccount.inProgress = true;
  deleteAccountConfirmBtn.disabled = true;
  
  // Ховаємо помилку
  if (deleteAccountError) {
    deleteAccountError.hidden = true;
    deleteAccountError.textContent = "";
  }
  
  try {
    // Викликаємо API для видалення облікового запису
    const response = await apiFetch("/users/me", { method: "DELETE" }, { skipAuth: false });
    
    // Показуємо повідомлення про успіх (опційно)
    console.log("Обліковий запис успішно видалено:", response);
    
    // Закриваємо модальне вікно
    closeDeleteAccountModal();
    
    // Показуємо сповіщення про успіх ПЕРЕД очищенням стану та перенаправленням
    // Це гарантує, що сповіщення відобразиться навіть після зміни маршруту
    showNotification({
      type: "success",
      title: "Обліковий запис видалено",
      message: "Ваш обліковий запис успішно видалено. Ви можете створити новий або завершити роботу з системою.",
      duration: 8000, // 8 секунд для важливого повідомлення
    });
    
    // Невелика затримка перед очищенням стану для того, щоб сповіщення встигло відобразитися
    setTimeout(() => {
      // Очищаємо стан автентифікації
      clearAuthState();
      
      // Перенаправляємо на сторінку входу
      navigateTo("/login", { replace: true });
    }, 100);
    
  } catch (error) {
    // Показуємо помилку в модальному вікні
    const errorMessage = error.detail || error.message || "Не вдалося видалити обліковий запис. Спробуйте пізніше.";
    if (deleteAccountError) {
      deleteAccountError.textContent = errorMessage;
      deleteAccountError.hidden = false;
    }
    // Розблоковуємо кнопку для повторної спроби
    deleteAccountConfirmBtn.disabled = false;
  } finally {
    handleDeleteAccount.inProgress = false;
  }
}

function handleHistoryTableClick(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const id = Number.parseInt(actionButton.dataset.id, 10);
  if (!Number.isFinite(id)) return;
  const action = actionButton.dataset.action;

  if (action === "replay") {
    const entry = authState.history.find((item) => item.id === id);
    if (entry) {
      loadPredictionFromHistory(entry.inputs);
      // Переходимо на сторінку форми та показуємо повідомлення
      navigateTo("/app");
      showNotification({
        type: "success",
        title: "Дані завантажено",
        message: "Дані прогнозу завантажено до форми.",
        duration: 4000,
      });
    }
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm("Ви впевнені, що хочете видалити цей прогноз з історії?");
    if (!confirmed) return;
    actionButton.disabled = true;
    apiFetch(`/users/me/history/${id}`, { method: "DELETE" })
      .then(() => {
        authState.history = authState.history.filter((item) => item.id !== id);
        renderHistoryTable();
        // Показуємо повідомлення на сторінці історії або профілю
        showNotification({
          type: "success",
          title: "Запис видалено",
          message: "Запис історії успішно видалено.",
          duration: 3000,
        });
      })
      .catch((error) => {
        showNotification({
          type: "error",
          title: "Помилка",
          message: error.message || "Не вдалося видалити запис історії.",
          duration: 5000,
        });
      })
      .finally(() => {
        actionButton.disabled = false;
      });
  }
}

function handleDocumentClick(event) {
  // Обробка кліків поза елементами (якщо потрібно)
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape") {
    // Закриваємо модальне вікно видалення облікового запису, якщо воно відкрите
    if (deleteAccountModal && !deleteAccountModal.hidden) {
      closeDeleteAccountModal();
      return;
    }
  }
}


// Notification system
const notificationsContainer = document.getElementById("notifications-container");
const MAX_NOTIFICATIONS = 4;
const DEFAULT_NOTIFICATION_DURATION = 5000; // 5 секунд
let notificationIdCounter = 0;
const activeNotifications = new Map();

/**
 * Показує сповіщення (toast notification)
 * @param {Object} options - Опції сповіщення
 * @param {string} options.type - Тип сповіщення: "success" | "error" | "info"
 * @param {string} options.title - Заголовок сповіщення (українською)
 * @param {string} [options.message] - Повідомлення (українською)
 * @param {number} [options.duration] - Тривалість відображення в мілісекундах (за замовчуванням 5000)
 * @returns {string} ID сповіщення
 */
function showNotification({ type = "info", title, message = "", duration = DEFAULT_NOTIFICATION_DURATION }) {
  if (!notificationsContainer) {
    console.warn("Контейнер сповіщень не знайдено");
    return null;
  }

  if (!title) {
    console.warn("Заголовок сповіщення є обов'язковим");
    return null;
  }

  const notificationId = `notification-${++notificationIdCounter}`;
  
  // Обмежуємо кількість одночасних сповіщень
  if (activeNotifications.size >= MAX_NOTIFICATIONS) {
    // Видаляємо найстаріше сповіщення
    const oldestId = Array.from(activeNotifications.keys())[0];
    hideNotification(oldestId);
  }

  // Визначаємо іконку та ARIA роль залежно від типу
  let iconName = "info";
  let ariaRole = "status";
  
  switch (type) {
    case "success":
      iconName = "check-circle";
      ariaRole = "status";
      break;
    case "error":
      iconName = "alert-circle";
      ariaRole = "alert";
      break;
    case "info":
    default:
      iconName = "info";
      ariaRole = "status";
      break;
  }

  // Створюємо HTML елемент сповіщення
  const notificationEl = document.createElement("div");
  notificationEl.className = `notification notification--${type}`;
  notificationEl.id = notificationId;
  notificationEl.setAttribute("role", ariaRole);
  notificationEl.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

  notificationEl.innerHTML = `
    <span class="icon notification__icon" data-lucide="${iconName}" aria-hidden="true"></span>
    <div class="notification__content">
      <h3 class="notification__title">${escapeHtml(title)}</h3>
      ${message ? `<p class="notification__message">${escapeHtml(message)}</p>` : ""}
    </div>
    <button type="button" class="notification__close" aria-label="Закрити сповіщення" data-notification-id="${notificationId}">
      <span class="icon" data-lucide="x" aria-hidden="true"></span>
    </button>
  `;

  // Додаємо сповіщення до контейнера
  notificationsContainer.appendChild(notificationEl);
  
  // Оновлюємо іконки
  refreshIcons();

  // Зберігаємо інформацію про сповіщення
  const timeoutId = setTimeout(() => {
    hideNotification(notificationId);
  }, duration);

  activeNotifications.set(notificationId, {
    element: notificationEl,
    timeoutId,
    type,
  });

  // Додаємо обробник закриття
  const closeBtn = notificationEl.querySelector(".notification__close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      hideNotification(notificationId);
    });
  }

  return notificationId;
}

/**
 * Ховає сповіщення з анімацією
 * @param {string} notificationId - ID сповіщення для приховування
 */
function hideNotification(notificationId) {
  const notification = activeNotifications.get(notificationId);
  if (!notification) return;

  // Зупиняємо таймер авто-приховування
  if (notification.timeoutId) {
    clearTimeout(notification.timeoutId);
  }

  // Додаємо клас для анімації виходу
  notification.element.classList.add("notification--exiting");

  // Видаляємо елемент після завершення анімації
  setTimeout(() => {
    if (notification.element.parentNode) {
      notification.element.parentNode.removeChild(notification.element);
    }
    activeNotifications.delete(notificationId);
  }, 300); // Тривалість анімації виходу
}

/**
 * Екранує HTML для безпеки
 * @param {string} text - Текст для екранування
 * @returns {string} Екранований текст
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function refreshIcons() {
  if (window.lucide?.createIcons) {
    const iconNodes = document.querySelectorAll("[data-lucide]");
    window.lucide.createIcons({ nodes: iconNodes });
  }
  updateThemeIcon(currentTheme);
}

function updateThemeIcon(theme) {
  if (!themeIconContainer) return;
  const iconName = theme === "dark" ? "sun" : "moon";
  if (window.lucide?.icons?.[iconName]) {
    themeIconContainer.innerHTML = window.lucide.icons[iconName].toSvg({ width: 18, height: 18 });
  } else {
    themeIconContainer.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

async function fetchMetadata() {
  try {
    const response = await fetch(`${API_BASE}/metadata`);
    if (!response.ok) {
      throw new Error("Не вдалося отримати метадані");
    }
    metadataCache = await response.json();
    buildFeatureInputs(metadataCache.feature_schema || []);
  } catch (error) {
    showError(error.message || "Сталася помилка під час завантаження метаданих");
  }
}

function createTooltipButton(content, tooltipId) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tooltip-trigger";
  if (tooltipId && TOOLTIP_LIBRARY[tooltipId]) {
    btn.dataset.tooltip = TOOLTIP_LIBRARY[tooltipId];
  } else {
    btn.dataset.tooltip = content;
  }
  const icon = document.createElement("span");
  icon.className = "icon";
  icon.dataset.lucide = "help-circle";
  btn.appendChild(icon);
  return btn;
}

function createIndicator() {
  const span = document.createElement("span");
  span.className = "live-indicator live-indicator--info";
  span.textContent = "—";
  return span;
}

function buildFeatureInputs(schema) {
  featuresContainer.innerHTML = "";
  Object.keys(inputRefs).forEach((key) => delete inputRefs[key]);
  liveIndicators.bmi = null;
  liveIndicators.glucose = null;
  liveIndicators.bp = null;

  schema.forEach((feature) => {
    const field = document.createElement("div");
    field.className = "form__field";

    const label = document.createElement("label");
    label.setAttribute("for", feature.name);

    const labelText = document.createElement("span");
    labelText.textContent = feature.description || feature.name;

    const tooltipText = TOOLTIP_TEXTS[feature.name] || "Параметр користувача.";
    const tooltipBtn = createTooltipButton(tooltipText);

    label.append(labelText, tooltipBtn);

    let inputElement;
    if (feature.name === "RIAGENDR") {
      inputElement = document.createElement("select");
      inputElement.innerHTML = `
        <option value="" disabled selected>Оберіть стать</option>
        <option value="1">Чоловік</option>
        <option value="2">Жінка</option>
      `;
    } else {
      inputElement = document.createElement("input");
      inputElement.type = "number";
      inputElement.step = "any";
      if (typeof feature.min === "number") inputElement.min = feature.min;
      if (typeof feature.max === "number") inputElement.max = feature.max;
      inputElement.placeholder = feature.hint || "Введіть значення";
    }

    inputElement.id = feature.name;
    inputElement.name = feature.name;
    inputElement.required = Boolean(feature.required);

    field.appendChild(label);
    field.appendChild(inputElement);

    if (feature.required) {
      const hint = document.createElement("span");
      hint.className = "form__hint";
      hint.textContent = "Обов'язкове поле";
      field.appendChild(hint);
    }

    if (feature.name === "BMXBMI") {
      const indicator = createIndicator();
      indicator.id = "bmi-indicator";
      field.appendChild(indicator);
      liveIndicators.bmi = indicator;
      inputElement.addEventListener("input", updateBmiIndicator);
    }

    if (feature.name === "LBXGLU") {
      const indicator = createIndicator();
      indicator.id = "glucose-indicator";
      field.appendChild(indicator);
      liveIndicators.glucose = indicator;
      inputElement.addEventListener("input", updateGlucoseIndicator);
    }

    if (feature.name === "BPXSY1") {
      inputElement.addEventListener("input", updateBpIndicator);
    }

    if (feature.name === "BPXDI1") {
      inputElement.addEventListener("input", updateBpIndicator);
      const indicator = createIndicator();
      indicator.id = "bp-indicator";
      field.appendChild(indicator);
      liveIndicators.bp = indicator;
    }

    featuresContainer.appendChild(field);
    inputRefs[feature.name] = inputElement;
  });

  attachModelTooltip();
  refreshIcons();
  updateAllIndicators();
  applyQueuedPredictionInputs();
}

function attachModelTooltip() {
  const modelTooltipBtn = document.querySelector('[data-tooltip-id="model-help"]');
  if (modelTooltipBtn && TOOLTIP_LIBRARY["model-help"]) {
    modelTooltipBtn.dataset.tooltip = TOOLTIP_LIBRARY["model-help"];
  }
  refreshIcons();
}

function showError(message) {
  errorBox.textContent = message || "Сталася помилка під час запиту. Перевірте введені дані та спробуйте ще раз.";
  errorBox.hidden = false;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}

function getFeatureSchema() {
  return metadataCache?.feature_schema ?? [];
}

function collectPayload() {
  const schema = getFeatureSchema();
  const payload = {};
  const missing = [];

  schema.forEach((feature) => {
    const input = inputRefs[feature.name];
    if (!input) return;

    const rawValue = input.value.trim();
    if (!rawValue) {
      if (feature.required) missing.push(feature.description || feature.name);
      return;
    }

    if (feature.name === "RIAGENDR") {
      payload[feature.name] = Number.parseInt(rawValue, 10);
    } else {
      const numeric = Number.parseFloat(rawValue);
      if (Number.isNaN(numeric)) {
        missing.push(feature.description || feature.name);
      } else {
        payload[feature.name] = numeric;
      }
    }
  });

  return { payload, missing };
}

function updateIndicator(indicator, text, level) {
  if (!indicator) return;
  indicator.textContent = text;
  indicator.classList.remove(
    "live-indicator--normal",
    "live-indicator--warning",
    "live-indicator--danger",
    "live-indicator--info",
  );
  if (level) indicator.classList.add(`live-indicator--${level}`);
}

function updateBmiIndicator() {
  const input = inputRefs["BMXBMI"];
  if (!input || !liveIndicators.bmi) return;
  const value = Number.parseFloat(input.value);
  if (Number.isNaN(value)) {
    updateIndicator(liveIndicators.bmi, "—", "info");
    return;
  }

  if (value < 18.5) {
    updateIndicator(liveIndicators.bmi, "Недостатня вага", "warning");
  } else if (value < 25) {
    updateIndicator(liveIndicators.bmi, "Норма", "normal");
  } else if (value < 30) {
    updateIndicator(liveIndicators.bmi, "Надмірна вага", "warning");
  } else {
    updateIndicator(liveIndicators.bmi, "Ожиріння", "danger");
  }
}

function updateGlucoseIndicator() {
  const input = inputRefs["LBXGLU"];
  if (!input || !liveIndicators.glucose) return;
  const value = Number.parseFloat(input.value);
  if (Number.isNaN(value)) {
    updateIndicator(liveIndicators.glucose, "—", "info");
    return;
  }

  if (value < 100) {
    updateIndicator(liveIndicators.glucose, "Норма", "normal");
  } else if (value < 126) {
    updateIndicator(liveIndicators.glucose, "Підвищена (переддіабет)", "warning");
  } else {
    updateIndicator(liveIndicators.glucose, "Можливий діабет", "danger");
  }
}

function updateBpIndicator() {
  const systolic = Number.parseFloat(inputRefs["BPXSY1"]?.value ?? "");
  const diastolic = Number.parseFloat(inputRefs["BPXDI1"]?.value ?? "");
  if (!liveIndicators.bp) return;

  if (Number.isNaN(systolic) || Number.isNaN(diastolic)) {
    updateIndicator(liveIndicators.bp, "—", "info");
    return;
  }

  if (systolic < 120 && diastolic < 80) {
    updateIndicator(liveIndicators.bp, "Норма", "normal");
  } else if (systolic >= 140 || diastolic >= 90) {
    updateIndicator(liveIndicators.bp, "Гіпертонія", "danger");
  } else {
    updateIndicator(liveIndicators.bp, "Передгіпертонія", "warning");
  }
}

function updateAllIndicators() {
  updateBmiIndicator();
  updateGlucoseIndicator();
  updateBpIndicator();
}

function updateRiskBar(probability, bucket) {
  if (!riskBarFill) return;
  const safeProbability = Math.max(0, Math.min(1, probability));
  riskBarFill.style.width = `${(safeProbability * 100).toFixed(2)}%`;
  riskBarFill.className = "risk-bar__fill";
  if (riskClasses[bucket]) {
    riskBarFill.classList.add(riskClasses[bucket]);
  }
}

function renderRisk(probability, bucket) {
  probabilityValue.textContent = `${(probability * 100).toFixed(2)}%`;
  riskBadge.textContent = riskLabels[bucket] || bucket;
  riskBadge.className = `badge ${riskClasses[bucket] || ""}`;
  updateRiskBar(probability, bucket);
}

function renderFactors(factors) {
  if (!factors || factors.length === 0) {
    chartEmpty.hidden = false;
    chartCanvas.hidden = true;
    if (factorsChart) {
      factorsChart.destroy();
      factorsChart = null;
    }
    return;
  }

  chartEmpty.hidden = true;
  chartCanvas.hidden = false;

  const ctx = chartCanvas.getContext("2d");
  const labels = factors.map((item) => {
    const info = factorInfo[item.feature];
    return `${info?.name ?? item.feature} (${item.feature})`;
  });
  const values = factors.map((item) => Number.parseFloat(item.impact));

  if (factorsChart) {
    factorsChart.destroy();
  }

  factorsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Вплив",
          data: values,
          backgroundColor: "rgba(88, 101, 242, 0.75)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const rawFeatureName = factors[context.dataIndex]?.feature;
              const info = factorInfo[rawFeatureName] ?? {};
              const lines = [];
              lines.push(info.name ?? context.label);
              lines.push(`Технічна назва: ${rawFeatureName}`);
              if (info.desc) {
                lines.push(`Пояснення: ${info.desc}`);
              }
              lines.push(`Вплив: ${context.parsed.y.toFixed(3)}`);
              return lines;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#3a3f60" },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#3a3f60" },
        },
      },
    },
  });
}

function storePredictionResult(target, data, payload) {
  if (!target) return;
  const snapshot = {
    ...data,
    target: data.target ?? target,
    inputValues: { ...(payload || {}) },
    savedAt: Date.now(),
    top_factors: Array.isArray(data.top_factors) ? [...data.top_factors] : [],
  };
  predictionStore[target] = snapshot;
  latestPredictionKey = target;
  if (insightsInitialized) {
    renderProfileOverviewChart();
    renderRiskComparisonChart();
    renderInsightsFactorsChart();
  }
}

function animateResultCard() {
  resultCard.classList.remove("glass-card--pop");
  void resultCard.offsetWidth;
  resultCard.classList.add("glass-card--pop");
}

function renderResult(data) {
  renderRisk(data.probability, data.risk_bucket);
  modelName.textContent = data.model_name;
  modelVersion.textContent = data.version;
  resultNote.textContent = data.note || "";
  renderFactors(data.top_factors || []);
  resultCard.hidden = false;
  animateResultCard();
  if (pendingPredictionContext) {
    storePredictionResult(
      pendingPredictionContext.target,
      data,
      pendingPredictionContext.payload,
    );
    pendingPredictionContext = null;
  }
  if (authState.user) {
    loadHistory().catch((error) => console.error("Не вдалося оновити історію після прогнозу:", error));
  }
}

function setApiStatus(isOnline) {
  if (!apiStatusDot || !apiStatusText) return;
  apiStatusDot.classList.remove("status-dot--ok", "status-dot--fail");
  
  const now = new Date();
  const timeString = now.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  
  if (isOnline) {
    apiStatusDot.classList.add("status-dot--ok");
    apiStatusText.textContent = "Підключено до API";
    
  } else {
    apiStatusDot.classList.add("status-dot--fail");
    apiStatusText.textContent = "Відключено від API";
    
  }
}

async function checkApiStatus() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error("Статус API недоступний");
    }
    setApiStatus(true);
  } catch (error) {
    setApiStatus(false);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkApiStatusWithLatency() {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json().catch(() => ({ status: "ok" }));
    return {
      isOnline: true,
      latency,
      httpStatus: response.status,
      data,
      timestamp: new Date(),
    };
  } catch (error) {
    const endTime = performance.now();
    const latency = error.name === "AbortError" ? null : Math.round(endTime - startTime);
    return {
      isOnline: false,
      latency,
      httpStatus: null,
      error: error.message,
      timestamp: new Date(),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function initializeApiStatusPage() {
  const statusDot = document.getElementById("api-status-page-dot");
  const statusText = document.getElementById("api-status-page-status-text");
  const latencyEl = document.getElementById("api-status-latency");
  const httpStatusEl = document.getElementById("api-status-http-status");
  const lastCheckEl = document.getElementById("api-status-last-check");
  const versionEl = document.getElementById("api-status-version");
  const totalRoutesEl = document.getElementById("api-status-total-routes");
  const mainEndpointsEl = document.getElementById("api-status-main-endpoints");
  const routesEl = document.getElementById("api-status-page-routes");
  const refreshBtn = document.getElementById("api-status-refresh-btn");
  
  // Функція для оновлення інтерфейсу
  const updateStatusUI = (result) => {
    if (!statusDot || !statusText) return;
    
    statusDot.classList.remove("status-dot--ok", "status-dot--fail");
    
    if (result.isOnline) {
      statusDot.classList.add("status-dot--ok");
      statusText.textContent = "API працює стабільно";
      
      if (latencyEl) {
        latencyEl.textContent = result.latency ? `${result.latency} ms` : "—";
      }
      if (httpStatusEl) {
        httpStatusEl.textContent = result.httpStatus ? `${result.httpStatus} OK` : "—";
      }
      if (versionEl && result.data?.version) {
        versionEl.textContent = result.data.version;
      }
      if (totalRoutesEl && result.data?.total_routes) {
        totalRoutesEl.textContent = result.data.total_routes;
      }
      if (mainEndpointsEl && result.data?.routes) {
        const mainRoutes = result.data.routes.filter(r => 
          !r.path.includes("{") && 
          (r.path.startsWith("/auth") || r.path.startsWith("/users") || r.path.startsWith("/predict") || r.path === "/health" || r.path === "/metadata")
        );
        mainEndpointsEl.textContent = mainRoutes.length;
      }
      
      if (routesEl && result.data?.routes) {
        const mainRoutes = result.data.routes
          .filter(r => !r.path.includes("{") && r.path !== "/" && r.path !== "/app" && !r.path.includes("/static"))
          .slice(0, 15)
          .map(r => {
            const methods = r.methods?.join(", ") || "";
            return `
              <div class="api-status-page__route-item">
                <div class="api-status-page__route-methods">${methods}</div>
                <div class="api-status-page__route-path">${r.path}</div>
              </div>
            `;
          })
          .join("");
        routesEl.innerHTML = mainRoutes || '<p class="api-status-page__empty">Немає доступних маршрутів</p>';
      }
    } else {
      statusDot.classList.add("status-dot--fail");
      statusText.textContent = "API недоступне";
      
      if (latencyEl) latencyEl.textContent = "—";
      if (httpStatusEl) httpStatusEl.textContent = "—";
      if (versionEl) versionEl.textContent = "—";
      if (totalRoutesEl) totalRoutesEl.textContent = "—";
      if (mainEndpointsEl) mainEndpointsEl.textContent = "—";
      if (routesEl) {
        routesEl.innerHTML = '<p class="api-status-page__empty">API недоступне. Перевірте підключення.</p>';
      }
    }
    
    if (lastCheckEl) {
      const timeString = result.timestamp.toLocaleTimeString("uk-UA", { 
        hour: "2-digit", 
        minute: "2-digit",
        second: "2-digit"
      });
      lastCheckEl.textContent = timeString;
    }
    
    refreshIcons();
  };
  
  // Обробник кнопки "Перевірити знову"
  if (refreshBtn) {
    refreshBtn.onclick = async () => {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<span class="icon" data-lucide="loader-2"></span><span>Перевірка...</span>';
      refreshIcons();
      
      const result = await checkApiStatusWithLatency();
      updateStatusUI(result);
      
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span class="icon" data-lucide="refresh-cw"></span><span>Перевірити знову</span>';
      refreshIcons();
    };
  }
  
  // Виконуємо початкову перевірку
  const result = await checkApiStatusWithLatency();
  updateStatusUI(result);
}

function initializeApiStatus() {
  checkApiStatus();
  apiStatusTimer = setInterval(checkApiStatus, API_STATUS_INTERVAL);
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  currentTheme = nextTheme;
  document.body.classList.remove("theme-light", "theme-dark");
  document.body.classList.add(`theme-${nextTheme}`);
  updateThemeIcon(nextTheme);
  localStorage.setItem("hr_theme", nextTheme);
  refreshIcons();
  refreshDashboardCharts();
}

function toggleTheme() {
  const isDark = document.body.classList.contains("theme-dark");
  const nextTheme = isDark ? "light" : "dark";
  applyTheme(nextTheme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("hr_theme");
  applyTheme(savedTheme === "dark" ? "dark" : "light");
  
  const themeToggleBtn = document.querySelector(".theme-toggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }
}

function activateSection(sectionId) {
  // Оновлюємо заголовок сторінки в хедері
  if (pageTitle && pageTitles[sectionId]) {
    pageTitle.textContent = pageTitles[sectionId];
  }
  
  // Explicitly ensure only one page is active at a time
  // First, remove page--active from ALL pages
  pages.forEach((page) => {
    page.classList.remove("page--active");
  });
  
  // Then add page--active only to the target section
  const targetPage = document.getElementById(sectionId);
  if (targetPage) {
    targetPage.classList.add("page--active");
  }
  
  navItems.forEach((item) => {
    item.classList.toggle("nav-item--active", item.dataset.section === sectionId);
  });
  if (sectionId === "page-insights") {
    initializeInsightsPage().catch((error) => {
      console.error("Не вдалося ініціалізувати діаграми:", error);
    });
  }
  if (sectionId === "page-profile") {
    updateProfileSection();
  }
  if (sectionId === "page-history") {
    // Завантажуємо історію на сторінці історії
    // Перевіряємо чи автентифікація завершена перед завантаженням
    if (authState.initialized) {
      if (authState.token && authState.user) {
        // Якщо історія вже завантажена, просто відображаємо її
        if (authState.history && authState.history.length > 0) {
          renderHistoryTable();
        } else {
          // Завантажуємо історію якщо її немає
          loadHistory(50).catch((error) => {
            console.error("Не вдалося завантажити історію:", error);
            renderHistoryTable(); // Показуємо порожній стан при помилці
          });
        }
      } else {
        renderHistoryTable(); // Показуємо порожній стан для неавтентифікованих
      }
    } else {
      // Якщо автентифікація ще не завершена, просто відображаємо порожній стан
      // activateSection буде викликано знову після завершення initializeAuth
      renderHistoryTable();
    }
  }
  if (sectionId === "page-forgot-password") {
    // Скидаємо стан форми при переході на сторінку відновлення пароля
    resetForgotPasswordForm();
  }
  if (sectionId === "page-api-status") {
    // Завантажуємо та відображаємо інформацію про статус API
    initializeApiStatusPage();
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearError();

  if (!metadataCache) {
    showError("Метадані ще завантажуються, спробуйте пізніше.");
    return;
  }

  const target = targetSelect.value;
  if (!target) {
    showError("Оберіть ціль прогнозування");
    return;
  }

  const { payload, missing } = collectPayload();
  if (missing.length > 0) {
    showError(`Заповніть поля: ${missing.join(", ")}`);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Обробка...";

  try {
    // Формуємо URL з параметрами
    const params = new URLSearchParams({ target });
    if (modelSelect && modelSelect.value && modelSelect.value !== "auto") {
      params.set("model", modelSelect.value);
    }

    // Використовуємо apiFetch замість fetch, щоб передавати токен автентифікації
    // skipAuth = false (за замовчуванням) означає що токен буде передано якщо користувач автентифікований
    // Це дозволяє бекенду зберегти історію для автентифікованих користувачів
    const data = await apiFetch(
      `/predict?${params.toString()}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      { skipAuth: false }, // Передаємо токен якщо користувач автентифікований
    );
    pendingPredictionContext = {
      target,
      payload: { ...payload },
    };
    renderResult(data);
    
    // Оновлюємо історію після успішного прогнозування (для автентифікованих користувачів)
    if (authState.token && authState.user) {
      console.log("✅ Користувач автентифікований, оновлюємо історію...");
      try {
        await loadHistory(50);
        console.log("✅ Історія оновлена:", authState.history?.length || 0, "записів");
        
        // Оновлюємо статистику для діаграм
        historyStatsCache = null; // Скидаємо кеш щоб завантажити оновлені дані
        
        // Оновлюємо діаграми якщо сторінка /diagrams відкрита
        if (insightsInitialized) {
          // Завантажуємо оновлену статистику та оновлюємо діаграми
          loadHistoryStats()
            .then((stats) => {
              if (stats && stats.total_predictions > 0) {
                renderHistoryTimelineChart(stats);
                renderHistoryRiskDistributionChart(stats);
                renderHistoryModelsChart(stats);
              }
            })
            .catch((error) => {
              console.error("Помилка завантаження статистики:", error);
            });
          refreshDashboardCharts();
        }
      } catch (error) {
        console.error("⚠️ Помилка оновлення історії:", error);
      }
    } else {
      console.log("ℹ️ Користувач не автентифікований, історія не зберігається");
    }
  } catch (error) {
    showError(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Розрахувати ризик";
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  const value = Math.random() * (max - min) + min;
  return Number.parseFloat(value.toFixed(decimals));
}

function fillRandomDemoData() {
  if (!metadataCache) {
    showError("Метадані ще завантажуються, спробуйте пізніше.");
    return;
  }

  if (inputRefs["RIDAGEYR"]) inputRefs["RIDAGEYR"].value = randomInt(18, 80);
  if (inputRefs["RIAGENDR"]) inputRefs["RIAGENDR"].value = Math.random() < 0.5 ? "1" : "2";
  if (inputRefs["BMXBMI"]) inputRefs["BMXBMI"].value = randomFloat(18.0, 38.0, 1);
  if (inputRefs["BPXSY1"]) inputRefs["BPXSY1"].value = randomInt(100, 170);
  if (inputRefs["BPXDI1"]) inputRefs["BPXDI1"].value = randomInt(60, 105);
  if (inputRefs["LBXGLU"]) inputRefs["LBXGLU"].value = randomInt(80, 180);
  if (inputRefs["LBXTC"]) inputRefs["LBXTC"].value = randomInt(140, 260);

  updateAllIndicators();
  clearError();
}

async function loadHistoryStats() {
  if (!authState.token || !authState.user) {
    historyStatsCache = null;
    return null;
  }
  try {
    const data = await apiFetch("/users/me/history/stats");
    historyStatsCache = data;
    return data;
  } catch (error) {
    console.error("Не вдалося завантажити статистику історії:", error);
    historyStatsCache = null;
    return null;
  }
}

async function loadAnalyticsData() {
  if (analyticsCache) return analyticsCache;
  if (analyticsLoadError) throw analyticsLoadError;

  try {
    const response = await fetch(`${API_BASE}${ANALYTICS_ENDPOINT}`, {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!response.ok) {
      throw new Error("Не вдалося завантажити статистику вибірки.");
    }
    const data = await response.json();
    analyticsCache = data;
    analyticsLoadError = null;
    updateAnalyticsError(null);
    return data;
  } catch (error) {
    analyticsLoadError = error;
    updateAnalyticsError("Не вдалося завантажити статистику вибірки. Спробуйте пізніше або перевірте наявність файлу analytics_summary.json.");
    throw error;
  }
}

function updateAnalyticsError(message) {
  const el = document.getElementById("analytics-error");
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.hidden = false;
  } else {
    el.textContent = "";
    el.hidden = true;
  }
}

function renderProfileOverviewChart() {
  const canvasId = "profile-overview-chart";
  const empty = document.getElementById("profile-overview-empty");
  const note = document.getElementById("profile-overview-note");

  const latest = getLatestPredictionEntry();
  const inputs = latest?.data?.inputValues ?? null;

  if (!inputs) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (note) {
      note.textContent = "Кольори відображають, чи знаходиться показник у межах норми, попереджувальній або ризиковій зоні.";
    }
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  const metrics = [
    { key: "BMXBMI", label: getFeatureName("BMXBMI"), normal: HEALTH_THRESHOLDS.BMXBMI.normal },
    { key: "BPXSY1", label: getFeatureName("BPXSY1"), normal: HEALTH_THRESHOLDS.BPXSY1.normal },
    { key: "BPXDI1", label: getFeatureName("BPXDI1"), normal: HEALTH_THRESHOLDS.BPXDI1.normal },
    { key: "LBXGLU", label: getFeatureName("LBXGLU"), normal: HEALTH_THRESHOLDS.LBXGLU.normal },
    { key: "LBXTC", label: getFeatureName("LBXTC"), normal: HEALTH_THRESHOLDS.LBXTC.optimal },
  ];

  const labels = [];
  const userValues = [];
  const normalValues = [];
  const barColors = [];
  const meta = [];

  metrics.forEach((metric) => {
    const rawValue = inputs[metric.key];
    if (rawValue === undefined || rawValue === null || rawValue === "") return;
    const numeric = Number.parseFloat(rawValue);
    if (Number.isNaN(numeric)) return;
    const classification = classifyMetric(metric.key, numeric);
    labels.push(metric.label);
    userValues.push(numeric);
    normalValues.push(metric.normal);
    barColors.push(getSeverityColor(classification.level));
    meta.push({
      feature: metric.key,
      classification,
      value: numeric,
    });
  });

  if (labels.length === 0) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  toggleHidden(empty, true);
  toggleChartVisibility(canvasId, true);
  const styles = getChartStyles();

  upsertDashboardChart(canvasId, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Ваш показник",
          data: userValues,
          backgroundColor: barColors,
          borderRadius: 12,
          maxBarThickness: 46,
        },
        {
          label: "Верхня межа норми",
          data: normalValues,
          backgroundColor: styles.accentLight,
          borderRadius: 12,
          maxBarThickness: 46,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: styles.textSecondary },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const info = meta[context.dataIndex];
              if (!info) return context.formattedValue;
              const { classification, feature, value } = info;
              const lines = [];
              lines.push(`${context.dataset.label}: ${formatMetricValue(feature, value)}`);
              lines.push(`Категорія: ${classification.label}`);
              lines.push(classification.explanation);
              const normalDataset = context.chart?.data?.datasets?.[1];
              const normalValue = normalDataset?.data?.[context.dataIndex];
              if (normalValue !== undefined) {
                lines.push(`Норма: ${formatMetricValue(feature, normalValue)}`);
              }
              return lines;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: styles.textSecondary },
          grid: {
            color: styles.gridColor,
          },
        },
        y: {
          beginAtZero: true,
          ticks: { color: styles.textSecondary },
          grid: {
            color: styles.gridColor,
          },
        },
      },
    },
  });

  const summary = meta
    .map((item) => `${getFeatureName(item.feature)} — ${item.classification.label.toLowerCase()}`)
    .join("; ");
  const updated = formatDateTime(latest.data.savedAt) || "щойно";
  if (note) {
    note.textContent = summary
      ? `Оновлено ${updated}: ${summary}.`
      : "Кольори відображають, чи знаходиться показник у межах норми, попереджувальній або ризиковій зоні.";
  }
}

function renderRiskComparisonChart() {
  const canvasId = "model-risks-chart";
  const empty = document.getElementById("model-risks-empty");
  const note = document.getElementById("model-risks-note");
  const styles = getChartStyles();

  const targets = [
    { key: "diabetes_present", label: TARGET_LABELS.diabetes_present },
    { key: "obesity_present", label: TARGET_LABELS.obesity_present },
  ];

  const dataset = targets.map((item) => {
    const prediction = getPrediction(item.key);
    const probability = prediction?.probability;
    const bucket = prediction?.risk_bucket;
    const percentage = percentToDisplay(probability);
    return {
      label: item.label,
      probability,
      percentage,
      bucket,
      available: typeof probability === "number",
      updatedAt: prediction?.savedAt,
    };
  });

  const availableCount = dataset.filter((item) => item.available).length;

  if (availableCount === 0) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (note) {
      note.textContent = "Щойно обидва ризики будуть розраховані, тут з’явиться порівняння.";
    }
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  toggleHidden(empty, true);
  toggleChartVisibility(canvasId, true);

  const dataValues = dataset.map((item) => (item.available ? item.percentage : 0));
  const barColors = dataset.map((item) => (item.available ? styles.accent : "rgba(160, 164, 200, 0.45)"));

  upsertDashboardChart(canvasId, {
    type: "bar",
    data: {
      labels: dataset.map((item) => item.label),
      datasets: [
        {
          label: "Ймовірність, %",
          data: dataValues,
          backgroundColor: barColors,
          borderRadius: 14,
          maxBarThickness: 52,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const info = dataset[context.dataIndex];
              if (!info.available) {
                return `${info.label}: ризик ще не розрахований`;
              }
              const lines = [];
              lines.push(`${info.label}: ${info.percentage.toFixed(2)}%`);
              if (info.bucket && riskLabels[info.bucket]) {
                lines.push(`Категорія: ${riskLabels[info.bucket]}`);
              }
              if (info.updatedAt) {
                lines.push(`Оновлено: ${formatDateTime(info.updatedAt)}`);
              }
              return lines;
            },
          },
        },
      },
      scales: {
        x: {
          max: 100,
          ticks: { color: styles.textSecondary, callback: (value) => `${value}%` },
          grid: { color: styles.gridColor },
        },
        y: {
          ticks: { color: styles.textSecondary },
          grid: { display: false },
        },
      },
    },
  });

  if (note) {
    if (availableCount === targets.length) {
      const highest = [...dataset].sort((a, b) => b.percentage - a.percentage)[0];
      note.textContent = `Зараз найвищий ${highest.label.toLowerCase()} — ${highest.percentage.toFixed(1)}%.`;
    } else {
      note.textContent = "Розрахуйте ще один ризик, щоб побачити повне порівняння.";
    }
  }
}

function renderInsightsFactorsChart() {
  const canvasId = "insights-factors-chart";
  const empty = document.getElementById("insights-factors-empty");
  const latest = getLatestPredictionEntry();
  const factors = latest?.data?.top_factors ?? [];
  if (!factors || factors.length === 0) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  toggleHidden(empty, true);
  toggleChartVisibility(canvasId, true);

  const styles = getChartStyles();
  const labels = [];
  const values = [];
  const meta = [];

  factors.forEach((factor) => {
    const value = Number.parseFloat(factor.impact);
    if (Number.isNaN(value)) return;
    const feature = factor.feature;
    labels.push(`${getFeatureName(feature)} (${feature})`);
    values.push(value);
    meta.push({
      feature,
      value,
    });
  });

  upsertDashboardChart(canvasId, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Вплив фактору",
          data: values,
          backgroundColor: styles.accent,
          borderRadius: 12,
          maxBarThickness: 38,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const info = meta[context.dataIndex];
              const details = [];
              details.push(`${getFeatureName(info.feature)} (${info.feature})`);
              details.push(getFeatureDescription(info.feature));
              details.push(`Вплив: ${info.value.toFixed(3)}`);
              return details;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: styles.textSecondary },
          grid: { color: styles.gridColor },
        },
        y: {
          ticks: { color: styles.textSecondary },
          grid: { display: false },
        },
      },
    },
  });
}

function renderBmiDistributionChart(analytics) {
  const canvasId = "dataset-bmi-chart";
  const data = analytics?.bmi_distribution ?? [];
  if (!data.length) {
    toggleChartVisibility(canvasId, false);
    return;
  }
  const styles = getChartStyles();
  upsertDashboardChart(canvasId, {
    type: "bar",
    data: {
      labels: data.map((item) => item.category),
      datasets: [
        {
          label: "Частка, %",
          data: data.map((item) => item.percentage),
          backgroundColor: data.map(() => styles.accent),
          borderRadius: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const item = data[context.dataIndex];
              return [
                `${item.category}`,
                `Частка: ${item.percentage.toFixed(2)}%`,
                `Кількість людей: ${item.count}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: styles.textSecondary },
          grid: { color: styles.gridColor },
        },
        y: {
          beginAtZero: true,
          ticks: { color: styles.textSecondary, callback: (value) => `${value}%` },
          grid: { color: styles.gridColor },
        },
      },
    },
  });
}

function renderBpDistributionChart(analytics) {
  const canvasId = "dataset-bp-chart";
  const data = analytics?.bp_distribution ?? [];
  if (!data.length) {
    toggleChartVisibility(canvasId, false);
    return;
  }
  const colors = [
    "rgba(63, 194, 114, 0.85)",
    "rgba(245, 182, 73, 0.85)",
    "rgba(241, 150, 94, 0.85)",
    "rgba(241, 94, 111, 0.85)",
  ];
  upsertDashboardChart(canvasId, {
    type: "doughnut",
    data: {
      labels: data.map((item) => item.category),
      datasets: [
        {
          label: "Частка, %",
          data: data.map((item) => item.percentage),
          backgroundColor: colors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label(context) {
              const info = data[context.dataIndex];
              return `${info.category}: ${info.percentage.toFixed(2)}% (${info.count} осіб)`;
            },
          },
        },
      },
    },
  });
}

function renderCholDistributionChart(analytics) {
  const canvasId = "dataset-chol-chart";
  const data = analytics?.cholesterol_distribution ?? [];
  if (!data.length) {
    toggleChartVisibility(canvasId, false);
    return;
  }
  const styles = getChartStyles();
  upsertDashboardChart(canvasId, {
    type: "bar",
    data: {
      labels: data.map((item) => item.category),
      datasets: [
        {
          label: "Частка, %",
          data: data.map((item) => item.percentage),
          backgroundColor: styles.accentAlt,
          borderRadius: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const info = data[context.dataIndex];
              return `${info.category}: ${info.percentage.toFixed(2)}% (${info.count} осіб)`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: styles.textSecondary },
          grid: { color: styles.gridColor },
        },
        y: {
          beginAtZero: true,
          ticks: { color: styles.textSecondary, callback: (value) => `${value}%` },
          grid: { color: styles.gridColor },
        },
      },
    },
  });
}

function renderGlucoseDistributionChart(analytics) {
  const canvasId = "dataset-glucose-chart";
  const empty = document.getElementById("dataset-glucose-empty");
  const data = analytics?.glucose_distribution ?? [];
  if (!data.length) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }
  toggleHidden(empty, true);
  toggleChartVisibility(canvasId, true);
  const styles = getChartStyles();
  upsertDashboardChart(canvasId, {
    type: "bar",
    data: {
      labels: data.map((item) => item.category),
      datasets: [
        {
          label: "Частка, %",
          data: data.map((item) => item.percentage),
          backgroundColor: ["rgba(63, 194, 114, 0.85)", "rgba(245, 182, 73, 0.85)", "rgba(241, 94, 111, 0.85)"],
          borderRadius: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const info = data[context.dataIndex];
              return `${info.category}: ${info.percentage.toFixed(2)}% (${info.count} осіб)`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: styles.textSecondary },
          grid: { color: styles.gridColor },
        },
        y: {
          beginAtZero: true,
          ticks: { color: styles.textSecondary, callback: (value) => `${value}%` },
          grid: { color: styles.gridColor },
        },
      },
    },
  });
}

function renderAgePrevalenceChart(analytics, key, canvasId) {
  const data = analytics?.[key] ?? [];
  if (!data.length) {
    toggleChartVisibility(canvasId, false);
    return;
  }
  const styles = getChartStyles();
  upsertDashboardChart(canvasId, {
    type: "line",
    data: {
      labels: data.map((item) => item.age_group),
      datasets: [
        {
          label: "Частка, %",
          data: data.map((item) => item.prevalence),
          borderColor: styles.accent,
          backgroundColor: "rgba(88, 101, 242, 0.15)",
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const info = data[context.dataIndex];
              return `${info.age_group}: ${info.prevalence.toFixed(2)}% (${info.count} осіб)`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: styles.textSecondary },
          grid: { color: styles.gridColor },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: styles.textSecondary, callback: (value) => `${value}%` },
          grid: { color: styles.gridColor },
        },
      },
    },
  });
}

function renderCorrelationChart(analytics) {
  const canvasId = "dataset-correlation-chart";
  const empty = document.getElementById("dataset-correlation-empty");
  const matrix = analytics?.correlation_matrix ?? null;
  if (!matrix) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  const pairs = [];
  const features = Object.keys(matrix);
  features.forEach((source, i) => {
    features.forEach((target, j) => {
      if (j <= i) return;
      const value = matrix[source]?.[target];
      if (value === null || value === undefined) return;
      pairs.push({
        label: `${getFeatureName(source)} ↔ ${getFeatureName(target)}`,
        value,
      });
    });
  });

  if (!pairs.length) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  toggleHidden(empty, true);
  toggleChartVisibility(canvasId, true);
  const styles = getChartStyles();

  upsertDashboardChart(canvasId, {
    type: "bar",
    data: {
      labels: pairs.map((item) => item.label),
      datasets: [
        {
          label: "Коефіцієнт кореляції",
          data: pairs.map((item) => item.value),
          backgroundColor: pairs.map((item) => (item.value >= 0 ? styles.accent : "rgba(241, 94, 111, 0.75)")),
          borderRadius: 10,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const pair = pairs[context.dataIndex];
              return `${pair.label}: ${pair.value.toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        x: {
          min: -1,
          max: 1,
          ticks: { color: styles.textSecondary },
          grid: { color: styles.gridColor },
        },
        y: {
          ticks: { color: styles.textSecondary },
          grid: { display: false },
        },
      },
    },
  });
}

function renderHistoryTimelineChart(stats) {
  const canvasId = "history-timeline-chart";
  const empty = document.getElementById("history-timeline-empty");
  
  if (!stats || !stats.time_series || stats.time_series.length === 0) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  toggleHidden(empty, true);
  toggleChartVisibility(canvasId, true);

  const styles = getChartStyles();
  const timeSeries = stats.time_series || [];
  
  // Групуємо дані по цілях
  const dataByTarget = {
    diabetes_present: [],
    obesity_present: [],
  };

  timeSeries.forEach((entry) => {
    const date = new Date(entry.date);
    const probability = entry.probability * 100; // Перетворюємо у відсотки
    if (entry.target === "diabetes_present") {
      dataByTarget.diabetes_present.push({ x: date, y: probability });
    } else if (entry.target === "obesity_present") {
      dataByTarget.obesity_present.push({ x: date, y: probability });
    }
  });

  // Сортуємо дані по даті для кожної цілі
  Object.keys(dataByTarget).forEach((target) => {
    dataByTarget[target].sort((a, b) => a.x - b.x);
  });

  const datasets = [];
  if (dataByTarget.diabetes_present.length > 0) {
    datasets.push({
      label: TARGET_LABELS.diabetes_present,
      data: dataByTarget.diabetes_present.map((item) => ({ x: item.x, y: item.y })),
      borderColor: "rgba(116, 137, 255, 0.95)",
      backgroundColor: "rgba(116, 137, 255, 0.2)",
      tension: 0.4,
      fill: false,
    });
  }
  if (dataByTarget.obesity_present.length > 0) {
    datasets.push({
      label: TARGET_LABELS.obesity_present,
      data: dataByTarget.obesity_present.map((item) => ({ x: item.x, y: item.y })),
      borderColor: "rgba(241, 94, 111, 0.95)",
      backgroundColor: "rgba(241, 94, 111, 0.2)",
      tension: 0.4,
      fill: false,
    });
  }

  // Об'єднуємо всі унікальні дати для labels
  const allDates = new Set();
  Object.values(dataByTarget).forEach((entries) => {
    entries.forEach((entry) => {
      allDates.add(entry.x.toISOString().split("T")[0]); // Беремо тільки дату
    });
  });
  const sortedDates = Array.from(allDates).sort();
  
  // Створюємо labels у форматі "dd.MM.yyyy"
  const labels = sortedDates.map((dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  });

  // Створюємо дані для кожної цілі, вирівнюючи по датах
  const processedDatasets = [];
  if (dataByTarget.diabetes_present.length > 0) {
    const data = sortedDates.map((dateStr) => {
      const entry = dataByTarget.diabetes_present.find((e) => e.x.toISOString().split("T")[0] === dateStr);
      return entry ? entry.y : null;
    });
    processedDatasets.push({
      label: TARGET_LABELS.diabetes_present,
      data,
      borderColor: "rgba(116, 137, 255, 0.95)",
      backgroundColor: "rgba(116, 137, 255, 0.2)",
      tension: 0.4,
      fill: false,
      spanGaps: true,
    });
  }
  if (dataByTarget.obesity_present.length > 0) {
    const data = sortedDates.map((dateStr) => {
      const entry = dataByTarget.obesity_present.find((e) => e.x.toISOString().split("T")[0] === dateStr);
      return entry ? entry.y : null;
    });
    processedDatasets.push({
      label: TARGET_LABELS.obesity_present,
      data,
      borderColor: "rgba(241, 94, 111, 0.95)",
      backgroundColor: "rgba(241, 94, 111, 0.2)",
      tension: 0.4,
      fill: false,
      spanGaps: true,
    });
  }

  upsertDashboardChart(canvasId, {
    type: "line",
    data: {
      labels,
      datasets: processedDatasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: styles.textSecondary },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label(context) {
              if (context.parsed.y === null) return null;
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: styles.textSecondary,
            maxRotation: 45,
            minRotation: 45,
          },
          grid: { color: styles.gridColor },
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            color: styles.textSecondary,
            callback: (value) => `${value}%`,
          },
          grid: { color: styles.gridColor },
        },
      },
    },
  });
}

function renderHistoryRiskDistributionChart(stats) {
  const canvasId = "history-risk-distribution-chart";
  const empty = document.getElementById("history-risk-distribution-empty");
  
  if (!stats || !stats.by_target_and_risk) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  const byTargetAndRisk = stats.by_target_and_risk || {};
  const riskBuckets = ["low", "medium", "high"];
  const riskLabelsMap = {
    low: "Низький",
    medium: "Помірний",
    high: "Високий",
  };
  const riskColors = {
    low: "rgba(63, 194, 114, 0.85)",
    medium: "rgba(245, 182, 73, 0.85)",
    high: "rgba(241, 94, 111, 0.85)",
  };

  const targets = ["diabetes_present", "obesity_present"];
  const labels = targets.map((target) => TARGET_LABELS[target] || target);
  
  const datasets = riskBuckets.map((bucket) => {
    const data = targets.map((target) => {
      const key = `${target}:${bucket}`;
      return byTargetAndRisk[key] || 0;
    });
    return {
      label: riskLabelsMap[bucket],
      data,
      backgroundColor: riskColors[bucket],
      borderRadius: 12,
    };
  });

  const totalCount = targets.reduce((sum, target) => {
    return sum + riskBuckets.reduce((s, bucket) => {
      const key = `${target}:${bucket}`;
      return s + (byTargetAndRisk[key] || 0);
    }, 0);
  }, 0);

  if (totalCount === 0) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  toggleHidden(empty, true);
  toggleChartVisibility(canvasId, true);
  const styles = getChartStyles();

  upsertDashboardChart(canvasId, {
    type: "bar",
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: styles.textSecondary },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const datasetLabel = context.dataset.label;
              const value = context.parsed.y;
              return `${datasetLabel}: ${value} прогноз${value === 1 ? "" : value < 5 ? "и" : "ів"}`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: styles.textSecondary },
          grid: { color: styles.gridColor },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            color: styles.textSecondary,
            stepSize: 1,
            callback: (value) => Math.floor(value) === value ? value : "",
          },
          grid: { color: styles.gridColor },
        },
      },
    },
  });
}

function renderHistoryModelsChart(stats) {
  const canvasId = "history-models-chart";
  const empty = document.getElementById("history-models-empty");
  
  if (!stats || !stats.by_model || Object.keys(stats.by_model).length === 0) {
    toggleChartVisibility(canvasId, false);
    toggleHidden(empty, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
    return;
  }

  const byModel = stats.by_model || {};
  const modelLabels = {
    auto: "Автоматично (чемпіон)",
    logreg: "Логістична регресія",
    random_forest: "Random Forest",
    xgb: "XGBoost",
    svm: "SVM",
    knn: "K-Nearest Neighbors",
    mlp: "Нейромережа (MLP)",
    unknown: "Невідомо",
  };

  const labels = Object.keys(byModel).map((key) => modelLabels[key] || key);
  const data = Object.values(byModel);
  const colors = [
    "rgba(116, 137, 255, 0.85)",
    "rgba(96, 244, 255, 0.85)",
    "rgba(63, 194, 114, 0.85)",
    "rgba(245, 182, 73, 0.85)",
    "rgba(241, 94, 111, 0.85)",
    "rgba(139, 92, 246, 0.85)",
    "rgba(236, 72, 153, 0.85)",
    "rgba(168, 85, 247, 0.85)",
  ];

  toggleHidden(empty, true);
  toggleChartVisibility(canvasId, true);
  const styles = getChartStyles();

  upsertDashboardChart(canvasId, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: styles.textSecondary,
            padding: 12,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

function renderAllAnalyticsCharts(analytics) {
  if (!analytics) return;
  renderBmiDistributionChart(analytics);
  renderBpDistributionChart(analytics);
  renderCholDistributionChart(analytics);
  renderGlucoseDistributionChart(analytics);
  renderAgePrevalenceChart(analytics, "diabetes_prevalence_age", "dataset-diabetes-age-chart");
  renderAgePrevalenceChart(analytics, "obesity_prevalence_age", "dataset-obesity-age-chart");
  renderCorrelationChart(analytics);
}

async function initializeInsightsPage() {
  if (insightsInitialized) {
    refreshDashboardCharts();
    return;
  }

  renderProfileOverviewChart();
  renderRiskComparisonChart();
  renderInsightsFactorsChart();

  // Завантажуємо статистику історії для автентифікованих користувачів
  if (authState.token && authState.user) {
    try {
      const historyStats = await loadHistoryStats();
      if (historyStats && historyStats.total_predictions > 0) {
        renderHistoryTimelineChart(historyStats);
        renderHistoryRiskDistributionChart(historyStats);
        renderHistoryModelsChart(historyStats);
      } else {
        // Показуємо порожні стани для діаграм історії
        showHistoryChartsEmptyState();
      }
    } catch (error) {
      console.warn("Не вдалося завантажити статистику історії:", error);
      showHistoryChartsEmptyState();
    }
  } else {
    showHistoryChartsEmptyState();
  }

  try {
    const analytics = await loadAnalyticsData();
    renderAllAnalyticsCharts(analytics);
  } catch (error) {
    console.warn("Аналітика недоступна:", error);
  }

  insightsInitialized = true;
}

function refreshDashboardCharts() {
  renderProfileOverviewChart();
  renderRiskComparisonChart();
  renderInsightsFactorsChart();
  if (analyticsCache) {
    renderAllAnalyticsCharts(analyticsCache);
  }
  // Оновлюємо діаграми історії якщо є дані
  if (historyStatsCache && historyStatsCache.total_predictions > 0) {
    renderHistoryTimelineChart(historyStatsCache);
    renderHistoryRiskDistributionChart(historyStatsCache);
    renderHistoryModelsChart(historyStatsCache);
  } else if (authState.token && authState.user) {
    // Якщо користувач автентифікований але немає даних - завантажуємо
    loadHistoryStats().then((stats) => {
      if (stats && stats.total_predictions > 0) {
        renderHistoryTimelineChart(stats);
        renderHistoryRiskDistributionChart(stats);
        renderHistoryModelsChart(stats);
      } else {
        showHistoryChartsEmptyState();
      }
    });
  } else {
    showHistoryChartsEmptyState();
  }
}

function showHistoryChartsEmptyState() {
  const emptyStates = [
    document.getElementById("history-timeline-empty"),
    document.getElementById("history-risk-distribution-empty"),
    document.getElementById("history-models-empty"),
  ];
  emptyStates.forEach((empty) => {
    if (empty) {
      empty.hidden = false;
    }
  });
  // Ховаємо canvas
  const canvasIds = ["history-timeline-chart", "history-risk-distribution-chart", "history-models-chart"];
  canvasIds.forEach((canvasId) => {
    toggleChartVisibility(canvasId, false);
    if (dashboardCharts[canvasId]) {
      dashboardCharts[canvasId].destroy();
      delete dashboardCharts[canvasId];
    }
  });
}

function registerEventListeners() {
  // Only add listeners for prediction form if it exists (not on auth pages)
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  if (demoButton) {
    demoButton.addEventListener("click", fillRandomDemoData);
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      // Перевіряємо, чи кнопка заблокована
      if (item.disabled || item.classList.contains("nav-item--disabled")) {
        // Якщо користувач не автентифікований і намагається перейти на захищену сторінку
        const sectionId = item.dataset.section;
        const protectedSections = ["page-profile", "page-history", "page-insights", "page-form"];
        if (protectedSections.includes(sectionId)) {
          // Перенаправляємо на сторінку входу
          pendingRouteAfterAuth = SECTION_TO_ROUTE[sectionId] || "/app";
          navigateTo("/login");
        }
        return;
      }
      
      const sectionId = item.dataset.section;
      const route = SECTION_TO_ROUTE[sectionId] || "/app";
      navigateTo(route);
    });
  });

  if (userPanelLoginBtn) {
    userPanelLoginBtn.addEventListener("click", openLoginPage);
  }
  if (userPanelRegisterBtn) {
    userPanelRegisterBtn.addEventListener("click", openRegisterPage);
  }
  if (profileLoginShortcut) {
    profileLoginShortcut.addEventListener("click", openLoginPage);
  }
  if (profileRegisterShortcut) {
    profileRegisterShortcut.addEventListener("click", openRegisterPage);
  }
  // Обробники для посилання на історію з профілю
  const profileHistoryLinkBtn = document.getElementById("profile-history-link-btn");
  if (profileHistoryLinkBtn) {
    profileHistoryLinkBtn.addEventListener("click", () => {
      navigateTo("/history");
    });
  }
  // Обробники для сторінки історії
  const historyLoginShortcut = document.getElementById("history-login-shortcut");
  const historyRegisterShortcut = document.getElementById("history-register-shortcut");
  if (historyLoginShortcut) {
    historyLoginShortcut.addEventListener("click", openLoginPage);
  }
  if (historyRegisterShortcut) {
    historyRegisterShortcut.addEventListener("click", openRegisterPage);
  }
  if (toRegisterLink) {
    toRegisterLink.addEventListener("click", openRegisterPage);
  }
  if (toLoginLink) {
    toLoginLink.addEventListener("click", openLoginPage);
  }
  // Обробник кліку на аватар - перехід на профіль
  if (userAvatarBtn) {
    userAvatarBtn.addEventListener("click", () => {
      navigateTo("/profile");
    });
  }
  
  // Обробник кліку на кнопку виходу
  if (userLogoutBtn) {
    userLogoutBtn.addEventListener("click", () => {
      handleLogout();
    });
  }
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
  }
  // Обробники табів профілю
  if (profileTabs) {
    profileTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabName = tab.dataset.tab;
        if (tabName) {
          switchProfileTab(tabName);
        }
      });
    });
  }
  
  // Обробник кнопки "Скасувати"
  if (profileEditCancelBtn) {
    profileEditCancelBtn.addEventListener("click", () => {
      // Повертаємо значення до оригінальних
      if (originalProfileData) {
        if (profileEditFirstNameInput) profileEditFirstNameInput.value = originalProfileData.first_name;
        if (profileEditLastNameInput) profileEditLastNameInput.value = originalProfileData.last_name;
        if (profileEditDateOfBirthInput) profileEditDateOfBirthInput.value = originalProfileData.date_of_birth;
        if (profileEditGenderSelect) profileEditGenderSelect.value = originalProfileData.gender;
        if (profileEditAvatarColorInput) profileEditAvatarColorInput.value = originalProfileData.avatar_color;
      }
      
      // Ховаємо кнопки дій
      hideProfileFormActions();
      setProfileStatus("");
    });
  }
  
  // Відстежуємо зміни в полях форми профілю
  const profileFormInputs = [
    profileEditFirstNameInput,
    profileEditLastNameInput,
    profileEditDateOfBirthInput,
    profileEditGenderSelect,
    profileEditAvatarColorInput,
  ];
  
  profileFormInputs.forEach((input) => {
    if (input) {
      input.addEventListener("input", checkProfileFormChanges);
      input.addEventListener("change", checkProfileFormChanges);
    }
  });
  
  // Обробники inline кнопок аватару
  if (profileAvatarUploadBtnInline) {
    profileAvatarUploadBtnInline.addEventListener("click", () => {
      if (avatarUploadInput) {
        avatarUploadInput.click();
      }
    });
  }
  
  if (profileAvatarResetBtnInline) {
    profileAvatarResetBtnInline.addEventListener("click", () => {
      handleAvatarReset();
    });
  }
  
  // Оновлюємо видимість inline кнопок аватару
  if (authState.user) {
    updateAvatarButtons();
  }
  
  if (profileUpdateForm) {
    profileUpdateForm.addEventListener("submit", handleProfileUpdate);
  }
  if (profilePasswordForm) {
    profilePasswordForm.addEventListener("submit", handlePasswordChange);
  }
  if (avatarUploadInput) {
    avatarUploadInput.addEventListener("change", handleAvatarUpload);
  }
  if (avatarUploadBtn) {
    avatarUploadBtn.addEventListener("click", () => {
      if (avatarUploadInput) {
        avatarUploadInput.click();
      }
    });
  }
  if (avatarResetBtn) {
    avatarResetBtn.addEventListener("click", handleAvatarReset);
  }
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", openForgotPasswordPage);
  }
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", handleForgotPassword);
  }
  if (forgotToLoginLink) {
    forgotToLoginLink.addEventListener("click", () => {
      resetForgotPasswordForm();
      navigateTo("/login");
    });
  }
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", handleResetPassword);
  }
  if (historyTableBody) {
    historyTableBody.addEventListener("click", handleHistoryTableClick);
  }
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", openDeleteAccountModal);
  }
  if (deleteAccountCancelBtn) {
    deleteAccountCancelBtn.addEventListener("click", closeDeleteAccountModal);
  }
  if (deleteAccountConfirmBtn) {
    deleteAccountConfirmBtn.addEventListener("click", handleDeleteAccount);
  }
  if (deleteAccountModalBackdrop) {
    deleteAccountModalBackdrop.addEventListener("click", (event) => {
      // Закриваємо модальне вікно при кліку на backdrop
      if (event.target === deleteAccountModalBackdrop) {
        closeDeleteAccountModal();
      }
    });
  }
  // Обробники для user menu видалені - більше не потрібні

  // Обробник кліку на статус API для переходу на сторінку статусу
  const apiStatusElement = document.getElementById("api-status");
  if (apiStatusElement) {
    apiStatusElement.addEventListener("click", (e) => {
      navigateTo("/api-status");
    });
    // Додаємо курсор pointer для індикації, що елемент клікабельний
    apiStatusElement.style.cursor = "pointer";
  }
  
  // Обробник кліку на лого для переходу на головну сторінку
  const sidebarLogo = document.querySelector(".sidebar__logo");
  if (sidebarLogo) {
    sidebarLogo.addEventListener("click", () => {
      // Якщо користувач залогінений - на профіль, інакше - на логін
      // Перевіряємо чи автентифікація ініціалізована перед перевіркою стану
      if (authState.initialized && authState.user) {
        navigateTo("/profile");
      } else {
        navigateTo("/login");
      }
    });
  }
  
  // Обробник згортання/розгортання sidebar
  initializeSidebarToggle();
  
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("popstate", () => syncRouteFromLocation());
}

function initializeSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const layout = document.querySelector(".layout");
  
  if (!sidebar || !sidebarToggle || !layout) return;
  
  // Відновлюємо стан з localStorage
  const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
  const isCollapsed = savedState === "true";
  
  if (isCollapsed) {
    sidebar.classList.add("sidebar--collapsed");
    layout.classList.add("layout--sidebar-collapsed");
    // Оновлюємо іконку
    const icon = sidebarToggle.querySelector(".icon");
    if (icon) {
      icon.setAttribute("data-lucide", "panel-left-open");
      lucide.createIcons();
    }
  }
  
  // Обробник кліку на кнопку перемикання
  sidebarToggle.addEventListener("click", () => {
    const isCurrentlyCollapsed = sidebar.classList.contains("sidebar--collapsed");
    
    if (isCurrentlyCollapsed) {
      // Розгортаємо sidebar
      sidebar.classList.remove("sidebar--collapsed");
      layout.classList.remove("layout--sidebar-collapsed");
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "false");
      // Змінюємо іконку
      const icon = sidebarToggle.querySelector(".icon");
      if (icon) {
        icon.setAttribute("data-lucide", "panel-left-close");
        lucide.createIcons();
      }
    } else {
      // Згортаємо sidebar
      sidebar.classList.add("sidebar--collapsed");
      layout.classList.add("layout--sidebar-collapsed");
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "true");
      // Змінюємо іконку
      const icon = sidebarToggle.querySelector(".icon");
      if (icon) {
        icon.setAttribute("data-lucide", "panel-left-open");
        lucide.createIcons();
      }
    }
  });
}

(function init() {
  // Включаємо transitions після повного завантаження DOM
  // Використовуємо requestAnimationFrame для забезпечення відображення DOM перед видаленням класу preload
  // Подвійний requestAnimationFrame забезпечує, що браузер завершив перший рендер
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Клас preload вже є в HTML, просто видаляємо його після рендерингу
      document.body.classList.remove("preload");
    });
  });
  
  refreshIcons();
  initializeTheme();
  // Ensure user menu is hidden on initialization
  // Ініціалізація user menu видалена - більше не потрібна
  initializeAuth().catch((error) => console.error("Помилка під час ініціалізації аутентифікації:", error));
  initializeApiStatus();
  registerEventListeners();
  fetchMetadata();
})();
