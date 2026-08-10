// 应用状态
// ============================================================
function loadLibrary() {
  try {
    const saved = localStorage.getItem("wordCardLibrary");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT_LIBRARY));
}
function saveLibrary() {
  localStorage.setItem("wordCardLibrary", JSON.stringify(wordLibrary));
  updateStats();
  renderCategoryGrid();
}
let wordLibrary = loadLibrary();

// ============================================================
// 类别选择
// ============================================================
let categorySelections = {}; // { "水果": true, "蔬菜": true, ... }

function loadCategorySelections() {
  try {
    const saved = localStorage.getItem("wordCardCategorySelections");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

function saveCategorySelections() {
  localStorage.setItem("wordCardCategorySelections", JSON.stringify(categorySelections));
}

function getCategoryStats() {
  const stats = {};
  wordLibrary.forEach(g => {
    const cat = g.category || "未分类";
    if (!stats[cat]) stats[cat] = 0;
    stats[cat]++;
  });
  return stats;
}

function renderCategoryGrid() {
  const stats = getCategoryStats();
  const saved = loadCategorySelections();

  // Initialize categorySelections
  const newSelections = {};
  Object.keys(stats).forEach(cat => {
    if (saved && saved.hasOwnProperty(cat)) {
      newSelections[cat] = saved[cat];
    } else {
      newSelections[cat] = true;
    }
  });
  categorySelections = newSelections;

  const grid = document.getElementById("categoryGrid");
  if (!grid) return;

  const cats = Object.keys(stats).sort((a, b) => stats[b] - stats[a]);

  let html = "";
  cats.forEach(cat => {
    const checked = categorySelections[cat] ? " checked" : "";
    html += `<label><input type="checkbox" value="${escapeHtml(cat)}"${checked} data-cat="${escapeHtml(cat)}"> ${escapeHtml(cat)} <span class="cat-count">(${stats[cat]})</span></label>`;
  });
  grid.innerHTML = html;

  // Bind change events
  grid.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      categorySelections[cb.dataset.cat] = cb.checked;
      saveCategorySelections();
      updateCategoryCount();
    });
  });

  updateCategoryCount();
}

function updateCategoryCount() {
  const stats = getCategoryStats();
  const catCountEl = document.getElementById("catCount");
  const catTotalEl = document.getElementById("catTotal");

  if (!catCountEl || !catTotalEl) return;

  let selectedCount = 0;
  let selectedGroups = 0;
  Object.keys(stats).forEach(cat => {
    if (categorySelections[cat] !== false) {
      selectedCount++;
      selectedGroups += stats[cat];
    }
  });
  catCountEl.textContent = selectedCount;
  catTotalEl.textContent = selectedGroups;
}

let currentCards = [];       // [{ playerIndex, words: [{word, isDiff}] }]
let currentSettings = {
  playerCount: 3,
  wordCount: 50,
  style: "red",
  fontSize: "medium"
};

// ============================================================
// 生成逻辑
// ============================================================
function generateCards() {
  const { playerCount, wordCount } = currentSettings;

  // 根据类别过滤词库
  const filtered = wordLibrary.filter(g => categorySelections[g.category] !== false);
  if (filtered.length < wordCount) {
    alert(t('error.insufficient', {0: wordCount, 1: filtered.length}));
    return;
  }

  // 1. 随机打乱词库并取前 wordCount 组
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, wordCount);

  // 2. 为每组随机选一个变体词
  const groups = selected.map(g => ({
    base: g.base,
    variant: g.variants[Math.floor(Math.random() * g.variants.length)]
  }));

  // 3. 生成卡片：第 i 个位置的卧底 = i % playerCount
  currentCards = [];
  for (let p = 0; p < playerCount; p++) {
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      const isDiff = (i % playerCount) === p;
      words.push({
        word: isDiff ? groups[i].variant : groups[i].base,
        isDiff: isDiff
      });
    }
    currentCards.push({ playerIndex: p, words });
  }

  // 4. 更新 UI
  updateStats();
  renderCards();
  $("#actionsBar").style.display = "flex";
  if (playerCount >= 4) {
    $("#btnPrintHost").style.display = "";
  } else {
    $("#btnPrintHost").style.display = "none";
  }
}

