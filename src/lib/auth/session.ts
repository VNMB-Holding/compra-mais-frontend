import { User } from "@/types/auth";

const SESSION_KEY = "currentUser";
const COOKIE_MAX_AGE = 60 * 60 * 24;

export function saveSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  document.cookie = `${SESSION_KEY}=${JSON.stringify(user)}; path=/; max-age=${COOKIE_MAX_AGE}`;
}

export function loadSession(): User | null {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${SESSION_KEY}=; path=/; max-age=0`;
}
