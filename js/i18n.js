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
  if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
  if (typeof window.renderOnlineRoom === 'function') window.renderOnlineRoom();
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

// 创建语言切换按钮和 GitHub 链接
function createLangSwitcher() {
  var header = document.querySelector('.header');
  if (!header) return;

  // 创建容器
  var wrapper = document.createElement('div');
  wrapper.className = 'header-actions';

  // GitHub 链接
  var gitLink = document.createElement('a');
  gitLink.href = 'https://github.com/hwxStarry/undercover';
  gitLink.target = '_blank';
  gitLink.rel = 'noopener';
  gitLink.className = 'header-github';
  gitLink.title = 'View on GitHub';
  gitLink.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
  wrapper.appendChild(gitLink);

  // 语言切换按钮
  var btn = document.createElement('button');
  btn.id = 'btnLang';
  btn.className = 'lang-switcher';
  btn.title = 'Switch to English';
  btn.textContent = 'EN';
  btn.addEventListener('click', function () {
    var next = __lang === 'zh-CN' ? 'en' : 'zh-CN';
    setLanguage(next);
  });
  wrapper.appendChild(btn);
  header.appendChild(wrapper);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
  initI18n();
  document.documentElement.lang = __lang === 'zh-CN' ? 'zh-CN' : 'en';
  createLangSwitcher();
  applyTranslations();
  if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
});
