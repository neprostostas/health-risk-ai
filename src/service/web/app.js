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
let assistantSelectedPredictionId = null;
let assistantLatestPredictionId = null;

// Bulk selection state for history
let historyBulkMode = false;
let historySelectedIds = new Set();
let historyViewMode = localStorage.getItem("hr_history_view") === "grid" ? "grid" : "list";
function getAssistantSelectionKeys() {
  const userId = authState?.user?.id || "guest";
  return {
    selectedKey: `hr_assistant_selected_prediction_${userId}`,
    latestTsKey: `hr_assistant_latest_ts_${userId}`,
  };
}

function saveAssistantSelectedPrediction(id) {
  const { selectedKey } = getAssistantSelectionKeys();
  try {
    if (id == null) {
      localStorage.removeItem(selectedKey);
    } else {
      localStorage.setItem(selectedKey, String(id));
    }
  } catch {}
}

function loadAssistantSelectedPrediction() {
  const { selectedKey } = getAssistantSelectionKeys();
  try {
    const v = localStorage.getItem(selectedKey);
    if (!v) return null;
    const num = Number(v);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

function saveAssistantLatestTimestamp(ts) {
  const { latestTsKey } = getAssistantSelectionKeys();
  try {
    if (ts == null) {
      localStorage.removeItem(latestTsKey);
    } else {
      localStorage.setItem(latestTsKey, String(ts));
    }
  } catch {}
}

function loadAssistantLatestTimestamp() {
  const { latestTsKey } = getAssistantSelectionKeys();
  try {
    const v = localStorage.getItem(latestTsKey);
    if (!v) return null;
    const num = Number(v);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

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
  "/assistant": "page-assistant",
  "/chats": "page-chats",
  "/reports": "page-report",
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
  "page-assistant": "/assistant",
  "page-chats": "/chats",
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
const generateReportBtn = document.getElementById("generate-report-btn");
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
const avatarDeleteBtn = document.getElementById("avatar-delete-btn");
const avatarColorBtn = document.getElementById("avatar-color-btn");
const avatarColorInput = document.getElementById("avatar-color-input");
const profileHistoryContainer = document.getElementById("profile-history");
const historyContent = document.getElementById("history-content");
const historyTableWrapper = document.getElementById("history-table-wrapper");
const deleteAccountBtn = document.getElementById("delete-account-btn");
const deleteAccountModal = document.getElementById("delete-account-modal");
const deleteAccountModalBackdrop = document.getElementById("delete-account-modal-backdrop");
const deleteAccountCancelBtn = document.getElementById("delete-account-cancel-btn");
const deleteAccountConfirmBtn = document.getElementById("delete-account-confirm-btn");
const deleteAccountError = document.getElementById("delete-account-error");
const deleteHistoryModal = document.getElementById("delete-history-modal");
const deleteHistoryModalBackdrop = document.getElementById("delete-history-modal-backdrop");
const deleteHistoryCancelBtn = document.getElementById("delete-history-cancel-btn");
const deleteHistoryConfirmBtn = document.getElementById("delete-history-confirm-btn");
const deleteAvatarModal = document.getElementById("delete-avatar-modal");
const deleteAvatarModalBackdrop = document.getElementById("delete-avatar-modal-backdrop");
const deleteAvatarCancelBtn = document.getElementById("delete-avatar-cancel-btn");
const deleteAvatarConfirmBtn = document.getElementById("delete-avatar-confirm-btn");
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
  "page-report": "Звіти",
  "page-profile": "Профіль",
  "page-history": "Історія прогнозів",
  "page-api-status": "Статус API",
  "page-login": "Вхід до облікового запису",
  "page-register": "Створення облікового запису",
  "page-forgot-password": "Відновлення пароля",
  "page-reset-password": "Встановлення нового пароля",
  "page-assistant": "Чат з асистентом",
  "page-chats": "Чати",
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
Нейромережа (MLP) — виявляє складні нелінійні взаємозв'язки.`,
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

// ========= Assistant Page Logic =========
let assistantInitialized = false;
let assistantTypingEl = null;
let assistantTypingTimer = null;
let assistantTypingDots = 0;

// Голосовий ввід (Web Speech API)
let voiceRecognition = null;
let voiceRecording = false;
let voiceManualStop = false;
let voiceRestartTimer = null;

function setAssistantVoiceButton(mode) {
  // mode: "mic" | "stop"
  const btn = document.getElementById("assistant-voice-btn");
  if (!btn) return;
  const icon = btn.querySelector(".icon");
  if (mode === "stop") {
    btn.setAttribute("aria-label", "Зупинити запис");
    btn.setAttribute("data-tooltip", "Зупинити запис");
    if (icon) icon.setAttribute("data-lucide", "square");
  } else {
    btn.setAttribute("aria-label", "Голосовий ввід");
    btn.setAttribute("data-tooltip", "Голосовий ввід");
    if (icon) icon.setAttribute("data-lucide", "mic");
  }
  refreshIcons();
}

// Відкрити модалку групового видалення
function openBulkDeleteHistoryModal() {
  const modal = document.getElementById("bulk-delete-history-modal");
  const msg = document.getElementById("bulk-delete-history-message");
  if (!modal || !msg) return;
  // Якщо режим all — беремо всю кількість, інакше — вибрані
  const mode = modal.dataset.mode || "selected";
  const count = mode === "all" ? (authState.history?.length || 0) : historySelectedIds.size;
  msg.textContent =
    mode === "all"
      ? `Ви впевнені, що хочете видалити всі ${count} ${declineUAPredictions(count)}?`
      : `Ви впевнені, що хочете видалити ${count} ${declineUAPredictions(count)}?`;
  modal.removeAttribute("hidden");
  modal.hidden = false;
  lucide.createIcons();
}

function closeBulkDeleteHistoryModal() {
  const modal = document.getElementById("bulk-delete-history-modal");
  if (!modal) return;
  modal.setAttribute("hidden", "");
  modal.hidden = true;
}

function declineUAPredictions(n) {
  // просте відмінювання слова "прогноз"
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return "прогнозів";
  if (n1 > 1 && n1 < 5) return "прогнози";
  if (n1 === 1) return "прогноз";
  return "прогнозів";
}

async function deleteSelectedHistory() {
  if (historySelectedIds.size === 0) return;
  const ids = Array.from(historySelectedIds);
  for (const id of ids) {
    try {
      await apiFetch(`/users/me/history/${id}`, { method: "DELETE" });
      authState.history = authState.history.filter((item) => item.id !== id);
    } catch (e) {
    }
  }
  historySelectedIds.clear();
  renderHistoryTable();
  showNotification({
    type: "success",
    title: "Історію оновлено",
    message: "Вибрані прогнози видалено.",
    duration: 2500,
  });
}

async function deleteAllHistory() {
  if (!authState.history || authState.history.length === 0) return;
  const ids = authState.history.map((x) => x.id);
  for (const id of ids) {
    try {
      await apiFetch(`/users/me/history/${id}`, { method: "DELETE" });
    } catch (e) {
    }
  }
  authState.history = [];
  historySelectedIds.clear();
  renderHistoryTable();
  showNotification({
    type: "success",
    title: "Історію очищено",
    message: "Всі прогнози видалено.",
    duration: 2500,
  });
}

function initVoiceInput() {
  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const voiceBtn = document.getElementById("assistant-voice-btn");
      if (voiceBtn) voiceBtn.hidden = true;
      return false;
    }
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.lang = "uk-UA";
    voiceRecognition.interimResults = true;
    // Безперервний режим: не зупинятись після фрази/паузи
    voiceRecognition.continuous = true;
    voiceRecognition.maxAlternatives = 1;
    const restartVoiceIfNeeded = () => {
      if (voiceManualStop) return;
      try {
        if (voiceRestartTimer) {
          clearTimeout(voiceRestartTimer);
          voiceRestartTimer = null;
        }
        // Невелика затримка, щоб уникнути циклів помилок
        voiceRestartTimer = setTimeout(() => {
          try {
            voiceRecognition.continuous = true; // повторно встановлюємо
            voiceRecognition.start();
          } catch {
            // ігноруємо повторні помилки старту
          }
        }, 120);
      } catch {}
    };
    voiceRecognition.onstart = () => {
      voiceRecording = true;
      voiceManualStop = false;
      setAssistantVoiceButton("stop");
      showNotification({
        type: "info",
        title: "Голосовий ввід",
        message: "Говоріть... Натисніть квадрат, щоб зупинити.",
        duration: 1500,
      });
    };
    voiceRecognition.onerror = (event) => {
      // Якщо це не ручна зупинка і помилка не NotAllowed — пробуємо перезапустити
      if (!voiceManualStop && event?.error && event.error !== "not-allowed") {
        restartVoiceIfNeeded();
      } else {
        voiceRecording = false;
        setAssistantVoiceButton("mic");
        showNotification({
          type: "error",
          title: "Помилка мікрофона",
          message: event.error || "Не вдалося розпізнати голос.",
          duration: 2500,
        });
      }
    };
    voiceRecognition.onend = () => {
      // Якщо користувач не тиснув «стоп» – перезапускаємо запис (щоб не зупинятись при паузі)
      if (!voiceManualStop) {
        restartVoiceIfNeeded();
        return;
      }
      // Завершення по користувачу
      voiceRecording = false;
      voiceManualStop = false;
      setAssistantVoiceButton("mic");
    };
    // Деякі браузери викликають це при паузах — не завершуємо сесію
    voiceRecognition.onspeechend = () => {
      // ігноруємо завершення фрази, очікуємо подальший ввід
    };
    // Якщо аудіопотік закрився — перезапускаємо, поки користувач не натисне стоп
    voiceRecognition.onaudioend = () => {
      if (!voiceManualStop) {
        restartVoiceIfNeeded();
      }
    };
    voiceRecognition.onnomatch = () => {
      // без дій, очікуємо подальше аудіо
    };
    document.addEventListener("visibilitychange", () => {
      // Якщо вкладка повернулась у фокус і запис мав йти — відновлюємо
      if (!document.hidden && voiceRecording && !voiceManualStop) {
        restartVoiceIfNeeded();
      }
    });
    voiceRecognition.onresult = (event) => {
      const input = document.getElementById("assistant-input");
      if (!input) return;
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      // Вставляємо текст у поле вводу (проміжні результати теж)
      input.value = transcript.trim();
    };
    return true;
  } catch (e) {
    const voiceBtn = document.getElementById("assistant-voice-btn");
    if (voiceBtn) voiceBtn.hidden = true;
    return false;
  }
}

function toggleVoiceRecording() {
  const ok = !!voiceRecognition || initVoiceInput();
  if (!ok) {
    showNotification({
      type: "warning",
      title: "Немає підтримки",
      message: "Браузер не підтримує голосовий ввід.",
      duration: 2500,
    });
    return;
  }
  try {
    if (voiceRecording) {
      voiceManualStop = true;
      voiceRecognition.stop();
      voiceRecording = false;
      setAssistantVoiceButton("mic");
    } else {
      // Запитуємо дозвіл на мікрофон (деякі браузери блокують без getUserMedia)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            // Відпускаємо мікрофон одразу — нам потрібен лише дозвіл
            try {
              stream.getTracks().forEach((t) => t.stop());
            } catch {}
            voiceManualStop = false;
            voiceRecognition.start();
          })
          .catch((err) => {
            setAssistantVoiceButton("mic");
            showNotification({
              type: "error",
              title: "Доступ до мікрофона заборонено",
              message: "Дозвольте доступ у налаштуваннях браузера та спробуйте знову.",
              duration: 3500,
            });
          });
      } else {
        // Без getUserMedia — пробуємо старт відразу
        voiceManualStop = false;
        voiceRecognition.start();
      }
    }
  } catch (e) {
    const msg = (e && e.name === "NotAllowedError")
      ? "Дозвольте доступ до мікрофона у налаштуваннях браузера."
      : String(e?.message || e);
    showNotification({
      type: "error",
      title: "Помилка запуску мікрофона",
      message: msg,
      duration: 2500,
    });
  }
}

// Глобальний стан стріму відповіді асистента
const assistantStream = {
  active: false,
  waiting: false,
  paused: false,
  timer: null,
  buffer: "",
  index: 0,
  msgEl: null,
};

function getAssistantMessageCount() {
  const container = document.getElementById("assistant-messages");
  return container ? container.children.length : 0;
}

function updateAssistantControls() {
  const clearBtn = document.getElementById("assistant-clear-btn");
  const quick = document.querySelector(".assistant-quick");
  const msgCount = getAssistantMessageCount();
  if (clearBtn) clearBtn.hidden = msgCount === 0;
  if (quick) quick.hidden = msgCount > 0;
}

function setAssistantSendButton(mode) {
  // mode: "send" | "stop" | "play"
  const btn = document.getElementById("assistant-send-btn");
  if (!btn) return;
  const icon = btn.querySelector(".icon");
  if (mode === "send") {
    btn.setAttribute("aria-label", "Надіслати");
    if (icon) icon.setAttribute("data-lucide", "send");
  } else if (mode === "stop") {
    btn.setAttribute("aria-label", "Зупинити");
    btn.setAttribute("data-tooltip", "Зупинити");
    if (icon) icon.setAttribute("data-lucide", "square");
  } else if (mode === "play") {
    btn.setAttribute("aria-label", "Продовжити");
    btn.setAttribute("data-tooltip", "Продовжити");
    if (icon) icon.setAttribute("data-lucide", "play");
  }
  refreshIcons();
}

// Ініціалізація обробників історії (кнопки в хедері, модалка)
function initHistoryControls() {
  const bulkModeBtn = document.getElementById("history-bulk-mode-btn");
  const bulkDeleteBtn = document.getElementById("history-bulk-delete-btn");
  const deleteAllBtn = document.getElementById("history-delete-all-btn");
  const viewToggleBtn = document.getElementById("history-view-toggle-btn");
  const bulkModal = document.getElementById("bulk-delete-history-modal");
  const bulkCancel = document.getElementById("bulk-delete-history-cancel-btn");
  const bulkConfirm = document.getElementById("bulk-delete-history-confirm-btn");
  const bulkBackdrop = document.getElementById("bulk-delete-history-modal-backdrop");
  if (bulkModeBtn) {
    bulkModeBtn.onclick = () => {
      historyBulkMode = !historyBulkMode;
      historySelectedIds.clear();
      if (bulkDeleteBtn) bulkDeleteBtn.hidden = !historyBulkMode;
      renderHistoryTable();
    };
  }
  if (viewToggleBtn) {
    const setIcon = () => {
      const icon = viewToggleBtn.querySelector(".icon");
      if (icon) icon.setAttribute("data-lucide", historyViewMode === "list" ? "layout-grid" : "list");
      viewToggleBtn.setAttribute("aria-label", historyViewMode === "list" ? "Grid View" : "List View");
      viewToggleBtn.setAttribute("data-tooltip", historyViewMode === "list" ? "Grid View" : "List View");
      refreshIcons();
    };
    setIcon();
    viewToggleBtn.onclick = () => {
      historyViewMode = historyViewMode === "list" ? "grid" : "list";
      localStorage.setItem("hr_history_view", historyViewMode);
      setIcon();
      renderHistoryTable();
    };
  }
  if (bulkDeleteBtn) {
    bulkDeleteBtn.onclick = () => {
      if (historySelectedIds.size === 0) {
        showNotification({
          type: "warning",
          title: "Нічого не вибрано",
          message: "Спочатку виберіть хоча б один прогноз.",
          duration: 2000,
        });
        return;
      }
      const modal = document.getElementById("bulk-delete-history-modal");
      if (modal) modal.dataset.mode = "selected";
      openBulkDeleteHistoryModal();
    };
  }
  if (deleteAllBtn) {
    deleteAllBtn.onclick = async () => {
      if (!authState.history || authState.history.length === 0) return;
      const modal = document.getElementById("bulk-delete-history-modal");
      if (modal) {
        modal.dataset.mode = "all";
      }
      openBulkDeleteHistoryModal();
    };
  }
  if (bulkCancel) bulkCancel.onclick = closeBulkDeleteHistoryModal;
  if (bulkBackdrop) bulkBackdrop.onclick = closeBulkDeleteHistoryModal;
  if (bulkConfirm) {
    bulkConfirm.onclick = async () => {
      const modal = document.getElementById("bulk-delete-history-modal");
      const mode = modal?.dataset.mode || "selected";
      if (mode === "all") {
        await deleteAllHistory();
      } else {
        await deleteSelectedHistory();
      }
      closeBulkDeleteHistoryModal();
      historyBulkMode = false;
      const bulkDeleteBtnEl = document.getElementById("history-bulk-delete-btn");
      if (bulkDeleteBtnEl) bulkDeleteBtnEl.hidden = true;
    };
  }
}

function resetAssistantStream() {
  if (assistantStream.timer) {
    clearInterval(assistantStream.timer);
    assistantStream.timer = null;
  }
  assistantStream.active = false;
  assistantStream.waiting = false;
  assistantStream.paused = false;
  assistantStream.buffer = "";
  assistantStream.index = 0;
  assistantStream.msgEl = null;
  setAssistantSendButton("send");
}

function stopAssistantStream() {
  if (assistantStream.timer) {
    clearInterval(assistantStream.timer);
    assistantStream.timer = null;
  }
  assistantStream.active = false;
  assistantStream.waiting = false;
  assistantStream.paused = false;
  setAssistantSendButton("send");
}

function startAssistantStream(answerText) {
  const container = document.getElementById("assistant-messages");
  if (!container) return;
  assistantStream.buffer = String(answerText || "");
  assistantStream.index = 0;
  assistantStream.paused = false;
  assistantStream.waiting = false;
  assistantStream.active = true;
  assistantStream.msgEl = document.createElement("div");
  assistantStream.msgEl.className = "assistant-msg assistant-msg--assistant";
  assistantStream.msgEl.textContent = "";
  container.appendChild(assistantStream.msgEl);
  container.scrollTop = container.scrollHeight;
  setAssistantSendButton("stop");
  assistantStream.timer = setInterval(() => {
    if (assistantStream.paused) return;
    if (assistantStream.index >= assistantStream.buffer.length) {
      clearInterval(assistantStream.timer);
      assistantStream.timer = null;
      assistantStream.active = false;
      setAssistantSendButton("send");
      return;
    }
    assistantStream.msgEl.textContent += assistantStream.buffer[assistantStream.index];
    assistantStream.index += 1;
    container.scrollTop = container.scrollHeight;
  }, 18);
}

function toggleAssistantStream() {
  if (!assistantStream.active) return;
  // Якщо ще очікуємо відповідь — просто ставимо/знімаємо паузу очікування
  if (assistantStream.waiting) {
    assistantStream.paused = !assistantStream.paused;
    setAssistantSendButton(assistantStream.paused ? "play" : "stop");
    return;
  }
  assistantStream.paused = !assistantStream.paused;
  if (assistantStream.paused) {
    if (assistantStream.timer) {
      clearInterval(assistantStream.timer);
      assistantStream.timer = null;
    }
    setAssistantSendButton("play");
  } else {
    // Продовжуємо друк
    setAssistantSendButton("stop");
    const container = document.getElementById("assistant-messages");
    assistantStream.timer = setInterval(() => {
      if (assistantStream.paused) return;
      if (assistantStream.index >= assistantStream.buffer.length) {
        clearInterval(assistantStream.timer);
        assistantStream.timer = null;
        assistantStream.active = false;
        setAssistantSendButton("send");
        return;
      }
      if (assistantStream.msgEl) {
        assistantStream.msgEl.textContent += assistantStream.buffer[assistantStream.index];
      }
      assistantStream.index += 1;
      if (container) container.scrollTop = container.scrollHeight;
    }, 18);
  }
}

async function fetchAssistantHistory(limit = 50) {
  return apiFetch(`/assistant/history?limit=${limit}`);
}

async function fetchLatestHealthRiskSnapshot() {
  try {
    const data = await apiFetch(`/health-risk/latest`);
    return data || null;
  } catch (error) {
    // 204 No Content або інші помилки
    return null;
  }
}

async function clearAssistantHistory() {
  await apiFetch(`/assistant/history`, { method: "DELETE" });
}
function appendAssistantMessage(role, content, timestamp = Date.now()) {
  const container = document.getElementById("assistant-messages");
  if (!container) return;
  const msg = document.createElement("div");
  msg.className = `assistant-msg ${role === "assistant" ? "assistant-msg--assistant" : "assistant-msg--user"}`;
  msg.innerText = content;
  container.appendChild(msg);
  // Автоскрол
  container.scrollTop = container.scrollHeight;
  // Показуємо кнопку очистки при наявності хоча б одного повідомлення
  const clearBtn = document.getElementById("assistant-clear-btn");
  if (clearBtn) {
    clearBtn.hidden = container.children.length === 0;
  }
  // Ховаємо швидкі кнопки після старту діалогу
  const quick = document.querySelector(".assistant-quick");
  if (quick) {
    quick.hidden = container.children.length > 0;
  }
}

