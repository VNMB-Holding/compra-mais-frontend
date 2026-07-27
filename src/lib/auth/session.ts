import { User } from "@/types/auth";

const TOKEN_KEY = "compra_access_token";
const REFRESH_KEY = "compra_refresh_token";
const USER_KEY = "compra_user";

export function saveSession(accessToken: string, refreshToken: string, user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `compra_logged_in=1; path=/; max-age=86400; SameSite=Lax`;
}

export function loadStoredSession(): { accessToken: string; refreshToken: string; user: User } | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const userStr = localStorage.getItem(USER_KEY);

  if (!accessToken || !userStr) return null;

  try {
    const user = JSON.parse(userStr) as User;
    return { accessToken, refreshToken: refreshToken || "", user };
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `compra_logged_in=; path=/; max-age=0`;
}