function updateStats() {
  const { playerCount, wordCount } = currentSettings;
  $("#statLibSize").textContent = wordLibrary.length;
  $("#statCards").textContent = currentCards.length > 0 ? currentCards.length : "0";
  const diffPerPerson = currentCards.length > 0
    ? Math.ceil(wordCount / playerCount)
    : "-";
  $("#statDiff").textContent = diffPerPerson;
}

// ============================================================
// 渲染卡片预览
// ============================================================
function renderCards() {
  const { playerCount, style } = currentSettings;
  const styleClass = style === "simple" ? "style-simple" : "";

  // 渲染标签
  const tabsEl = $("#previewTabs");
  tabsEl.style.display = "flex";
  let tabHTML = "";
  for (let p = 0; p < playerCount; p++) {
    const activeClass = p === 0 ? " active" : "";
    tabHTML += `<button class="preview-tab${activeClass}" data-tab="player-${p}">${t('card.player', {0: p + 1})}</button>`;
  }
  if (playerCount >= 4) {
    tabHTML += `<button class="preview-tab host-tab" data-tab="host">${t('card.host')}</button>`;
  }
  tabsEl.innerHTML = tabHTML;

  // 渲染所有卡片
  const contentEl = $("#previewContent");
  let cardsHTML = "";

  // 玩家卡片
  for (let p = 0; p < playerCount; p++) {
    const display = p === 0 ? "block" : "none";
    cardsHTML += `<div class="card-panel" id="panel-player-${p}" style="display:${display}">`;
    cardsHTML += renderSingleCard(p, false, styleClass);
    cardsHTML += "</div>";
  }

  // 主持人卡片
  if (playerCount >= 4) {
    cardsHTML += `<div class="card-panel" id="panel-host" style="display:none">`;
    cardsHTML += renderHostCardsAll(styleClass);
    cardsHTML += "</div>";
  }

  contentEl.innerHTML = cardsHTML;

  // 绑定标签切换
  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".preview-tab");
    if (!btn) return;
    $$("#previewTabs .preview-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    $$(".card-panel").forEach(p => p.style.display = "none");
    const panel = $(`#panel-${tab}`);
    if (panel) panel.style.display = "block";
  });
}

function renderSingleCard(playerIndex, isHost, styleClass) {
  const card = currentCards[playerIndex];
  const hostClass = isHost ? " host-card" : "";
  const title = isHost ? t('card.hostPlayer', {0: playerIndex + 1}) : t('card.title', {0: playerIndex + 1});
  const badge = isHost ? t('card.diffHighlight') : t('card.player', {0: playerIndex + 1});

  let html = `<div class="card-preview ${styleClass}${hostClass}">`;
  html += `<div class="card-preview-header"><span class="title">${title}</span><span class="badge">${badge}</span></div>`;
  html += `<div class="card-preview-grid">`;
  card.words.forEach((w, i) => {
    const diffClass = (isHost && w.isDiff) ? " diff" : "";
    html += `<div class="card-preview-item${diffClass}"><span class="num">${i + 1}.</span><span class="word">${w.word}</span></div>`;
  });
  html += `</div></div>`;
  return html;
}

function renderHostCardsAll(styleClass) {
  const { playerCount } = currentSettings;
  // 构建 hostWords：每个位置 { base, variant }
  const hostWords = [];
  for (let i = 0; i < currentCards[0].words.length; i++) {
    let base = "", variant = "";
    for (let p = 0; p < playerCount; p++) {
      if (currentCards[p].words[i].isDiff) {
        variant = currentCards[p].words[i].word;
      } else {
        base = currentCards[p].words[i].word;
      }
    }
    hostWords.push({ base, variant });
  }

  let html = `<div class="card-preview ${styleClass} host-single">`;
  html += `<div class="card-preview-header"><span class="title">${t('card.host')}</span><span class="badge">${t('card.spyWordRed')}</span></div>`;
  html += `<div class="host-grid">`;
  hostWords.forEach((hw, i) => {
    html += `<div class="host-item">`;
    html += `<div class="host-base"><span class="num">${i + 1}.</span><span class="word">${hw.base}</span></div>`;
    html += `<div class="host-variant">🕵 ${hw.variant}</div>`;
    html += `</div>`;
  });
  html += `</div></div>`;
  return html;
}