function setAssistantTyping(isTyping) {
  const container = document.getElementById("assistant-messages");
  if (!container) return;
  if (isTyping) {
    // Під час "думає" кнопка має бути у стані "стоп"
    setAssistantSendButton("stop");
    if (!assistantTypingEl) {
      assistantTypingEl = document.createElement("div");
      assistantTypingEl.className = "assistant-msg assistant-msg--assistant";
      assistantTypingEl.textContent = "Асистент думає.";
      container.appendChild(assistantTypingEl);
      // Анімація крапок
      if (assistantTypingTimer) clearInterval(assistantTypingTimer);
      assistantTypingDots = 1;
      assistantTypingTimer = setInterval(() => {
        assistantTypingDots = (assistantTypingDots % 3) + 1;
        if (assistantTypingEl) {
          assistantTypingEl.textContent = `Асистент думає${".".repeat(assistantTypingDots)}`;
        }
      }, 500);
    }
  } else {
    if (assistantTypingTimer) {
      clearInterval(assistantTypingTimer);
      assistantTypingTimer = null;
    }
    if (assistantTypingEl) {
      assistantTypingEl.remove();
      assistantTypingEl = null;
    }
    // Якщо немає активного або очікуваного стріму — повертаємо кнопку до "send"
    if (!assistantStream.active && !assistantStream.waiting) {
      setAssistantSendButton("send");
    }
  }
  container.scrollTop = container.scrollHeight;
}

function appendAssistantReplyStreaming(text) {
  const container = document.getElementById("assistant-messages");
  if (!container) return;
  const msg = document.createElement("div");
  msg.className = "assistant-msg assistant-msg--assistant";
  msg.textContent = "";
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  const content = String(text || "");
  let i = 0;
  const stepMs = 18;
  const timer = setInterval(() => {
    if (i >= content.length) {
      clearInterval(timer);
      return;
    }
    msg.textContent += content[i];
    i += 1;
    container.scrollTop = container.scrollHeight;
  }, stepMs);
}

function renderAssistantHistory(messages) {
  const container = document.getElementById("assistant-messages");
  if (!container) return;
  container.innerHTML = "";
  (messages || []).forEach((m) => {
    appendAssistantMessage(m.role, m.content, m.created_at);
  });
  updateAssistantControls();
}

function renderAssistantStateCard(snapshot) {
  const empty = document.getElementById("assistant-state-empty");
  const rows = document.getElementById("assistant-state-rows");
  if (!empty || !rows) return;
  if (!snapshot) {
    empty.hidden = false;
    rows.hidden = true;
    return;
  }
  empty.hidden = true;
  rows.hidden = false;
  const targetEl = document.getElementById("assistant-state-target");
  const probEl = document.getElementById("assistant-state-probability");
  const badgeEl = document.getElementById("assistant-state-badge");
  const factorsEl = document.getElementById("assistant-state-factors");
  const timeEl = document.getElementById("assistant-state-time");
  if (targetEl) targetEl.textContent = formatTargetLabel(snapshot.target);
  if (probEl) probEl.textContent = formatProbability(snapshot.probability);
  if (badgeEl) {
    const bucket = snapshot.risk_bucket || "";
    badgeEl.textContent = riskLabels[bucket] || bucket || "—";
    // Застосовуємо класи, сумісні з існуючим CSS (.badge.risk-low|medium|high)
    const bucketClass = bucket ? `risk-${bucket}` : "";
    badgeEl.className = `badge ${bucketClass}`.trim();
  }
  if (factorsEl) {
    const factors = (snapshot.top_factors || []).map((f) => f.feature || f).slice(0, 5);
    factorsEl.textContent = factors.length ? factors.join(", ") : "—";
  }
  if (timeEl) timeEl.textContent = formatDateTime(snapshot.created_at);
}

function buildSnapshotFromHistoryItem(item) {
  if (!item) return null;
  const topFactors = Array.isArray(item?.inputs?.top_factors) ? item.inputs.top_factors : [];
  return {
    target: item.target,
    probability: item.probability,
    risk_bucket: item.risk_bucket,
    top_factors: topFactors,
    created_at: item.created_at,
  };
}

function formatHistoryOptionLabel(item) {
  const target = formatTargetLabel(item.target);
  const prob = formatProbability(item.probability);
  const date = formatDateTime(item.created_at);
  return `${target} — ${prob} — ${date}`;
}

async function populateAssistantRiskSelector() {
  const selectorWrap = document.getElementById("assistant-state-selector");
  const selectRoot = document.getElementById("assistant-risk-select");
  const btn = document.getElementById("assistant-risk-btn");
  const btnLabel = document.getElementById("assistant-risk-btn-label");
  const menu = document.getElementById("assistant-risk-menu");
  if (!selectorWrap || !selectRoot || !btn || !btnLabel || !menu) return;
  if (!authState.token || !authState.user) {
    selectorWrap.hidden = true;
    assistantSelectedPredictionId = null;
    assistantLatestPredictionId = null;
    return;
  }
  if (!Array.isArray(authState.history) || authState.history.length === 0) {
    try {
      await loadHistory(50);
    } catch {}
  }
  const items = Array.isArray(authState.history) ? authState.history.slice() : [];
  if (items.length === 0) {
    selectorWrap.hidden = true;
    assistantSelectedPredictionId = null;
    assistantLatestPredictionId = null;
    return;
  }
  const sortedAll = items.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const latest = sortedAll[0];
  assistantLatestPredictionId = latest?.id ?? null;
  // Persist latest timestamp for comparison after new predictions
  const latestTs = latest ? new Date(latest.created_at).getTime() : null;
  if (latestTs) saveAssistantLatestTimestamp(latestTs);
  // Restore persisted selection if valid, otherwise default to latest
  const storedId = loadAssistantSelectedPrediction();
  const storedExists = storedId != null && sortedAll.some((i) => i.id === storedId);
  assistantSelectedPredictionId =
    (storedExists ? storedId : null) ??
    (assistantLatestPredictionId != null ? assistantLatestPredictionId : null);
  const titleSpan = document.getElementById("assistant-state-title-text");
  if (titleSpan) {
    if (assistantSelectedPredictionId && assistantSelectedPredictionId !== assistantLatestPredictionId) {
      titleSpan.textContent = "Обраний ризик";
    } else {
      titleSpan.textContent = "Мій поточний ризик";
    }
  }
  // Build custom menu
  menu.innerHTML = "";
  const sorted = sortedAll;
  sorted.forEach((item) => {
    const row = document.createElement("div");
    row.className = "risk-option";
    row.setAttribute("role", "option");
    row.setAttribute("tabindex", "0");
    row.dataset.id = String(item.id);
    const meta = document.createElement("div");
    meta.className = "risk-option__meta";
    const t = document.createElement("p");
    t.className = "risk-option__title";
    t.textContent = `${formatTargetLabel(item.target)} • ${formatProbability(item.probability)}`;
    const s = document.createElement("p");
    s.className = "risk-option__subtitle";
    s.textContent = formatDateTime(item.created_at);
    meta.appendChild(t);
    meta.appendChild(s);
    const badge = document.createElement("span");
    const bucket = item.risk_bucket || "";
    badge.className = `badge risk-option__badge ${bucket ? `risk-${bucket}` : ""}`.trim();
    badge.textContent = riskLabels[bucket] || bucket || "—";
    row.appendChild(meta);
    row.appendChild(badge);
    const applySelect = () => {
      assistantSelectedPredictionId = Number(item.id);
      saveAssistantSelectedPrediction(assistantSelectedPredictionId);
      // Update label (compact)
      if (btnLabel) btnLabel.textContent = `${formatTargetLabel(item.target)} • ${formatProbability(item.probability)}`;
      // Update title
      if (titleSpan) {
        if (assistantSelectedPredictionId && assistantSelectedPredictionId !== assistantLatestPredictionId) {
          titleSpan.textContent = "Обраний ризик";
        } else {
          titleSpan.textContent = "Мій поточний ризик";
        }
      }
      // Update card content
      renderAssistantStateCard(buildSnapshotFromHistoryItem(item));
      // Close
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    row.addEventListener("click", applySelect);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        applySelect();
      }
    });
    menu.appendChild(row);
  });
  // Initialize button label with current selection
  const currentItem = sorted.find((i) => i.id === assistantSelectedPredictionId) || sorted[0];
  if (currentItem && btnLabel) {
    btnLabel.textContent = `${formatTargetLabel(currentItem.target)} • ${formatProbability(currentItem.probability)}`;
  }
  // Toggle handler
  const closeMenu = (e) => {
    if (!selectRoot.contains(e.target)) {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", escClose);
    }
  };
  const escClose = (e) => {
    if (e.key === "Escape") {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", escClose);
    }
  };
  btn.onclick = () => {
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    btn.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) {
      document.addEventListener("mousedown", closeMenu);
      document.addEventListener("keydown", escClose);
    } else {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", escClose);
    }
  };
  selectorWrap.hidden = false;
}

async function sendAssistantMessage(text) {
  try {
    // Якщо з попередньої відповіді щось залишилось — зупиняємо
    if (assistantStream.active || assistantStream.timer || assistantStream.waiting) {
      stopAssistantStream();
    }
    setAssistantTyping(true);
    // Позначаємо активний стан і показуємо кнопку зупинки
    assistantStream.active = true;
    assistantStream.waiting = true;
    assistantStream.paused = false;
    setAssistantSendButton("stop");
    // Інформуємо користувача, що відповідь генерується
    showNotification({
      type: "info",
      title: "Генерація відповіді",
      message: "Асистент формує відповідь. Ви можете натиснути «Стоп», щоб поставити на паузу.",
      duration: 2500,
    });
    const data = await apiFetch("/assistant/chat", {
      method: "POST",
    body: JSON.stringify({
      message: text,
      prediction_id: assistantSelectedPredictionId || undefined,
    }),
    });
    setAssistantTyping(false);
    assistantStream.waiting = false;
    // Якщо натиснули паузу під час очікування — стартуємо у паузі
    if (assistantStream.paused) {
      // створимо пуста бульбашка, а відновлення піде по кнопці
      const container = document.getElementById("assistant-messages");
      if (container) {
        assistantStream.msgEl = document.createElement("div");
        assistantStream.msgEl.className = "assistant-msg assistant-msg--assistant";
        assistantStream.msgEl.textContent = "";
        container.appendChild(assistantStream.msgEl);
        container.scrollTop = container.scrollHeight;
      }
      assistantStream.buffer = String(data?.answer || "Відповідь відсутня.");
      assistantStream.index = 0;
      setAssistantSendButton("play");
      showNotification({
        type: "info",
        title: "Поставлено на паузу",
        message: "Натисніть «Продовжити», щоб відновити відповідь.",
        duration: 2000,
      });
      return;
    }
    startAssistantStream(data?.answer || "Відповідь відсутня.");
    showNotification({
      type: "success",
      title: "Відповідь отримано",
      message: "Асистент друкує повідомлення.",
      duration: 1800,
    });
  } catch (error) {
    setAssistantTyping(false);
    assistantStream.active = false;
    assistantStream.waiting = false;
    assistantStream.paused = false;
    setAssistantSendButton("send");
    showNotification({
      type: "error",
      title: "Помилка надсилання",
      message: error.message || "Не вдалося надіслати повідомлення.",
      duration: 4000,
    });
  }
}

async function initializeAssistantPage() {
  if (!authState.user) {
    // Якщо користувач не автентифікований — перенаправляємо у логін
    navigateTo("/login");
    return;
  }

  // Підʼєднуємо обробники один раз
  if (!assistantInitialized) {
    const input = document.getElementById("assistant-input");
    const sendBtn = document.getElementById("assistant-send-btn");
    const quickBtns = document.querySelectorAll(".assistant-quick__btn");
    const clearBtn = document.getElementById("assistant-clear-btn");
    const voiceBtn = document.getElementById("assistant-voice-btn");
    const warningDismissBtn = document.getElementById("assistant-warning-dismiss");
    if (sendBtn && input) {
      sendBtn.addEventListener("click", async () => {
        // Якщо активна відповідь — кнопка керує пауза/продовження
        if (assistantStream.active) {
          // Якщо ще чекаємо контент — лише перемикаємо очікувану паузу
          if (assistantStream.waiting) {
            assistantStream.paused = !assistantStream.paused;
            setAssistantSendButton(assistantStream.paused ? "play" : "stop");
            showNotification({
              type: "info",
              title: assistantStream.paused ? "Поставлено на паузу" : "Продовжено",
              message: assistantStream.paused ? "Відповідь призупинено." : "Продовжуємо друк відповіді.",
              duration: 1500,
            });
            return;
          }
          // Інакше перемикаємо реальний стрім
          assistantStream.paused = !assistantStream.paused;
          if (assistantStream.paused) {
            setAssistantSendButton("play");
            showNotification({
              type: "info",
              title: "Поставлено на паузу",
              message: "Відповідь зупинено на поточному місці.",
              duration: 1500,
            });
          } else {
            // Продовжуємо стрім з буфера, якщо він був створений раніше
            if (assistantStream.msgEl && assistantStream.buffer && assistantStream.index >= 0) {
              const container = document.getElementById("assistant-messages");
              setAssistantSendButton("stop");
              assistantStream.timer = setInterval(() => {
                if (assistantStream.paused) return;
                if (assistantStream.index >= assistantStream.buffer.length) {
                  clearInterval(assistantStream.timer);
                  assistantStream.timer = null;
                  assistantStream.active = false;
                  setAssistantSendButton("send");
                  return;
                }
                assistantStream.msgEl.textContent += assistantStream.buffer[assistantStream.index];
                assistantStream.index += 1;
                if (container) container.scrollTop = container.scrollHeight;
              }, 18);
              showNotification({
                type: "info",
                title: "Продовжено",
                message: "Відповідь продовжено.",
                duration: 1200,
              });
            } else {
              setAssistantSendButton("stop");
            }
          }
          return;
        }
        const text = (input.value || "").trim();
        if (!text) return;
        appendAssistantMessage("user", text);
        input.value = "";
        await sendAssistantMessage(text);
      });
      input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (assistantStream.active) {
            // Дзеркалимо кліки для Enter
            if (assistantStream.waiting) {
              assistantStream.paused = !assistantStream.paused;
              setAssistantSendButton(assistantStream.paused ? "play" : "stop");
              return;
            }
            assistantStream.paused = !assistantStream.paused;
            if (assistantStream.paused) {
              setAssistantSendButton("play");
            } else {
              const container = document.getElementById("assistant-messages");
              setAssistantSendButton("stop");
              assistantStream.timer = setInterval(() => {
                if (assistantStream.paused) return;
                if (assistantStream.index >= assistantStream.buffer.length) {
                  clearInterval(assistantStream.timer);
                  assistantStream.timer = null;
                  assistantStream.active = false;
                  setAssistantSendButton("send");
                  return;
                }
                assistantStream.msgEl.textContent += assistantStream.buffer[assistantStream.index];
                assistantStream.index += 1;
                if (container) container.scrollTop = container.scrollHeight;
              }, 18);
            }
            return;
          }
          const text = (input.value || "").trim();
          if (!text) return;
          appendAssistantMessage("user", text);
          input.value = "";
          await sendAssistantMessage(text);
        }
      });
    }
    if (quickBtns && quickBtns.length) {
      quickBtns.forEach((btn) => {
        btn.addEventListener("click", async () => {
          const template = btn.getAttribute("data-template") || "";
          const input = document.getElementById("assistant-input");
          if (input) input.value = template;
          if (template) {
            appendAssistantMessage("user", template);
            if (input) input.value = "";
            await sendAssistantMessage(template);
          }
        });
      });
    }
    if (voiceBtn) {
      // Приховуємо, якщо немає підтримки
      const supported = initVoiceInput();
      if (!supported) {
        voiceBtn.hidden = true;
      } else {
        voiceBtn.addEventListener("click", () => {
          // Якщо асистент зараз друкує/думає — керуємо паузою друку, а не мікрофоном
          if (assistantStream.active || assistantStream.waiting) {
            toggleAssistantStream();
            return;
          }
          toggleVoiceRecording();
        });
      }
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        try {
          // Якщо йде друк — повністю зупиняємо
          stopAssistantStream();
          await clearAssistantHistory();
          renderAssistantHistory([]);
          showNotification({
            type: "success",
            title: "Чат очищено",
            message: "Вся переписка з асистентом видалена.",
            duration: 3000,
          });
          const warn = document.getElementById("assistant-warning");
          if (warn && !localStorage.getItem("assistant_warning_dismissed")) {
            warn.hidden = false;
          }
          // Після очистки: ховаємо очистку, показуємо швидкі кнопки
          clearBtn.hidden = true;
          const quick = document.querySelector(".assistant-quick");
          if (quick) quick.hidden = false;
        } catch (error) {
          showNotification({
            type: "error",
            title: "Помилка очищення",
            message: error.message || "Не вдалося очистити чат.",
            duration: 4000,
          });
        }
      });
    }
    if (warningDismissBtn) {
      warningDismissBtn.addEventListener("click", () => {
        const warn = document.getElementById("assistant-warning");
        if (warn) {
          warn.hidden = true;
          localStorage.setItem("assistant_warning_dismissed", "1");
        }
      });
    }
    assistantInitialized = true;
  }

  // Завантажуємо дані стану та історію
  const [snapshot, history] = await Promise.all([
    fetchLatestHealthRiskSnapshot(),
    fetchAssistantHistory(50).catch(() => []),
  ]);
  await populateAssistantRiskSelector();
  if (assistantSelectedPredictionId) {
    const selectedItem = (authState.history || []).find((i) => i.id === assistantSelectedPredictionId);
    if (selectedItem) {
      renderAssistantStateCard(buildSnapshotFromHistoryItem(selectedItem));
    } else {
  renderAssistantStateCard(snapshot);
    }
  } else {
    renderAssistantStateCard(snapshot);
  }
  renderAssistantHistory(history || []);
  // Показ попередження лише для нових користувачів (без історії), якщо не закривали
  const warningEl = document.getElementById("assistant-warning");
  if (warningEl) {
    const hasHistory = Array.isArray(history) && history.length > 0;
    const dismissed = localStorage.getItem("assistant_warning_dismissed") === "1";
    warningEl.hidden = hasHistory || dismissed;
  }
  refreshIcons();
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

// Заповнює predictionStore з історії прогнозів для відображення в діаграмах
function populatePredictionStoreFromHistory() {
  if (!authState.history || authState.history.length === 0) {
    // Якщо історії немає, очищаємо predictionStore
    Object.keys(predictionStore).forEach(key => delete predictionStore[key]);
    latestPredictionKey = null;
    return;
  }
  
  // Групуємо історію за target та беремо останній запис для кожного target
  const latestByTarget = {};
  authState.history.forEach((entry) => {
    const target = entry.target;
    if (!target) return;
    
    // Беремо останній запис для кожного target (історія вже відсортована за датою desc)
    if (!latestByTarget[target]) {
      latestByTarget[target] = entry;
    }
  });
  
  // Заповнюємо predictionStore
  let latestTimestamp = 0;
  let latestTarget = null;
  
  Object.entries(latestByTarget).forEach(([target, entry]) => {
    const createdTimestamp = new Date(entry.created_at).getTime();
    
    // Витягуємо inputs, виключаючи service поля
    const { target: _, model: __, top_factors: ___, ...inputValues } = entry.inputs || {};
    
    const snapshot = {
      target: entry.target,
      probability: entry.probability,
      risk_bucket: entry.risk_bucket,
      model_name: entry.model_name,
      version: null, // Версія моделі не зберігається в історії
      top_factors: entry.inputs?.top_factors || [],
      inputValues: inputValues,
      savedAt: createdTimestamp,
    };
    
    predictionStore[target] = snapshot;
    
    // Визначаємо найновіший прогноз
    if (createdTimestamp > latestTimestamp) {
      latestTimestamp = createdTimestamp;
      latestTarget = target;
    }
  });
  
  if (latestTarget) {
    latestPredictionKey = latestTarget;
  }
  
  // Оновлюємо діаграми якщо вони вже ініціалізовані
  if (insightsInitialized) {
    renderProfileOverviewChart();
    renderRiskComparisonChart();
    renderInsightsFactorsChart();
  }
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
  { skipAuth = false, skipAuthCheck = false } = {},
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
    // Якщо skipAuthCheck = true, не викликаємо handleUnauthorized
    if (response.status === 401 && !skipAuth && !skipAuthCheck) {
      // Перенаправляємо на login перед киданням помилки
      handleUnauthorized();
      // Після перенаправлення кидаємо помилку, яка буде оброблена в catch блоках
      // Але не показуємо її користувачу, бо вже перенаправлено
      const authError = new Error("Потрібно увійти до системи.");
      authError.isAuthError = true; // Позначаємо, що це помилка автентифікації
      authError.silent = true; // Позначаємо, що помилку не потрібно показувати
      throw authError;
    }
    // Для 404 помилок на захищених роутах перенаправляємо на логін
    if (response.status === 404 && !skipAuth && !skipAuthCheck) {
      const currentPath = window.location.pathname;
      const protectedPaths = ["/chats", "/c/", "/app", "/diagrams", "/history", "/profile", "/assistant", "/reports"];
      const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));
      if (isProtectedPath) {
        handleUnauthorized();
        const notFoundError = new Error("Сторінку не знайдено.");
        notFoundError.isAuthError = true;
        notFoundError.silent = true;
        throw notFoundError;
      }
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
  // Обробка маршруту /c/:chatId
  if (normalized.startsWith("/c/")) {
    return normalized; // Зберігаємо повний шлях для чатів
  }
  normalized = normalized.toLowerCase();
  if (ROUTE_ALIASES[normalized]) {
    normalized = ROUTE_ALIASES[normalized];
  }
  // Якщо роут не існує, перенаправляємо на /app (або /login якщо не автентифікований)
  // ВАЖЛИВО: Не робимо редірект для існуючих захищених сторінок - вони мають залишатися як є
  if (!ROUTE_SECTIONS[normalized] && !normalized.startsWith("/c/")) {
    // Перевіряємо, чи це захищений роут (якщо так, перенаправляємо на логін для неавтентифікованих)
    const protectedPaths = ["/chats", "/c/", "/app", "/diagrams", "/history", "/profile", "/assistant", "/reports"];
    const isProtectedPath = protectedPaths.some(path => pathname.toLowerCase().startsWith(path));
    if (isProtectedPath && authState.initialized && !authState.user) {
      return "/login";
    }
    // Для неіснуючих роутів перенаправляємо на /app
    return "/app";
  }
  return normalized;
}

