// In-app notification hook backed by the `notifications` Supabase table
import { useState, useEffect, useCallback } from "react";
import { getSession } from "./session";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? "",
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
);

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

  const fetchNotifications = useCallback(async () => {
    if (!session?.id) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, message, is_read, sent_at")
      .eq("user_id", session.id)
      .order("sent_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data as AppNotification[]);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, [session?.id]);

  const markRead = useCallback(
    async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    if (!session?.id) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [session?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications };
}
