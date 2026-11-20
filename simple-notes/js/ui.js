import * as store from "./notesStore.js";
import * as storage from "./storage.js";
import { formatDate } from "./utils.js";
import { navigateToAuth } from "./router.js";

let selectedEditorTag = "Personal";
let selectedEditorColor = "indigo";

const els = {
  // Notes List & Main Container
  list: document.getElementById("notes-list"),
  empty: document.getElementById("empty-state"),
  emptyTitle: document.getElementById("empty-state-title"),
  emptyDesc: document.getElementById("empty-state-desc"),
  viewTitle: document.getElementById("view-title"),
  viewStats: document.getElementById("view-stats"),
  activeTagBadge: document.getElementById("active-tag-badge"),

  // Header Elements
  sidebarToggle: document.getElementById("sidebar-toggle"),
  workspaceBadgeName: document.getElementById("workspace-badge-name"),
  search: document.getElementById("search"),
  searchClearBtn: document.getElementById("search-clear-btn"),
  sort: document.getElementById("sort"),
  newNoteBtn: document.getElementById("new-note-btn"),
  emptyNewNoteBtn: document.getElementById("empty-new-note-btn"),
  viewModeBtn: document.getElementById("view-mode-btn"),
  viewModeIcon: document.getElementById("view-mode-icon"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  themeToggleIcon: document.getElementById("theme-toggle-icon"),

  // Sidebar Elements
  sidebar: document.getElementById("app-sidebar"),
  sidebarBackdrop: document.getElementById("sidebar-backdrop"),
  navItems: document.querySelectorAll(".sidebar-nav-item"),
  countAll: document.getElementById("count-all"),
  countPinned: document.getElementById("count-pinned"),
  countRecent: document.getElementById("count-recent"),
  sidebarWorkspaceTitle: document.getElementById("sidebar-workspace-title"),
  sidebarSettingsBtn: document.getElementById("sidebar-settings-btn"),
  tagItems: document.querySelectorAll(".sidebar-tag-item"),
  tagCountAll: document.getElementById("tag-count-all"),
  tagCountWork: document.getElementById("tag-count-work"),
  tagCountPersonal: document.getElementById("tag-count-personal"),
  tagCountIdeas: document.getElementById("tag-count-ideas"),
  tagCountTodo: document.getElementById("tag-count-todo"),

  // Note Editor Dialog
  editorDialog: document.getElementById("editor-dialog"),
  editorForm: document.getElementById("editor-form"),
  editorDialogTitle: document.getElementById("editor-dialog-title"),
  id: document.getElementById("note-id"),
  title: document.getElementById("note-title"),
  content: document.getElementById("note-content"),
  cancelBtn: document.getElementById("cancel-btn"),
  editorCloseIconBtn: document.getElementById("editor-close-icon-btn"),
  editorWordCount: document.getElementById("editor-word-count"),
  tagPills: document.querySelectorAll("#note-tag-selector .tag-pill"),
  colorDots: document.querySelectorAll("#note-color-picker .color-dot"),

  // Bottom Storage Bar
  bottomBar: document.getElementById("bottom-bar"),
  storageTrigger: document.getElementById("storage-details-trigger"),
  storageProgressBar: document.getElementById("storage-progress-bar"),
  storageUsedText: document.getElementById("storage-used-text"),
  storageQuotaText: document.getElementById("storage-quota-text"),
  storagePercentText: document.getElementById("storage-percent-text"),
  bottomNoteCount: document.getElementById("bottom-note-count"),
  bottomPinnedCount: document.getElementById("bottom-pinned-count"),
  syncStatus: document.getElementById("sync-status"),

  // Settings Dialog
  settingsDialog: document.getElementById("settings-dialog"),
  settingWorkspaceName: document.getElementById("setting-workspace-name"),
  settingDefaultSort: document.getElementById("setting-default-sort"),
  settingsSaveBtn: document.getElementById("settings-save-btn"),
  settingsCancelBtn: document.getElementById("settings-cancel-btn"),
  settingsCloseIconBtn: document.getElementById("settings-close-icon-btn"),
  settingsStatusMsg: document.getElementById("settings-status-msg"),
  settingsExportBtn: document.getElementById("settings-export-btn"),
  settingsImportBtn: document.getElementById("settings-import-btn"),
  settingsImportFile: document.getElementById("settings-import-file"),
  settingsClearDataBtn: document.getElementById("settings-clear-data-btn"),

  // Storage Details Dialog
  storageDialog: document.getElementById("storage-dialog"),
  storageDialogCloseBtn: document.getElementById("storage-dialog-close-btn"),
  storageCloseIconBtn: document.getElementById("storage-close-icon-btn"),
  storageDialogUsed: document.getElementById("storage-dialog-used"),
  storageDialogBar: document.getElementById("storage-dialog-bar"),
  storageKeysList: document.getElementById("storage-keys-list"),

  // PRD §3 & §8: Clear All (header button + strong confirmation dialog)
  clearAllBtn: document.getElementById("clear-all-btn"),
  confirmClearDialog: document.getElementById("confirm-clear-dialog"),
  confirmClearInput: document.getElementById("confirm-clear-input"),
  confirmClearOkBtn: document.getElementById("confirm-clear-ok-btn"),
  confirmClearCancelBtn: document.getElementById("confirm-clear-cancel-btn"),

  // Toast
  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toast-message"),
  toastIcon: document.getElementById("toast-icon"),
};

export function render() {
  const notes = store.getVisibleNotes();
  const counts = store.getCounts();
  const tagCounts = store.getTagCounts();
  const currentFilter = store.getFilter();
  const currentTag = store.getTagFilter();
  const currentViewMode = store.getViewMode();
  const settings = store.getSettings();

  // 1. View Mode (Grid vs List)
  if (els.list) {
    els.list.classList.toggle("notes-grid--list-view", currentViewMode === "list");
    els.list.replaceChildren(...notes.map(createNoteCard));
  }
  if (els.viewModeIcon) {
    els.viewModeIcon.textContent = currentViewMode === "list" ? "grid_view" : "view_list";
  }
  if (els.viewModeBtn) {
    els.viewModeBtn.title = currentViewMode === "list" ? "Switch to Grid View" : "Switch to List View";
  }

  // 2. Empty State
  if (els.empty) {
    const isEmpty = notes.length === 0;
    els.empty.hidden = !isEmpty;
    if (isEmpty) {
      if (currentFilter === "pinned") {
        if (els.emptyTitle) els.emptyTitle.textContent = "No pinned notes";
        if (els.emptyDesc) els.emptyDesc.textContent = "Click the pin icon on any note to keep it pinned at the top.";
      } else if (currentFilter === "recent") {
        if (els.emptyTitle) els.emptyTitle.textContent = "No recent notes";
        if (els.emptyDesc) els.emptyDesc.textContent = "Notes edited or created in the past 7 days will appear here.";
      } else if (currentTag !== "all") {
        if (els.emptyTitle) els.emptyTitle.textContent = `No notes tagged with "${currentTag}"`;
        if (els.emptyDesc) els.emptyDesc.textContent = "Assign this tag when creating or editing a note to organize your thoughts.";
      } else if (els.search && els.search.value.trim()) {
        if (els.emptyTitle) els.emptyTitle.textContent = `No matches for "${els.search.value.trim()}"`;
        if (els.emptyDesc) els.emptyDesc.textContent = "Try searching for another keyword or clear the search query.";
      } else {
        if (els.emptyTitle) els.emptyTitle.textContent = "Your workspace is empty";
        if (els.emptyDesc) els.emptyDesc.textContent = "Capture tasks, ideas, meeting summaries, and notes in your browser.";
      }
    }
  }

  // 3. Sidebar Category Counts & Active States
  if (els.countAll) els.countAll.textContent = counts.all;
  if (els.countPinned) els.countPinned.textContent = counts.pinned;
  if (els.countRecent) els.countRecent.textContent = counts.recent;

  if (els.navItems) {
    els.navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === currentFilter);
    });
  }

  // 4. Sidebar Tag Counts & Active States
  if (els.tagCountAll) els.tagCountAll.textContent = tagCounts.all;
  if (els.tagCountWork) els.tagCountWork.textContent = tagCounts.Work || 0;
  if (els.tagCountPersonal) els.tagCountPersonal.textContent = tagCounts.Personal || 0;
  if (els.tagCountIdeas) els.tagCountIdeas.textContent = tagCounts.Ideas || 0;
  if (els.tagCountTodo) els.tagCountTodo.textContent = tagCounts.Todo || 0;

  if (els.tagItems) {
    els.tagItems.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tag === currentTag);
    });
  }

  // 5. Header Title & Active Tag Chip
  const viewTitles = {
    all: "All Notes",
    pinned: "Pinned Notes",
    recent: "Recent (7 Days)",
  };
  if (els.viewTitle) els.viewTitle.textContent = viewTitles[currentFilter] || "All Notes";

  if (els.activeTagBadge) {
    if (currentTag !== "all") {
      els.activeTagBadge.hidden = false;
      els.activeTagBadge.textContent = `#${currentTag}`;
    } else {
      els.activeTagBadge.hidden = true;
    }
  }

  if (els.viewStats) {
    els.viewStats.textContent = `Showing ${notes.length} of ${counts.all} note${counts.all === 1 ? "" : "s"}`;
  }

  // 6. Workspace Name
  const wsName = settings.workspaceName || "Asmet Workspace";
  if (els.workspaceBadgeName) els.workspaceBadgeName.textContent = wsName;
  if (els.sidebarWorkspaceTitle) els.sidebarWorkspaceTitle.textContent = wsName;

  // 7. Local Storage Bottom Bar Metrics
  updateStorageBar(counts);

  // 8. Sync Sort dropdown
  if (els.sort && els.sort.value !== store.getSort()) {
    els.sort.value = store.getSort();
  }

  // 9. Sync Theme Icon
  updateThemeIcon();
}