// ============================================================
// 打印功能
// ============================================================
function getPrintStyle(style) {
  const borderStyle = style === "simple"
    ? "2px solid #333"
    : "1.5px dashed #999";
  const titleColor = style === "simple" ? "#333" : "#c0392b";
  const numColor = style === "simple" ? "#555" : "#c0392b";
  return { borderStyle, titleColor, numColor };
}

function getFontSizes(size) {
  // small / medium / large
  switch (size) {
    case "small":
      return { title: "11pt", badge: "7pt", word: "7pt", num: "6pt", gridGap: "1mm 2mm", hostBase: "8pt", hostVariant: "7pt", hostTitle: "12pt" };
    case "large":
      return { title: "15pt", badge: "10pt", word: "9pt", num: "8pt", gridGap: "1.5mm 4mm", hostBase: "10pt", hostVariant: "9pt", hostTitle: "16pt" };
    default: // medium
      return { title: "13pt", badge: "9pt", word: "8pt", num: "7pt", gridGap: "1mm 3mm", hostBase: "9pt", hostVariant: "8pt", hostTitle: "14pt" };
  }
}

function printPlayerCards() {
  const { playerCount, wordCount, style, fontSize } = currentSettings;
  if (currentCards.length === 0) return;
  const { borderStyle, titleColor, numColor } = getPrintStyle(style);
  const fs = getFontSizes(fontSize);

  // 计算每页卡片数（A4竖版，3张/页）
  const cardsPerPage = 3;
  const pages = Math.ceil(playerCount / cardsPerPage);

  let html = `<!-- Generated by Trae Work -->
<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${t('print.playerTitle')}</title><style>
@page { size: A4 portrait; margin: 6mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif; }
.page-wrapper { page-break-after:always; break-after:page; }
.page-wrapper:last-child { page-break-after:auto; break-after:auto; }
.page { width: 210mm; min-height: 297mm; padding: 6mm 8mm; display:flex; flex-direction:column; gap:4mm; }
.card { flex:1; border:${borderStyle}; border-radius:4px; padding:3mm 4mm 4mm; display:flex; flex-direction:column; min-height:0; page-break-inside:avoid; break-inside:avoid; }
.card-header { display:flex; justify-content:space-between; margin-bottom:2mm; padding-bottom:1.5mm; border-bottom:1px solid #ddd; }
.card-title { font-size:${fs.title}; font-weight:700; color:${titleColor}; }
.card-badge { font-size:${fs.badge}; color:#999; }
.word-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:${fs.gridGap}; flex:1; align-content:start; }
.word-item { display:flex; align-items:center; gap:1mm; font-size:${fs.word}; line-height:1.5; }
.word-num { color:${numColor}; font-weight:600; font-size:${fs.num}; min-width:14px; text-align:right; flex-shrink:0; }
.word-text { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.preview-toolbar { position:fixed; top:0; left:0; right:0; z-index:1000; background:#fff; border-bottom:2px solid #c0392b; padding:8px 16px; display:flex; justify-content:space-between; align-items:center; }
.preview-toolbar .title { font-size:14pt; font-weight:700; color:#c0392b; }
.preview-toolbar .btns { display:flex; gap:8px; }
.preview-toolbar button { padding:6px 18px; border:none; border-radius:4px; cursor:pointer; font-size:11pt; }
.preview-toolbar .btn-print { background:#c0392b; color:#fff; }
.preview-toolbar .btn-print:hover { background:#a93226; }
.preview-toolbar .btn-close { background:#eee; color:#333; }
.preview-toolbar .btn-close:hover { background:#ddd; }
body { padding-top:50px; }
@media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .preview-toolbar { display:none !important; } body { padding-top:0; } }
</style></head><body>
<div class="preview-toolbar"><span class="title">${t('print.playerPreviewTitle')}</span><div class="btns"><button class="btn-print" onclick="window.print()">${t('print.print')}</button><button class="btn-close" onclick="window.close()">${t('print.close')}</button></div></div>
`;

  for (let page = 0; page < pages; page++) {
    html += `<div class="page-wrapper"><div class="page">`;
    for (let c = 0; c < cardsPerPage; c++) {
      const p = page * cardsPerPage + c;
      if (p >= playerCount) break;
      const card = currentCards[p];
      html += `<div class="card">`;
      html += `<div class="card-header"><span class="card-title">${t('card.title', {0: p + 1})}</span><span class="card-badge">${t('card.player', {0: p + 1})}</span></div>`;
      html += `<div class="word-grid">`;
      card.words.forEach((w, i) => {
        html += `<div class="word-item"><span class="word-num">${i + 1}.</span><span class="word-text">${w.word}</span></div>`;
      });
      html += `</div></div>`;
    }
    html += `</div></div>`;
  }

  html += `</body></html>`;
  openPrintWindow(html);
}

