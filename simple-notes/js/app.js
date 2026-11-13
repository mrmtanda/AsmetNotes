import * as store from "./notesStore.js";
import { render, bindEvents, updateUserInfoUI } from "./ui.js";

async function bootstrap() {
  try {
    console.log("[app.js] Starting initialization...");
    store.subscribe(() => {
      render();
      updateUserInfoUI();
    });

    bindEvents();
    render();

    // Initialize store with active Supabase user session
    const ok = await store.init();
    if (ok) {
      render();
      updateUserInfoUI();
    }
    console.log("[app.js] Initialization complete!");
    window.__APP_LOADED__ = true;
  } catch (err) {
    console.error("[app.js ERROR]:", err);
    window.__APP_ERROR__ = err.message + "\n" + err.stack;
  }
}

bootstrap();
