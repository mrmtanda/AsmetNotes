// ====================================================================
// AsmetNotes Application Configuration
// ====================================================================

export const CONFIG = {
  // Supabase Project Credentials
  supabase: {
    url: window.__ENV?.SUPABASE_URL || "https://gudoctpbbejzytbpldiv.supabase.co",
    // Standard JWT anon key ensures 100% compatibility with all Supabase JS client versions
    anonKey: window.__ENV?.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1ZG9jdHBiYmVqenl0YnBsZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzMTMwMTMsImV4cCI6MjEwOTg4OTAxM30.skZspaxGIxnPWPBILFv8vl4uI5kKz2IW5V3F9oBwAuQ",
  },

  // App Metadata & Settings
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
