const DATA_KEY = "asmet-notes:data";
const LEGACY_KEY = "simple-notes:data";
const SETTINGS_KEY = "asmet-notes:settings";
const VERSION = 2;

export const DEFAULT_TAGS = ["Work", "Personal", "Ideas", "Todo"];
export const DEFAULT_COLORS = ["indigo", "emerald", "amber", "rose", "purple"];

const DEFAULT_SETTINGS = {
  workspaceName: "Asmet Workspace",
  theme: "system", // "system" | "light" | "dark"
  defaultSort: "newest",
  viewMode: "grid", // "grid" | "list"
  defaultTag: "Personal",
  defaultColor: "indigo",
};

export function load() {
  try {
    let raw = localStorage.getItem(DATA_KEY);
    // Backward compatibility: migrate from simple-notes:data if present
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(DATA_KEY, legacy);
      }
    }
    if (!raw) return [];
    const data = JSON.parse(raw);
    const rawNotes = Array.isArray(data.notes) ? data.notes : [];

    // Ensure tags and colors exist on all notes
    return rawNotes.map((n) => ({
      ...n,
      tag: n.tag || "General",
      color: n.color || "indigo",
      content: n.content || "",
    }));
  } catch (err) {
    console.error("Failed to load notes from localStorage:", err);
    return [];
  }
}

export function save(notes) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify({ version: VERSION, notes }));
    return true;
  } catch (err) {
    console.error("Failed to save notes to localStorage:", err);
    return false;
  }
}

export function clear() {
  localStorage.removeItem(DATA_KEY);
  localStorage.removeItem(LEGACY_KEY);
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Failed to load settings from localStorage:", err);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error("Failed to save settings to localStorage:", err);
    return false;
  }
}

// Compute real-time localStorage size and stats
export function getStorageStats() {
  let usedBytes = 0;
  const keyBreakdown = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key) || "";
      const bytes = (key.length + val.length) * 2;
      usedBytes += bytes;
      keyBreakdown[key] = bytes;
    }
  } catch (e) {
    console.warn("Could not read localStorage size:", e);
  }

  const quotaBytes = 5 * 1024 * 1024; // 5 MB typical browser quota
  const percent = Math.min(100, (usedBytes / quotaBytes) * 100);

  let formattedUsed = `${usedBytes} B`;
  if (usedBytes >= 1024 * 1024) {
    formattedUsed = `${(usedBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (usedBytes >= 1024) {
    formattedUsed = `${(usedBytes / 1024).toFixed(1)} KB`;
  }

  return {
    usedBytes,
    quotaBytes,
    percentage: Math.max(0.1, parseFloat(percent.toFixed(2))),
    formattedUsed,
    formattedQuota: "5.0 MB",
    keyBreakdown,
  };
}

export function exportBackup(notes) {
  const payload = {
    appName: "AsmetNotes",
    version: VERSION,
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    notes,
  };
  return JSON.stringify(payload, null, 2);
}

export function importBackup(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.notes)) {
      throw new Error("Invalid format: 'notes' array missing.");
    }
    const validNotes = data.notes.filter(
      (n) => n && typeof n.title === "string" && typeof n.id === "string"
    ).map((n) => ({
      ...n,
      tag: n.tag || "General",
      color: n.color || "indigo",
    }));

    save(validNotes);
    if (data.settings && typeof data.settings === "object") {
      saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    }
    return { success: true, count: validNotes.length };
  } catch (err) {
    console.error("Backup import failed:", err);
    return { success: false, error: err.message };
  }
}
