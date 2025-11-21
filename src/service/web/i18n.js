/**
 * Internationalization (i18n) module for Health Risk AI
 * 
 * This module provides centralized localization support for the application.
 * 
 * To add a new language:
 * 1. Create locales/<lang>.json with the same key structure as uk.json
 * 2. Add <lang> to SUPPORTED_LANGUAGES array below
 * 3. Optionally add language selector button in UI
 * 
 * The module automatically falls back to Ukrainian (uk) if a translation is missing.
 */

// Supported language codes
const SUPPORTED_LANGUAGES = ['uk', 'en'];
const DEFAULT_LANGUAGE = 'uk';
const STORAGE_KEY = 'healthrisk_lang';

// Current language state
let currentLanguage = DEFAULT_LANGUAGE;
let translations = {};
let ukTranslations = {}; // Fallback translations
let translationsReady = false; // Flag to track if translations are loaded

/**
 * Load translations from JSON file
 * @param {string} langCode - Language code (uk, en, etc.)
 * @returns {Promise<Object>} Translations object
 */
async function loadTranslations(langCode) {
  try {
    const response = await fetch(`/app/static/locales/${langCode}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${langCode}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Failed to load translations for ${langCode}:`, error);
    return {};
  }
}

/**
 * Initialize i18n module
 * Loads translations and sets current language from localStorage or default
 * @returns {Promise<void>}
 */
async function initI18n() {
  // Load Ukrainian translations first (for fallback)
  ukTranslations = await loadTranslations('uk');
  
  // Debug: verify critical keys are loaded
  if (ukTranslations && Object.keys(ukTranslations).length > 0) {
    const hasHistory = !!ukTranslations.history;
    const hasPages = !!ukTranslations.pages;
    const hasEmptyLoggedOut = !!ukTranslations.history?.emptyLoggedOut;
    const hasPagesLogin = !!ukTranslations.pages?.login;
    
    if (!hasHistory || !hasPages || !hasEmptyLoggedOut || !hasPagesLogin) {
      console.warn('i18n: Missing critical keys in ukTranslations', {
        hasHistory,
        hasPages,
        hasEmptyLoggedOut,
        hasPagesLogin,
        historyKeys: ukTranslations.history ? Object.keys(ukTranslations.history) : [],
        pagesKeys: ukTranslations.pages ? Object.keys(ukTranslations.pages) : []
      });
    }
  }
  
  // Determine current language
  const savedLang = localStorage.getItem(STORAGE_KEY);
  const langToUse = savedLang && SUPPORTED_LANGUAGES.includes(savedLang) 
    ? savedLang 
    : DEFAULT_LANGUAGE;
  
  // Load current language translations
  if (langToUse !== 'uk') {
    translations = await loadTranslations(langToUse);
  } else {
    translations = ukTranslations;
  }
  
  currentLanguage = langToUse;
  translationsReady = true; // Mark translations as loaded
  
  // Apply translations to page (only if DOM is ready)
  if (document.readyState !== 'loading') {
    applyTranslations();
    updateLanguageSwitcherTrigger();
  } else {
    // If DOM is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      applyTranslations();
      updateLanguageSwitcherTrigger();
    }, { once: true });
  }
}

/**
 * Get translation by key with fallback support
 * Supports nested keys like "auth.login.title"
 * Supports variable interpolation like "Hello {{name}}"
 * 
 * @param {string} key - Translation key (e.g., "auth.login.title")
 * @param {Object} vars - Variables for interpolation (e.g., {name: "John"})
 * @returns {string} Translated text
 */
