import { toast } from "sonner";

// Mocked SMS sender. In production, swap this for a server function that calls
// Twilio or Fast2SMS using credentials stored as secrets.
export function sendSms(phone: string, message: string, label?: string) {
  // Console log so demos can show "real" payload
  // eslint-disable-next-line no-console
  console.log("[MEDIKIOSK SMS]", { to: phone, message });

  toast.success(label ?? "SMS sent", {
    description: `To ${phone || "your phone"} — ${message.split("\n")[0]}`,
    duration: 4000,
  });
}

export const smsTemplates = {
  welcome: (name: string) =>
    `Welcome to MEDIKIOSK! 👋\nHi ${name}, your account is ready. Stay healthy!\n- Team MEDIKIOSK`,
  approved: (name: string, doctor: string) =>
    `✅ Prescription Approved!\nHi ${name}, Dr. ${doctor} approved your prescription.\nPlease collect from the kiosk.\n- MEDIKIOSK`,
  dispensed: (name: string, meds: string[]) =>
    `🎉 Thank you, ${name}!\nMedicines dispensed: ${meds.join(", ")}\nTake care and get well soon! 💊\n- Team MEDIKIOSK`,
};
