import DEFAULT_LIBRARY from "./library.js";
import { t, applyTranslations } from "./i18n.js";
import {
  currentCards,
  currentSettings,
  renderCategoryGrid,
  updateStats,
  generateCards,
  renderCards,
  printPlayerCards,
  printHostCard,
} from "./render.js";
import {
  loadLibrary,
  saveLibrary,
  showImportModal,
  hideImportModal,
  importLibrary,
  resetLibrary,
  showEditModal,
  hideEditModal,
  renderEditTable,
  showEditRowModal,
  hideEditRowModal,
  confirmEditRow,
  deleteGroup,
  saveEditLibrary,
} from "./edit.js";

// DOM selectors
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Main word library
let wordLibrary = loadLibrary(DEFAULT_LIBRARY);

// ============================================================
// Initialize setting buttons
// ============================================================
function initSettingButtons() {
  $("#playerCountGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-opt");
    if (!btn) return;
    $$("#playerCountGroup .btn-opt").forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");
    currentSettings.playerCount = parseInt(btn.dataset.val);
    updateStats(wordLibrary);
  });

  $("#wordCountGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-opt");
    if (!btn) return;
    $$("#wordCountGroup .btn-opt").forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");
    currentSettings.wordCount = parseInt(btn.dataset.val);
    updateStats(wordLibrary);
  });

  $("#styleGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-opt");
    if (!btn) return;
    $$("#styleGroup .btn-opt").forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");
    currentSettings.style = btn.dataset.val;
    if (currentCards.length > 0) renderCards();
  });

  $("#fontSizeGroup").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-opt");
    if (!btn) return;
    $$("#fontSizeGroup .btn-opt").forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");
    currentSettings.fontSize = btn.dataset.val;
  });
}

// ============================================================
// Event binding
// ============================================================
function bindEvents() {
  $("#btnGenerate").addEventListener("click", () =>
    generateCards(wordLibrary)
  );
  $("#btnRegenerate").addEventListener("click", () =>
    generateCards(wordLibrary)
  );
  $("#btnPrintAll").addEventListener("click", printPlayerCards);
  $("#btnPrintHost").addEventListener("click", printHostCard);
  $("#btnImport").addEventListener("click", showImportModal);
  $("#btnImportCancel").addEventListener("click", hideImportModal);
  $("#btnImportConfirm").addEventListener("click", () => {
    const result = importLibrary(wordLibrary);
    if (result) {
      wordLibrary = result;
    }
  });
  $("#btnReset").addEventListener("click", () => {
    const result = resetLibrary(DEFAULT_LIBRARY);
    if (result) {
      wordLibrary = result;
    }
  });

  // Edit
  $("#btnEdit").addEventListener("click", () => showEditModal(wordLibrary));
  $("#btnEditCancel").addEventListener("click", hideEditModal);
  $("#btnEditSave").addEventListener("click", () =>
    saveEditLibrary(wordLibrary)
  );
  $("#btnEditAdd").addEventListener("click", () =>
    showEditRowModal(wordLibrary, -1)
  );
  $("#btnEditRowCancel").addEventListener("click", hideEditRowModal);
  $("#btnEditRowConfirm").addEventListener("click", () =>
    confirmEditRow(wordLibrary)
  );
  $("#editSearch").addEventListener("input", (e) =>
    renderEditTable(wordLibrary, e.target.value)
  );

  // Modal overlay close
  $("#importModal").addEventListener("click", (e) => {
    if (e.target === $("#importModal")) hideImportModal();
  });
  $("#editModal").addEventListener("click", (e) => {
    if (e.target === $("#editModal")) hideEditModal();
  });
  $("#editRowModal").addEventListener("click", (e) => {
    if (e.target === $("#editRowModal")) hideEditRowModal();
  });

  // Category select all / none / invert
  const btnCatAll = document.getElementById("btnCatAll");
  const btnCatNone = document.getElementById("btnCatNone");
  const btnCatInvert = document.getElementById("btnCatInvert");
  if (btnCatAll) {
    btnCatAll.addEventListener("click", () => {
      const categorySelections = {};
      const stats = getCategoryStats(wordLibrary);
      Object.keys(stats).forEach((cat) => {
        categorySelections[cat] = true;
      });
      localStorage.setItem(
        "wordCardCategorySelections",
        JSON.stringify(categorySelections)
      );
      renderCategoryGrid(wordLibrary);
    });
  }
  if (btnCatNone) {
    btnCatNone.addEventListener("click", () => {
      const categorySelections = {};
      const stats = getCategoryStats(wordLibrary);
      Object.keys(stats).forEach((cat) => {
        categorySelections[cat] = false;
      });
      localStorage.setItem(
        "wordCardCategorySelections",
        JSON.stringify(categorySelections)
      );
      renderCategoryGrid(wordLibrary);
    });
  }
  if (btnCatInvert) {
    btnCatInvert.addEventListener("click", () => {
      const saved = JSON.parse(
        localStorage.getItem("wordCardCategorySelections") || "{}"
      );
      const stats = getCategoryStats(wordLibrary);
      const categorySelections = {};
      Object.keys(stats).forEach((cat) => {
        categorySelections[cat] = !saved[cat];
      });
      localStorage.setItem(
        "wordCardCategorySelections",
        JSON.stringify(categorySelections)
      );
      renderCategoryGrid(wordLibrary);
    });
  }

  // Keyboard shortcuts
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
    if (e.ctrlKey && e.key === "g") {
      e.preventDefault();
      generateCards(wordLibrary);
    }
  });
}

function getCategoryStats(wordLibrary) {
  const stats = {};
  wordLibrary.forEach((g) => {
    const cat = g.category || t("msg.uncategorized");
    if (!stats[cat]) stats[cat] = 0;
    stats[cat]++;
  });
  return stats;
}

// ============================================================
// Startup
// ============================================================
function init() {
  applyTranslations();
  initSettingButtons();
  bindEvents();
  renderCategoryGrid(wordLibrary);
  updateStats(wordLibrary);
}

// DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}