function t(key, vars = {}) {
  if (!key) return '';
  
  // If translations are not ready yet, return key (will be retranslated later)
  if (!translationsReady) {
    // Try to get from ukTranslations if they're already loaded
    if (ukTranslations && Object.keys(ukTranslations).length > 0) {
      const value = getNestedValue(ukTranslations, key);
      if (value !== undefined && value !== null) {
        return value;
      }
    }
    return key;
  }
  
  // Get value from current language, fallback to Ukrainian, then to key itself
  let value = getNestedValue(translations, key);
  
  // If not found in current language, try Ukrainian fallback
  if (value === undefined || value === null) {
    value = getNestedValue(ukTranslations, key);
  }
  
  // If still not found, use key as fallback
  if (value === undefined || value === null) {
    value = key;
    // Only log warning in development (not in production)
    if (typeof console !== 'undefined' && console.warn) {
      // Debug: log what we're looking for
      if (key === 'history.emptyLoggedOut' || key === 'pages.login') {
        console.warn(`Translation missing for key: ${key}`, {
          translationsReady,
          hasTranslations: !!translations && Object.keys(translations).length > 0,
          hasUkTranslations: !!ukTranslations && Object.keys(ukTranslations).length > 0,
          hasHistory: !!ukTranslations?.history,
          hasPages: !!ukTranslations?.pages,
          historyKeys: ukTranslations?.history ? Object.keys(ukTranslations.history) : [],
          pagesKeys: ukTranslations?.pages ? Object.keys(ukTranslations.pages) : [],
          directAccess: key === 'history.emptyLoggedOut' ? ukTranslations?.history?.emptyLoggedOut : ukTranslations?.pages?.login
        });
      } else {
        console.warn(`Translation missing for key: ${key}`);
      }
    }
  }
  
  // Interpolate variables
  if (typeof value === 'string' && Object.keys(vars).length > 0) {
    Object.entries(vars).forEach(([varKey, varValue]) => {
      value = value.replace(new RegExp(`{{${varKey}}}`, 'g'), varValue);
    });
  }
  
  return value;
}

/**
 * Get nested value from object by dot-notation key
 * @param {Object} obj - Object to search in
 * @param {string} key - Dot-notation key (e.g., "auth.login.title")
 * @returns {*} Value or undefined
 */
function getNestedValue(obj, key) {
  if (!obj || !key) return undefined;
  
  const parts = key.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    if (!(part in current)) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Get current language code
 * @returns {string} Current language code
 */
function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Set language and reload translations
 * @param {string} langCode - Language code to set
 */
async function setLanguage(langCode) {
  if (!SUPPORTED_LANGUAGES.includes(langCode)) {
    console.warn(`Unsupported language: ${langCode}`);
    return;
  }
  
  currentLanguage = langCode;
  localStorage.setItem(STORAGE_KEY, langCode);
  
  // Load translations for new language
  if (langCode === 'uk') {
    translations = ukTranslations;
  } else {
    translations = await loadTranslations(langCode);
  }
  
  // Re-apply translations to page
  applyTranslations();
  
  // Trigger custom event for components that need to update
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }));
}

/**
 * Language flags mapping
 */
const LANGUAGE_FLAGS = {
  'uk': '🇺🇦',
  'en': '🇬🇧'
};

/**
 * Language short codes mapping
 */
const LANGUAGE_CODES = {
  'uk': 'UA',
  'en': 'EN'
};

/**
 * Update language switcher trigger button
 */
