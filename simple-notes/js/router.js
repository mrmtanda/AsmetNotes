// ====================================================================
// Clean URL Router for AsmetNotes
// Removes .html extensions and provides clean navigation
// ====================================================================

/**
 * Strips .html extensions from current window.location without reloading
 */
export function cleanCurrentUrl() {
  if (typeof window === "undefined" || !window.location) return;

  const { pathname, search, hash } = window.location;
  let newPath = pathname;

  if (newPath.endsWith("/index.html")) {
    newPath = newPath.slice(0, -"/index.html".length) || "/";
  } else if (newPath.endsWith("index.html")) {
    newPath = newPath.slice(0, -"index.html".length) || "./";
  } else if (newPath.endsWith(".html")) {
    newPath = newPath.slice(0, -5);
  }

  if (newPath !== pathname) {
    try {
      window.history.replaceState(null, "", newPath + search + hash);
    } catch (_) {}
  }
}

/**
 * Computes base path relative to current deployment
 */
export function getBasePath() {
  const path = window.location.pathname;
  if (path.includes("/simple-notes")) {
    const idx = path.indexOf("/simple-notes");
    return path.substring(0, idx + "/simple-notes".length);
  }
  return "";
}

/**
 * Navigate to Notes Dashboard with clean URL (no .html)
 */
export function navigateToDashboard() {
  const base = getBasePath();
  const target = base ? `${base}/` : "./";
  window.location.replace(target);
}

/**
 * Navigate to Auth page with clean URL (no .html)
 */
export function navigateToAuth(mode = "") {
  const base = getBasePath();
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  const target = base ? `${base}/auth${query}` : `auth${query}`;
  window.location.replace(target);
}

// Intercept clicks on links that point to .html files and route cleanly
export function initLinkInterceptors() {
  if (typeof document === "undefined") return;

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link || !link.href) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    if (url.pathname.endsWith("/auth.html") || url.pathname.endsWith("auth.html")) {
      e.preventDefault();
      navigateToAuth();
    } else if (url.pathname.endsWith("/index.html") || url.pathname.endsWith("index.html")) {
      e.preventDefault();
      navigateToDashboard();
    }
  });
}

// Automatically clean URL on load
cleanCurrentUrl();
initLinkInterceptors();
