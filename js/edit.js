// 导入词库
// ============================================================
function showImportModal() {
  $("#importModal").classList.add("show");
  $("#importTextarea").value = "";
  $("#importStatus").textContent = "";
  $("#importStatus").className = "status-msg";
}

function hideImportModal() {
  $("#importModal").classList.remove("show");
}

function importLibrary() {
  const raw = $("#importTextarea").value.trim();
  const statusEl = $("#importStatus");
  if (!raw) {
    statusEl.textContent = t('import.errorEmpty');
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
      throw new Error(t('import.errorFormat'));
    }

    // 验证
    const valid = groups.filter(g =>
      g.base && typeof g.base === "string" &&
      Array.isArray(g.variants) && g.variants.length > 0 &&
      g.variants.every(v => typeof v === "string")
    ).map(g => ({
      base: g.base,
      variants: g.variants,
      category: g.category || "未分类"
    }));

    if (valid.length === 0) {
      throw new Error(t('import.errorNoValid'));
    }

    wordLibrary = valid;
    saveLibrary();
    statusEl.textContent = t('import.success', {0: valid.length});
    statusEl.className = "status-msg success";
    updateStats();
    setTimeout(hideImportModal, 1200);
  } catch (e) {
    statusEl.textContent = t('import.errorFail', {0: e.message});
    statusEl.className = "status-msg error";
  }
}

function resetLibrary() {
  if (confirm(t('reset.confirm'))) {
    wordLibrary = JSON.parse(JSON.stringify(DEFAULT_LIBRARY));
    localStorage.removeItem("wordCardLibrary");
    localStorage.removeItem("wordCardCategorySelections");
    categorySelections = {};
    updateStats();
    renderCategoryGrid();
  }
}

// ============================================================
// 编辑词库
// ============================================================
let editModalIdx = -1; // -1 = add, >=0 = edit

function showEditModal() {
  $("#editModal").classList.add("show");
  $("#editSearch").value = "";
  renderEditTable();
}

function hideEditModal() {
  $("#editModal").classList.remove("show");
}

function renderEditTable(filter = "") {
  const tbody = $("#editTableBody");
  const kw = filter.toLowerCase().trim();
  const filtered = kw
    ? wordLibrary.filter((g, i) => {
        if (g.base.toLowerCase().includes(kw)) return true;
        if (g.variants.some(v => v.toLowerCase().includes(kw))) return true;
        if ((g.category || "未分类").toLowerCase().includes(kw)) return true;
        return false;
      })
    : wordLibrary;

  $("#editCount").textContent = t('edit.showCount', {0: filtered.length, 1: wordLibrary.length});

  tbody.innerHTML = filtered.map((g) => {
    const origIdx = wordLibrary.indexOf(g);
    const variants = g.variants.join(", ");
    const rawCat = g.category || "未分类";
    const cat = rawCat === "未分类" ? t('common.uncategorized') : rawCat;
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
  }).join("");

  // Bind click events
  tbody.querySelectorAll(".btn-icon").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const action = btn.dataset.action;
      const idx = parseInt(btn.dataset.idx);
      if (action === "edit") {
        showEditRowModal(idx);
      } else if (action === "del") {
        deleteGroup(idx);
      }
    });
  });
}


function showEditRowModal(idx = -1) {
  editModalIdx = idx;
  // 填充 datalist
  const cats = [...new Set(wordLibrary.map(g => g.category || "未分类"))].sort();
  $("#categoryList").innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`).join("");

  if (idx >= 0) {
    $("#editRowTitle").textContent = t('editRow.editTitle');
    $("#editRowBase").value = wordLibrary[idx].base;
    $("#editRowVariants").value = wordLibrary[idx].variants.join(", ");
    $("#editRowCategory").value = wordLibrary[idx].category || "未分类";
  } else {
    $("#editRowTitle").textContent = t('editRow.title');
    $("#editRowBase").value = "";
    $("#editRowVariants").value = "";
    $("#editRowCategory").value = "未分类";
  }
  $("#editRowStatus").textContent = "";
  $("#editRowStatus").className = "status-msg";
  $("#editRowModal").classList.add("show");
}

function hideEditRowModal() {
  $("#editRowModal").classList.remove("show");
}

function confirmEditRow() {
  const base = $("#editRowBase").value.trim();
  const variantsRaw = $("#editRowVariants").value.trim();
  const category = $("#editRowCategory").value.trim() || "未分类";
  const statusEl = $("#editRowStatus");

  if (!base) {
    statusEl.textContent = t('editRow.errorBase');
    statusEl.className = "status-msg error";
    return;
  }
  if (!variantsRaw) {
    statusEl.textContent = t('editRow.errorVariants');
    statusEl.className = "status-msg error";
    return;
  }

  const variants = variantsRaw.split(/[,，\s]+/).filter(v => v.length > 0);
  if (variants.length === 0) {
    statusEl.textContent = t('editRow.errorVariants');
    statusEl.className = "status-msg error";
    return;
  }

  if (editModalIdx >= 0) {
    wordLibrary[editModalIdx] = { base, variants, category };
  } else {
    wordLibrary.push({ base, variants, category });
  }

  hideEditRowModal();
  renderEditTable($("#editSearch").value);
}

function deleteGroup(idx) {
  if (!confirm(t('edit.deleteConfirm', {0: wordLibrary[idx].base}))) return;
  wordLibrary.splice(idx, 1);
  renderEditTable($("#editSearch").value);
}

function saveEditLibrary() {
  saveLibrary();
  $("#editStatus").textContent = t('edit.saveSuccess');
  $("#editStatus").className = "status-msg success";
  setTimeout(() => { $("#editStatus").textContent = ""; }, 2000);
}

// ============================================================