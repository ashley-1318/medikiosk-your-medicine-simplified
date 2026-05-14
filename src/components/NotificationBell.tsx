import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { useNotifications, type AppNotification } from "@/lib/useNotifications";

const TYPE_COLORS: Record<string, string> = {
  welcome: "bg-amber/20 text-amber",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
  dispensed: "bg-mint text-surface",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent/60 text-sidebar-foreground transition hover:bg-sidebar-accent"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber text-[9px] font-bold text-amber-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border bg-card shadow-soft animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-surface">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-surface"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-surface" />
              </button>
            </div>
          </div>

          {/* List */}
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </li>
            )}
            {notifications.map((n: AppNotification) => (
              <li
                key={n.id}
                onClick={() => markRead(n.id)}
                className={
                  "cursor-pointer px-4 py-3 transition hover:bg-mint/40 " +
                  (!n.is_read ? "bg-amber/5" : "")
                }
              >
                <div className="flex items-start gap-3">
                  <span
                    className={
                      "mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider " +
                      (TYPE_COLORS[n.type] ?? "bg-mint text-surface")
                    }
                  >
                    {n.type}
                  </span>
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber" />
                  )}
                </div>
                <p className="mt-1 text-sm text-surface leading-snug">{n.message}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(n.sent_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
