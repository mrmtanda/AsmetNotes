// ====================================================================
// AsmetNotes Application Configuration
// Central configuration for backend services and client preferences
// ====================================================================

export const CONFIG = {
  // Supabase Project Credentials
  // URL and Publishable (anon) Key are safe to be exposed on the frontend
  // when protected by PostgreSQL Row Level Security (RLS).
  supabase: {
    url: window.__ENV?.SUPABASE_URL || "https://gudoctpbbejzytbpldiv.supabase.co",
    anonKey: window.__ENV?.SUPABASE_ANON_KEY || "sb_publishable_dcrWaIeXOX85bdHvzjvMXA_Z0CONUrK",
  },

  // App Metadata & Settings
  app: {
    name: "AsmetNotes",
    version: "1.3.0",
    defaultTheme: "system", // "system" | "light" | "dark"
    storageKeys: {
      data: "asmet-notes:data",
      settings: "asmet-notes:settings",
      userNotesPrefix: "asmet-notes:user-notes:",
    },
  },
};

// Direct export helpers
export const SUPABASE_URL = CONFIG.supabase.url;
export const SUPABASE_ANON_KEY = CONFIG.supabase.anonKey;

export default CONFIG;
