import { Link, useLocation } from "@tanstack/react-router";
import { Pill, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { clearSession } from "@/lib/session";
import { NotificationBell } from "@/components/NotificationBell";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export function DashboardShell({
  role,
  items,
  children,
}: {
  role: "Patient" | "Doctor" | "Admin";
  items: NavItem[];
  children: ReactNode;
}) {
  const location = useLocation();

  async function handleSignOut() {
    await signOut(auth);
    clearSession();
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen bg-mint/40">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-amber">
              <Pill className="h-4 w-4 text-surface" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">MEDIKIOSK</div>
              <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50">{role}</div>
            </div>
          </div>
          {/* 🔔 Notification Bell */}
          <NotificationBell />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {items.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition " +
                  (active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/70 transition hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-8 md:py-12">{children}</div>
      </main>
    </div>
  );
}
