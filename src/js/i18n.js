import zhCN from "./locales/zh-CN.js";
import en from "./locales/en.js";

const locales = {
  "zh-CN": zhCN,
  en: en,
};

// Default locale
window.__locale = window.__locale || "zh-CN";

/**
 * Translate a key to the current locale.
 * Supports placeholder replacement: t('key', 'arg1', 'arg2')
 * or t('key', ['arg1', 'arg2'])
 */
export function t(key, ...args) {
  const locale = locales[window.__locale] || locales["zh-CN"];
  let text = locale[key] !== undefined ? locale[key] : key;

  // Replace placeholders: {0}, {1}, etc.
  if (args.length > 0) {
    const replacements = Array.isArray(args[0]) ? args[0] : args;
    text = text.replace(/\{(\d+)\}/g, (_, idx) => {
      const i = parseInt(idx);
      return replacements[i] !== undefined ? replacements[i] : "";
    });
  }

  return text;
}

/**
 * Set the current locale and re-render translations.
 */
export function setLocale(localeName) {
  if (locales[localeName]) {
    window.__locale = localeName;
    applyTranslations();
  }
}

/**
 * Apply translations to all elements with data-i18n attribute.
 */
export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });

  // Handle placeholder attributes
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      el.setAttribute("placeholder", t(key));
    }
  });

  // Handle summary elements (category toggle)
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });
}

export default { t, setLocale, applyTranslations };