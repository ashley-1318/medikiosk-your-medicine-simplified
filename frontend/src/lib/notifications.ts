// Replaces Twilio SMS stub with in-app toast notifications.
// Real push notifications are sent by the backend via FCM.
import { toast } from "sonner";

export function showNotification(title: string, body: string) {
  toast.success(title, { description: body, duration: 5000 });
}

export const notificationTemplates = {
  welcome: (name: string) => ({
    title: "Welcome to MEDIKIOSK 👋",
    body: `Hi ${name}! Your account is ready. No queues. No waiting. Just care.`,
  }),
  approved: (name: string, doctor: string) => ({
    title: "✅ Prescription Approved!",
    body: `Dr. ${doctor} approved your prescription. Please collect your medicines.`,
  }),
  dispensed: (name: string) => ({
    title: "🎉 Medicines Dispensed!",
    body: `${name}, your medicines have been dispensed successfully. Get well soon! 💊`,
  }),
  newPrescription: (patientName: string) => ({
    title: "📋 New Prescription Received",
    body: `Patient ${patientName} has submitted a prescription for your review.`,
  }),
};
