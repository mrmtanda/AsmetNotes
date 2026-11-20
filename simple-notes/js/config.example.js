// ====================================================================
// Template Configuration (Copy to config.js)
// ====================================================================

export const CONFIG = {
  supabase: {
    url: "https://YOUR_PROJECT_REF.supabase.co",
    anonKey: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY",
  },
  app: {
    name: "AsmetNotes",
    version: "1.3.0",
    defaultTheme: "system",
    storageKeys: {
      data: "asmet-notes:data",
      settings: "asmet-notes:settings",
      userNotesPrefix: "asmet-notes:user-notes:",
    },
  },
};

export const SUPABASE_URL = CONFIG.supabase.url;
export const SUPABASE_ANON_KEY = CONFIG.supabase.anonKey;

export default CONFIG;