function updateLanguageSwitcherTrigger() {
  const trigger = document.getElementById('language-switcher-trigger');
  const flag = document.getElementById('language-switcher-flag');
  const code = document.getElementById('language-switcher-code');
  
  if (!trigger || !flag || !code) return;
  
  const flagEmoji = LANGUAGE_FLAGS[currentLanguage] || '🌐';
  const shortCode = LANGUAGE_CODES[currentLanguage] || currentLanguage.toUpperCase();
  const fullName = t(`layout.languages.${currentLanguage}`) || shortCode;
  
  flag.textContent = flagEmoji;
  code.textContent = shortCode;
  trigger.setAttribute('aria-label', fullName);
  
  // Refresh icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Generate language switcher dropdown options dynamically
 */
function generateLanguageSwitcher() {
  const dropdown = document.getElementById('language-switcher-dropdown');
  if (!dropdown) return;
  
  // Clear existing options
  dropdown.innerHTML = '';
  
  // Generate option for each supported language
  SUPPORTED_LANGUAGES.forEach(langCode => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'language-switcher__option';
    option.setAttribute('data-lang', langCode);
    option.setAttribute('role', 'menuitem');
    
    // Get full language name
    const fullName = t(`layout.languages.${langCode}`) || LANGUAGE_CODES[langCode] || langCode.toUpperCase();
    const flagEmoji = LANGUAGE_FLAGS[langCode] || '🌐';
    const shortCode = LANGUAGE_CODES[langCode] || langCode.toUpperCase();
    
    option.innerHTML = `
      <span class="language-switcher__option-flag">${flagEmoji}</span>
      <span class="language-switcher__option-text">
        <span class="language-switcher__option-name">${fullName}</span>
        <span class="language-switcher__option-code">${shortCode}</span>
      </span>
      ${langCode === currentLanguage ? '<span class="icon language-switcher__option-check" data-lucide="check" aria-hidden="true"></span>' : ''}
    `;
    
    // Mark active language
    if (langCode === currentLanguage) {
      option.setAttribute('data-active', 'true');
      option.setAttribute('aria-current', 'true');
    }
    
    // Set tabindex="-1" initially (will be removed when dropdown opens)
    option.setAttribute('tabindex', '-1');
    
    // Add click event
    option.addEventListener('click', () => {
      if (SUPPORTED_LANGUAGES.includes(langCode)) {
        setLanguage(langCode);
        closeLanguageSwitcher();
      }
    });
    
    dropdown.appendChild(option);
  });
  
  // Refresh icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
  
  // Update trigger button
  updateLanguageSwitcherTrigger();
}

/**
 * Apply translations to all elements with data-i18n attributes
 */
function applyTranslations() {
  // Check if translations are loaded
  // We need at least ukTranslations as fallback
  if (!ukTranslations || Object.keys(ukTranslations).length === 0) {
    // If translations are not loaded yet, wait a bit and try again
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => applyTranslations(), 100);
      }, { once: true });
    } else {
      setTimeout(() => applyTranslations(), 100);
    }
    return;
  }
  
  // If current language translations are not loaded, use Ukrainian as fallback
  if (!translations || Object.keys(translations).length === 0) {
    translations = ukTranslations;
  }
  
  // Apply to elements with data-i18n (text content)
  // Use querySelectorAll on document to find all elements, even hidden ones
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (!key) return;
    
    const translated = t(key);
    // Only update if translation was found (not the key itself)
    if (translated && translated !== key) {
      if (element.tagName === 'OPTION') {
        element.textContent = translated;
      } else {
        element.textContent = translated;
      }
    }
  });
  
  // Apply to elements with data-i18n-attr-* (attributes)
  document.querySelectorAll('[data-i18n-attr]').forEach(element => {
    const attrKeys = element.getAttribute('data-i18n-attr').split(',');
    attrKeys.forEach(attrKey => {
      const [attr, key] = attrKey.trim().split(':');
      if (attr && key) {
        const translated = t(key);
        if (translated && translated !== key) {
          element.setAttribute(attr, translated);
        }
      }
    });
  });
  
  // Apply to specific attribute patterns
  const attrPatterns = ['title', 'placeholder', 'aria-label', 'aria-description', 'alt', 'data-tooltip', 'template'];
  attrPatterns.forEach(attr => {
    document.querySelectorAll(`[data-i18n-${attr}]`).forEach(element => {
      const key = element.getAttribute(`data-i18n-${attr}`);
      if (!key) return;
      
      const translated = t(key);
      if (translated && translated !== key) {
        element.setAttribute(attr, translated);
      }
    });
  });
  
  // Special handling for data-i18n-data-tooltip (for data-tooltip attribute)
  document.querySelectorAll('[data-i18n-data-tooltip]').forEach(element => {
    const key = element.getAttribute('data-i18n-data-tooltip');
    if (!key) return;
    
    const translated = t(key);
    if (translated && translated !== key) {
      element.setAttribute('data-tooltip', translated);
    }
  });
  
  // Update page title
  const pageTitle = document.querySelector('title');
  if (pageTitle && pageTitle.hasAttribute('data-i18n')) {
    const key = pageTitle.getAttribute('data-i18n');
    const translated = t(key);
    if (translated && translated !== key) {
      pageTitle.textContent = translated;
    }
  }
  
  // Update html lang attribute
  const htmlRoot = document.documentElement;
  if (htmlRoot) {
    htmlRoot.setAttribute('lang', currentLanguage);
  }
  
  // Regenerate switcher to update options and trigger with new language
  generateLanguageSwitcher();
  closeLanguageSwitcher();
}