function printHostCard() {
  const { playerCount, style, fontSize } = currentSettings;
  if (currentCards.length === 0 || playerCount < 4) return;
  const { borderStyle, titleColor, numColor } = getPrintStyle(style);
  const fs = getFontSizes(fontSize);

  // 构建 hostWords
  const wordCount = currentCards[0].words.length;
  const hostWords = [];
  for (let i = 0; i < wordCount; i++) {
    let base = "", variant = "";
    for (let p = 0; p < playerCount; p++) {
      if (currentCards[p].words[i].isDiff) {
        variant = currentCards[p].words[i].word;
      } else {
        base = currentCards[p].words[i].word;
      }
    }
    hostWords.push({ base, variant });
  }

  let html = `<!-- Generated by Trae Work -->
<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${t('print.hostTitle')}</title><style>
@page { size: A4 portrait; margin: 8mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif; }
.page { width: 210mm; min-height: 297mm; padding: 8mm 10mm; }
.card { border:${borderStyle}; border-radius:6px; padding:5mm 6mm; background:#fff; page-break-inside:avoid; break-inside:avoid; }
.card-header { display:flex; justify-content:space-between; margin-bottom:3mm; padding-bottom:2mm; border-bottom:1px solid #ddd; }
.card-title { font-size:${fs.hostTitle}; font-weight:700; color:${titleColor}; }
.card-badge { font-size:${fs.badge}; color:#e67e22; }
.host-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:${fs.gridGap}; }
.host-item { display:flex; flex-direction:column; line-height:1.6; }
.host-base { display:flex; align-items:center; gap:1mm; font-size:${fs.hostBase}; }
.host-base .num { color:${numColor}; font-weight:600; font-size:${fs.num}; min-width:16px; text-align:right; flex-shrink:0; }
.host-variant { font-size:${fs.hostVariant}; color:#c0392b; font-weight:600; padding-left:17px; }
.preview-toolbar { position:fixed; top:0; left:0; right:0; z-index:1000; background:#fff; border-bottom:2px solid #c0392b; padding:8px 16px; display:flex; justify-content:space-between; align-items:center; }
.preview-toolbar .title { font-size:14pt; font-weight:700; color:#c0392b; }
.preview-toolbar .btns { display:flex; gap:8px; }
.preview-toolbar button { padding:6px 18px; border:none; border-radius:4px; cursor:pointer; font-size:11pt; }
.preview-toolbar .btn-print { background:#c0392b; color:#fff; }
.preview-toolbar .btn-print:hover { background:#a93226; }
.preview-toolbar .btn-close { background:#eee; color:#333; }
.preview-toolbar .btn-close:hover { background:#ddd; }
body { padding-top:50px; }
@media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .preview-toolbar { display:none !important; } body { padding-top:0; } }
</style></head><body><div class="preview-toolbar"><span class="title">${t('print.hostPreviewTitle')}</span><div class="btns"><button class="btn-print" onclick="window.print()">${t('print.print')}</button><button class="btn-close" onclick="window.close()">${t('print.close')}</button></div></div><div class="page-wrapper"><div class="page"><div class="card">`;
  html += `<div class="card-header"><span class="card-title">${t('card.host')}</span><span class="card-badge">${t('card.spyWordRed')}</span></div>`;
  html += `<div class="host-grid">`;
  hostWords.forEach((hw, i) => {
    html += `<div class="host-item">`;
    html += `<div class="host-base"><span class="num">${i + 1}.</span><span>${hw.base}</span></div>`;
    html += `<div class="host-variant">🕵 ${hw.variant}</div>`;
    html += `</div>`;
  });
  html += `</div></div></div></div></body></html>`;
  openPrintWindow(html);
}

function openPrintWindow(html) {
  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(html);
  w.document.close();
  w.focus();
}

// ============================================================

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}