function getSectionByPath(pathname) {
  const normalized = normalizePath(pathname);
  // Обробка маршруту /c/:chatId
  if (normalized.startsWith("/c/")) {
    return {
      path: normalized,
      section: "page-chats",
    };
  }
  
  // Для незалогіненого користувача НЕ можна падати в дефолт page-form
  // Якщо !hasUser і path не публічний - ми вже мали піти в handleUnauthorized() ДО цієї логіки
  const hasUser = Boolean(authState.user);
  const defaultSection = hasUser ? ROUTE_SECTIONS["/app"] : "page-not-found";
  
  return {
    path: normalized,
    section: ROUTE_SECTIONS[normalized] || defaultSection,
  };
}

// Функція для визначення публічних маршрутів (доступних без автентифікації)
function isPublicRoute(pathname) {
  const basePath = pathname.split("?")[0];
  return (
    basePath === "/login" ||
    basePath === "/register" ||
    basePath === "/forgot-password" ||
    basePath === "/reset-password"
  );
}

function showSectionForPath(pathname) {
  const basePath = pathname.split("?")[0];
  const hasUser = Boolean(authState.user);
  
  // 1. ГАРАНТОВАНИЙ guard для незалогіненого - ПЕРШИМ, БЕЗУМОВНО
  // Guard має працювати завжди, незалежно від initialized
  if (!hasUser && !isPublicRoute(basePath)) {
    handleUnauthorized();
    return "/login";
  }
  
  // Якщо автентифікація ще не ініціалізована - чекаємо (тільки для залогінених або публічних маршрутів)
  // Але для незалогіненого на непублічному маршруті - одразу редірект
  if (!authState.initialized) {
    // Якщо користувач не залогінений і маршрут не публічний - редірект на /login
    if (!hasUser && !isPublicRoute(basePath)) {
      handleUnauthorized();
      return "/login";
    }
    // Чекаємо, поки автентифікація ініціалізується
    // syncRouteFromLocation викличе showSectionForPath знову після ініціалізації
    const { path } = getSectionByPath(pathname);
    return path;
  }
  
  // 2. Далі ВСЯ інша логіка (normalizePath, getSectionByPath, ROUTE_SECTIONS, тощо)
  const { path, section } = getSectionByPath(pathname);
  
  // Auth gating: require authentication for main app pages
  // Перевіряємо автентифікацію тільки після того, як authState.initialized === true
  // Це дозволяє правильно завантажити сторінку при оновленні (якщо є токен)
  const protectedSections = ["page-form", "page-insights", "page-profile", "page-history", "page-assistant", "page-chats", "page-report"];
  
  // Додаткова перевірка для захищених секцій (на випадок, якщо щось пропустили вище)
  if (protectedSections.includes(section) && !authState.user) {
    // Користувач не автентифікований - перенаправляємо на /login
    handleUnauthorized();
    return path; // handleUnauthorized() вже перенаправить через window.location.href
  }
  
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
  
  // ВАЖЛИВО: Перевіряємо валідні захищені роути
  // Якщо користувач на валідному захищеному роуті - залишаємо його там, не редіректимо
  const validProtectedRoutes = ["/chats", "/c/", "/app", "/diagrams", "/history", "/profile", "/assistant", "/reports"];
  const isOnValidProtectedRoute = validProtectedRoutes.some(route => pathname.toLowerCase().startsWith(route));
  
  // Додаткова перевірка для валідних захищених роутів (на випадок, якщо щось пропустили вище)
  if (isOnValidProtectedRoute && authState.initialized && !authState.user) {
    handleUnauthorized();
    return "/login";
  }
  
  // Якщо це валідний захищений роут і користувач автентифікований - залишаємо на цьому роуті
  // НЕ робимо редірект на /app для валідних захищених роутів
  if (isOnValidProtectedRoute && authState.user && authState.initialized) {
    // Просто активуємо секцію без зміни URL
    // path вже правильний, section вже визначено через getSectionByPath
    // Просто продовжуємо виконання до activateSection
  } else if (!path.startsWith("/c/") && !ROUTE_SECTIONS[path] && path !== "/login" && path !== "/register" && path !== "/forgot-password" && !path.startsWith("/reset-password")) {
    // Якщо роут не існує в ROUTE_SECTIONS і це НЕ валідний захищений роут - редірект на /app
    // (тільки для неіснуючих роутів, не для валідних захищених)
    if (authState.user && authState.initialized) {
      const appPath = showSectionForPath("/app");
      if (window.location.pathname !== appPath) {
        history.replaceState({}, "", appPath);
      }
      return appPath;
    }
    return path; // Don't redirect if auth not initialized yet
  }
  
  // Фінальна перевірка перед активацією - не активуємо захищені сторінки для неавтентифікованих
  // Додаткова перевірка на випадок, якщо guard вище не спрацював
  if (protectedSections.includes(section) && !hasUser) {
    // Якщо це не публічний маршрут - редірект на /login
    if (!isPublicRoute(basePath)) {
      handleUnauthorized();
      return "/login";
    }
    return path;
  }
  
  // ВАЖЛИВО: Для валідних захищених роутів залишаємо оригінальний pathname
  // Це гарантує, що користувач залишиться на тій самій сторінці після перезавантаження
  const finalPath = path.startsWith("/c/") ? pathname : (isOnValidProtectedRoute ? pathname : path);
  
  // Додаткова перевірка: ніколи не показуємо page-form для незалогіненого
  if (section === "page-form" && !hasUser) {
    handleUnauthorized();
    return "/login";
  }
  
  activateSection(section);
  return finalPath;
}

function navigateTo(pathname, { replace = false } = {}) {
  const currentPath = window.location.pathname;
  // Нормалізуємо шлях через getSectionByPath, але зберігаємо оригінальний для /c/{uuid}
  const { path: normalizedPath } = getSectionByPath(pathname);
  const finalPath = pathname.startsWith("/c/") ? pathname : normalizedPath;
  
  // Спочатку оновлюємо URL, щоб activateSection міг правильно прочитати шлях
  if (replace) {
    if (currentPath !== finalPath) {
      history.replaceState({}, "", finalPath);
    }
  } else if (currentPath !== finalPath) {
    history.pushState({}, "", finalPath);
  }
  
  // Після оновлення URL викликаємо showSectionForPath
  showSectionForPath(finalPath);
}

