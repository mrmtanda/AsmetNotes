import * as storage from "./storage.js";
import { generateId } from "./utils.js";
import { supabase, getSession, signOut } from "./supabaseClient.js";

let notes = [];
let settings = storage.loadSettings();
let query = "";
let sortBy = settings.defaultSort || "newest";
let activeFilter = "all"; // "all" | "pinned" | "recent"
let activeTag = "all"; // "all" | "Work" | "Personal" | "Ideas" | "Todo"
let viewMode = settings.viewMode || "grid"; // "grid" | "list"
const listeners = new Set();

let currentUser = null;
let currentProfile = null;

function notify() {
  listeners.forEach((fn) => fn());
}

function commit() {
  if (currentUser) {
    try {
      localStorage.setItem(`asmet-notes:user-notes:${currentUser.id}`, JSON.stringify(notes));
    } catch (_) {}
  }
  notify();
}

function normalizeRemoteNote(r) {
  return {
    id: r.id,
    user_id: r.user_id,
    title: r.title || "",
    content: r.content || "",
    tag: r.tag || "Personal",
    color: r.color || "indigo",
    pinned: !!r.pinned,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/**
 * Initialize Store with Supabase Session
 * Guarantees that only the signed-in user's notes and profile are loaded.
 */
export async function init() {
  try {
    const session = await getSession();
    if (!session?.user) {
      // User is not signed in, redirect to auth.html
      window.location.href = "auth.html";
      return false;
    }

    currentUser = session.user;

    // 1. Fetch user's profile from Supabase
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profile) {
        currentProfile = profile;
        settings.workspaceName = profile.workspace_name || settings.workspaceName;
        if (profile.theme) settings.theme = profile.theme;
        if (profile.default_sort) sortBy = profile.default_sort;
        if (profile.view_mode) viewMode = profile.view_mode;
      } else {
        const name = currentUser.user_metadata?.full_name || (currentUser.email ? currentUser.email.split("@")[0] : "User");
        const wsName = `${name}'s Workspace`;
        await supabase.from("profiles").insert([{ id: currentUser.id, workspace_name: wsName }]);
        currentProfile = { workspace_name: wsName };
        settings.workspaceName = wsName;
      }
    } catch (e) {
      console.warn("Could not fetch profile from Supabase:", e);
    }

    // 2. Load user-specific cached notes while remote syncs
    try {
      const local = localStorage.getItem(`asmet-notes:user-notes:${currentUser.id}`);
      if (local) {
        notes = JSON.parse(local);
        notify();
      }
    } catch (_) {}

    // 3. Fetch notes from Supabase (Strict RLS: Only this user's notes are returned!)
    const { data: remoteNotes, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase load notes error:", error);
    } else if (remoteNotes) {
      notes = remoteNotes.map(normalizeRemoteNote);
      commit();
    }

    return true;
  } catch (err) {
    console.error("Store init error:", err);
    return false;
  }
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentProfile() {
  return currentProfile;
}

export function getWorkspaceName() {
  if (currentProfile?.workspace_name) return currentProfile.workspace_name;
  if (currentUser?.user_metadata?.full_name) return `${currentUser.user_metadata.full_name}'s Workspace`;
  if (currentUser?.email) return `${currentUser.email.split("@")[0]}'s Workspace`;
  return "My Workspace";
}

export function getUserDisplayName() {
  if (currentUser?.user_metadata?.full_name) return currentUser.user_metadata.full_name;
  if (currentUser?.email) return currentUser.email.split("@")[0];
  return "Guest";
}

export async function addNote({ title, content = "", tag = "Personal", color = "indigo" }) {
  const cleanTitle = (title || "").trim();
  const cleanContent = content || "";
  const cleanTag = tag || "Personal";
  const cleanColor = color || "indigo";

  if (!cleanTitle) return null;

  if (currentUser) {
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert([{
          user_id: currentUser.id,
          title: cleanTitle,
          content: cleanContent,
          tag: cleanTag,
          color: cleanColor,
          pinned: false,
        }])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert note error:", error);
      } else if (data) {
        const newNote = normalizeRemoteNote(data);
        notes.unshift(newNote);
        commit();
        return newNote;
      }
    } catch (e) {
      console.error("Supabase insert error:", e);
    }
  }

  // Fallback
  const now = Date.now();
  const fallbackNote = {
    id: generateId(),
    user_id: currentUser?.id || "local",
    title: cleanTitle,
    content: cleanContent,
    tag: cleanTag,
    color: cleanColor,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  notes.unshift(fallbackNote);
  commit();
  return fallbackNote;
}

