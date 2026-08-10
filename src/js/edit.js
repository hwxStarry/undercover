import { t } from "./i18n.js";
import { escapeHtml, renderCategoryGrid, updateStats, currentCards } from "./render.js";

const $ = (sel) => document.querySelector(sel);

let editModalIdx = -1;

export function loadLibrary(defaultLibrary) {
  try {
    const saved = localStorage.getItem("wordCardLibrary");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    /* ignore */
  }
  return JSON.parse(JSON.stringify(defaultLibrary));
}

export function saveLibrary(wordLibrary) {
  localStorage.setItem("wordCardLibrary", JSON.stringify(wordLibrary));
  updateStats(wordLibrary);
  renderCategoryGrid(wordLibrary);
}

// ============================================================
// Import
// ============================================================
export function showImportModal() {
  $("#importModal").classList.add("show");
  $("#importTextarea").value = "";
  $("#importStatus").textContent = "";
  $("#importStatus").className = "status-msg";
}

export function hideImportModal() {
  $("#importModal").classList.remove("show");
}

export function importLibrary(wordLibrary) {
  const raw = $("#importTextarea").value.trim();
  const statusEl = $("#importStatus");
  if (!raw) {
    statusEl.textContent = t("msg.importEmpty");
    statusEl.className = "status-msg error";
    return;
  }

  try {
    const data = JSON.parse(raw);
    let groups;
    if (Array.isArray(data)) {
      groups = data;
    } else if (data.groups && Array.isArray(data.groups)) {
      groups = data.groups;
    } else {
      throw new Error(t("msg.importFormatError"));
    }

    const valid = groups
      .filter(
        (g) =>
          g.base &&
          typeof g.base === "string" &&
          Array.isArray(g.variants) &&
          g.variants.length > 0 &&
          g.variants.every((v) => typeof v === "string")
      )
      .map((g) => ({
        base: g.base,
        variants: g.variants,
        category: g.category || t("msg.uncategorized"),
      }));

    if (valid.length === 0) {
      throw new Error(t("msg.importNoValid"));
    }

    wordLibrary.length = 0;
    wordLibrary.push(...valid);
    saveLibrary(wordLibrary);
    statusEl.textContent = t("msg.importSuccess", [valid.length]);
    statusEl.className = "status-msg success";
    updateStats(wordLibrary);
    setTimeout(hideImportModal, 1200);
    return valid;
  } catch (e) {
    statusEl.textContent = t("msg.importFailed", [e.message]);
    statusEl.className = "status-msg error";
    return null;
  }
}

export function resetLibrary(defaultLibrary) {
  if (confirm(t("msg.resetConfirm"))) {
    const wordLibrary = JSON.parse(JSON.stringify(defaultLibrary));
    localStorage.removeItem("wordCardLibrary");
    localStorage.removeItem("wordCardCategorySelections");
    updateStats(wordLibrary);
    renderCategoryGrid(wordLibrary);
    return wordLibrary;
  }
  return null;
}

// ============================================================
// Edit
// ============================================================
export function showEditModal(wordLibrary) {
  $("#editModal").classList.add("show");
  $("#editSearch").value = "";
  renderEditTable(wordLibrary);
}

export function hideEditModal() {
  $("#editModal").classList.remove("show");
}

export function renderEditTable(wordLibrary, filter = "") {
  const tbody = $("#editTableBody");
  const kw = filter.toLowerCase().trim();
  const filtered = kw
    ? wordLibrary.filter((g) => {
        if (g.base.toLowerCase().includes(kw)) return true;
        if (g.variants.some((v) => v.toLowerCase().includes(kw))) return true;
        if ((g.category || t("msg.uncategorized")).toLowerCase().includes(kw))
          return true;
        return false;
      })
    : wordLibrary;

  $("#editCount").textContent = `${t("edit.countShow")} ${filtered.length} / ${wordLibrary.length} ${t("edit.countUnit")}`;

  tbody.innerHTML = filtered
    .map((g) => {
      const origIdx = wordLibrary.indexOf(g);
      const variants = g.variants.join(", ");
      const cat = g.category || t("msg.uncategorized");
      return `<tr>
      <td class="td-num">${origIdx + 1}</td>
      <td class="td-base">${escapeHtml(g.base)}</td>
      <td class="td-variants">${escapeHtml(variants)}</td>
      <td class="td-cat">${escapeHtml(cat)}</td>
      <td class="td-actions">
        <span class="btn-icon" data-action="edit" data-idx="${origIdx}">✏️</span>
        <span class="btn-icon del" data-action="del" data-idx="${origIdx}">🗑</span>
      </td>
    </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".btn-icon").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const action = btn.dataset.action;
      const idx = parseInt(btn.dataset.idx);
      if (action === "edit") {
        showEditRowModal(wordLibrary, idx);
      } else if (action === "del") {
        deleteGroup(wordLibrary, idx);
      }
    });
  });
}

export function showEditRowModal(wordLibrary, idx = -1) {
  editModalIdx = idx;
  const cats = [
    ...new Set(wordLibrary.map((g) => g.category || t("msg.uncategorized"))),
  ].sort();
  $("#categoryList").innerHTML = cats
    .map((c) => `<option value="${escapeHtml(c)}">`)
    .join("");

  if (idx >= 0) {
    $("#editRowTitle").textContent = t("editRow.editTitle");
    $("#editRowBase").value = wordLibrary[idx].base;
    $("#editRowVariants").value = wordLibrary[idx].variants.join(", ");
    $("#editRowCategory").value =
      wordLibrary[idx].category || t("msg.uncategorized");
  } else {
    $("#editRowTitle").textContent = t("editRow.addTitle");
    $("#editRowBase").value = "";
    $("#editRowVariants").value = "";
    $("#editRowCategory").value = t("editRow.uncategorized");
  }
  $("#editRowStatus").textContent = "";
  $("#editRowStatus").className = "status-msg";
  $("#editRowModal").classList.add("show");
}

export function hideEditRowModal() {
  $("#editRowModal").classList.remove("show");
}

export function confirmEditRow(wordLibrary) {
  const base = $("#editRowBase").value.trim();
  const variantsRaw = $("#editRowVariants").value.trim();
  const category =
    $("#editRowCategory").value.trim() || t("editRow.uncategorized");
  const statusEl = $("#editRowStatus");

  if (!base) {
    statusEl.textContent = t("msg.enterBase");
    statusEl.className = "status-msg error";
    return;
  }
  if (!variantsRaw) {
    statusEl.textContent = t("msg.enterVariants");
    statusEl.className = "status-msg error";
    return;
  }

  const variants = variantsRaw.split(/[,，\s]+/).filter((v) => v.length > 0);
  if (variants.length === 0) {
    statusEl.textContent = t("msg.enterVariants");
    statusEl.className = "status-msg error";
    return;
  }

  if (editModalIdx >= 0) {
    wordLibrary[editModalIdx] = { base, variants, category };
  } else {
    wordLibrary.push({ base, variants, category });
  }

  hideEditRowModal();
  renderEditTable(wordLibrary, $("#editSearch").value);
}

export function deleteGroup(wordLibrary, idx) {
  if (!confirm(t("msg.deleteConfirm", [wordLibrary[idx].base]))) return;
  wordLibrary.splice(idx, 1);
  renderEditTable(wordLibrary, $("#editSearch").value);
}

export function saveEditLibrary(wordLibrary) {
  saveLibrary(wordLibrary);
  $("#editStatus").textContent = t("editRow.saved");
  $("#editStatus").className = "status-msg success";
  setTimeout(() => {
    $("#editStatus").textContent = "";
  }, 2000);
}