function syncRouteFromLocation() {
  const pathname = window.location.pathname;
  const actualPath = showSectionForPath(pathname);
  // Для /c/{uuid} зберігаємо оригінальний шлях
  const finalPath = pathname.startsWith("/c/") ? pathname : actualPath;
  // Оновлюємо URL тільки якщо шлях змінився і це не перенаправлення на /login через handleUnauthorized
  // (handleUnauthorized() робить window.location.href = "/login", тому сторінка перезавантажиться)
  if (window.location.pathname !== finalPath && finalPath !== pathname) {
    history.replaceState({}, "", finalPath);
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
  // Очищаємо збережений останній відкритий чат при вилогіненні
  lastOpenedChatUuid = null;
  currentChatUuid = null;
  // Очищаємо список нещодавно розблокованих користувачів при вилогіненні
  recentlyUnblockedUsers.clear();
}

function handleUnauthorized() {
  clearAuthState();
  const loginPath = "/login";
  
  // Спочатку міняємо URL на /login
  if (window.location.pathname !== loginPath) {
    window.history.replaceState(null, "", loginPath);
  }
  
  // Прямий показ page-login, без викликів showSectionForPath
  activateSection("page-login");
}

async function handleAuthSuccess(payload, options = {}) {
  if (!payload?.access_token || !payload?.user) return;
  persistToken(payload.access_token);
  authState.user = payload.user;
  authState.history = [];
  updateUserPanel();
  updateProfileSection();
  loadHistory().catch(() => {});
  updateNavigationVisibility();
  refreshIcons();
  
  // Завантажуємо дані для чатів (тільки якщо користувач автентифікований)
  if (authState.user && typeof loadUnreadCount === "function") {
    loadUnreadCount();
    
    // Завантажуємо список чатів для перевірки непрочитаних повідомлень
    if (typeof loadChatsList === "function") {
      try {
        await loadChatsList();
        // Показуємо сповіщення про нові повідомлення
        showUnreadMessagesNotification();
      } catch (e) {
        // Ігноруємо помилки завантаження чатів для сповіщень
        if (!e.isAuthError && !e.silent) {
        }
      }
    }
  }
  
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
    // Використовуємо getUserInitial для консистентності з іншими місцями
    element.textContent = getUserInitial(user);
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
  const protectedSections = ["page-profile", "page-history", "page-insights", "page-form", "page-assistant", "page-report"];
  
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
  const navChats = document.getElementById("nav-chats");
  const navReport = document.getElementById("nav-report");
  
  // Знаходимо кнопки "Форма прогнозування" та "Діаграми" через data-section (безпечний селектор)
  const navForm = document.querySelector('.sidebar__nav [data-section="page-form"]');
  const navInsights = document.querySelector('.sidebar__nav [data-section="page-insights"]');
  const navAssistant = document.querySelector('.sidebar__nav [data-section="page-assistant"]');
  
  // Ці кнопки приховуємо повністю, якщо користувач не автентифікований
  if (navProfile) {
    navProfile.hidden = !authState.user;
  }
  if (navHistory) {
    navHistory.hidden = !authState.user;
  }
  if (navForm) {
    navForm.hidden = !authState.user;
  }
  if (navInsights) {
    navInsights.hidden = !authState.user;
  }
  if (navAssistant) {
    navAssistant.hidden = !authState.user;
  }
  if (navReport) {
    navReport.hidden = !authState.user;
  }
  if (navChats) {
    navChats.hidden = !authState.user;
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
  
  // Перевіряємо, що authState.user існує і оновлено
  const user = authState.user;
  if (!user) {
    // Користувач НЕ автентифікований: ховаємо профіль, показуємо гостя
    profileGuestState.removeAttribute("hidden");
    profileGuestState.hidden = false;
    profileAuthenticated.setAttribute("hidden", "");
    profileAuthenticated.hidden = true;
    return;
  }
  
  if (user) {
    // Користувач автентифікований: показуємо профіль, ховаємо гостя
    profileGuestState.setAttribute("hidden", "");
    profileGuestState.hidden = true;
    profileAuthenticated.removeAttribute("hidden");
    profileAuthenticated.hidden = false;
    
    // Використовуємо актуальні дані з authState (вже отримані вище)
    // const user = authState.user; - вже визначено вище
    
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
    
    // Оновлюємо форму редагування (дані відображаються в полях форми)
    if (profileEditFirstNameInput) profileEditFirstNameInput.value = user.first_name || "";
    if (profileEditLastNameInput) profileEditLastNameInput.value = user.last_name || "";
    if (profileEditDateOfBirthInput) {
      if (user.date_of_birth) {
        try {
          // Нормалізуємо дату до формату YYYY-MM-DD для поля input[type="date"]
          const dateStr = String(user.date_of_birth);
          let normalizedDate = "";
          
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Вже в правильному форматі YYYY-MM-DD
            normalizedDate = dateStr;
          } else if (dateStr.includes('T')) {
            // ISO формат з часом, витягуємо тільки дату
            normalizedDate = dateStr.split('T')[0];
          } else {
            // Спробуємо парсити як дату
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              normalizedDate = date.toISOString().split('T')[0];
            }
          }
          
          profileEditDateOfBirthInput.value = normalizedDate;
        } catch (e) {
          profileEditDateOfBirthInput.value = "";
        }
      } else {
        profileEditDateOfBirthInput.value = "";
      }
    }
    if (profileEditGenderSelect) profileEditGenderSelect.value = user.gender || "";
    // Оновлюємо прихований input кольору аватару
    if (avatarColorInput) {
      avatarColorInput.value = user.avatar_color || DEFAULT_AVATAR_COLOR;
    }
    
    // Зберігаємо оригінальні значення для відстеження змін
    saveOriginalProfileData();
    
    // Ховаємо кнопки дій при оновленні профілю
    hideProfileFormActions();
    
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
  if (!authState.user) return;
  
  const avatarType = authState.user?.avatar_type || "generated";
  const hasUploadedAvatar = avatarType === "uploaded" && authState.user?.avatar_url;
  
  // Якщо є завантажене фото - показуємо ТІЛЬКИ 2 кнопки: "Завантажити іншу фото" і "Видалити"
  if (hasUploadedAvatar) {
    // Показуємо кнопку завантаження з іконкою camera
    if (avatarUploadBtn) {
      avatarUploadBtn.removeAttribute("hidden");
      avatarUploadBtn.hidden = false;
      const icon = avatarUploadBtn.querySelector(".icon");
      if (icon) {
        icon.setAttribute("data-lucide", "camera");
        lucide.createIcons();
      }
      avatarUploadBtn.setAttribute("aria-label", "Завантажити іншу фото");
    }
    // Показуємо кнопку видалення
    if (avatarDeleteBtn) {
      avatarDeleteBtn.removeAttribute("hidden");
      avatarDeleteBtn.hidden = false;
    }
    // ОБОВ'ЯЗКОВО ховаємо кнопку зміни кольору - вона не потрібна коли є фото
    if (avatarColorBtn) {
      avatarColorBtn.setAttribute("hidden", "");
      avatarColorBtn.hidden = true;
    }
  } else {
    // Якщо немає завантаженого фото - показуємо ТІЛЬКИ 2 кнопки: "Завантажити фото" і "Змінити колір"
    // Показуємо кнопку завантаження з іконкою upload
    if (avatarUploadBtn) {
      avatarUploadBtn.removeAttribute("hidden");
      avatarUploadBtn.hidden = false;
      const icon = avatarUploadBtn.querySelector(".icon");
      if (icon) {
        icon.setAttribute("data-lucide", "upload");
        lucide.createIcons();
      }
      avatarUploadBtn.setAttribute("aria-label", "Завантажити фото");
    }
    // ОБОВ'ЯЗКОВО ховаємо кнопку видалення - вона не потрібна коли немає фото
    if (avatarDeleteBtn) {
      avatarDeleteBtn.setAttribute("hidden", "");
      avatarDeleteBtn.hidden = true;
    }
    // Показуємо кнопку зміни кольору
    if (avatarColorBtn) {
      avatarColorBtn.removeAttribute("hidden");
      avatarColorBtn.hidden = false;
    }
  }
  
  // Оновлюємо старий кнопку скидання (якщо існує) - для сумісності
  if (avatarResetBtn) {
    if (hasUploadedAvatar) {
      avatarResetBtn.removeAttribute("hidden");
      avatarResetBtn.hidden = false;
    } else {
      avatarResetBtn.setAttribute("hidden", "");
      avatarResetBtn.hidden = true;
    }
  }
  
  // Оновлюємо inline кнопку скидання (якщо існує) - для сумісності
  if (profileAvatarResetBtnInline) {
    if (hasUploadedAvatar) {
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
  
  // Оновлюємо значення прихованого поля кольору аватару
  if (avatarColorInput) {
    avatarColorInput.value = originalProfileData.avatar_color;
  }
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
  
  // Для avatar_color перевіряємо тільки якщо була зміна через колір picker
  let currentAvatarColor = originalProfileData.avatar_color;
  if (avatarColorInput && avatarColorInput.value) {
    currentAvatarColor = avatarColorInput.value || DEFAULT_AVATAR_COLOR;
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
    const historyCountEl = document.getElementById("history-count");
    if (historyCountEl) {
      historyCountEl.hidden = true;
      historyCountEl.textContent = "";
    }
    return;
  }

  // Оновлюємо лічильник у заголовку
  (function updateHistoryCount() {
    const historyCountEl = document.getElementById("history-count");
    if (!historyCountEl) return;
    const count = authState.history.length;
    if (count > 0) {
      historyCountEl.textContent = String(count);
      historyCountEl.hidden = false;
    } else {
      historyCountEl.hidden = true;
      historyCountEl.textContent = "";
    }
  })();
  const rows = authState.history
    .map((entry) => {
      const dateLabel = formatDateTimeLong(entry.created_at);
      const targetLabel = formatTargetLabel(entry.target);
      const modelLabel = entry.model_name || "Автоматично";
      const probabilityLabel = formatProbability(entry.probability);
      const riskLabel = riskLabels[entry.risk_bucket] || entry.risk_bucket;
      const color = getRiskColor(entry.risk_bucket);
      const checkboxCell = historyBulkMode
        ? `<td><input type="checkbox" class="history-select-checkbox" data-id="${entry.id}" ${historySelectedIds.has(entry.id) ? "checked" : ""} aria-label="Вибрати"></td>`
        : `<td><span class="history-select-spacer" aria-hidden="true"></span></td>`;
      return `
        <tr data-id="${entry.id}">
          ${checkboxCell}
          <td>${dateLabel}</td>
          <td>${targetLabel}</td>
          <td>${modelLabel}</td>
          <td>${probabilityLabel}</td>
          <td><span class="history-actions__pill" style="background:${color};color:#fff;">${riskLabel}</span></td>
          <td class="history-table__actions">
            <button type="button" class="icon-button" data-action="replay" data-id="${entry.id}" title="Повторити" aria-label="Повторити" data-tooltip="Повторити" ${historyBulkMode ? "hidden" : ""}>
              <span class="icon" data-lucide="rotate-ccw"></span>
            </button>
            <button type="button" class="icon-button icon-button--danger" data-action="delete" data-id="${entry.id}" title="Видалити" aria-label="Видалити" data-tooltip="Видалити" ${historyBulkMode ? "hidden" : ""}>
              <span class="icon" data-lucide="trash-2"></span>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  const grid = document.getElementById("history-grid");
  const tableEl = historyTableWrapper ? historyTableWrapper.querySelector(".history-table") : null;
  if (historyViewMode === "list") {
    if (grid) grid.hidden = true;
    if (tableEl) tableEl.hidden = false;
  historyTableBody.innerHTML = rows;
  if (historyEmpty) {
  historyEmpty.hidden = true;
  }
  if (historyTableWrapper) {
    historyTableWrapper.hidden = false;
      // Позначаємо режим групового вибору для керування відображенням колонки "Дії"
      historyTableWrapper.classList.toggle("history--bulk", !!historyBulkMode);
  }
  refreshIcons();
    // Bind checkboxes in bulk mode
    if (historyBulkMode) {
      document.querySelectorAll(".history-select-checkbox").forEach((cb) => {
        cb.addEventListener("change", () => {
          const id = Number(cb.dataset.id);
          if (cb.checked) historySelectedIds.add(id);
          else historySelectedIds.delete(id);
        });
      });
    }
    // Row click toggles selection in bulk mode (клік по всьому рядку)
    document.querySelectorAll("#history-table-body tr").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (!historyBulkMode) return;
        if (e.target.closest(".history-table__actions")) return;
        if (e.target.closest(".history-select-checkbox")) return;
        const id = Number(row.dataset.id);
        const cb = row.querySelector(".history-select-checkbox");
        if (!cb) return;
        const nowChecked = !cb.checked;
        cb.checked = nowChecked;
        if (nowChecked) historySelectedIds.add(id);
        else historySelectedIds.delete(id);
      });
    });
  } else {
    // Grid view
    if (historyEmpty) historyEmpty.hidden = true;
    if (historyTableWrapper) {
      historyTableWrapper.hidden = false;
      historyTableWrapper.classList.toggle("history--bulk", !!historyBulkMode);
    }
    if (grid) {
      grid.hidden = false;
      if (tableEl) tableEl.hidden = true;
      const cards = authState.history
        .map((entry) => {
          const dateLabel = formatDateTimeLong(entry.created_at);
          const targetLabel = formatTargetLabel(entry.target);
          const modelLabel = entry.model_name || "Автоматично";
          const probabilityLabel = formatProbability(entry.probability);
          const riskLabel = riskLabels[entry.risk_bucket] || entry.risk_bucket;
          const color = getRiskColor(entry.risk_bucket);
          const checked = historySelectedIds.has(entry.id) ? "checked" : "";
          return `
            <div class="history-card-item" data-id="${entry.id}">
              <div class="history-card__row">
                <input type="checkbox" class="history-card__checkbox history-select-checkbox" data-id="${entry.id}" ${checked} aria-label="Вибрати">
                <h3 class="history-card__title">${targetLabel}</h3>
                <span class="badge history-card__badge" style="background:${color};color:#fff;">${riskLabel}</span>
              </div>
              <p class="history-card__meta">${dateLabel}</p>
              <p class="history-card__meta">Модель: ${modelLabel}</p>
              <p class="history-card__meta">Ймовірність: ${probabilityLabel}</p>
              <div class="history-card__actions">
                <button type="button" class="icon-button" data-action="replay" data-id="${entry.id}" title="Повторити" aria-label="Повторити" data-tooltip="Повторити">
                  <span class="icon" data-lucide="rotate-ccw"></span>
                </button>
                <button type="button" class="icon-button icon-button--danger" data-action="delete" data-id="${entry.id}" title="Видалити" aria-label="Видалити" data-tooltip="Видалити">
                  <span class="icon" data-lucide="trash-2"></span>
                </button>
              </div>
            </div>
          `;
        })
        .join("");
      grid.innerHTML = cards;
      refreshIcons();
      if (historyBulkMode) {
        grid.querySelectorAll(".history-select-checkbox").forEach((cb) => {
          cb.addEventListener("change", () => {
            const id = Number(cb.dataset.id);
            if (cb.checked) historySelectedIds.add(id);
            else historySelectedIds.delete(id);
          });
        });
      }
      grid.querySelectorAll(".history-card-item").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (!historyBulkMode) return;
          if (e.target.closest(".history-card__actions")) return;
          if (e.target.closest(".history-select-checkbox")) return;
          const id = Number(card.dataset.id);
          const cb = card.querySelector(".history-select-checkbox");
          if (!cb) return;
          const nowChecked = !cb.checked;
          cb.checked = nowChecked;
          if (nowChecked) historySelectedIds.add(id);
          else historySelectedIds.delete(id);
        });
      });
      // Делегування дій для кнопок "Повторити" та "Видалити" у GridView
      if (!grid.dataset.actionsBound) {
        grid.addEventListener("click", async (e) => {
          const btn = e.target.closest(".icon-button");
          if (!btn) return;
          const action = btn.getAttribute("data-action");
          const idAttr = btn.getAttribute("data-id");
          const id = idAttr ? Number(idAttr) : NaN;
          if (!action || !Number.isFinite(id)) return;
          if (historyBulkMode) return; // в bulk-режимі кнопки дій не активні
          const entry = authState.history.find((h) => h.id === id);
          if (!entry) return;
          if (action === "replay") {
            if (entry.inputs) {
              loadPredictionFromHistory(entry.inputs);
            } else {
              showNotification({
                type: "warning",
                title: "Дані недоступні",
                message: "Для цього запису відсутні вхідні дані.",
                duration: 2500,
              });
            }
          } else if (action === "delete") {
            // Використовуємо існуючу кастомну модалку підтвердження видалення
            openDeleteHistoryModal(id, btn);
          }
        });
        grid.dataset.actionsBound = "1";
      }
    }
    // Очистимо табличний вміст, щоб не дублювався
    historyTableBody.innerHTML = "";
  }
}

async function loadHistory(limit = 50) {
  if (!authState.token) {
    authState.history = [];
    renderHistoryTable();
    populatePredictionStoreFromHistory();
    return;
  }
  try {
    const data = await apiFetch(`/users/me/history?limit=${limit}`);
    authState.history = Array.isArray(data?.items) ? data.items : [];
    // Заповнюємо predictionStore з історії для відображення в діаграмах
    populatePredictionStoreFromHistory();
    // Оновлюємо збережену вибірку, якщо з'явився новий прогноз (після форми)
    const sorted = authState.history.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = sorted[0];
    if (latest) {
      const latestTs = new Date(latest.created_at).getTime();
      const storedTs = loadAssistantLatestTimestamp();
      if (!storedTs || latestTs > storedTs) {
        // Зʼявився новий прогноз — фіксуємо його як обраний
        saveAssistantLatestTimestamp(latestTs);
        saveAssistantSelectedPrediction(latest.id);
        assistantSelectedPredictionId = latest.id;
        assistantLatestPredictionId = latest.id;
      }
    }
  } catch (error) {
    authState.history = [];
    populatePredictionStoreFromHistory();
    
    // Показуємо сповіщення про помилку тільки якщо це не автоматичне завантаження при ініціалізації
    // (щоб не показувати помилку при першому завантаженні, коли користувач ще не на сторінці історії)
    const currentSection = window.location.pathname;
    if (currentSection === "/history" || currentSection.includes("history")) {
      showNotification({
        type: "error",
        title: "Помилка завантаження історії",
        message: error.message || "Не вдалося завантажити історію прогнозів. Спробуйте оновити сторінку.",
        duration: 5000,
      });
    }
  }
  renderHistoryTable();
}

async function initializeAuth() {
  const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (storedToken) {
    persistToken(storedToken);
    try {
      const profile = await apiFetch("/users/me");
      // Нормалізуємо date_of_birth до формату YYYY-MM-DD для поля форми
      if (profile.date_of_birth) {
        const dateStr = String(profile.date_of_birth);
        if (dateStr.includes('T')) {
          profile.date_of_birth = dateStr.split('T')[0];
        } else if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Якщо формат не YYYY-MM-DD, спробуємо парсити
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            profile.date_of_birth = date.toISOString().split('T')[0];
          }
        }
      }
      authState.user = profile;
      await loadHistory();
    } catch (error) {
      clearAuthState();
      // Не показуємо сповіщення про помилку відновлення сесії, бо це нормально при першому відвідуванні
      // або якщо токен застарів - просто очищаємо стан
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
  
  // Завантажуємо кількість непрочитаних повідомлень після ініціалізації автентифікації
  // Це забезпечує відображення бейджа навіть після перезавантаження сторінки
  // Викликаємо після authState.initialized = true, щоб loadUnreadCount() не вийшов рано
  // Також викликаємо після updateNavigationVisibility(), щоб кнопка nav-chats була видима
  if (authState.user && typeof loadUnreadCount === "function") {
    // Невелика затримка, щоб переконатися, що DOM готовий і updateNavigationVisibility() вже виконався
    setTimeout(() => {
      loadUnreadCount().catch((e) => {
        // Ігноруємо помилки для unread count, це не критично
        if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
          return; // Не показуємо помилку, не логуємо
        }
      });
    }, 100);
  }
  
  // Синхронізуємо маршрут після завершення автентифікації
  // IMPORTANT: If user is authenticated and on a valid protected route (like /chats, /reports, /diagrams),
  // we should stay on that route, not redirect to /app
  // Only redirect to /app if we're on /login, /register, or root /
  const currentPath = window.location.pathname;
  const hasUser = Boolean(authState.user);
  
  const validProtectedRoutes = ["/chats", "/c/", "/app", "/diagrams", "/history", "/profile", "/assistant", "/reports"];
  const isOnValidProtectedRoute = validProtectedRoutes.some(route => currentPath.toLowerCase().startsWith(route));
  
  // КРИТИЧНО: Обробка для НЕзалогінених користувачів
  if (!hasUser) {
    // Якщо користувач не залогінений і на непублічному маршруті - редірект на /login
    if (!isPublicRoute(currentPath)) {
      // Викликаємо syncRouteFromLocation, який викличе showSectionForPath,
      // а showSectionForPath зробить редірект через handleUnauthorized
      syncRouteFromLocation();
      return;
    }
    // Якщо на публічному маршруті - просто синхронізуємо
    syncRouteFromLocation();
    return;
  }
  
  // КРИТИЧНО: Редірект на /app тільки для /, /login, /register
  // Для всіх інших валідних захищених роутів - залишаємося на них
  if (authState.user && (currentPath === "/login" || currentPath === "/register" || currentPath === "/")) {
    // User is authenticated but on login/register/root - redirect to /app
    navigateTo("/app", { replace: true });
  } else if (authState.user && isOnValidProtectedRoute) {
    // User is authenticated and on a valid protected route - stay there
    // Викликаємо syncRouteFromLocation, який активує поточну секцію без редіректу
    syncRouteFromLocation();
  } else {
    // Default: sync route (handles other cases)
    syncRouteFromLocation();
  }
}

// Функція toggleUserMenu видалена - більше не потрібна

function loadPredictionFromHistory(inputs) {
  if (!inputs) return;
  queuedFormInputs = { ...inputs };
  applyQueuedPredictionInputs();
  navigateTo("/app");
  window.scrollTo({ top: 0, behavior: "smooth" });
  
  showNotification({
    type: "info",
    title: "Прогноз завантажено",
    message: "Дані з історії прогнозів успішно завантажено в форму. Можете розрахувати новий прогноз.",
    duration: 4000,
  });
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
    showNotification({
      type: "success",
      title: "Вхід успішний",
      message: "Ви успішно увійшли в систему.",
      duration: 3000,
    });
  } catch (error) {
    // Обробка помилок від backend
    const errorMessage = error.message || error.detail || "Не вдалося увійти. Спробуйте ще раз.";
    setAuthFormError(loginErrorBox, errorMessage);
    showNotification({
      type: "error",
      title: "Помилка входу",
      message: errorMessage,
      duration: 5000,
    });
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
    showNotification({
      type: "success",
      title: "Реєстрація успішна",
      message: "Ваш обліковий запис успішно створено. Ласкаво просимо!",
      duration: 4000,
    });
  } catch (error) {
    const errorMessage = error.message || "Не вдалося зареєструватися. Спробуйте ще раз.";
    setAuthFormError(registerErrorBox, errorMessage);
    showNotification({
      type: "error",
      title: "Помилка реєстрації",
      message: errorMessage,
      duration: 5000,
    });
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
  // Додаємо avatar_color якщо була зміна через колір picker
  if (avatarColorInput && avatarColorInput.value && avatarColorInput.value !== (originalProfileData?.avatar_color || DEFAULT_AVATAR_COLOR)) {
    payload.avatar_color = avatarColorInput.value;
  }
  
  setProfileStatus("Збереження...", "info");
  
  const submitButton = event.target.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  
  try {
    const data = await apiFetch("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    
    // Оновлюємо authState з новими даними (конвертуємо date_of_birth якщо потрібно)
    const updatedUser = { ...authState.user, ...data };
    
    // Нормалізуємо date_of_birth до формату YYYY-MM-DD якщо він прийшов в іншому форматі
    if (updatedUser.date_of_birth) {
      const dateStr = String(updatedUser.date_of_birth);
      if (dateStr.includes('T')) {
        // ISO формат з часом, витягуємо тільки дату
        updatedUser.date_of_birth = dateStr.split('T')[0];
      } else if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Якщо не в форматі YYYY-MM-DD, спробуємо парсити
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          updatedUser.date_of_birth = date.toISOString().split('T')[0];
        }
      }
    }
    
    authState.user = updatedUser;
    
    // Оновлюємо UI компоненти
    updateUserPanel();
    updateProfileSection();
    
    // Оновлюємо оригінальні значення після успішного збереження
    saveOriginalProfileData();
    
    // Ховаємо кнопки дій після збереження
    hideProfileFormActions();
    
    // Переключаємо на таб "Профіль" ПІСЛЯ оновлення даних
    switchProfileTab("profile");
    
    // Додатково перевіряємо, що дані оновлені після перемикання табу
    // Використовуємо подвійний requestAnimationFrame для гарантії рендерингу
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateProfileSection();
        if (profileInfoDateOfBirth) {
        }
      });
    });
    
    setProfileStatus("Профіль успішно оновлено.", "info");
    
    // Показуємо повідомлення про успіх (з перевіркою, чи була зміна кольору аватара)
    const wasAvatarColorChanged = avatarColorInput && 
      avatarColorInput.value !== (originalProfileData?.avatar_color || DEFAULT_AVATAR_COLOR);
    
    if (wasAvatarColorChanged) {
      showNotification({
        type: "success",
        title: "Колір аватара змінено",
        message: "Колір аватара успішно оновлено.",
        duration: 4000,
      });
    } else {
      showNotification({
        type: "success",
        title: "Профіль оновлено",
        message: "Дані профілю успішно збережено.",
        duration: 3000,
      });
    }
  } catch (error) {
    const errorMessage = error.message || "Не вдалося оновити профіль. Спробуйте ще раз.";
    setProfileStatus(errorMessage, "error");
    showNotification({
      type: "error",
      title: "Помилка оновлення профілю",
      message: errorMessage,
      duration: 5000,
    });
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
    const icon = avatarUploadBtn.querySelector(".icon");
    if (icon) {
      icon.setAttribute("data-lucide", "loader-2");
      lucide.createIcons();
    }
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
    
    // Видимість кнопок оновлюється через updateAvatarButtons()
    
    // Показуємо нотифікацію про успіх
    showNotification({
      type: "success",
      title: "Фото завантажено",
      message: "Фото профілю успішно завантажено та оновлено.",
      duration: 4000,
    });
  } catch (error) {
    setProfileStatus(error.message || "Не вдалося завантажити фото. Спробуйте інший файл.", "error");
    showNotification({
      type: "error",
      title: "Помилка завантаження",
      message: error.message || "Не вдалося завантажити фото. Спробуйте інший файл.",
      duration: 5000,
    });
  } finally {
    // Скидаємо інпут
    if (avatarUploadInput) {
      avatarUploadInput.value = "";
    }
    if (avatarUploadBtn) {
      avatarUploadBtn.disabled = false;
      // Відновлюємо правильну іконку залежно від стану аватару
      const avatarType = authState.user?.avatar_type || "generated";
      const hasUploadedAvatar = avatarType === "uploaded" && authState.user?.avatar_url;
      const icon = avatarUploadBtn.querySelector(".icon");
      if (icon) {
        icon.setAttribute("data-lucide", hasUploadedAvatar ? "camera" : "upload");
        lucide.createIcons();
      }
      avatarUploadBtn.setAttribute("aria-label", hasUploadedAvatar ? "Завантажити іншу фото" : "Завантажити фото");
    }
  }
}

// Функція для відкриття модалки видалення прогнозу з історії
function openDeleteHistoryModal(predictionId, actionButton) {
  const modal = document.getElementById("delete-history-modal");
  if (modal) {
    // Зберігаємо ID прогнозу та кнопку для видалення в дата-атрибутах модалки
    modal.dataset.predictionId = predictionId;
    // Створюємо унікальний ID для кнопки якщо його немає
    if (!actionButton.id) {
      actionButton.id = `history-delete-btn-${predictionId}-${Date.now()}`;
    }
    modal.dataset.actionButtonId = actionButton.id;
    
    modal.removeAttribute("hidden");
    modal.hidden = false;
    lucide.createIcons();
  }
}

// Функція для закриття модалки видалення прогнозу з історії
function closeDeleteHistoryModal() {
  const modal = document.getElementById("delete-history-modal");
  if (modal) {
    modal.setAttribute("hidden", "");
    modal.hidden = true;
    delete modal.dataset.predictionId;
    delete modal.dataset.actionButtonId;
  }
}

// Функція для підтвердження видалення прогнозу з історії (викликається з модалки)
async function confirmDeleteHistory() {
  const modal = document.getElementById("delete-history-modal");
  if (!modal) return;
  
  // Зберігаємо дані з dataset перед закриттям модалки
  const predictionId = modal.dataset.predictionId;
  const actionButtonId = modal.dataset.actionButtonId;
  
  if (!predictionId) return;
  
  const id = Number.parseInt(predictionId, 10);
  if (!Number.isFinite(id)) return;
  
  closeDeleteHistoryModal();
  
  // Знаходимо кнопку за ID (якщо вона збережена)
  const actionButton = actionButtonId ? document.getElementById(actionButtonId) : null;
  
  if (actionButton) {
    actionButton.disabled = true;
  }
  
  try {
    await apiFetch(`/users/me/history/${id}`, { method: "DELETE" });
    
    authState.history = authState.history.filter((item) => item.id !== id);
    renderHistoryTable();
    
    // Оновлюємо predictionStore якщо видалений прогноз був останнім для якогось target
    populatePredictionStoreFromHistory();
    
    // Оновлюємо діаграми якщо вони вже ініціалізовані
    if (insightsInitialized) {
      renderProfileOverviewChart();
      renderRiskComparisonChart();
      renderInsightsFactorsChart();
    }
    
    // Показуємо повідомлення про успіх
    showNotification({
      type: "success",
      title: "Запис видалено",
      message: "Запис історії успішно видалено.",
      duration: 3000,
    });
  } catch (error) {
    showNotification({
      type: "error",
      title: "Помилка",
      message: error.message || "Не вдалося видалити запис історії.",
      duration: 5000,
    });
  } finally {
    if (actionButton) {
      actionButton.disabled = false;
    }
  }
}

// Функція для відкриття модалки видалення аватара
function openDeleteAvatarModal() {
  const modal = document.getElementById("delete-avatar-modal");
  if (modal) {
    modal.removeAttribute("hidden");
    modal.hidden = false;
    lucide.createIcons();
  }
}

// Функція для закриття модалки видалення аватара
function closeDeleteAvatarModal() {
  const modal = document.getElementById("delete-avatar-modal");
  if (modal) {
    modal.setAttribute("hidden", "");
    modal.hidden = true;
  }
}

async function handleAvatarReset() {
  if (!authState.user) return;
  
  // Відкриваємо модалку замість стандартного confirm
  openDeleteAvatarModal();
}

// Функція для підтвердження видалення аватара (викликається з модалки)
async function confirmDeleteAvatar() {
  if (!authState.user) return;
  
  closeDeleteAvatarModal();
  setProfileStatus("Скидання аватару...", "info");
  
  if (avatarResetBtn) {
    avatarResetBtn.disabled = true;
  }
  if (avatarDeleteBtn) {
    avatarDeleteBtn.disabled = true;
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
    
    // Видимість кнопок оновлюється через updateAvatarButtons()
    // Оновлюємо оригінальні значення після видалення аватару
    saveOriginalProfileData();
    
    // Показуємо нотифікацію про успіх
    showNotification({
      type: "success",
      title: "Фото видалено",
      message: "Фото профілю успішно видалено. Повернуто стандартний аватар.",
      duration: 4000,
    });
  } catch (error) {
    setProfileStatus(error.message || "Не вдалося скинути аватар. Спробуйте пізніше.", "error");
    showNotification({
      type: "error",
      title: "Помилка",
      message: error.message || "Не вдалося видалити фото. Спробуйте пізніше.",
      duration: 5000,
    });
  } finally {
    if (avatarResetBtn) {
      avatarResetBtn.disabled = false;
    }
    if (avatarDeleteBtn) {
      avatarDeleteBtn.disabled = false;
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
    
    const successMessage = response.message || "Пароль успішно змінено.";
    setPasswordStatus(successMessage, "info");
    
    showNotification({
      type: "success",
      title: "Пароль змінено",
      message: successMessage,
      duration: 4000,
    });
    
    // Очищаємо поля форми
    if (profileCurrentPasswordInput) profileCurrentPasswordInput.value = "";
    if (profileNewPasswordInput) profileNewPasswordInput.value = "";
    if (profileConfirmPasswordInput) profileConfirmPasswordInput.value = "";
  } catch (error) {
    const errorMessage = error.message || "Не вдалося змінити пароль. Спробуйте ще раз.";
    setPasswordStatus(errorMessage, "error");
    showNotification({
      type: "error",
      title: "Помилка зміни пароля",
      message: errorMessage,
      duration: 5000,
    });
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
        } catch (clipboardError) {
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
          }
        } catch (execCommandError) {
        }
      }

      // Відкриваємо посилання в новій вкладці
      try {
        window.open(resetUrl, '_blank', 'noopener,noreferrer');
      } catch (openError) {
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
          const escapedUrlForData = resetUrl.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
          const messageHTML = `<strong>Посилання для скидання пароля (дипломна версія):</strong><br><br><a href="${escapedUrl}" id="reset-password-link-copy" data-url="${escapedUrlForData}" style="color: #15803d; text-decoration: underline; cursor: pointer; font-weight: 600; word-break: break-all;">${resetUrl}</a><br><br>Натисніть на посилання вище, щоб скопіювати його.`;
          forgotPasswordSuccess.innerHTML = messageHTML;
          forgotPasswordSuccess.hidden = false;
          
          // Додаємо обробник для копіювання посилання (після вставки HTML)
          setTimeout(() => {
            const copyLink = document.getElementById("reset-password-link-copy");
            if (copyLink) {
              copyLink.addEventListener("click", async (e) => {
                e.preventDefault();
                const url = copyLink.dataset.url || copyLink.getAttribute("href");
                if (!url) return;
                
                // Декодуємо HTML entities
                const decodedUrl = url
                  .replace(/&apos;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/&amp;/g, "&");
                
                try {
                  // Спробуємо скопіювати через Clipboard API
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(decodedUrl);
                    showNotification({
                      type: "success",
                      title: "Посилання скопійовано",
                      message: "Посилання для скидання пароля скопійовано в буфер обміну.",
                      duration: 3000,
                    });
                  } else {
                    // Fallback через execCommand
                    const textArea = document.createElement("textarea");
                    textArea.value = decodedUrl;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-999999px";
                    textArea.style.top = "-999999px";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    const successful = document.execCommand("copy");
                    document.body.removeChild(textArea);
                    
                    if (successful) {
                      showNotification({
                        type: "success",
                        title: "Посилання скопійовано",
                        message: "Посилання для скидання пароля скопійовано в буфер обміну.",
                        duration: 3000,
                      });
                    } else {
                      showNotification({
                        type: "error",
                        title: "Помилка",
                        message: "Не вдалося скопіювати посилання. Спробуйте скопіювати вручну.",
                        duration: 5000,
                      });
                    }
                  }
                } catch (error) {
                  showNotification({
                    type: "error",
                    title: "Помилка",
                    message: "Не вдалося скопіювати посилання. Спробуйте скопіювати вручну.",
                    duration: 5000,
                  });
                }
              });
            }
          }, 100);
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
      
      
      showNotification({
        type: "success",
        title: "Інструкції надіслано",
        message: copied 
          ? "Посилання для скидання пароля скопійовано у буфер обміну та відкрито в новій вкладці." 
          : "Посилання для скидання пароля відкрито в новій вкладці. Натисніть на посилання вище, щоб скопіювати його.",
        duration: 5000,
      });
    } else {
      // Якщо reset_token відсутній - користувача не знайдено
      // (Але це не повинно статися, якщо backend правильно повертає помилку)
      const errorMessage = "Користувача з такою електронною поштою не зареєстровано.";
      setForgotPasswordError(errorMessage);
      
      showNotification({
        type: "error",
        title: "Помилка відновлення пароля",
        message: errorMessage,
        duration: 5000,
      });
      
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
    setForgotPasswordError(errorMessage);
    
    showNotification({
      type: "error",
      title: "Помилка відновлення пароля",
      message: errorMessage,
      duration: 5000,
    });
    
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
    const successMessage = data.message || "Пароль успішно оновлено!";
    if (resetPasswordError) {
      resetPasswordError.textContent = successMessage;
      resetPasswordError.style.color = "var(--success-color, #4ade80)";
      resetPasswordError.hidden = false;
    }
    
    showNotification({
      type: "success",
      title: "Пароль оновлено",
      message: successMessage,
      duration: 4000,
    });
    
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
    showNotification({
      type: "error",
      title: "Помилка оновлення пароля",
      message: errorMessage,
      duration: 5000,
    });
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
    return;
  }
  
  handleLogout.inProgress = true;
  
  try {
    await apiFetch("/auth/logout", { method: "POST" }, { skipAuth: false });
    showNotification({
      type: "info",
      title: "Вихід виконано",
      message: "Ви успішно вийшли з системи.",
      duration: 3000,
    });
  } catch (error) {
    showNotification({
      type: "warning",
      title: "Помилка виходу",
      message: "Під час виходу сталася помилка, але сесію було очищено.",
      duration: 4000,
    });
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
    // Відкриваємо модалку замість стандартного confirm
    openDeleteHistoryModal(id, actionButton);
  }
}

function handleDocumentClick(event) {
  // Обробка кліків поза елементами (якщо потрібно)
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape") {
    // Закриваємо модальне вікно видалення прогнозу з історії, якщо воно відкрите
    if (deleteHistoryModal && !deleteHistoryModal.hidden) {
      closeDeleteHistoryModal();
      return;
    }
    // Закриваємо модальне вікно видалення аватара, якщо воно відкрите
    if (deleteAvatarModal && !deleteAvatarModal.hidden) {
      closeDeleteAvatarModal();
      return;
    }
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
    return null;
  }

  if (!title) {
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

/**
 * Показує кастомну модалку підтвердження (заміна confirm)
 * @param {string} message - Повідомлення для відображення
 * @param {string} title - Заголовок модалки (опційно)
 * @param {string} type - Тип модалки: 'warning', 'danger', 'info' (за замовчуванням 'warning')
 * @returns {Promise<boolean>} Promise, який резолвиться з true якщо підтверджено, false якщо скасовано
 */
function showConfirm(message, title = "Підтвердження", type = "warning") {
  return new Promise((resolve) => {
    const modalId = `custom-modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const container = document.getElementById("custom-modal-container");
    if (!container) {
      resolve(false);
      return;
    }

    const iconMap = {
      warning: "alert-triangle",
      danger: "alert-circle",
      info: "info",
      success: "check-circle",
    };

    const colorMap = {
      warning: "rgba(255, 193, 7, 0.95)",
      danger: "rgba(241, 94, 111, 0.95)",
      info: "rgba(95, 109, 250, 0.95)",
      success: "rgba(34, 197, 94, 0.95)",
    };

    const icon = iconMap[type] || iconMap.warning;
    const color = colorMap[type] || colorMap.warning;

    const modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal custom-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", `${modalId}-title`);

    modal.innerHTML = `
      <div class="modal__backdrop custom-modal__backdrop"></div>
      <div class="modal__container">
        <div class="modal__content glass-card">
          <div class="modal__header">
            <h2 class="modal__title" id="${modalId}-title" style="color: ${color};">
              <span class="icon" data-lucide="${icon}"></span>
              <span>${escapeHtml(title)}</span>
            </h2>
          </div>
          <div class="modal__body">
            <p class="modal__message">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
          </div>
          <div class="modal__actions">
            <button type="button" class="button button--ghost custom-modal__cancel-btn">Скасувати</button>
            <button type="button" class="button button--primary custom-modal__confirm-btn" style="background: ${color}; border-color: ${color};">
              <span>Підтвердити</span>
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(modal);
    refreshIcons();

    const closeModal = (result) => {
      modal.classList.add("custom-modal--closing");
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        resolve(result);
      }, 300);
    };

    const confirmBtn = modal.querySelector(".custom-modal__confirm-btn");
    const cancelBtn = modal.querySelector(".custom-modal__cancel-btn");
    const backdrop = modal.querySelector(".custom-modal__backdrop");

    confirmBtn.addEventListener("click", () => closeModal(true));
    cancelBtn.addEventListener("click", () => closeModal(false));
    backdrop.addEventListener("click", () => closeModal(false));

    // Закриваємо по Escape
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal(false);
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);

    // Фокус на кнопці підтвердження
    setTimeout(() => confirmBtn.focus(), 100);
  });
}

/**
 * Показує кастомну модалку alert (заміна alert)
 * @param {string} message - Повідомлення для відображення
 * @param {string} title - Заголовок модалки (опційно)
 * @param {string} type - Тип модалки: 'info', 'success', 'warning', 'error' (за замовчуванням 'info')
 * @returns {Promise<void>} Promise, який резолвиться після закриття модалки
 */
function showAlert(message, title = "Повідомлення", type = "info") {
  return new Promise((resolve) => {
    const modalId = `custom-modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const container = document.getElementById("custom-modal-container");
    if (!container) {
      resolve();
      return;
    }

    const iconMap = {
      info: "info",
      success: "check-circle",
      warning: "alert-triangle",
      error: "alert-circle",
    };

    const colorMap = {
      info: "rgba(95, 109, 250, 0.95)",
      success: "rgba(34, 197, 94, 0.95)",
      warning: "rgba(255, 193, 7, 0.95)",
      error: "rgba(241, 94, 111, 0.95)",
    };

    const icon = iconMap[type] || iconMap.info;
    const color = colorMap[type] || colorMap.info;

    const modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal custom-modal";
    modal.setAttribute("role", "alertdialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", `${modalId}-title`);

    modal.innerHTML = `
      <div class="modal__backdrop custom-modal__backdrop"></div>
      <div class="modal__container">
        <div class="modal__content glass-card">
          <div class="modal__header">
            <h2 class="modal__title" id="${modalId}-title" style="color: ${color};">
              <span class="icon" data-lucide="${icon}"></span>
              <span>${escapeHtml(title)}</span>
            </h2>
          </div>
          <div class="modal__body">
            <p class="modal__message">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
          </div>
          <div class="modal__actions">
            <button type="button" class="button button--primary custom-modal__ok-btn" style="background: ${color}; border-color: ${color};">
              <span>ОК</span>
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(modal);
    refreshIcons();

    const closeModal = () => {
      modal.classList.add("custom-modal--closing");
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        resolve();
      }, 300);
    };

    const okBtn = modal.querySelector(".custom-modal__ok-btn");
    const backdrop = modal.querySelector(".custom-modal__backdrop");

    okBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    // Закриваємо по Escape або Enter
    const handleKey = (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        closeModal();
        document.removeEventListener("keydown", handleKey);
      }
    };
    document.addEventListener("keydown", handleKey);

    // Фокус на кнопці ОК
    setTimeout(() => okBtn.focus(), 100);
  });
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
  // Показуємо кнопку "Згенерувати Звіт" після успішного розрахунку
  if (generateReportBtn) {
    generateReportBtn.hidden = false;
  }
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
    loadHistory().catch(() => {});
  }
  
  // Показуємо сповіщення про успішне прогнозування
  const riskPercentage = (data.probability * 100).toFixed(2);
  const riskLabel = riskLabels[data.risk_bucket] || data.risk_bucket;
  showNotification({
    type: "success",
    title: "Прогноз розраховано",
    message: `Ризик: ${riskPercentage}% (${riskLabel}). Результати збережено в історії.`,
    duration: 5000,
  });
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
  // Для захищених сторінок перевіряємо автентифікацію перед активацією
  // Але тільки якщо authState.initialized === true (як для діаграм)
  const protectedSections = ["page-form", "page-insights", "page-profile", "page-history", "page-assistant", "page-chats", "page-report"];
  if (protectedSections.includes(sectionId) && !authState.user && authState.initialized) {
    // Якщо користувач не автентифікований і автентифікація вже ініціалізована, не активуємо сторінку
    // Вже перенаправлено в showSectionForPath, просто виходимо
    return;
  }
  
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
    // Забезпечуємо, що секція не має атрибуту hidden при активації
    if (targetPage.hasAttribute("hidden")) {
      targetPage.removeAttribute("hidden");
      targetPage.hidden = false;
    }
    targetPage.classList.add("page--active");
  }
  
  navItems.forEach((item) => {
    item.classList.toggle("nav-item--active", item.dataset.section === sectionId);
  });
  if (sectionId === "page-insights") {
    initializeInsightsPage().catch((error) => {
    });
  }
  if (sectionId === "page-chats") {
    // Перевіряємо автентифікацію перед виконанням API запитів
    // Якщо автентифікація ще не ініціалізована, чекаємо
    if (!authState.initialized) {
      // Чекаємо, поки автентифікація ініціалізується
      return;
    }
    // Якщо користувач не автентифікований після ініціалізації, перенаправляємо
    if (!authState.user) {
      // Використовуємо handleUnauthorized для примусового редіректу
      handleUnauthorized();
      return;
    }
    
    // Використовуємо актуальний шлях з URL
    const path = window.location.pathname;
    if (path && path.startsWith("/c/")) {
      const uuid = path.substring(3);
      if (!uuid) {
        return;
      }
      if (typeof loadChat === "function") {
        loadChat(uuid).catch((e) => {
          // Якщо помилка автентифікації, просто ігноруємо - handleUnauthorized вже викликано
          if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
            return; // Не показуємо помилку, не логуємо, не перенаправляємо (вже зроблено)
          }
        });
      }
    } else {
      // На сторінці /chats (без конкретного чату)
      // Перевіряємо, чи є збережений останній відкритий чат
      if (lastOpenedChatUuid && typeof loadChat === "function") {
        // Відкриваємо останній відкритий чат
        navigateTo(`/c/${lastOpenedChatUuid}`, { replace: true });
      } else {
        // Показуємо список активних чатів
        showChatsListFull();
        if (typeof loadChatsList === "function") {
          loadChatsList().catch((e) => {
            // Якщо помилка автентифікації, просто ігноруємо - handleUnauthorized вже викликано
            if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
              return; // Не показуємо помилку, не логуємо, не перенаправляємо (вже зроблено)
            }
          });
        }
      }
    }
    if (authState.user && typeof loadUnreadCount === "function") {
      loadUnreadCount().catch((e) => {
        // Ігноруємо помилки для unread count, це не критично
        if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
          return; // Не показуємо помилку, не логуємо
        }
      });
    }
  }
  if (sectionId === "page-history") {
    initHistoryControls();
  }
  if (sectionId === "page-assistant") {
    initializeAssistantPage().catch((error) => {
      showNotification({
        type: "error",
        title: "Помилка ініціалізації",
        message: "Не вдалося завантажити чат асистента.",
        duration: 4000,
      });
    });
  }
  if (sectionId === "page-profile") {
    updateProfileSection();
  }
  if (sectionId === "page-report") {
    initializeReportPage();
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
    const errorMessage = "Метадані ще завантажуються, спробуйте пізніше.";
    showError(errorMessage);
    showNotification({
      type: "warning",
      title: "Метадані не готові",
      message: errorMessage,
      duration: 4000,
    });
    return;
  }

  const target = targetSelect.value;
  if (!target) {
    const errorMessage = "Оберіть ціль прогнозування";
    showError(errorMessage);
    showNotification({
      type: "warning",
      title: "Помилка форми",
      message: errorMessage,
      duration: 4000,
    });
    return;
  }

  const { payload, missing } = collectPayload();
  if (missing.length > 0) {
    const errorMessage = `Заповніть поля: ${missing.join(", ")}`;
    showError(errorMessage);
    showNotification({
      type: "warning",
      title: "Помилка форми",
      message: errorMessage,
      duration: 5000,
    });
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
    // Після відображення результату — фіксуємо snapshot і ховаємо кнопку до змін
    try {
      lastSubmittedHash = hashPredictionInput(
        payload,
        target,
        String(modelSelect?.value || "auto")
      );
    } catch {
      lastSubmittedHash = null;
    }
    if (submitButton) {
      submitButton.hidden = true;
      submitButton.disabled = true;
    }
    updateSubmitAvailability();
    
    // Оновлюємо історію після успішного прогнозування (для автентифікованих користувачів)
    if (authState.token && authState.user) {
      try {
        await loadHistory(50);
        
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
            });
          refreshDashboardCharts();
        }
  } catch (error) {
      }
    } else {
    }
  } catch (error) {
    const errorMessage = error.message || "Не вдалося розрахувати прогноз. Спробуйте ще раз.";
    showError(errorMessage);
    showNotification({
      type: "error",
      title: "Помилка прогнозування",
      message: errorMessage,
      duration: 5000,
    });
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

// Прапорець: чи користувач натискав "Заповнити випадкові дані"
let demoUsed = false;
let lastSubmittedHash = null;

function isPredictionFormComplete() {
  if (!targetSelect || !featuresContainer) return false;
  const targetOk = !!targetSelect.value;
  if (!targetOk) return false;
  // Перевіряємо, що всі інпути у контейнері заповнені (не порожні)
  const inputs = Array.from(featuresContainer.querySelectorAll("input, select, textarea"));
  if (inputs.length === 0) return false;
  for (const el of inputs) {
    if (el.disabled || el.hidden) continue;
    const val = (el.value ?? "").toString().trim();
    if (val === "") return false;
  }
  return true;
}

function updateSubmitAvailability() {
  if (!submitButton) return;
  const complete = isPredictionFormComplete();
  let shouldShow = complete;
  if (complete) {
    try {
      const { payload } = collectPayload();
      const currentHash = hashPredictionInput(
        payload,
        String(targetSelect?.value || ""),
        String(modelSelect?.value || "auto")
      );
      if (lastSubmittedHash && currentHash === lastSubmittedHash) {
        shouldShow = false;
      }
    } catch {}
  }
  submitButton.hidden = !shouldShow;
  submitButton.disabled = !shouldShow;
  // Оновлюємо текст на кнопці демо-заповнення залежно від стану
  if (demoButton) {
    if (complete && demoUsed) {
      demoButton.textContent = "Перезаповнити ще раз";
    } else {
      demoButton.textContent = "Заповнити випадкові дані";
    }
  }
}

function hashPredictionInput(payload, target, model) {
  const normalize = (obj) => {
    const out = {};
    Object.keys(obj || {})
      .sort()
      .forEach((k) => {
        const v = obj[k];
        const num = typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : v;
        out[k] = num;
      });
    return out;
  };
  const normalized = normalize(payload);
  return JSON.stringify({ t: target || "", m: model || "auto", p: normalized });
}

function fillRandomDemoData() {
  if (!metadataCache) {
    const errorMessage = "Метадані ще завантажуються, спробуйте пізніше.";
    showError(errorMessage);
    showNotification({
      type: "warning",
      title: "Метадані не готові",
      message: errorMessage,
      duration: 4000,
    });
    return;
  }

  if (inputRefs["RIDAGEYR"]) inputRefs["RIDAGEYR"].value = randomInt(18, 80);
  if (inputRefs["RIAGENDR"]) inputRefs["RIAGENDR"].value = Math.random() < 0.5 ? "1" : "2";
  if (inputRefs["BMXBMI"]) inputRefs["BMXBMI"].value = randomFloat(18.0, 38.0, 1);
  if (inputRefs["BPXSY1"]) inputRefs["BPXSY1"].value = randomInt(100, 170);
  if (inputRefs["BPXDI1"]) inputRefs["BPXDI1"].value = randomInt(60, 105);
  if (inputRefs["LBXGLU"]) inputRefs["LBXGLU"].value = randomInt(80, 180);
  if (inputRefs["LBXTC"]) inputRefs["LBXTC"].value = randomInt(140, 260);

  // Рандомно обираємо ціль прогнозування
  if (targetSelect) {
    const targets = ["diabetes_present", "obesity_present"];
    targetSelect.value = targets[Math.floor(Math.random() * targets.length)];
  }

  updateAllIndicators();
  clearError();
  updateSubmitAvailability();
  demoUsed = true;
  // Оновлюємо підпис кнопки, якщо все заповнено
  if (demoButton && isPredictionFormComplete()) {
    demoButton.textContent = "Перезаповнити ще раз";
  }
  // Після рандомного заповнення: розміщення кнопок — зліва submit, справа demo
  const actions = document.querySelector(".form__actions");
  if (actions) {
    actions.classList.add("form__actions--calc-left");
  }
  
  showNotification({
    type: "info",
    title: "Демо-дані заповнено",
    message: "Форма заповнена випадковими значеннями. Можете розрахувати прогноз або змінити дані.",
    duration: 4000,
  });
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
      note.textContent = "Щойно обидва ризики будуть розраховані, тут з'явиться порівняння.";
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

  // Заповнюємо predictionStore з історії перед рендерингом діаграм
  if (authState.token && authState.user) {
    // Переконаємося що історія завантажена
    if (authState.history.length === 0) {
      await loadHistory();
    } else {
      populatePredictionStoreFromHistory();
    }
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
      showHistoryChartsEmptyState();
    }
  } else {
    showHistoryChartsEmptyState();
  }

  try {
    const analytics = await loadAnalyticsData();
    renderAllAnalyticsCharts(analytics);
  } catch (error) {
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
    // Відстежуємо заповнення для керування кнопкою відправки
    if (targetSelect) {
      targetSelect.addEventListener("change", updateSubmitAvailability);
    }
    if (modelSelect) {
      modelSelect.addEventListener("change", updateSubmitAvailability);
    }
    if (featuresContainer) {
      featuresContainer.addEventListener("input", updateSubmitAvailability);
      featuresContainer.addEventListener("change", updateSubmitAvailability);
    }
    // Початковий стан
    updateSubmitAvailability();
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
        const protectedSections = ["page-profile", "page-history", "page-insights", "page-form", "page-assistant"];
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
        if (avatarColorInput) avatarColorInput.value = originalProfileData.avatar_color;
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
  ];
  
  profileFormInputs.forEach((input) => {
    if (input) {
      input.addEventListener("input", checkProfileFormChanges);
      input.addEventListener("change", checkProfileFormChanges);
    }
  });
  
  // Обробник для зміни кольору аватару (live preview + перевірка змін)
  if (avatarColorInput) {
    // Live preview - оновлюємо аватар при зміні кольору в реальному часі
    avatarColorInput.addEventListener("input", (event) => {
      const newColor = event.target.value;
      const profileAvatarLarge = document.getElementById("profile-avatar-large");
      
      // Оновлюємо аватар тільки якщо це згенерований аватар (не завантажене фото)
      const avatarType = authState.user?.avatar_type || "generated";
      if (avatarType !== "uploaded" && profileAvatarLarge) {
        profileAvatarLarge.style.background = newColor;
        profileAvatarLarge.style.backgroundImage = "none";
      }
    });
    
    // Перевірка змін при завершенні вибору кольору
    avatarColorInput.addEventListener("change", () => {
      checkProfileFormChanges();
      
      // Показуємо нотифікацію про зміну кольору (інформативну)
      showNotification({
        type: "info",
        title: "Колір аватара змінено",
        message: "Не забудьте зберегти зміни, щоб застосувати новий колір.",
        duration: 3000,
      });
    });
  }
  
  // Обробник для кнопки вибору кольору аватару
  if (avatarColorBtn) {
    avatarColorBtn.addEventListener("click", () => {
      if (avatarColorInput) {
        avatarColorInput.click();
      }
    });
  }
  
  // Обробник для кнопки видалення фото
  if (avatarDeleteBtn) {
    avatarDeleteBtn.addEventListener("click", () => {
      handleAvatarReset();
    });
  }
  
  // Обробники для модалки видалення аватара
  if (deleteAvatarModalBackdrop) {
    deleteAvatarModalBackdrop.addEventListener("click", closeDeleteAvatarModal);
  }
  
  if (deleteAvatarCancelBtn) {
    deleteAvatarCancelBtn.addEventListener("click", closeDeleteAvatarModal);
  }
  
  if (deleteAvatarConfirmBtn) {
    deleteAvatarConfirmBtn.addEventListener("click", confirmDeleteAvatar);
  }
  
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
  
  // Обробники для модалки видалення прогнозу з історії
  if (deleteHistoryModalBackdrop) {
    deleteHistoryModalBackdrop.addEventListener("click", closeDeleteHistoryModal);
  }
  
  if (deleteHistoryCancelBtn) {
    deleteHistoryCancelBtn.addEventListener("click", closeDeleteHistoryModal);
  }
  
  if (deleteHistoryConfirmBtn) {
    deleteHistoryConfirmBtn.addEventListener("click", confirmDeleteHistory);
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
  
  // Обробник кліків на nav-item кнопки через делегування подій
  const sidebarNav = document.querySelector(".sidebar__nav");
  if (sidebarNav) {
    sidebarNav.addEventListener("click", (event) => {
      const navItem = event.target.closest(".nav-item");
      if (navItem && navItem.dataset.section) {
        const section = navItem.dataset.section;
        // Знаходимо шлях для цієї секції
        const path = Object.keys(ROUTE_SECTIONS).find(key => ROUTE_SECTIONS[key] === section);
        if (path) {
          navigateTo(path);
        }
      }
    });
  }
  
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
  // УЛЬТРА-РАННІЙ GUARD: перевірка автентифікації ДО запуску всієї SPA-логіки
  const publicBasePaths = ["/login", "/register", "/reset-password", "/forgot-password"];
  const pathname = window.location.pathname.split("?")[0];
  
  // Дізнаємося ключ токена з існуючого коду
  const tokenKey = AUTH_TOKEN_KEY; // "hr_auth_token"
  const token = window.localStorage.getItem(tokenKey);
  const hasToken = Boolean(token);
  
  const isPublic = publicBasePaths.includes(pathname);
  
  // Якщо немає токена і маршрут НЕ публічний → одразу редірект на /login і не запускаємо SPA-логіку
  if (!hasToken && !isPublic) {
    const loginPath = "/login";
    
    if (window.location.pathname !== loginPath) {
      window.location.replace(loginPath);
    }
    
    // ВАЖЛИВО: ПЕРЕРВА виконання. Далі ніякий initializeAuth / showSectionForPath не викликаємо
    return;
  }
  
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
  initializeAuth().catch(() => {});
  initializeApiStatus();
  registerEventListeners();
  fetchMetadata();
  initializeChats();
})();

// ========== Chats functionality ==========
let currentChatUuid = null;
let lastOpenedChatUuid = null; // Зберігаємо останній відкритий чат до вилогінення
let chatsList = [];
let usersList = [];
let unreadCount = 0;
let isEditMode = false; // Режим редагування для drag-and-drop
let recentlyUnblockedUsers = new Set(); // Множина ID користувачів, які були нещодавно розблоковані (до вилогінення)

async function loadUnreadCount() {
  // Перевіряємо автентифікацію перед виконанням запиту
  if (!authState.initialized) {
    // Чекаємо, поки автентифікація ініціалізується
    return;
  }
  if (!authState.user) {
    // Якщо користувач не автентифікований, не робимо запит (це не критично)
    return;
  }
  try {
    const res = await apiFetch("/api/chats/unread-count");
    unreadCount = res.count || 0;
    updateChatsBadge();
  } catch (e) {
    // Якщо помилка автентифікації, handleUnauthorized вже викликається в apiFetch
    // Для unread count це не критично, просто ігноруємо помилку
    if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
      return; // Просто виходимо, не показуємо помилку, не логуємо
    }
  }
}

function updateChatsBadge() {
  const badge = document.getElementById("nav-chats-badge");
  if (!badge) {
    // Якщо елемент ще не завантажений, спробуємо через невелику затримку
    setTimeout(() => updateChatsBadge(), 100);
    return;
  }
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}

function showUnreadMessagesNotification() {
  // Перевіряємо, чи є чати з непрочитаними повідомленнями
  if (!Array.isArray(chatsList) || chatsList.length === 0) {
    return;
  }
  
  // Знаходимо чати з непрочитаними повідомленнями
  const unreadChats = chatsList.filter(chat => chat.unread_count > 0);
  
  if (unreadChats.length === 0) {
    return; // Немає непрочитаних повідомлень
  }
  
  // Обчислюємо загальну кількість непрочитаних повідомлень
  const totalUnread = unreadChats.reduce((sum, chat) => sum + chat.unread_count, 0);
  
  // Формуємо повідомлення
  let message = "";
  if (unreadChats.length === 1) {
    // Один чат з непрочитаними повідомленнями
    const chat = unreadChats[0];
    const senderName = chat.other_user?.display_name || chat.other_user?.email || "Користувач";
    const lastMsg = chat.last_message?.content || "";
    const preview = lastMsg.length > 50 ? lastMsg.substring(0, 50) + "..." : lastMsg;
    message = `${senderName}: ${preview || "Нове повідомлення"}`;
  } else {
    // Кілька чатів з непрочитаними повідомленнями
    // Показуємо перші 2-3 чати
    const topChats = unreadChats.slice(0, 3);
    const chatPreviews = topChats.map(chat => {
      const senderName = chat.other_user?.display_name || chat.other_user?.email || "Користувач";
      const lastMsg = chat.last_message?.content || "";
      const preview = lastMsg.length > 30 ? lastMsg.substring(0, 30) + "..." : lastMsg;
      return `${senderName}: ${preview || "нове повідомлення"}`;
    }).join("\n");
    
    const remaining = unreadChats.length - 3;
    if (remaining > 0) {
      message = `${chatPreviews}\n... та ще ${remaining} ${remaining === 1 ? 'чат' : 'чатів'}`;
    } else {
      message = chatPreviews;
    }
  }
  
  // Показуємо сповіщення
  showNotification({
    type: "info",
    title: `У вас ${totalUnread} ${totalUnread === 1 ? 'нове повідомлення' : totalUnread < 5 ? 'нові повідомлення' : 'нових повідомлень'}`,
    message: message,
    duration: 6000,
  });
}

async function loadChatsList({ skipAuthCheck = false } = {}) {
  // Перевіряємо автентифікацію перед виконанням запиту
  if (!authState.initialized) {
    // Чекаємо, поки автентифікація ініціалізується
    return;
  }
  if (!authState.user) {
    // Якщо користувач не автентифікований, перенаправляємо на логін (тільки якщо не skipAuthCheck)
    if (!skipAuthCheck) {
      handleUnauthorized();
    }
    return;
  }
  try {
    const result = await apiFetch("/api/chats", {}, { skipAuthCheck });
    // Перевіряємо, чи результат є масивом
    chatsList = Array.isArray(result) ? result : [];
    renderChatsList();
  } catch (e) {
    // Якщо помилка автентифікації, handleUnauthorized вже викликається в apiFetch (якщо не skipAuthCheck)
    // Не показуємо помилку користувачу, бо вже перенаправлено на login
    if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
      return; // Просто виходимо, не показуємо помилку
    }
    // Встановлюємо порожній масив на випадок помилки
    chatsList = [];
    renderChatsList();
  }
}

async function loadUsersList({ skipAuthCheck = false } = {}) {
  // Перевіряємо автентифікацію перед виконанням запиту
  if (!authState.initialized) {
    // Чекаємо, поки автентифікація ініціалізується
    return;
  }
  if (!authState.user) {
    // Якщо користувач не автентифікований, перенаправляємо на логін (тільки якщо не skipAuthCheck)
    if (!skipAuthCheck) {
      handleUnauthorized();
    }
    return;
  }
  try {
    // Спочатку завантажуємо список чатів, щоб знати, з якими користувачами вже є чати
    if (!Array.isArray(chatsList) || chatsList.length === 0) {
      await loadChatsList({ skipAuthCheck });
    }
    usersList = await apiFetch("/api/chats/users", {}, { skipAuthCheck });
    renderUsersList();
  } catch (e) {
    // Якщо помилка автентифікації, handleUnauthorized вже викликається в apiFetch (якщо не skipAuthCheck)
    // Не показуємо помилку користувачу, бо вже перенаправлено на login
    if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
      return; // Просто виходимо, не показуємо помилку, не логуємо
    }
  }
}

function renderChatsList() {
  const container = document.getElementById("chats-list");
  const empty = document.getElementById("chats-empty");
  if (!container) return;
  
  // Перевіряємо, чи chatsList є масивом
  if (!Array.isArray(chatsList)) {
    chatsList = [];
  }
  
  if (chatsList.length === 0) {
    container.innerHTML = "";
    if (empty) empty.hidden = false;
    // Приховуємо кнопку "Редагувати порядок", коли список пустий
    const editModeBtn = document.getElementById("chats-edit-mode-btn");
    if (editModeBtn) {
      editModeBtn.hidden = true;
    }
    return;
  }
  
  if (empty) empty.hidden = true;
  
  // Фільтруємо заблокованих користувачів
  const activeChats = chatsList.filter(chat => chat.other_user && chat.other_user.is_blocked !== true);
  
  // Приховуємо/показуємо кнопку "Редагувати порядок" залежно від наявності чатів
  const editModeBtn = document.getElementById("chats-edit-mode-btn");
  if (editModeBtn) {
    if (activeChats.length === 0) {
      editModeBtn.hidden = true;
    } else {
      editModeBtn.hidden = false;
    }
  }
  
  container.innerHTML = activeChats.map(chat => {
    const lastMsg = chat.last_message ? (chat.last_message.content.length > 50 ? chat.last_message.content.substring(0, 50) + "..." : chat.last_message.content) : "Немає повідомлень";
    const unreadBadge = chat.unread_count > 0 ? `<span class="chats-item__badge">${chat.unread_count > 99 ? "99+" : chat.unread_count}</span>` : "";
    const pinIcon = chat.is_pinned ? `<span class="chats-item__pin-icon" data-lucide="pin"></span>` : "";
    const gripIcon = isEditMode ? `<span class="chats-item__grip-icon" data-lucide="grip-vertical"></span>` : "";
    return `
      <div class="chats-item ${chat.is_pinned ? 'chats-item--pinned' : ''} ${isEditMode ? 'chats-item--edit-mode' : ''}" data-chat-uuid="${chat.uuid}" draggable="${isEditMode}">
        ${gripIcon}
        <div class="chats-item__avatar" data-user-id="${chat.other_user.id}">${getUserInitial(chat.other_user)}</div>
        <div class="chats-item__content">
          <div class="chats-item__header">
            <span class="chats-item__name">${chat.other_user.display_name}</span>
            ${pinIcon}
            ${unreadBadge}
          </div>
          <p class="chats-item__preview">${lastMsg}</p>
        </div>
        <div class="chats-item__actions">
          <button type="button" class="chats-item__action-btn chats-item__pin-btn" data-chat-uuid="${chat.uuid}" aria-label="${chat.is_pinned ? 'Відкріпити' : 'Закріпити'}">
            <span class="icon" data-lucide="${chat.is_pinned ? 'pin-off' : 'pin'}"></span>
          </button>
          <button type="button" class="chats-item__action-btn chats-item__delete-btn" data-chat-uuid="${chat.uuid}" aria-label="Видалити чат">
            <span class="icon" data-lucide="trash-2"></span>
          </button>
        </div>
      </div>
    `;
  }).join("");
  
  refreshIcons();
  
  // Застосовуємо стилі аватарок (фото або кольоровий фон)
  container.querySelectorAll(".chats-item__avatar").forEach(avatarEl => {
    const userId = Number(avatarEl.dataset.userId);
    const chat = chatsList.find(c => c.other_user.id === userId);
    if (chat && chat.other_user) {
      applyAvatarStyle(avatarEl, chat.other_user);
    }
  });
  
  // Додаємо обробники кліків
  container.querySelectorAll(".chats-item").forEach(item => {
    item.addEventListener("click", async (e) => {
      // Не відкриваємо чат, якщо клікнули на кнопку дії
      if (e.target.closest('.chats-item__actions')) {
        return;
      }
      const uuid = item.dataset.chatUuid;
      if (!uuid) {
        return;
      }
      navigateTo(`/c/${uuid}`);
    });
  });
  
  // Додаємо обробники для кнопок pin та delete
  container.querySelectorAll(".chats-item__pin-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const uuid = btn.dataset.chatUuid;
      if (!uuid) return;
      await togglePinChat(uuid);
    });
  });
  
  container.querySelectorAll(".chats-item__delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const uuid = btn.dataset.chatUuid;
      if (!uuid) return;
      await deleteChat(uuid);
    });
  });
  
  // Додаємо drag and drop функціональність
  setupDragAndDrop(container);
}

function renderUsersList() {
  const container = document.getElementById("chats-users-list");
  const empty = document.getElementById("chats-users-empty");
  if (!container) return;
  
  if (usersList.length === 0) {
    container.innerHTML = "";
    if (empty) {
      empty.textContent = "Немає доступних користувачів";
      empty.hidden = false;
    }
    return;
  }
  
  // Фільтруємо користувачів, які вже мають чати з поточним користувачем
  // Отримуємо список ID користувачів, з якими вже є чати
  const existingChatUserIds = new Set();
  if (Array.isArray(chatsList)) {
    chatsList.forEach(chat => {
      if (chat.other_user && chat.other_user.id) {
        existingChatUserIds.add(chat.other_user.id);
      }
    });
  }
  
  // Фільтруємо користувачів, виключаючи поточного користувача та тих, з ким вже є активні чати
  const currentUserId = authState.user?.id;
  
  // Розділяємо користувачів на активних та заблокованих
  const activeUsers = [];
  const blockedUsers = [];
  const recentlyUnblockedActiveUsers = [];
  
  usersList.forEach(user => {
    // Виключаємо поточного користувача
    if (user.id === currentUserId) return;
    
    // Перевіряємо, чи є активний чат з цим користувачем
    const hasActiveChat = existingChatUserIds.has(user.id);
    const isRecentlyUnblocked = recentlyUnblockedUsers.has(user.id);
    const isBlocked = user.is_blocked === true;
    
    if (isBlocked) {
      // Заблоковані користувачі показуємо окремо
      blockedUsers.push(user);
    } else if (!hasActiveChat) {
      // Активні користувачі без чатів
      if (isRecentlyUnblocked) {
        // Нещодавно розблоковані користувачі показуємо окремо
        recentlyUnblockedActiveUsers.push(user);
      } else {
        activeUsers.push(user);
      }
    }
  });
  
  // Сортуємо: спочатку активні, потім нещодавно розблоковані, потім заблоковані
  const allUsers = [...activeUsers, ...recentlyUnblockedActiveUsers, ...blockedUsers];
  
  if (allUsers.length === 0) {
    container.innerHTML = "";
    if (empty) {
      empty.textContent = "Немає доступних користувачів для нового чату";
      empty.hidden = false;
    }
    return;
  }
  
  if (empty) empty.hidden = true;
  
  container.innerHTML = allUsers.map(user => {
    const isBlocked = user.is_blocked === true;
    const isRecentlyUnblocked = recentlyUnblockedUsers.has(user.id);
    if (isBlocked) {
      // Для заблокованих користувачів: аватар всередині content, кнопка окремо
      return `
        <div class="chats-item chats-item--user chats-item--blocked" data-user-id="${user.id}" data-blocked="true">
          <div class="chats-item__content">
            <div class="chats-item__avatar" data-user-id="${user.id}">${getUserInitial(user)}</div>
            <div class="chats-item__content-inner">
              <div class="chats-item__header">
                <span class="chats-item__name">${user.display_name}</span>
                <span class="chats-item__blocked-badge">Заблокований</span>
              </div>
              <p class="chats-item__preview">${user.email}</p>
            </div>
          </div>
          <button type="button" class="button button--ghost button--small btn-unblock-user" data-user-id="${user.id}" aria-label="Розблокувати користувача">
            <span class="icon" data-lucide="user-check"></span>
            <span>Розблокувати</span>
          </button>
        </div>
      `;
    } else {
      // Для звичайних користувачів: стандартна структура з content-inner для вертикального розташування
      return `
        <div class="chats-item chats-item--user ${isRecentlyUnblocked ? 'chats-item--recently-unblocked' : ''}" data-user-id="${user.id}">
          <div class="chats-item__avatar" data-user-id="${user.id}">${getUserInitial(user)}</div>
          <div class="chats-item__content">
            <div class="chats-item__content-inner">
              <div class="chats-item__header">
                <span class="chats-item__name">${user.display_name}</span>
                ${isRecentlyUnblocked ? '<span class="chats-item__unblocked-badge">Нещодавно розблокований</span>' : ''}
              </div>
              <p class="chats-item__preview">${user.email}</p>
            </div>
          </div>
        </div>
      `;
    }
  }).join("");
  
  // Застосовуємо стилі аватарок (фото або кольоровий фон)
  container.querySelectorAll(".chats-item__avatar").forEach(avatarEl => {
    const userId = Number(avatarEl.dataset.userId);
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      applyAvatarStyle(avatarEl, user);
    }
  });
  
  // Додаємо обробники кліків для кнопок розблокування
  container.querySelectorAll(".btn-unblock-user").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const userId = Number(btn.dataset.userId);
      if (!userId) return;
      
      const user = allUsers.find(u => u.id === userId);
      if (!user) return;
      
      // Знаходимо батьківський елемент чату
      const chatItem = btn.closest(".chats-item");
      if (!chatItem) return;
      
      // Показуємо inline popup для підтвердження
      showUnblockConfirmationPopup(chatItem, userId, user);
    });
  });
  
  refreshIcons();
  
  // Додаємо обробники кліків для вибору користувача
  container.querySelectorAll(".chats-item--user").forEach(item => {
    const isBlocked = item.dataset.blocked === "true";
    const isRecentlyUnblocked = item.classList.contains("chats-item--recently-unblocked");
    
    // Заблоковані користувачі неактивні (крім кнопки розблокування)
    // Нещодавно розблоковані користувачі активні
    if (isBlocked && !isRecentlyUnblocked) {
      // Не встановлюємо inline стилі - opacity застосовується через CSS до .chats-item__content
      return; // Не додаємо обробник кліку для заблокованих
    }
    
    item.addEventListener("click", async () => {
      if (!authState.user) {
        pendingRouteAfterAuth = window.location.pathname;
        navigateTo("/login", { replace: true });
        return;
      }
      const userId = Number(item.dataset.userId);
      const user = allUsers.find(u => u.id === userId);
      
      // Перевіряємо, чи користувач не заблокований
      if (user && user.is_blocked === true) {
        showNotification({
          type: "error",
          title: "Помилка",
          message: "Не можна створити чат з заблокованим користувачем",
          duration: 3000,
        });
        return;
      }
      
      try {
        // Створюємо або отримуємо чат з користувачем
        const chat = await apiFetch("/api/chats", {
          method: "POST",
          body: JSON.stringify({ user_id: userId }),
        });
        // Оновлюємо список чатів перед переходом
        await loadChatsList();
        // Переходимо до чату
        navigateTo(`/c/${chat.uuid}`);
      } catch (e) {
        if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
          return;
        }
        showNotification({
          type: "error",
          title: "Помилка",
          message: "Не вдалося створити чат",
          duration: 3000,
        });
      }
    });
  });
}

async function loadChat(uuid) {
  // Перевіряємо автентифікацію перед виконанням запиту
  if (!authState.initialized) {
    // Чекаємо, поки автентифікація ініціалізується
    return;
  }
  if (!authState.user) {
    // Якщо користувач не автентифікований, перенаправляємо на логін
    handleUnauthorized();
    return;
  }
  try {
    const chat = await apiFetch(`/api/chats/${uuid}`);
    if (!chat || !chat.uuid) {
      showNotification({
        type: "error",
        title: "Помилка",
        message: "Не вдалося завантажити чат",
        duration: 3000,
      });
      return;
    }
    currentChatUuid = uuid;
    // Зберігаємо останній відкритий чат
    lastOpenedChatUuid = uuid;
    renderChat(chat);
  } catch (e) {
    // Якщо помилка автентифікації, handleUnauthorized вже викликається в apiFetch
    // Не показуємо помилку користувачу, бо вже перенаправлено на login
    if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
      return; // Просто виходимо, не показуємо помилку, не логуємо
    }
    showNotification({
      type: "error",
      title: "Помилка",
      message: "Не вдалося завантажити чат",
      duration: 3000,
    });
  }
}

function renderChat(chat) {
  // Показуємо layout з чатом та sidebar
  showChatLayout();
  
  const empty = document.getElementById("chats-main-empty");
  const content = document.getElementById("chats-main-content");
  const messages = document.getElementById("chats-main-messages");
  const avatar = document.getElementById("chats-main-avatar");
  const name = document.getElementById("chats-main-name");
  const blockBtn = document.getElementById("chats-main-block-btn");
  
  if (!empty || !content || !messages || !avatar || !name) return;
  
  empty.hidden = true;
  content.hidden = false;
  
  // Застосовуємо стилі аватарок (фото або кольоровий фон)
  applyAvatarStyle(avatar, chat.other_user);
  name.textContent = chat.other_user.display_name;
  
  // Показуємо/ховаємо кнопку блокування
  if (blockBtn) {
    const isBlocked = chat.other_user.is_blocked === true;
    blockBtn.hidden = false;
    blockBtn.setAttribute("aria-label", isBlocked ? "Розблокувати користувача" : "Заблокувати користувача");
    blockBtn.removeAttribute("data-tooltip");
    blockBtn.dataset.userId = String(chat.other_user.id);
    blockBtn.dataset.isBlocked = isBlocked ? "true" : "false";
    
    // Оновлюємо іконку
    const icon = blockBtn.querySelector(".icon");
    if (icon) {
      icon.setAttribute("data-lucide", isBlocked ? "user-check" : "user-x");
    }
    
    // Видаляємо всі старі обробники подій
    const newBlockBtn = blockBtn.cloneNode(true);
    blockBtn.parentNode.replaceChild(newBlockBtn, blockBtn);
    
    // Додаємо новий обробник
    newBlockBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const userId = Number(newBlockBtn.dataset.userId);
      const isCurrentlyBlocked = newBlockBtn.dataset.isBlocked === "true";
      if (!userId) {
        return;
      }
      await toggleUserBlock(userId, isCurrentlyBlocked, chat.other_user.display_name || chat.other_user.email);
    });
    
    refreshIcons();
  }
  
  messages.innerHTML = chat.messages.map(msg => {
    const isOwn = msg.sender_id === authState.user.id;
    return `
      <div class="chats-message ${isOwn ? "chats-message--own" : ""}">
        <div class="chats-message__content">${escapeHtml(msg.content)}</div>
        <div class="chats-message__time">${formatDateTime(new Date(msg.created_at))}</div>
      </div>
    `;
  }).join("");
  
  messages.scrollTop = messages.scrollHeight;
  
  // Оновлюємо список чатів та непрочитані повідомлення
  if (authState.user) {
    // Оновлюємо список чатів
    loadChatsList().then(() => {
      loadUnreadCount();
    }).catch(e => {
      // Якщо не вдалося завантажити список, все одно показуємо чат
      loadUnreadCount();
    });
  }
}

// Функція для форматування часу блокування (X хв/год/днів тому)
function formatBlockedTime(blockedAt) {
  if (!blockedAt) return "нещодавно";
  
  const now = new Date();
  const blocked = new Date(blockedAt);
  const diffMs = now - blocked;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "щойно";
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'хвилину' : diffMins < 5 ? 'хвилини' : 'хвилин'} тому`;
  }
  if (diffHours < 24) {
    const remainingMins = diffMins % 60;
    if (remainingMins === 0) {
      return `${diffHours} ${diffHours === 1 ? 'годину' : diffHours < 5 ? 'години' : 'годин'} тому`;
    }
    return `${diffHours} ${diffHours === 1 ? 'годину' : diffHours < 5 ? 'години' : 'годин'} ${remainingMins} ${remainingMins === 1 ? 'хвилину' : remainingMins < 5 ? 'хвилини' : 'хвилин'} тому`;
  }
  return `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дні' : 'днів'} тому`;
}

// Функція для показу inline popup підтвердження розблокування
function showUnblockConfirmationPopup(chatItem, userId, user) {
  // Видаляємо попередній popup, якщо він існує
  const existingPopup = document.querySelector(".unblock-confirmation-popup");
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Отримуємо час блокування
  const blockedAt = user.blocked_at;
  const blockedTimeText = formatBlockedTime(blockedAt);
  
  // Створюємо popup
  const popup = document.createElement("div");
  popup.className = "unblock-confirmation-popup";
  popup.innerHTML = `
    <div class="unblock-confirmation-popup__content">
      <div class="unblock-confirmation-popup__header">
        <h3>Розблокувати користувача?</h3>
      </div>
      <div class="unblock-confirmation-popup__body">
        <p class="unblock-confirmation-popup__text">Ви впевнені, що хочете розблокувати "${user.display_name || user.email}"?</p>
        <p class="unblock-confirmation-popup__info">Заблокований ${blockedTimeText}</p>
      </div>
      <div class="unblock-confirmation-popup__actions">
        <button type="button" class="button button--ghost button--small unblock-confirmation-popup__cancel">Скасувати</button>
        <button type="button" class="button button--primary button--small unblock-confirmation-popup__confirm">Підтвердити</button>
      </div>
    </div>
  `;
  
  // Додаємо popup до DOM (після chatItem)
  chatItem.parentNode.insertBefore(popup, chatItem.nextSibling);
  
  // Позиціонуємо popup відносно chatItem
  // Використовуємо fixed positioning для точного позиціювання відносно viewport
  const rect = chatItem.getBoundingClientRect();
  
  // Встановлюємо позицію відносно viewport
  popup.style.position = "fixed";
  popup.style.top = `${rect.bottom + 8}px`;
  popup.style.left = `${rect.left}px`;
  
  // Перевіряємо, чи popup не виходить за межі екрану
  setTimeout(() => {
    const popupRect = popup.getBoundingClientRect();
    if (popupRect.right > window.innerWidth) {
      popup.style.left = `${window.innerWidth - popupRect.width - 16}px`;
    }
    if (popupRect.bottom > window.innerHeight) {
      popup.style.top = `${rect.top - popupRect.height - 8}px`;
    }
  }, 0);
  
  // Обробники кнопок
  const cancelBtn = popup.querySelector(".unblock-confirmation-popup__cancel");
  const confirmBtn = popup.querySelector(".unblock-confirmation-popup__confirm");
  
  const closePopup = () => {
    popup.remove();
  };
  
  cancelBtn.addEventListener("click", closePopup);
  
  confirmBtn.addEventListener("click", async () => {
    closePopup();
    await handleUnblockUser(userId, user);
  });
  
  // Закриваємо popup при кліку поза ним
  const handleClickOutside = (e) => {
    if (!popup.contains(e.target) && !chatItem.contains(e.target)) {
      closePopup();
      document.removeEventListener("click", handleClickOutside);
    }
  };
  
  // Додаємо обробник після невеликої затримки, щоб не спрацював одразу
  setTimeout(() => {
    document.addEventListener("click", handleClickOutside);
  }, 100);
}

// Функція для обробки розблокування користувача
async function handleUnblockUser(userId, user) {
  try {
    // Виконуємо розблокування
    const result = await apiFetch(`/users/${userId}/unblock`, { method: "PATCH" }, { skipAuthCheck: true });
    
    if (!result || result.is_blocked === undefined) {
      throw new Error("Некоректна відповідь від сервера");
    }
    
    // Додаємо користувача до списку нещодавно розблокованих
    recentlyUnblockedUsers.add(userId);
    
    showNotification({
      type: "success",
      title: "Користувача розблоковано",
      message: result.message || "Користувач успішно розблокований",
      duration: 3000,
    });
    
    // Оновлюємо список користувачів (це оновить UI з новим статусом)
    try {
      await loadUsersList({ skipAuthCheck: true });
    } catch (e) {
      // Ігноруємо помилки при оновленні списку користувачів після розблокування
    }
    
    // Оновлюємо список чатів
    try {
      await loadChatsList({ skipAuthCheck: true });
    } catch (e) {
      // Ігноруємо помилки
    }
  } catch (e) {
    let errorMessage = "Не вдалося розблокувати користувача";
    if (e.message) {
      errorMessage = e.message;
    } else if (e.detail) {
      errorMessage = e.detail;
    }
    
    showNotification({
      type: "error",
      title: "Помилка",
      message: errorMessage,
      duration: 4000,
    });
  }
}

// Функція для блокування/розблокування користувача
async function toggleUserBlock(userId, isCurrentlyBlocked, userName) {
  try {
    // Якщо розблоковуємо, показуємо модалку підтвердження
    if (isCurrentlyBlocked) {
      // Показуємо модалку з підтвердженням розблокування
      const confirmed = await showConfirm(
        `Ви впевнені, що хочете розблокувати користувача "${userName}"?\n\nПісля розблокування:\n• Ви зможете обмінюватися повідомленнями\n• Чат з цим користувачем стане доступним\n• Користувач зможе відправляти вам повідомлення`,
        "Розблокувати користувача?",
        "info"
      );
      
      if (!confirmed) {
        return; // Користувач скасував розблокування
      }
      
      // Виконуємо розблокування
      const result = await apiFetch(`/users/${userId}/unblock`, { method: "PATCH" }, { skipAuthCheck: true });
      
      if (!result || result.is_blocked === undefined) {
        throw new Error("Некоректна відповідь від сервера");
      }
      
      // Додаємо користувача до списку нещодавно розблокованих
      recentlyUnblockedUsers.add(userId);
      
      showNotification({
        type: "success",
        title: "Користувача розблоковано",
        message: result.message || "Користувач успішно розблокований",
        duration: 3000,
      });
      
      // Оновлюємо список чатів та користувачів
      // Використовуємо skipAuthCheck, щоб не викликати handleUnauthorized при помилках
      try {
        await loadChatsList({ skipAuthCheck: true });
      } catch (e) {
        // Ігноруємо помилки при оновленні списку чатів після розблокування
      }
      try {
        await loadUsersList({ skipAuthCheck: true });
      } catch (e) {
        // Ігноруємо помилки при оновленні списку користувачів після розблокування
      }
      
      // Оновлюємо поточний чат, якщо він відкритий
      if (currentChatUuid) {
        try {
          const currentChat = chatsList.find(c => c.uuid === currentChatUuid);
          if (currentChat && currentChat.other_user.id === userId) {
            await loadChat(currentChatUuid);
          }
        } catch (e) {
        }
      }
      return;
    }
    
    // Якщо блокуємо, показуємо модалку з попередженням
    const confirmed = await showConfirm(
      `Ви впевнені, що хочете заблокувати користувача "${userName}"?\n\nПісля блокування:\n• Ви не зможете обмінюватися повідомленнями\n• Чат з цим користувачем буде приховано\n• Користувач не зможе відправляти вам повідомлення`,
      "Заблокувати користувача?",
      "danger"
    );
    
    if (!confirmed) {
      return; // Користувач скасував блокування
    }
    
    // Виконуємо блокування
    const result = await apiFetch(`/users/${userId}/block`, { method: "PATCH" }, { skipAuthCheck: true });
    
    if (!result || result.is_blocked === undefined) {
      throw new Error("Некоректна відповідь від сервера");
    }
    
    // Оновлюємо список чатів ПЕРЕД перевіркою закріплення та закриттям чату
    // Використовуємо skipAuthCheck, щоб не викликати handleUnauthorized при помилках
    try {
      await loadChatsList({ skipAuthCheck: true });
    } catch (e) {
      // Ігноруємо помилки при оновленні списку чатів після блокування
    }
    
    // Знаходимо чат з заблокованим користувачем (після оновлення списку)
    const chatToBlock = chatsList.find(c => c.other_user && c.other_user.id === userId);
    
    // Якщо чат був закріплений, відкріплюємо його
    if (chatToBlock && chatToBlock.is_pinned) {
      try {
        await togglePinChat(chatToBlock.uuid, true);
      } catch (e) {
        // Ігноруємо помилки при відкріпленні
      }
    }
    
    showNotification({
      type: "success",
      title: "Користувача заблоковано",
      message: result.message || "Користувач успішно заблокований",
      duration: 3000,
    });
    
    // Оновлюємо список користувачів
    try {
      await loadUsersList({ skipAuthCheck: true });
    } catch (e) {
      // Ігноруємо помилки при оновленні списку користувачів після блокування
    }
    
    // Якщо заблокований користувач був у відкритому чаті, закриваємо чат
    if (result.is_blocked && currentChatUuid) {
      const currentChat = chatsList.find(c => c.uuid === currentChatUuid);
      if (currentChat && currentChat.other_user && currentChat.other_user.id === userId) {
        lastOpenedChatUuid = null;
        navigateTo("/chats", { replace: true });
        showNotification({
          type: "info",
          title: "Чат закрито",
          message: "Чат з заблокованим користувачем було закрито",
          duration: 2000,
        });
      }
    } else if (currentChatUuid) {
      // Якщо чат відкритий, оновлюємо його, щоб відобразити зміни
      const currentChat = chatsList.find(c => c.uuid === currentChatUuid);
      if (currentChat && currentChat.other_user && currentChat.other_user.id === userId) {
        try {
          await loadChat(currentChatUuid);
        } catch (e) {
          // Ігноруємо помилки при оновленні чату
        }
      }
    }
  } catch (e) {
    // Не викликаємо handleUnauthorized тут, щоб не вилогінювати користувача
    
    let errorMessage = "Не вдалося заблокувати/розблокувати користувача";
    if (e.message) {
      errorMessage = e.message;
    } else if (e.detail) {
      errorMessage = e.detail;
    }
    
    showNotification({
      type: "error",
      title: "Помилка",
      message: errorMessage,
      duration: 4000,
    });
  }
}

function getUserInitial(user) {
  if (user.first_name && user.last_name) {
    return (user.first_name[0] + user.last_name[0]).toUpperCase();
  }
  return user.display_name ? user.display_name[0].toUpperCase() : "?";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Функції для перемикання між станами
function showChatsListFull() {
  const listFull = document.getElementById("chats-list-full");
  const usersFull = document.getElementById("chats-users-full");
  const layout = document.getElementById("chats-layout");
  const chatsMain = document.querySelector(".chats-main");
  if (listFull) listFull.hidden = false;
  if (usersFull) usersFull.hidden = true;
  if (layout) layout.hidden = true;
  if (chatsMain) chatsMain.classList.remove("chats-main--in-chat");
}

function showUsersListFull() {
  const listFull = document.getElementById("chats-list-full");
  const usersFull = document.getElementById("chats-users-full");
  const layout = document.getElementById("chats-layout");
  const chatsMain = document.querySelector(".chats-main");
  if (listFull) listFull.hidden = true;
  if (usersFull) usersFull.hidden = false;
  if (layout) layout.hidden = true;
  if (chatsMain) chatsMain.classList.remove("chats-main--in-chat");
}

function showChatLayout() {
  const listFull = document.getElementById("chats-list-full");
  const usersFull = document.getElementById("chats-users-full");
  const layout = document.getElementById("chats-layout");
  const chatsMain = document.querySelector(".chats-main");
  if (listFull) listFull.hidden = true;
  if (usersFull) usersFull.hidden = true;
  if (layout) layout.hidden = false;
  if (chatsMain) chatsMain.classList.add("chats-main--in-chat");
}

function renderChatsSidebarList(activeChat) {
  const container = document.getElementById("chats-sidebar-list");
  const empty = document.getElementById("chats-sidebar-empty");
  if (!container) return;
  
  if (!Array.isArray(chatsList)) {
    chatsList = [];
  }
  
  if (chatsList.length === 0) {
    container.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  
  if (empty) empty.hidden = true;
  
  // Фільтруємо заблокованих користувачів
  const activeChats = chatsList.filter(chat => chat.other_user && chat.other_user.is_blocked !== true);
  
  container.innerHTML = activeChats.map(chat => {
    const isActive = activeChat && chat.uuid === activeChat.uuid;
    const lastMsg = chat.last_message ? (chat.last_message.content.length > 50 ? chat.last_message.content.substring(0, 50) + "..." : chat.last_message.content) : "Немає повідомлень";
    const unreadBadge = chat.unread_count > 0 ? `<span class="chats-item__badge">${chat.unread_count > 99 ? "99+" : chat.unread_count}</span>` : "";
    const pinIcon = chat.is_pinned ? `<span class="chats-item__pin-icon" data-lucide="pin"></span>` : "";
    const gripIcon = isEditMode ? `<span class="chats-item__grip-icon" data-lucide="grip-vertical"></span>` : "";
    return `
      <div class="chats-item ${isActive ? "chats-item--active" : ""} ${chat.is_pinned ? 'chats-item--pinned' : ''} ${isEditMode ? 'chats-item--edit-mode' : ''}" data-chat-uuid="${chat.uuid}" draggable="${isEditMode}">
        ${gripIcon}
        <div class="chats-item__avatar" data-user-id="${chat.other_user.id}">${getUserInitial(chat.other_user)}</div>
        <div class="chats-item__content">
          <div class="chats-item__header">
            <span class="chats-item__name">${chat.other_user.display_name}</span>
            ${pinIcon}
            ${unreadBadge}
          </div>
          <p class="chats-item__preview">${lastMsg}</p>
        </div>
      </div>
    `;
  }).join("");
  
  refreshIcons();
  
  // Застосовуємо стилі аватарок
  container.querySelectorAll(".chats-item__avatar").forEach(avatarEl => {
    const userId = Number(avatarEl.dataset.userId);
    const chat = chatsList.find(c => c.other_user.id === userId);
    if (chat && chat.other_user) {
      applyAvatarStyle(avatarEl, chat.other_user);
    }
  });
  
  // Додаємо обробники кліків
  container.querySelectorAll(".chats-item").forEach(item => {
    item.addEventListener("click", async (e) => {
      const uuid = item.dataset.chatUuid;
      if (!uuid) {
        return;
      }
      navigateTo(`/c/${uuid}`);
    });
  });
  
  // Додаємо drag and drop функціональність
  setupDragAndDrop(container);
}

// Функції для роботи з чатами (pin, delete, drag and drop)
async function togglePinChat(uuid, skipAuthCheck = false) {
  try {
    const result = await apiFetch(`/api/chats/${uuid}/pin`, { method: "PATCH" }, { skipAuthCheck });
    // Оновлюємо список чатів
    await loadChatsList({ skipAuthCheck });
    showNotification({
      type: "success",
      title: result.is_pinned ? "Чат закріплено" : "Чат відкріплено",
      message: "",
      duration: 2000,
    });
  } catch (e) {
    if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
      return;
    }
    showNotification({
      type: "error",
      title: "Помилка",
      message: "Не вдалося закріпити/відкріпити чат",
      duration: 3000,
    });
  }
}

async function deleteChat(uuid) {
  const confirmed = await showConfirm(
    "Ви впевнені, що хочете видалити цей чат? Всі повідомлення будуть видалені.",
    "Видалити чат?",
    "danger"
  );
  if (!confirmed) {
    return;
  }
  
  try {
    await apiFetch(`/api/chats/${uuid}`, { method: "DELETE" });
    // Оновлюємо список чатів
    await loadChatsList();
    // Якщо видалений чат був відкритий, закриваємо його
    if (currentChatUuid === uuid) {
      lastOpenedChatUuid = null;
      navigateTo("/chats", { replace: true });
    }
    showNotification({
      type: "success",
      title: "Чат видалено",
      message: "",
      duration: 2000,
    });
  } catch (e) {
    if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
      return;
    }
    showNotification({
      type: "error",
      title: "Помилка",
      message: "Не вдалося видалити чат",
      duration: 3000,
    });
  }
}

function setupDragAndDrop(container) {
  let draggedElement = null;
  
  container.querySelectorAll(".chats-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      // Перевіряємо, чи активований режим редагування
      if (!isEditMode) {
        e.preventDefault();
        return;
      }
      draggedElement = item;
      item.classList.add("chats-item--dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    
    item.addEventListener("dragend", () => {
      item.classList.remove("chats-item--dragging");
      container.querySelectorAll(".chats-item").forEach(el => {
        el.classList.remove("chats-item--drag-over");
      });
    });
    
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      
      const afterElement = getDragAfterElement(container, e.clientY);
      const dragging = container.querySelector(".chats-item--dragging");
      
      if (afterElement == null) {
        container.appendChild(dragging);
      } else {
        container.insertBefore(dragging, afterElement);
      }
    });
    
    item.addEventListener("drop", async (e) => {
      e.preventDefault();
      if (!draggedElement) return;
      
      const items = Array.from(container.querySelectorAll(".chats-item"));
      // Оновлюємо порядок для всіх чатів
      const newOrder = items.map((item, index) => ({
        uuid: item.dataset.chatUuid,
        order: index,
      }));
      
      try {
        await apiFetch("/api/chats/reorder", {
          method: "PATCH",
          body: JSON.stringify({ chats: newOrder }),
        });
        await loadChatsList();
      } catch (error) {
        // Перезавантажуємо список, щоб відновити правильний порядок
        await loadChatsList();
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".chats-item:not(.chats-item--dragging)")];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function initializeChats() {
  const newChatBtn = document.getElementById("chats-new-chat-btn");
  const editModeBtn = document.getElementById("chats-edit-mode-btn");
  const backToListBtn = document.getElementById("chats-back-to-list-btn");
  const backFromChatBtn = document.getElementById("chats-back-to-list-from-chat-btn");
  const sendBtn = document.getElementById("chats-main-send-btn");
  const input = document.getElementById("chats-main-input");
  
  // Кнопка "Редагувати порядок" - активує/деактивує режим редагування
  if (editModeBtn) {
    editModeBtn.addEventListener("click", () => {
      isEditMode = !isEditMode;
      editModeBtn.classList.toggle("button--active", isEditMode);
      editModeBtn.setAttribute("aria-label", isEditMode ? "Завершити редагування" : "Редагувати порядок");
      editModeBtn.setAttribute("data-tooltip", isEditMode ? "Завершити редагування" : "Редагувати порядок");
      // Оновлюємо відображення списків чатів
      renderChatsList();
      const sidebarContainer = document.getElementById("chats-sidebar-list");
      if (sidebarContainer && currentChatUuid) {
        const activeChat = chatsList.find(c => c.uuid === currentChatUuid);
        if (activeChat) {
          renderChatsSidebarList(activeChat);
        }
      }
    });
  }
  
  // Кнопка "Новий чат" - показує список користувачів
  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      if (!authState.user) {
        pendingRouteAfterAuth = window.location.pathname;
        navigateTo("/login", { replace: true });
        return;
      }
      showUsersListFull();
      loadUsersList();
    });
  }
  
  // Кнопка "Назад" зі списку користувачів - повертає до списку чатів
  if (backToListBtn) {
    backToListBtn.addEventListener("click", () => {
      showChatsListFull();
      loadChatsList();
    });
  }
  
  // Кнопка "Назад" з чату - повертає до списку чатів
  if (backFromChatBtn) {
    backFromChatBtn.addEventListener("click", () => {
      // Очищаємо збережений останній відкритий чат, щоб при наступному кліку на "Чати" показувався список
      lastOpenedChatUuid = null;
      // Переходимо на /chats і показуємо список активних чатів
      navigateTo("/chats", { replace: true });
    });
  }
  
  if (sendBtn && input) {
    const sendMessage = async () => {
      if (!authState.user) {
        pendingRouteAfterAuth = window.location.pathname;
        navigateTo("/login", { replace: true });
        return;
      }
      const text = input.value.trim();
      if (!text || !currentChatUuid) return;
      
      try {
        await apiFetch(`/api/chats/${currentChatUuid}/messages`, {
          method: "POST",
          body: JSON.stringify({ content: text }),
        });
        input.value = "";
        // Оновлюємо поточний чат
        loadChat(currentChatUuid);
        // Оновлюємо список чатів, щоб новий чат з'явився в списку
        loadChatsList();
      } catch (e) {
        // Якщо помилка автентифікації, handleUnauthorized вже викликається в apiFetch
        // Не показуємо помилку користувачу, бо вже перенаправлено на login
        if (e.isAuthError || e.silent || (e.message && e.message.includes("увійти"))) {
          return; // Просто виходимо, не показуємо помилку, не логуємо
        }
        showNotification({
          type: "error",
          title: "Помилка",
          message: "Не вдалося відправити повідомлення",
          duration: 3000,
        });
      }
    };
    
    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  // НЕ викликаємо loadChatsList() тут, щоб уникнути API запитів для неавтентифікованих користувачів
  // Ці функції будуть викликатися тільки в activateSection, коли сторінка активується
  
  // Ініціалізація кнопки "Згенерувати Звіт"
  if (generateReportBtn) {
    generateReportBtn.addEventListener("click", () => {
      navigateTo("/reports");
    });
  }
}

// Змінні для сторінки звітів
let selectedPredictionId = null;
let selectedFormat = null;
let currentPredictionData = null;
let reportViewMode = localStorage.getItem("hr_report_view") === "grid" ? "grid" : "list";

// Ініціалізація сторінки звітів
async function initializeReportPage() {
  if (!authState.user) {
    handleUnauthorized();
    return;
  }
  
  const reportEmpty = document.getElementById("report-empty");
  const reportSelector = document.getElementById("report-selector");
  const predictionsList = document.getElementById("report-predictions-list");
  const formatGrid = document.getElementById("report-format-grid");
  
  if (!reportEmpty || !reportSelector || !predictionsList || !formatGrid) return;
  
  // Перевіряємо, чи є поточний результат розрахунку
  const hasCurrentResult = resultCard && !resultCard.hidden && probabilityValue && probabilityValue.textContent !== "—";
  
  // Завантажуємо історію прогнозувань
  let history = [];
  try {
    if (authState.history && authState.history.length > 0) {
      history = authState.history;
    } else {
      history = await loadHistory(50);
    }
  } catch (e) {
    history = [];
  }
  
  // Якщо немає поточного результату і немає історії - показуємо заглушку
  if (!hasCurrentResult && (!history || history.length === 0)) {
    reportEmpty.hidden = false;
    reportSelector.hidden = true;
    return;
  }
  
  // Показуємо селектор
  reportEmpty.hidden = true;
  reportSelector.hidden = false;
  
  // Рендеримо список прогнозувань
  renderPredictionsList(history, hasCurrentResult);
  
  // Додаємо обробники для вибору формату
  formatGrid.querySelectorAll(".report-format-card").forEach(card => {
    card.addEventListener("click", () => {
      formatGrid.querySelectorAll(".report-format-card").forEach(c => {
        c.classList.remove("report-format-card--selected");
      });
      card.classList.add("report-format-card--selected");
      selectedFormat = card.dataset.format;
      
      // Якщо обрані і прогнозування, і формат - можна генерувати
      if (selectedPredictionId && selectedFormat) {
        generateReport();
      }
    });
  });
  
  // Ініціалізація кнопки перемикача view
  const viewToggleBtn = document.getElementById("report-view-toggle-btn");
  if (viewToggleBtn) {
    const setIcon = () => {
      const icon = viewToggleBtn.querySelector(".icon");
      if (icon) icon.setAttribute("data-lucide", reportViewMode === "list" ? "layout-grid" : "list");
      viewToggleBtn.setAttribute("aria-label", reportViewMode === "list" ? "Grid View" : "List View");
      viewToggleBtn.setAttribute("data-tooltip", reportViewMode === "list" ? "Grid View" : "List View");
      if (typeof refreshIcons === "function") {
        refreshIcons();
      }
    };
    setIcon();
    viewToggleBtn.onclick = () => {
      reportViewMode = reportViewMode === "list" ? "grid" : "list";
      localStorage.setItem("hr_report_view", reportViewMode);
      setIcon();
      renderPredictionsList(history, hasCurrentResult);
    };
  }
}

// Рендеринг списку прогнозувань
function renderPredictionsList(history, hasCurrentResult) {
  const predictionsList = document.getElementById("report-predictions-list");
  if (!predictionsList) return;
  
  predictionsList.innerHTML = "";
  
  // Встановлюємо клас для grid або list view
  predictionsList.className = reportViewMode === "grid" 
    ? "report-selector__predictions report-selector__predictions--grid" 
    : "report-selector__predictions";
  
  // Збираємо всі прогнозування
  const allPredictions = [];
  
  // Додаємо поточний результат, якщо він є
  if (hasCurrentResult) {
    allPredictions.push({
      id: "current",
      target: document.getElementById("target-select")?.value || "diabetes_present",
      probability: parseFloat(probabilityValue.textContent.replace("%", "")) / 100,
      created_at: new Date().toISOString(),
      isCurrent: true
    });
  }
  
  // Додаємо історію
  if (history && history.length > 0) {
    allPredictions.push(...history);
  }
  
  // Рендеримо в залежності від режиму
  allPredictions.forEach(prediction => {
    const card = createPredictionCard(prediction);
    predictionsList.appendChild(card);
  });
  
  // Оновлюємо іконки після рендерингу
  if (typeof refreshIcons === "function") {
    refreshIcons();
  }
}

// Створення картки прогнозування
function createPredictionCard(prediction) {
  const card = document.createElement("div");
  card.className = "report-prediction-card";
  card.dataset.predictionId = prediction.id;
  
  const date = new Date(prediction.created_at);
  const formattedDate = date.toLocaleString("uk-UA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  
  const probability = prediction.probability || 0;
  const riskLevel = probability < 0.3 ? "низький" : probability < 0.7 ? "середній" : "високий";
  
  // Визначаємо bucket для отримання кольору
  const riskBucket = probability < 0.3 ? "low" : probability < 0.7 ? "medium" : "high";
  const riskColor = getRiskColor(riskBucket);
  
  // Створюємо більш приглушені кольори (зменшуємо насиченість)
  const mutedColors = {
    low: "rgba(63, 194, 114, 0.6)",      // приглушений зелений
    medium: "rgba(245, 182, 73, 0.6)",   // приглушений жовтий/помаранчевий
    high: "rgba(241, 94, 111, 0.6)"       // приглушений червоний
  };
  const badgeColor = mutedColors[riskBucket] || mutedColors.low;
  
  const target = prediction.target || "diabetes_present";
  const targetLabel = TARGET_LABELS[target] || target;
  
  card.innerHTML = `
    <div class="report-prediction-card__info">
      <h4 class="report-prediction-card__title">
        ${targetLabel}
        ${prediction.isCurrent ? '<span style="margin-left: 8px; font-size: 0.75rem; color: var(--accent-color);">(Поточний)</span>' : ''}
      </h4>
      <p class="report-prediction-card__meta">${formattedDate}</p>
    </div>
    <span class="report-prediction-card__badge badge" style="background: ${badgeColor}; color: #fff;">${(probability * 100).toFixed(1)}% (${riskLevel})</span>
  `;
  
  card.addEventListener("click", () => {
    const predictionsList = document.getElementById("report-predictions-list");
    if (predictionsList) {
      predictionsList.querySelectorAll(".report-prediction-card").forEach(c => {
        c.classList.remove("report-prediction-card--selected");
      });
    }
    card.classList.add("report-prediction-card--selected");
    selectedPredictionId = prediction.id;
    
    // Зберігаємо дані прогнозування
    if (prediction.isCurrent) {
      currentPredictionData = {
        target: document.getElementById("target-select")?.value || "diabetes",
        probability: parseFloat(probabilityValue.textContent.replace("%", "")) / 100,
        riskLevel: riskBadge?.textContent || "N/A",
        model: modelName?.textContent || "N/A",
        formData: getCurrentFormData()
      };
    } else {
      currentPredictionData = prediction;
    }
    
    // Якщо обрані і прогнозування, і формат - можна генерувати
    if (selectedFormat) {
      generateReport();
    }
  });
  
  return card;
}

// Отримання поточних даних форми
function getCurrentFormData() {
  const formData = {};
  if (form) {
    const inputs = form.querySelectorAll("input, select");
    inputs.forEach(input => {
      if (input.id && input.value) {
        formData[input.id] = input.value;
      }
    });
  }
  return formData;
}

// Генерація звіту
function generateReport() {
  if (!selectedPredictionId || !selectedFormat || !currentPredictionData) {
    showNotification({
      type: "warning",
      title: "Оберіть параметри",
      message: "Будь ласка, оберіть прогнозування та формат звіту.",
      duration: 3000
    });
    return;
  }
  
  try {
    switch (selectedFormat) {
      case "pdf":
        generatePDFReport(currentPredictionData).catch(error => {
          console.error("PDF generation error:", error);
          showNotification({
            type: "error",
            title: "Помилка генерації PDF",
            message: error.message || "Не вдалося згенерувати PDF звіт",
            duration: 4000
          });
        });
        break;
      case "excel":
        generateExcelReport(currentPredictionData);
        break;
      case "csv":
        generateCSVReport(currentPredictionData);
        break;
      case "json":
        generateJSONReport(currentPredictionData);
        break;
      default:
        showNotification({
          type: "error",
          title: "Помилка",
          message: "Невідомий формат звіту",
          duration: 3000
        });
    }
  } catch (error) {
    showNotification({
      type: "error",
      title: "Помилка генерації",
      message: error.message || "Не вдалося згенерувати звіт",
      duration: 4000
    });
  }
}

// jsPDF font init with Cyrillic support
let pdfFontInitialized = false;
let pdfFontInitializing = false;

// Зберігаємо завантажений шрифт для подальшого використання
let loadedFontBase64 = null;

async function ensurePdfFontInitialized(jsPDF) {
  if (pdfFontInitialized && loadedFontBase64) return;
  if (pdfFontInitializing) {
    // Чекаємо, поки шрифт завантажується
    while (pdfFontInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  pdfFontInitializing = true;

  // Отримуємо jsPDF клас
  const { jsPDF: JsPDFClass } = window.jspdf || {};
  const JsPDF = jsPDF || JsPDFClass || window.jsPDF;

  if (!JsPDF) {
    console.warn("[PDF Font] jsPDF not available");
    pdfFontInitializing = false;
    return;
  }

  const fontName = "DejaVuSans";
  const fontFileName = "DejaVuSans.ttf";

  try {
    // Завантажуємо TTF-шрифт з локального файлу
    const fontUrl = "/app/static/fonts/DejaVuSans.ttf";
    
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`Failed to load font: ${response.status}`);
    }

    // Отримуємо шрифт як ArrayBuffer
    const fontBytes = await response.arrayBuffer();
    const fontUint8 = new Uint8Array(fontBytes);
    
    // Конвертуємо Uint8Array в base64 для jsPDF
    // Використовуємо більш ефективний спосіб для великих файлів
    let fontBinary = '';
    const chunkSize = 8192;
    for (let i = 0; i < fontUint8.length; i += chunkSize) {
      const chunk = fontUint8.subarray(i, i + chunkSize);
      fontBinary += String.fromCharCode.apply(null, chunk);
    }
    const fontBase64 = btoa(fontBinary);
    
    // Зберігаємо base64 для подальшого використання
    loadedFontBase64 = fontBase64;
    
    pdfFontInitialized = true;
    console.log("[PDF Font] DejaVuSans font loaded successfully");
  } catch (error) {
    console.error("[PDF Font] Failed to load font:", error);
    throw error; // Прокидаємо помилку далі
  } finally {
    pdfFontInitializing = false;
  }
}

// Генерація PDF звіту
async function generatePDFReport(data) {
  // Перевірка наявності бібліотеки jsPDF
  // jsPDF може бути доступний як window.jspdf.jsPDF або window.jsPDF
  let jsPDF;
  if (typeof window.jspdf !== "undefined" && window.jspdf.jsPDF) {
    jsPDF = window.jspdf.jsPDF;
  } else if (typeof window.jsPDF !== "undefined") {
    jsPDF = window.jsPDF;
  } else {
    showNotification({
      type: "error",
      title: "Помилка",
      message: "Бібліотека PDF не завантажена. Будь ласка, оновіть сторінку.",
      duration: 5000
    });
    return;
  }
  
  const { jsPDF: JsPDFClass } = window.jspdf || {};
  
  try {
    // Ініціалізуємо шрифт один раз (асинхронно)
    await ensurePdfFontInitialized(jsPDF || JsPDFClass);
  } catch (error) {
    showNotification({
      type: "error",
      title: "Помилка завантаження шрифту",
      message: "Не вдалося завантажити шрифт для PDF. Спробуйте пізніше.",
      duration: 5000
    });
    return;
  }
  
  const doc = new jsPDF();
  
  // Додаємо шрифт до документа, якщо він ще не доданий
  if (loadedFontBase64) {
    try {
      const fontFileName = "DejaVuSans.ttf";
      const fontName = "DejaVuSans";
      
      // Додаємо шрифт до віртуальної файлової системи документа
      doc.addFileToVFS(fontFileName, loadedFontBase64);
      
      // Реєструємо шрифт
      doc.addFont(fontFileName, fontName, "normal");
      
      console.log("[PDF Font] DejaVuSans font registered in document");
    } catch (error) {
      console.error("[PDF Font] Failed to register font in document:", error);
    }
  }
  
  // Перевіряємо доступність шрифту
  const fontList = doc.getFontList ? doc.getFontList() : {};
  console.log("[PDF Font] Available fonts:", Object.keys(fontList));
  
  // Встановлюємо DejaVuSans як основний шрифт для всього документа
  if (fontList['DejaVuSans']) {
    doc.setFont("DejaVuSans", "normal");
    console.log("[PDF Font] Using DejaVuSans font");
  } else {
    showNotification({
      type: "error",
      title: "Помилка",
      message: "Шрифт DejaVuSans не доступний. PDF може не відображати кирилицю коректно.",
      duration: 5000
    });
    // Не продовжуємо генерацію без правильного шрифту
    return;
  }
  
  // Заголовок
  doc.setFontSize(20);
  doc.text("Звіт про прогнозування ризиків здоров'я", 20, 20);
  
  // Інформація про прогнозування
  doc.setFontSize(12);
  let y = 40;
  
  // Використовуємо оригінальні українські тексти
  const targetLabel = TARGET_LABELS[data.target] || data.target;
  doc.text(`Ціль: ${targetLabel}`, 20, y);
  y += 10;
  doc.text(`Ймовірність: ${(data.probability * 100).toFixed(2)}%`, 20, y);
  y += 10;
  
  // Рівень ризику
  const riskLevel = data.riskLevel || "N/A";
  doc.text(`Рівень ризику: ${riskLevel}`, 20, y);
  y += 10;
  
  const model = data.model || "N/A";
  doc.text(`Модель: ${model}`, 20, y);
  y += 20;
  
  // Дата
  const date = new Date();
  const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  doc.text(`Дата: ${dateStr}`, 20, y);
  
  // Збереження
  const filename = `health_risk_report_${data.target}_${Date.now()}.pdf`;
  doc.save(filename);
  
  showNotification({
    type: "success",
    title: "Звіт згенеровано",
    message: `PDF звіт збережено як ${filename}`,
    duration: 3000
  });
}

// Генерація Excel звіту
function generateExcelReport(data) {
  // Перевірка наявності бібліотеки XLSX
  if (typeof XLSX === "undefined" || typeof XLSX.utils === "undefined") {
    showNotification({
      type: "error",
      title: "Помилка",
      message: "Бібліотека Excel не завантажена. Будь ласка, оновіть сторінку.",
      duration: 5000
    });
    return;
  }
  
  const worksheet = XLSX.utils.json_to_sheet([{
    "Ціль": TARGET_LABELS[data.target] || data.target,
    "Ймовірність (%)": (data.probability * 100).toFixed(2),
    "Рівень ризику": data.riskLevel || "N/A",
    "Модель": data.model || "N/A",
    "Дата": new Date().toLocaleString("uk-UA")
  }]);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Прогнозування");
  
  const filename = `health_risk_report_${data.target}_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, filename);
  
  showNotification({
    type: "success",
    title: "Звіт згенеровано",
    message: `Excel звіт збережено як ${filename}`,
    duration: 3000
  });
}

// Генерація CSV звіту
function generateCSVReport(data) {
  const csv = [
    "Параметр,Значення",
    `Ціль,${TARGET_LABELS[data.target] || data.target}`,
    `Ймовірність (%),${(data.probability * 100).toFixed(2)}`,
    `Рівень ризику,${data.riskLevel || "N/A"}`,
    `Модель,${data.model || "N/A"}`,
    `Дата,${new Date().toLocaleString("uk-UA")}`
  ].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `health_risk_report_${data.target}_${Date.now()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification({
    type: "success",
    title: "Звіт згенеровано",
    message: "CSV звіт завантажено",
    duration: 3000
  });
}

// Генерація JSON звіту
function generateJSONReport(data) {
  const jsonData = {
    target: TARGET_LABELS[data.target] || data.target,
    probability: data.probability,
    riskLevel: data.riskLevel || "N/A",
    model: data.model || "N/A",
    date: new Date().toLocaleString("uk-UA"),
    formData: data.formData || {}
  };
  
  const json = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `health_risk_report_${data.target}_${Date.now()}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification({
    type: "success",
    title: "Звіт згенеровано",
    message: "JSON звіт завантажено",
    duration: 3000
  });
}

