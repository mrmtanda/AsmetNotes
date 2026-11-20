import * as store from "./notesStore.js";
import { render, bindEvents, updateUserInfoUI } from "./ui.js";

async function bootstrap() {
  try {
    console.log("[app.js] Initializing session & store...");
    const ok = await store.init();
    if (!ok) {
      console.log("[app.js] No active session, redirected to auth.html");
      return;
    }

    store.subscribe(() => {
      render();
      updateUserInfoUI();
    });

    bindEvents();
    render();
    updateUserInfoUI();
    console.log("[app.js] Initialization complete!");
    window.__APP_LOADED__ = true;
  } catch (err) {
    console.error("[app.js ERROR]:", err);
    window.__APP_ERROR__ = err.message + "\n" + err.stack;
  }
}

bootstrap();
