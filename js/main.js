// DOM 引用
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ============================================================
// 初始化设置按钮
// ============================================================
function initSettingButtons() {
  // 玩家数量
  $("#playerCountGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-opt");
    if (!btn) return;
    $$("#playerCountGroup .btn-opt").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSettings.playerCount = parseInt(btn.dataset.val);
    updateStats();
  });

  // 词数
  $("#wordCountGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-opt");
    if (!btn) return;
    $$("#wordCountGroup .btn-opt").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSettings.wordCount = parseInt(btn.dataset.val);
    updateStats();
  });

  // 风格
  $("#styleGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-opt");
    if (!btn) return;
    $$("#styleGroup .btn-opt").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSettings.style = btn.dataset.val;
    if (currentCards.length > 0) renderCards();
  });

  // 打印字号
  $("#fontSizeGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-opt");
    if (!btn) return;
    $$("#fontSizeGroup .btn-opt").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSettings.fontSize = btn.dataset.val;
  });
}

// ============================================================
// 事件绑定
// ============================================================
function bindEvents() {
  $("#btnGenerate").addEventListener("click", generateCards);
  $("#btnRegenerate").addEventListener("click", generateCards);
  $("#btnPrintAll").addEventListener("click", printPlayerCards);
  $("#btnPrintHost").addEventListener("click", printHostCard);
  $("#btnImport").addEventListener("click", showImportModal);
  $("#btnImportCancel").addEventListener("click", hideImportModal);
  $("#btnImportConfirm").addEventListener("click", importLibrary);
  $("#btnReset").addEventListener("click", resetLibrary);

  // 编辑词库
  $("#btnEdit").addEventListener("click", showEditModal);
  $("#btnEditCancel").addEventListener("click", hideEditModal);
  $("#btnEditSave").addEventListener("click", saveEditLibrary);
  $("#btnEditAdd").addEventListener("click", () => showEditRowModal(-1));
  $("#btnEditRowCancel").addEventListener("click", hideEditRowModal);
  $("#btnEditRowConfirm").addEventListener("click", confirmEditRow);
  $("#editSearch").addEventListener("input", (e) => renderEditTable(e.target.value));

  // 点击遮罩关闭
  $("#importModal").addEventListener("click", (e) => {
    if (e.target === $("#importModal")) hideImportModal();
  });
  $("#editModal").addEventListener("click", (e) => {
    if (e.target === $("#editModal")) hideEditModal();
  });
  $("#editRowModal").addEventListener("click", (e) => {
    if (e.target === $("#editRowModal")) hideEditRowModal();
  });

  // 类别选择
  const btnCatAll = document.getElementById("btnCatAll");
  const btnCatNone = document.getElementById("btnCatNone");
  const btnCatInvert = document.getElementById("btnCatInvert");
  if (btnCatAll) {
    btnCatAll.addEventListener("click", () => {
      Object.keys(categorySelections).forEach(cat => { categorySelections[cat] = true; });
      saveCategorySelections();
      renderCategoryGrid();
    });
  }
  if (btnCatNone) {
    btnCatNone.addEventListener("click", () => {
      Object.keys(categorySelections).forEach(cat => { categorySelections[cat] = false; });
      saveCategorySelections();
      renderCategoryGrid();
    });
  }
  if (btnCatInvert) {
    btnCatInvert.addEventListener("click", () => {
      Object.keys(categorySelections).forEach(cat => { categorySelections[cat] = !categorySelections[cat]; });
      saveCategorySelections();
      renderCategoryGrid();
    });
  }

  // 快捷键
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if ($("#editRowModal").classList.contains("show")) {
        hideEditRowModal();
      } else if ($("#editModal").classList.contains("show")) {
        hideEditModal();
      } else {
        hideImportModal();
      }
    }
    if (document.body.dataset.view === "offline" && e.ctrlKey && e.key.toLowerCase() === "g") {
      e.preventDefault();
      generateCards();
    }
  });
}

// ============================================================
// 启动
// ============================================================
initSettingButtons();
bindEvents();
renderCategoryGrid();
updateStats();