function updateStorageBar(counts) {
  const stats = storage.getStorageStats();

  if (els.storageProgressBar) {
    els.storageProgressBar.style.width = `${Math.max(1, stats.percentage)}%`;
  }
  if (els.storageUsedText) els.storageUsedText.textContent = stats.formattedUsed;
  if (els.storageQuotaText) els.storageQuotaText.textContent = stats.formattedQuota;
  if (els.storagePercentText) els.storagePercentText.textContent = `${stats.percentage}%`;

  if (els.bottomNoteCount) {
    els.bottomNoteCount.textContent = `${counts.all} Note${counts.all === 1 ? "" : "s"}`;
  }
  if (els.bottomPinnedCount) {
    els.bottomPinnedCount.textContent = `${counts.pinned} Pinned`;
  }
}

function createNoteCard(note) {
  const li = document.createElement("li");
  const noteColor = note.color || "indigo";
  li.className = `note-card note-card--color-${noteColor}`;
  if (note.pinned) {
    li.classList.add("note-card--pinned");
  }
  li.dataset.id = note.id;
  li.title = "Click to open and read note";
  li.setAttribute("role", "button");
  li.tabIndex = 0;

  // Card Header: Title + Tag + Pin
  const header = document.createElement("div");
  header.className = "note-card__header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "note-card__title-wrap";

  const h3 = document.createElement("h3");
  h3.className = "note-card__title";
  h3.textContent = note.title;

  const tagBadge = document.createElement("span");
  tagBadge.className = `note-card__tag-chip note-card__tag-chip--${note.tag.toLowerCase()}`;
  tagBadge.textContent = `#${note.tag}`;

  titleWrap.append(h3, tagBadge);

  const pinBadge = document.createElement("button");
  pinBadge.type = "button";
  pinBadge.dataset.action = "pin";
  pinBadge.className = `btn-pin ${note.pinned ? "btn-pin--active" : ""}`;
  pinBadge.title = note.pinned ? "Unpin note" : "Pin note to top";
  pinBadge.innerHTML = `<span class="material-symbols-outlined text-sm">push_pin</span>`;

  header.append(titleWrap, pinBadge);

  // Card Content
  const p = document.createElement("p");
  p.className = "note-card__content";
  p.textContent = (note.content || "").slice(0, 160);

  // Card Footer: Timestamps (PRD §4: created & last-edited) + Quick Actions
  const footer = document.createElement("div");
  footer.className = "note-card__footer";

  const timestamps = document.createElement("div");
  timestamps.className = "note-card__timestamps";
  const editedTime = document.createElement("small");
  editedTime.className = "note-card__date";
  editedTime.title = `Created: ${formatDate(note.createdAt)}`;
  // Show "Edited" label if note was updated after creation (> 5s diff)
  const wasEdited = note.updatedAt - note.createdAt > 5000;
  editedTime.textContent = wasEdited
    ? `Edited ${formatDate(note.updatedAt)}`
    : `Created ${formatDate(note.createdAt)}`;

  const actions = document.createElement("div");
  actions.className = "note-card__actions";

  // Real Feature: Copy Content to Clipboard
  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.dataset.action = "copy";
  copyBtn.className = "btn-card-action";
  copyBtn.title = "Copy to clipboard";
  copyBtn.innerHTML = `<span class="material-symbols-outlined text-xs">content_copy</span>`;

  // Real Feature: Duplicate Note
  const dupBtn = document.createElement("button");
  dupBtn.type = "button";
  dupBtn.dataset.action = "duplicate";
  dupBtn.className = "btn-card-action";
  dupBtn.title = "Duplicate note";
  dupBtn.innerHTML = `<span class="material-symbols-outlined text-xs">content_paste</span>`;

  // Edit Note
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.dataset.action = "edit";
  editBtn.className = "btn-card-action";
  editBtn.title = "Edit note";
  editBtn.innerHTML = `<span class="material-symbols-outlined text-xs">edit</span>`;

  // Delete Note
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";
  deleteBtn.className = "btn-card-action btn--delete";
  deleteBtn.title = "Delete note";
  deleteBtn.innerHTML = `<span class="material-symbols-outlined text-xs">delete</span>`;

  // Real Feature: Share Note
  const shareBtn = document.createElement("button");
  shareBtn.type = "button";
  shareBtn.dataset.action = "share";
  shareBtn.className = "btn-card-action";
  shareBtn.title = "Share note";
  shareBtn.innerHTML = `<span class="material-symbols-outlined text-xs">share</span>`;

  actions.append(copyBtn, dupBtn, shareBtn, editBtn, deleteBtn);
  timestamps.append(editedTime);
  footer.append(timestamps, actions);

  li.append(header, p, footer);
  return li;
}

