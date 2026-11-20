// ====================================================================
// Authentication Controller for AsmetNotes
// ====================================================================

import * as authClient from "./supabaseClient.js";

const els = {
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  themeToggleIcon: document.getElementById("theme-toggle-icon"),
  authMainCard: document.getElementById("auth-main-card"),
  authSessionPanel: document.getElementById("auth-session-panel"),
  authSessionEmailLabel: document.getElementById("auth-session-email-label"),
  authSessionSignoutBtn: document.getElementById("auth-session-signout-btn"),
  tabSignIn: document.getElementById("tab-signin"),
  tabSignUp: document.getElementById("tab-signup"),
  authAlertBox: document.getElementById("auth-alert-box"),
  authAlertIcon: document.getElementById("auth-alert-icon"),
  authAlertMsg: document.getElementById("auth-alert-msg"),
  authForm: document.getElementById("auth-form"),
  fieldFullName: document.getElementById("field-fullname"),
  authInputName: document.getElementById("auth-input-name"),
  authInputEmail: document.getElementById("auth-input-email"),
  fieldPassword: document.getElementById("field-password"),
  authInputPassword: document.getElementById("auth-input-password"),
  authPwToggleBtn: document.getElementById("auth-pw-toggle-btn"),
  authPwToggleIcon: document.getElementById("auth-pw-toggle-icon"),
  authLinkForgot: document.getElementById("auth-link-forgot"),
  authSubmitBtn: document.getElementById("auth-submit-btn"),
  authSubmitText: document.getElementById("auth-submit-text"),
};

let currentMode = "signin"; // "signin" | "signup" | "forgot"

// --------------------------------------------------------------------
// 1. Theme Synchronization
// --------------------------------------------------------------------
function initTheme() {
  const SETTINGS_KEY = "asmet-notes:settings";
  let theme = "system";

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.theme) theme = parsed.theme;
    }
  } catch (_) {}

  applyTheme(theme);

  els.themeToggleBtn?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);

    try {
      const raw = localStorage.getItem(SETTINGS_KEY) || "{}";
      const settings = JSON.parse(raw);
      settings.theme = next;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {}
  });
}

function applyTheme(theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
    if (els.themeToggleIcon) els.themeToggleIcon.textContent = "light_mode";
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    if (els.themeToggleIcon) els.themeToggleIcon.textContent = "dark_mode";
  }
}

// --------------------------------------------------------------------
// 2. Alert Feedback
// --------------------------------------------------------------------
function showAlert(msg, isSuccess = false) {
  if (!els.authAlertBox) return;
  els.authAlertBox.hidden = false;
  els.authAlertBox.className = `auth-notice ${isSuccess ? "auth-notice--success" : "auth-notice--danger"}`;
  if (els.authAlertIcon) els.authAlertIcon.textContent = isSuccess ? "check_circle" : "error";
  if (els.authAlertMsg) els.authAlertMsg.textContent = msg;
}

function clearAlert() {
  if (!els.authAlertBox) return;
  els.authAlertBox.hidden = true;
}

function setBtnLoading(isLoading) {
  if (!els.authSubmitBtn) return;
  els.authSubmitBtn.disabled = isLoading;
  if (isLoading) {
    els.authSubmitText.textContent = "Please wait...";
  } else {
    els.authSubmitText.textContent =
      currentMode === "signup"
        ? "Create Account"
        : currentMode === "forgot"
        ? "Send Reset Link"
        : "Sign In";
  }
}

// --------------------------------------------------------------------
// 3. Mode Switcher (Sign In vs Sign Up vs Forgot)
// --------------------------------------------------------------------
function setMode(mode) {
  currentMode = mode;
  clearAlert();

  if (mode === "signup") {
    document.title = "Create Account • AsmetNotes";
    els.tabSignIn?.classList.remove("active");
    els.tabSignUp?.classList.add("active");
    if (els.fieldFullName) els.fieldFullName.hidden = false;
    if (els.fieldPassword) els.fieldPassword.hidden = false;
    if (els.authSubmitText) els.authSubmitText.textContent = "Create Account";
  } else if (mode === "forgot") {
    document.title = "Reset Password • AsmetNotes";
    els.tabSignIn?.classList.remove("active");
    els.tabSignUp?.classList.remove("active");
    if (els.fieldFullName) els.fieldFullName.hidden = true;
    if (els.fieldPassword) els.fieldPassword.hidden = true;
    if (els.authSubmitText) els.authSubmitText.textContent = "Send Reset Link";
  } else {
    document.title = "Sign In • AsmetNotes";
    els.tabSignIn?.classList.add("active");
    els.tabSignUp?.classList.remove("active");
    if (els.fieldFullName) els.fieldFullName.hidden = true;
    if (els.fieldPassword) els.fieldPassword.hidden = false;
    if (els.authSubmitText) els.authSubmitText.textContent = "Sign In";
  }
}

