// In-app notification hook backed by the `notifications` Supabase table
// Switched to Polling mode to prevent 'postgres_changes' crashes
import { useState, useEffect, useCallback } from "react";
import { getSession } from "./session";
import { supabase } from "./supabase";

export type AppNotification = {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  sent_at: string;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const session = getSession();

  // ── Fetch Logic ────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!session?.id) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, message, is_read, sent_at")
        .eq("user_id", session.id)
        .order("sent_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      if (data) {
        setNotifications(data as AppNotification[]);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.warn("[Notifications] Refresh failed:", err);
    }
  }, [session?.id]);

  // ── Polling Loop (Safe replacement for Realtime) ──────────────────────────
  useEffect(() => {
    if (!session?.id) return;

    // Initial load
    fetchNotifications();

    // Check for updates every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(interval);
  }, [session?.id, fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (!session?.id) return;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", session.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  }, [session?.id]);

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications };
}