export function openEditor(note = null) {
  if (!els.editorDialog) return;
  const isEdit = Boolean(note);
  if (els.editorDialogTitle) {
    els.editorDialogTitle.textContent = isEdit ? "View & Edit Note" : "New Note";
  }
  if (els.id) els.id.value = note?.id ?? "";
  if (els.title) els.title.value = note?.title ?? "";
  if (els.content) els.content.value = note?.content ?? "";

  selectedEditorTag = note?.tag || "Personal";
  selectedEditorColor = note?.color || "indigo";

  // Select tag pill
  if (els.tagPills) {
    els.tagPills.forEach((p) => {
      p.classList.toggle("active", p.dataset.value === selectedEditorTag);
    });
  }

  // Select color dot
  if (els.colorDots) {
    els.colorDots.forEach((d) => {
      d.classList.toggle("active", d.dataset.color === selectedEditorColor);
    });
  }

  updateWordCount();
  els.editorDialog.showModal();
  if (els.title) els.title.focus();
}

export function closeEditor() {
  if (els.editorDialog?.open) {
    els.editorDialog.close();
  }
}

function updateWordCount() {
  if (!els.editorWordCount || !els.content) return;
  const text = els.content.value || "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  els.editorWordCount.textContent = `${words} word${words === 1 ? "" : "s"} • ${chars} char${chars === 1 ? "" : "s"}`;
}