// --------------------------------------------------------------------
// 4. Form Handlers & Event Listeners
// --------------------------------------------------------------------
function bindEvents() {
  // Clear any alerts on typing
  [els.authInputName, els.authInputEmail, els.authInputPassword].forEach((input) => {
    input?.addEventListener("input", clearAlert);
    input?.addEventListener("focus", clearAlert);
  });

  // Tab buttons
  els.tabSignIn?.addEventListener("click", () => setMode("signin"));
  els.tabSignUp?.addEventListener("click", () => setMode("signup"));

  // Forgot password trigger
  els.authLinkForgot?.addEventListener("click", (e) => {
    e.preventDefault();
    setMode("forgot");
  });

  // Password visibility toggle
  els.authPwToggleBtn?.addEventListener("click", () => {
    const isPassword = els.authInputPassword.type === "password";
    els.authInputPassword.type = isPassword ? "text" : "password";
    if (els.authPwToggleIcon) {
      els.authPwToggleIcon.textContent = isPassword ? "visibility_off" : "visibility";
    }
  });

  // Sign out from active session panel
  els.authSessionSignoutBtn?.addEventListener("click", async () => {
    try {
      await authClient.signOut();
      if (els.authSessionPanel) els.authSessionPanel.hidden = true;
      if (els.authMainCard) els.authMainCard.hidden = false;
      setMode("signin");
      showAlert("Signed out successfully.", true);
    } catch (_) {}
  });

  // Form Submission
  els.authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAlert();

    const email = (els.authInputEmail?.value || "").trim();
    const password = els.authInputPassword?.value || "";
    const fullName = (els.authInputName?.value || "").trim();

    if (!email) {
      showAlert("Please enter your email address.");
      els.authInputEmail?.focus();
      return;
    }

    if (currentMode === "forgot") {
      try {
        setBtnLoading(true);
        await authClient.resetPassword(email);
        showAlert("Password reset link sent! Check your inbox.", true);
        setBtnLoading(false);
      } catch (err) {
        showAlert(err.message || "Failed to send reset link.");
        setBtnLoading(false);
      }
      return;
    }

    if (!password) {
      showAlert("Please enter your password.");
      els.authInputPassword?.focus();
      return;
    }

    if (currentMode === "signup") {
      if (password.length < 6) {
        showAlert("Password must be at least 6 characters.");
        els.authInputPassword?.focus();
        return;
      }

      try {
        setBtnLoading(true);
        await authClient.signUp({ email, password, fullName });
        // Automatically sign in
        try {
          await authClient.signIn({ email, password });
        } catch (_) {}

        showAlert("Account created! Redirecting...", true);
        setTimeout(() => {
          window.location.href = "index.html";
        }, 350);
      } catch (err) {
        showAlert(err.message || "Could not create account.");
        setBtnLoading(false);
      }
      return;
    }

    // Sign In Mode
    try {
      setBtnLoading(true);
      await authClient.signIn({ email, password });
      showAlert("Signed in! Redirecting...", true);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 350);
    } catch (err) {
      showAlert(err.message || "Invalid email or password.");
      setBtnLoading(false);
    }
  });
}

// --------------------------------------------------------------------
// 5. Initial Session Check
// --------------------------------------------------------------------
async function checkActiveSession() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  setMode(mode === "signup" ? "signup" : mode === "forgot" ? "forgot" : "signin");

  try {
    const session = await authClient.getSession();
    if (session?.user && els.authSessionPanel && els.authSessionEmailLabel) {
      els.authSessionEmailLabel.textContent = session.user.email || "Active User";
      els.authSessionPanel.hidden = false;
      if (els.authMainCard) els.authMainCard.hidden = true;
    }
  } catch (_) {}
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  bindEvents();
  checkActiveSession();
});