export async function updateNote(id, { title, content = "", tag = "Personal", color = "indigo" }) {
  const note = notes.find((n) => n.id === id);
  if (!note) return null;
  note.title = (title || "").trim();
  note.content = content || "";
  note.tag = tag || note.tag || "Personal";
  note.color = color || note.color || "indigo";
  note.updatedAt = Date.now();
  commit();

  if (currentUser) {
    try {
      await supabase
        .from("notes")
        .update({
          title: note.title,
          content: note.content,
          tag: note.tag,
          color: note.color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", currentUser.id);
    } catch (e) {
      console.error("Supabase update error:", e);
    }
  }
  return note;
}

export async function duplicateNote(id) {
  const original = notes.find((n) => n.id === id);
  if (!original) return null;
  return await addNote({
    title: `${original.title} (Copy)`,
    content: original.content,
    tag: original.tag,
    color: original.color,
  });
}

export async function deleteNote(id) {
  notes = notes.filter((n) => n.id !== id);
  commit();

  if (currentUser) {
    try {
      await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);
    } catch (e) {
      console.error("Supabase delete error:", e);
    }
  }
}

export async function clearAll() {
  notes = [];
  commit();

  if (currentUser) {
    try {
      await supabase
        .from("notes")
        .delete()
        .eq("user_id", currentUser.id);
    } catch (e) {
      console.error("Supabase clear all error:", e);
    }
  }
}

export async function togglePin(id) {
  const note = notes.find((n) => n.id === id);
  if (note) {
    note.pinned = !note.pinned;
    commit();

    if (currentUser) {
      try {
        await supabase
          .from("notes")
          .update({ pinned: note.pinned })
          .eq("id", id)
          .eq("user_id", currentUser.id);
      } catch (e) {
        console.error("Supabase toggle pin error:", e);
      }
    }
  }
}

export function setQuery(q) {
  query = (q || "").toLowerCase().trim();
  notify();
}

export function setSort(s) {
  sortBy = s;
  notify();
}

export function getSort() {
  return sortBy;
}

export function setFilter(filter) {
  activeFilter = filter;
  notify();
}

export function getFilter() {
  return activeFilter;
}

export function setTagFilter(tag) {
  activeTag = tag;
  notify();
}

export function getTagFilter() {
  return activeTag;
}

export function setViewMode(mode) {
  viewMode = mode === "list" ? "list" : "grid";
  settings.viewMode = viewMode;
  storage.saveSettings(settings);
  notify();
}

export function getViewMode() {
  return viewMode;
}

export const getNote = (id) => notes.find((n) => n.id === id);
export const getAllNotes = () => [...notes];

export function getCounts() {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  return {
    all: notes.length,
    pinned: notes.filter((n) => n.pinned).length,
    recent: notes.filter((n) => n.updatedAt >= sevenDaysAgo).length,
  };
}

export function getTagCounts() {
  const counts = {
    all: notes.length,
    Work: 0,
    Personal: 0,
    Ideas: 0,
    Todo: 0,
  };
  notes.forEach((n) => {
    if (counts[n.tag] !== undefined) {
      counts[n.tag]++;
    }
  });
  return counts;
}

// Derived view: filter -> sort -> pinned first
export function getVisibleNotes() {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const sorters = {
    newest: (a, b) => b.createdAt - a.createdAt,
    oldest: (a, b) => a.createdAt - b.createdAt,
    title: (a, b) => (a.title || "").localeCompare(b.title || ""),
  };

  return notes
    .filter((n) => {
      // 1. Sidebar filter check (all, pinned, recent)
      if (activeFilter === "pinned" && !n.pinned) return false;
      if (activeFilter === "recent" && n.updatedAt < sevenDaysAgo) return false;

      // 2. Tag filter check
      if (activeTag !== "all" && n.tag !== activeTag) return false;

      // 3. Search query check
      if (query) {
        const titleMatch = (n.title || "").toLowerCase().includes(query);
        const contentMatch = (n.content || "").toLowerCase().includes(query);
        const tagMatch = (n.tag || "").toLowerCase().includes(query);
        return titleMatch || contentMatch || tagMatch;
      }
      return true;
    })
    .sort(sorters[sortBy] || sorters.newest)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned)); // pinned always first
}

// Workspace Settings
export function getSettings() {
  return { ...settings };
}

export async function updateSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  storage.saveSettings(settings);

  if (currentUser) {
    try {
      await supabase
        .from("profiles")
        .update({
          workspace_name: settings.workspaceName,
          theme: settings.theme,
          default_sort: settings.defaultSort,
          view_mode: settings.viewMode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);
    } catch (e) {
      console.warn("Could not sync profile settings to Supabase:", e);
    }
  }

  if (newSettings.defaultSort && newSettings.defaultSort !== sortBy) {
    sortBy = newSettings.defaultSort;
  }
  if (newSettings.viewMode) {
    viewMode = newSettings.viewMode;
  }
  notify();
}

export function exportNotes() {
  return storage.exportBackup(notes);
}

export function importNotes(jsonStr) {
  const res = storage.importBackup(jsonStr);
  if (res.success) {
    notes = storage.load();
    settings = storage.loadSettings();
    notify();
  }
  return res;
}