export function openSettings() {
  if (!els.settingsDialog) return;
  const settings = store.getSettings();

  if (els.settingWorkspaceName) {
    els.settingWorkspaceName.value = settings.workspaceName || "Asmet Workspace";
  }
  if (els.settingDefaultSort) {
    els.settingDefaultSort.value = settings.defaultSort || "newest";
  }

  const themeRadio = document.querySelector(`input[name="theme"][value="${settings.theme || "system"}"]`);
  if (themeRadio) themeRadio.checked = true;

  if (els.settingsStatusMsg) els.settingsStatusMsg.hidden = true;
  els.settingsDialog.showModal();
}

export function closeSettings() {
  if (els.settingsDialog?.open) {
    els.settingsDialog.close();
  }
}

export function openStorageDialog() {
  if (!els.storageDialog) return;
  const stats = storage.getStorageStats();

  if (els.storageDialogUsed) {
    els.storageDialogUsed.textContent = `${stats.formattedUsed} (${stats.percentage}%)`;
  }
  if (els.storageDialogBar) {
    els.storageDialogBar.style.width = `${Math.max(1, stats.percentage)}%`;
  }

  if (els.storageKeysList) {
    const keys = Object.keys(stats.keyBreakdown);
    els.storageKeysList.innerHTML = keys
      .map((k) => {
        const bytes = stats.keyBreakdown[k];
        const formatted = bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
        return `
          <div class="storage-key-row">
            <span class="storage-key-name">${k}</span>
            <span class="storage-key-size">${formatted}</span>
          </div>
        `;
      })
      .join("");
  }

  els.storageDialog.showModal();
}

