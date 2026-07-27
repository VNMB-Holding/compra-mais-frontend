/**
 * Session management utilities.
 * 
 * The actual session lives in an httpOnly cookie (`compra_session`)
 * managed by the BFF backend. The frontend cannot read it directly.
 * 
 * We use a lightweight client-side flag cookie so the Next.js middleware
 * can detect whether the user has logged in without needing to parse
 * the httpOnly cookie (which it can read, but we keep this simple).
 */

const FLAG_COOKIE = "compra_logged_in";
const FLAG_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Sets a flag cookie indicating the user has an active session.
 * Called after a successful login.
 */
export function markSessionActive() {
  if (typeof document === "undefined") return;
  document.cookie = `${FLAG_COOKIE}=1; path=/; max-age=${FLAG_MAX_AGE}; SameSite=Lax`;
}

/**
 * Clears the flag cookie. Called on logout.
 * Also clears the old `currentUser` cookie/localStorage if present.
 */
export function clearSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${FLAG_COOKIE}=; path=/; max-age=0`;
  // Clean up legacy localStorage session
  try {
    localStorage.removeItem("currentUser");
  } catch {
    // SSR or storage unavailable
  }
  // Clean up legacy cookie
  document.cookie = "currentUser=; path=/; max-age=0";
}
