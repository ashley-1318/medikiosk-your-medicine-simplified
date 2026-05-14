// Persists auth session across tab navigations via sessionStorage
export type Session = {
  id: string;          // Supabase user UUID (returned from backend /auth/verify)
  name: string;
  phone: string;
  role: "Patient" | "Doctor" | "Admin";
  jwt: string;         // Backend JWT for authenticated API calls
  fcmToken?: string;
  email?: string;
  address?: string;
  age?: number;
  blood_group?: string;
  weight?: string;
  height?: string;
  gender?: string;
  allergies?: string;
  conditions?: string;
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
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch { /* noop */ }
}
