// Persists auth session across tab navigations via sessionStorage
export type Session = {
  id: string;          // Supabase user UUID (returned from backend /auth/verify)
  name: string;
  phone: string;
  role: "Patient" | "Doctor" | "Admin";
  jwt: string;         // Backend JWT for authenticated API calls
  fcmToken?: string;
};

const KEY = "medikiosk:session";

export function setSession(s: Session) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* noop */ }
}

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch { /* noop */ }
}
