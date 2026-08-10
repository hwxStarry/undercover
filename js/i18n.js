// ============================================================
// i18n 国际化引擎
// 默认跟随浏览器语言，支持手动切换，localStorage 记住偏好
// ============================================================

// 当前语言
var __lang = 'zh-CN';

// 翻译字典
var __dict = {};

// 支持的语言列表
var __locales = ['zh-CN', 'en'];

// 初始化：检测浏览器语言
function initI18n() {
  // 1. 优先用户之前的选择
  var saved = localStorage.getItem('app-lang');
  if (saved && __locales.indexOf(saved) !== -1) {
    __lang = saved;
    return;
  }
  // 2. 检测浏览器语言
  var navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (navLang.indexOf('zh') === 0) {
    __lang = 'zh-CN';
  } else {
    __lang = 'en';
  }
}

// 注册翻译
function registerLocale(lang, dict) {
  __dict[lang] = dict;
}

// 从嵌套对象中按 dot-notation 路径获取值
// 例如 key = "settings.playerCount" → dict["settings"]["playerCount"]
function _resolveKey(dict, key) {
  var parts = key.split('.');
  var val = dict;
  for (var i = 0; i < parts.length; i++) {
    if (val && typeof val === 'object') {
      val = val[parts[i]];
    } else {
      return undefined;
    }
  }
  return val;
}

// 翻译函数
// t('key') → 返回翻译文本
// t('key', {0: 'val', 1: 'val2'}) → 替换占位符 {0} {1}
// 支持 dot-notation 键名，如 t('settings.playerCount')
function t(key, params) {
  var dict = __dict[__lang] || __dict['zh-CN'] || {};
  var text = _resolveKey(dict, key);
  if (text === undefined) {
    // 回退到中文
    var fallback = __dict['zh-CN'] || {};
    text = _resolveKey(fallback, key);
  }
  if (text === undefined || typeof text !== 'string') return key;
  // 替换占位符
  if (params) {
    for (var k in params) {
      if (params.hasOwnProperty(k)) {
        text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
      }
    }
  }
  return text;
}

// 切换语言
function setLanguage(lang) {
  if (__locales.indexOf(lang) === -1) return;
  __lang = lang;
  localStorage.setItem('app-lang', lang);
  document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en';
  applyTranslations();
  // 重新渲染 UI（类别筛选、统计等）
  if (typeof renderCategoryGrid === 'function') renderCategoryGrid();
  if (typeof updateStats === 'function') updateStats();
  if (typeof renderCards === 'function' && typeof window.__currentGenerate === 'function') window.__currentGenerate();
}

// 遍历 DOM 替换 data-i18n 标记的文本
function applyTranslations() {
  // 更新 data-i18n 元素（使用 innerHTML 以支持 HTML 标签）
  var els = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var key = el.getAttribute('data-i18n');
    var text = t(key);
    if (text) el.innerHTML = text;
  }
  // 更新 data-i18n-placeholder
  var phs = document.querySelectorAll('[data-i18n-placeholder]');
  for (var j = 0; j < phs.length; j++) {
    var ph = phs[j];
    var phKey = ph.getAttribute('data-i18n-placeholder');
    ph.placeholder = t(phKey);
  }
  // 更新 data-i18n-title
  var titles = document.querySelectorAll('[data-i18n-title]');
  for (var k = 0; k < titles.length; k++) {
    var ti = titles[k];
    ti.title = t(ti.getAttribute('data-i18n-title'));
  }
  // 更新语言切换按钮
  updateLangSwitcher();
}

// 更新语言切换按钮状态
function updateLangSwitcher() {
  var btn = document.getElementById('btnLang');
  if (btn) {
    btn.textContent = __lang === 'zh-CN' ? 'EN' : '中';
    btn.title = __lang === 'zh-CN' ? 'Switch to English' : '切换到中文';
  }
}

// 创建语言切换按钮
function createLangSwitcher() {
  var header = document.querySelector('.header');
  if (!header) return;
  var btn = document.createElement('button');
  btn.id = 'btnLang';
  btn.className = 'lang-switcher';
  btn.title = 'Switch to English';
  btn.textContent = 'EN';
  btn.addEventListener('click', function () {
    var next = __lang === 'zh-CN' ? 'en' : 'zh-CN';
    setLanguage(next);
  });
  header.appendChild(btn);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
  initI18n();
  document.documentElement.lang = __lang === 'zh-CN' ? 'zh-CN' : 'en';
  applyTranslations();
  createLangSwitcher();
});