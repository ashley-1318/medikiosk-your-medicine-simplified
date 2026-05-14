// Typed API helpers — all calls to the backend go through here
const BASE = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

function authHeaders(jwt?: string) {
  return {
    "Content-Type": "application/json",
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function verifyFirebaseToken(token: string, role: string) {
  const res = await fetch(`${BASE}/auth/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ token, role }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ jwt: string; user: any; is_new_user: boolean }>;
}

export async function updateProfile(jwt: string, name: string, role: string) {
  const res = await fetch(`${BASE}/auth/update-profile`, {
    method: "PATCH",
    headers: authHeaders(jwt),
    body: JSON.stringify({ name, role }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveFcmToken(jwt: string, userId: string, fcmToken: string) {
  const res = await fetch(`${BASE}/auth/fcm-token`, {
    method: "PATCH",
    headers: authHeaders(jwt),
    body: JSON.stringify({ user_id: userId, fcm_token: fcmToken }),
  });
  return res.json();
}

// ── Prescription AI ───────────────────────────────────────────────────────────

export async function processPrescription(
  jwt: string,
  patientId: string,
  file: File,
  doctorId?: string,
) {
  const form = new FormData();
  form.append("prescription", file);
  form.append("patient_id", patientId);
  if (doctorId) form.append("doctor_id", doctorId);

  const res = await fetch(`${BASE}/ai/process-prescription`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` }, // no Content-Type — let browser set boundary
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  jwt: string,
  patientId: string,
  message: string,
  prescriptionId?: string,
) {
  const res = await fetch(`${BASE}/chat/message`, {
    method: "POST",
    headers: authHeaders(jwt),
    body: JSON.stringify({ patient_id: patientId, message, prescription_id: prescriptionId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ response: string }>;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function triggerNotification(
  jwt: string,
  trigger: string,
  userId: string,
  extra?: Record<string, string>,
) {
  const res = await fetch(`${BASE}/notifications/send`, {
    method: "POST",
    headers: authHeaders(jwt),
    body: JSON.stringify({ trigger, user_id: userId, ...extra }),
  });
  return res.json();
}

// ── Receipt ───────────────────────────────────────────────────────────────────

export async function generateReceipt(jwt: string, dispenseLogId: string) {
  const res = await fetch(`${BASE}/receipt/generate`, {
    method: "POST",
    headers: authHeaders(jwt),
    body: JSON.stringify({ dispense_log_id: dispenseLogId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ receipt_url: string }>;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getInventory(jwt: string) {
  const res = await fetch(`${BASE}/admin/inventory`, { headers: authHeaders(jwt) });
  return res.json();
}

export async function updateStock(jwt: string, id: string, stock_quantity: number) {
  const res = await fetch(`${BASE}/admin/inventory/update`, {
    method: "PUT",
    headers: authHeaders(jwt),
    body: JSON.stringify({ id, stock_quantity }),
  });
  return res.json();
}

export async function getMachineStatus(jwt: string) {
  const res = await fetch(`${BASE}/admin/machine/status`, { headers: authHeaders(jwt) });
  return res.json();
}

export async function getDispenseLogs(jwt: string) {
  const res = await fetch(`${BASE}/admin/dispense/logs`, { headers: authHeaders(jwt) });
  return res.json();
}

export async function getLowStockAlerts(jwt: string) {
  const res = await fetch(`${BASE}/admin/alerts/lowstock`, { headers: authHeaders(jwt) });
  return res.json();
}