/**
 * Open language switcher dropdown
 */
function openLanguageSwitcher() {
  const dropdown = document.getElementById('language-switcher-dropdown');
  const trigger = document.getElementById('language-switcher-trigger');
  if (!dropdown || !trigger) return;
  
  dropdown.setAttribute('aria-hidden', 'false');
  trigger.setAttribute('aria-expanded', 'true');
  dropdown.classList.add('language-switcher__dropdown--open');
  
  // Make options focusable when open
  const options = dropdown.querySelectorAll('.language-switcher__option');
  options.forEach(option => {
    option.removeAttribute('tabindex');
    option.removeAttribute('inert');
  });
}

/**
 * Close language switcher dropdown
 */
function closeLanguageSwitcher() {
  const dropdown = document.getElementById('language-switcher-dropdown');
  const trigger = document.getElementById('language-switcher-trigger');
  if (!dropdown || !trigger) return;
  
  // Remove focus from any focused element inside dropdown
  const focusedElement = dropdown.querySelector(':focus');
  if (focusedElement) {
    focusedElement.blur();
  }
  
  // Make options non-focusable when closed
  const options = dropdown.querySelectorAll('.language-switcher__option');
  options.forEach(option => {
    option.setAttribute('tabindex', '-1');
  });
  
  dropdown.setAttribute('aria-hidden', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  dropdown.classList.remove('language-switcher__dropdown--open');
}

/**
 * Toggle language switcher dropdown
 */
function toggleLanguageSwitcher() {
  const dropdown = document.getElementById('language-switcher-dropdown');
  if (!dropdown) return;
  
  const isOpen = dropdown.getAttribute('aria-hidden') === 'false';
  if (isOpen) {
    closeLanguageSwitcher();
  } else {
    openLanguageSwitcher();
  }
}

/**
 * Initialize language switcher
 * Generates dropdown options dynamically based on SUPPORTED_LANGUAGES
 */
function initLanguageSwitcher() {
  // Generate dropdown options dynamically
  generateLanguageSwitcher();
  
  // Ensure dropdown is closed initially
  closeLanguageSwitcher();
  
  // Add click event to trigger button
  const trigger = document.getElementById('language-switcher-trigger');
  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLanguageSwitcher();
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const switcher = document.getElementById('language-switcher');
    if (switcher && !switcher.contains(e.target)) {
      closeLanguageSwitcher();
    }
  });
  
  // Close dropdown on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const dropdown = document.getElementById('language-switcher-dropdown');
      const trigger = document.getElementById('language-switcher-trigger');
      if (dropdown && dropdown.getAttribute('aria-hidden') === 'false') {
        closeLanguageSwitcher();
        trigger?.focus(); // Return focus to trigger
      }
    }
  });
  
  // Close dropdown on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLanguageSwitcher();
    }
  });
}

/**
 * Get list of supported languages
 * @returns {Array<string>} Array of language codes
 */
function getSupportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}

// Export i18n API
window.i18n = {
  t,
  getCurrentLanguage,
  setLanguage,
  init: initI18n,
  getSupportedLanguages,
  applyTranslations
};

// Export i18n API immediately (before translations are loaded)
// This allows code to use window.i18n.t() even before initI18n() completes
window.i18n = {
  t,
  getCurrentLanguage,
  setLanguage,
  init: initI18n,
  getSupportedLanguages,
  applyTranslations
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initI18n().then(() => {
      initLanguageSwitcher();
    });
  });
} else {
  initI18n().then(() => {
    initLanguageSwitcher();
  });
}