export function closeStorageDialog() {
  if (els.storageDialog?.open) {
    els.storageDialog.close();
  }
}

export function applyTheme(theme) {
  if (!theme || theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  if (!els.themeToggleIcon) return;
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const isDark = currentTheme === "dark" || (!currentTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  els.themeToggleIcon.textContent = isDark ? "light_mode" : "dark_mode";
}

export function showToast(message, icon = "check_circle") {
  if (!els.toast) return;
  if (els.toastMessage) els.toastMessage.textContent = message;
  if (els.toastIcon) els.toastIcon.textContent = icon;
  els.toast.hidden = false;
  els.toast.classList.add("toast--show");
  setTimeout(() => {
    if (els.toast) {
      els.toast.classList.remove("toast--show");
      setTimeout(() => { if (els.toast) els.toast.hidden = true; }, 200);
    }
  }, 2200);
}

export function triggerExport() {
  const jsonString = store.exportNotes();
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `asmetnotes-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Backup exported successfully!");
}

export function triggerImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const res = store.importNotes(text);
    if (res.success) {
      showToast(`Imported ${res.count} notes!`);
      closeSettings();
    } else {
      alert(`Failed to import backup: ${res.error || "Invalid file format."}`);
    }
  };
  reader.readAsText(file);
}

export function bindEvents() {
  // Apply initial theme
  const initialSettings = store.getSettings();
  applyTheme(initialSettings.theme);

  // 1. Note Cards Event Delegation (Click anywhere to open & read note)
  if (els.list) {
    els.list.addEventListener("click", async (e) => {
      const card = e.target.closest(".note-card");
      if (!card) return;
      const id = card.dataset.id;
      const note = store.getNote(id);
      if (!note) return;

      const actionBtn = e.target.closest("[data-action]");
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === "edit") {
          openEditor(note);
          return;
        } else if (action === "pin") {
          store.togglePin(id);
          return;
        } else if (action === "delete") {
          if (confirm("Delete this note?")) {
            store.deleteNote(id);
            showToast("Note deleted");
          }
          return;
        } else if (action === "duplicate") {
          const cloned = store.duplicateNote(id);
          if (cloned) showToast("Note duplicated!");
          return;
        } else if (action === "copy") {
          try {
            const text = `${note.title}\n\n${note.content || ""}`.trim();
            await navigator.clipboard.writeText(text);
            showToast("Copied to clipboard!", "content_copy");
          } catch (_) {
            showToast("Copied to clipboard!");
          }
          return;
        } else if (action === "share") {
          const shareText = `${note.title}\n\n${note.content || ""}`.trim();
          const tagLine = note.tag ? `\n\n[#${note.tag}]` : "";
          try {
            if (navigator.share) {
              await navigator.share({
                title: note.title,
                text: shareText + tagLine,
              });
              showToast("Note shared!", "share");
            } else {
              // Fallback: copy shareable text to clipboard
              await navigator.clipboard.writeText(shareText + tagLine);
              showToast("Share text copied!", "share");
            }
          } catch (err) {
            if (err.name !== "AbortError") {
              showToast("Could not share note", "error");
            }
          }
          return;
        }
      }

      // Default: Clicking on the note card, title, or body opens it to read and edit
      openEditor(note);
    });

    // Support keyboard Enter or Space to open note when focused
    els.list.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const card = e.target.closest(".note-card");
        if (card && !e.target.closest("button")) {
          e.preventDefault();
          const id = card.dataset.id;
          const note = store.getNote(id);
          if (note) openEditor(note);
        }
      }
    });
  }

  // 2. Note Editor Form Submission
  if (els.editorForm) {
    els.editorForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = (els.title?.value || "").trim();
      const content = els.content?.value || "";
      if (!title) return;

      const id = els.id?.value;
      if (id) {
        store.updateNote(id, {
          title,
          content,
          tag: selectedEditorTag,
          color: selectedEditorColor,
        });
        showToast("Note updated!");
      } else {
        store.addNote({
          title,
          content,
          tag: selectedEditorTag,
          color: selectedEditorColor,
        });
        showToast("Note created!");
      }
      closeEditor();
    });
  }

  // Live word counter in editor
  if (els.content) {
    els.content.addEventListener("input", updateWordCount);
  }

  // Tag selector pills in editor
  if (els.tagPills) {
    els.tagPills.forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedEditorTag = btn.dataset.value || "Personal";
        els.tagPills.forEach((p) => p.classList.toggle("active", p === btn));
      });
    });
  }

  // Color picker dots in editor
  if (els.colorDots) {
    els.colorDots.forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedEditorColor = btn.dataset.color || "indigo";
        els.colorDots.forEach((d) => d.classList.toggle("active", d === btn));
      });
    });
  }

  if (els.cancelBtn) els.cancelBtn.onclick = closeEditor;
  if (els.editorCloseIconBtn) els.editorCloseIconBtn.onclick = closeEditor;

  // 3. New Note Triggers (Single Primary in Header + Empty state)
  const openNew = () => openEditor();
  if (els.newNoteBtn) els.newNoteBtn.onclick = openNew;
  if (els.emptyNewNoteBtn) els.emptyNewNoteBtn.onclick = openNew;

  // 4. Real Feature: View Mode Switcher (Grid vs List)
  if (els.viewModeBtn) {
    els.viewModeBtn.onclick = () => {
      const current = store.getViewMode();
      store.setViewMode(current === "grid" ? "list" : "grid");
    };
  }

  // 5. Real Feature: Quick Theme Toggle Button
  if (els.themeToggleBtn) {
    els.themeToggleBtn.onclick = () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const isDark = currentTheme === "dark" || (!currentTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
      const nextTheme = isDark ? "light" : "dark";
      store.updateSettings({ theme: nextTheme });
      applyTheme(nextTheme);
    };
  }

  // 6. Search Input & Clear
  if (els.search) {
    els.search.addEventListener("input", (e) => {
      const val = e.target.value;
      store.setQuery(val);
      if (els.searchClearBtn) {
        els.searchClearBtn.hidden = val.length === 0;
      }
    });
  }

  if (els.searchClearBtn) {
    els.searchClearBtn.onclick = () => {
      if (els.search) {
        els.search.value = "";
        store.setQuery("");
        els.searchClearBtn.hidden = true;
        els.search.focus();
      }
    };
  }

  // 7. Sort Dropdown
  if (els.sort) {
    els.sort.addEventListener("change", (e) => {
      store.setSort(e.target.value);
    });
  }

  // 8. Sidebar Category Navigation (All, Pinned, Recent)
  if (els.navItems) {
    els.navItems.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter || "all";
        store.setFilter(filter);
        if (window.innerWidth < 768 && els.sidebar) {
          els.sidebar.classList.remove("open");
          if (els.sidebarBackdrop) els.sidebarBackdrop.classList.remove("visible");
        }
      });
    });
  }

  // 9. Sidebar Tag Filter Navigation
  if (els.tagItems) {
    els.tagItems.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tag = btn.dataset.tag || "all";
        store.setTagFilter(tag);
        if (window.innerWidth < 768 && els.sidebar) {
          els.sidebar.classList.remove("open");
          if (els.sidebarBackdrop) els.sidebarBackdrop.classList.remove("visible");
        }
      });
    });
  }

  // 10. Mobile Sidebar Toggle & Backdrop
  if (els.sidebarToggle && els.sidebar) {
    els.sidebarToggle.onclick = () => {
      els.sidebar.classList.toggle("open");
      if (els.sidebarBackdrop) {
        els.sidebarBackdrop.classList.toggle("visible", els.sidebar.classList.contains("open"));
      }
    };
  }

  if (els.sidebarBackdrop) {
    els.sidebarBackdrop.onclick = () => {
      if (els.sidebar) els.sidebar.classList.remove("open");
      els.sidebarBackdrop.classList.remove("visible");
    };
  }

  // 11. Workspace Settings Modal
  if (els.sidebarSettingsBtn) els.sidebarSettingsBtn.onclick = openSettings;
  if (els.settingsCancelBtn) els.settingsCancelBtn.onclick = closeSettings;
  if (els.settingsCloseIconBtn) els.settingsCloseIconBtn.onclick = closeSettings;

  if (els.settingsSaveBtn) {
    els.settingsSaveBtn.onclick = () => {
      const name = els.settingWorkspaceName?.value.trim() || "Asmet Workspace";
      const defaultSort = els.settingDefaultSort?.value || "newest";
      const selectedTheme = document.querySelector('input[name="theme"]:checked')?.value || "system";

      store.updateSettings({
        workspaceName: name,
        defaultSort,
        theme: selectedTheme,
      });

      applyTheme(selectedTheme);

      if (els.settingsStatusMsg) {
        els.settingsStatusMsg.hidden = false;
        setTimeout(() => {
          if (els.settingsStatusMsg) els.settingsStatusMsg.hidden = true;
          closeSettings();
        }, 500);
      } else {
        closeSettings();
      }
    };
  }

  // Live theme radio in Settings
  document.querySelectorAll('input[name="theme"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      applyTheme(e.target.value);
    });
  });

  // Export & Import in Settings
  if (els.settingsExportBtn) els.settingsExportBtn.onclick = triggerExport;
  if (els.settingsImportBtn && els.settingsImportFile) {
    els.settingsImportBtn.onclick = () => els.settingsImportFile.click();
    els.settingsImportFile.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        triggerImport(file);
        els.settingsImportFile.value = "";
      }
    };
  }

  // Clear All Data
  if (els.settingsClearDataBtn) {
    els.settingsClearDataBtn.onclick = () => {
      if (confirm("Are you sure? This will delete all notes in this workspace.")) {
        store.clearAll();
        closeSettings();
        showToast("All workspace data cleared");
      }
    };
  }

  // 12. Storage Details Dialog
  if (els.storageTrigger) els.storageTrigger.onclick = openStorageDialog;
  if (els.storageDialogCloseBtn) els.storageDialogCloseBtn.onclick = closeStorageDialog;
  if (els.storageCloseIconBtn) els.storageCloseIconBtn.onclick = closeStorageDialog;

  // 13. PRD §3 & §8: Clear All — header button opens strong two-step confirmation dialog
  if (els.clearAllBtn && els.confirmClearDialog) {
    els.clearAllBtn.onclick = () => {
      if (els.confirmClearInput) els.confirmClearInput.value = "";
      if (els.confirmClearOkBtn) els.confirmClearOkBtn.disabled = true;
      els.confirmClearDialog.showModal();
      if (els.confirmClearInput) els.confirmClearInput.focus();
    };
  }

  if (els.confirmClearInput && els.confirmClearOkBtn) {
    els.confirmClearInput.addEventListener("input", () => {
      els.confirmClearOkBtn.disabled = els.confirmClearInput.value.trim() !== "DELETE";
    });
  }

  if (els.confirmClearOkBtn) {
    els.confirmClearOkBtn.onclick = () => {
      store.clearAll();
      els.confirmClearDialog?.close();
      showToast("All notes cleared", "delete_forever");
    };
  }

  if (els.confirmClearCancelBtn) {
    els.confirmClearCancelBtn.onclick = () => els.confirmClearDialog?.close();
  }

  // 14. Sign Out Handlers
  const handleSignOut = async () => {
    if (confirm("Sign out of AsmetNotes?")) {
      try {
        const { signOut } = await import("./supabaseClient.js");
        await signOut();
      } catch (_) {}
      navigateToAuth();
    }
  };

  const headerSignOutBtn = document.getElementById("header-signout-btn");
  if (headerSignOutBtn) headerSignOutBtn.onclick = handleSignOut;

  const sidebarSignOutBtn = document.getElementById("sidebar-signout-btn");
  if (sidebarSignOutBtn) sidebarSignOutBtn.onclick = handleSignOut;

  updateUserInfoUI();
}

export function updateUserInfoUI() {
  const wsName = store.getWorkspaceName();
  const userName = store.getUserDisplayName();
  const currentUser = store.getCurrentUser();

  if (els.workspaceBadgeName) {
    els.workspaceBadgeName.textContent = wsName;
  }
  if (els.sidebarWorkspaceTitle) {
    els.sidebarWorkspaceTitle.textContent = wsName;
  }
  const authBtnLabel = document.getElementById("auth-btn-label");
  if (authBtnLabel) {
    authBtnLabel.textContent = userName.length > 14 ? userName.slice(0, 12) + "..." : userName;
  }
  const authBtn = document.getElementById("auth-btn");
  if (authBtn && currentUser) {
    authBtn.title = `Signed in as ${currentUser.email || "Guest User"}`;
  }
  if (els.syncStatus) {
    if (currentUser?.email) {
      els.syncStatus.textContent = `Supabase: ${currentUser.email}`;
    } else if (currentUser?.is_anonymous) {
      els.syncStatus.textContent = `Supabase: Guest User`;
    } else {
      els.syncStatus.textContent = `Local storage`;
    }
  }
}
