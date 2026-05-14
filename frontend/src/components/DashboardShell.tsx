import { Link, useLocation } from "@tanstack/react-router";
import { Pill, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { clearSession } from "@/lib/session";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

function SidebarItem({ 
  item, 
  activeLabel, 
  onClick 
}: { 
  item: NavItem; 
  activeLabel?: string; 
  onClick?: (item: NavItem) => void 
}) {
  const location = useLocation();
  const isActive = activeLabel ? activeLabel === item.label : location.pathname === item.to;

  const content = (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition cursor-pointer",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground",
      )}
    >
      <div className="flex items-center gap-3">
        <item.icon className={cn("h-4 w-4", isActive ? "opacity-100" : "opacity-60")} />
        <span className={cn("font-medium", isActive ? "font-bold" : "")}>{item.label}</span>
      </div>
      {item.badge !== undefined && item.badge > 0 && (
        <span className={cn(
          "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white",
          item.badgeColor || "bg-amber"
        )}>
          {item.badge}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return <div onClick={() => onClick(item)}>{content}</div>;
  }

  return (
    <Link to={item.to} className="block">
      {content}
    </Link>
  );
}

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: string;
};

export function DashboardShell({
  role,
  items,
  children,
  activeLabel,
  onItemClick,
}: {
  role: string;
  items: NavItem[];
  children: ReactNode;
  activeLabel?: string;
  onItemClick?: (item: NavItem) => void;
}) {
  // Capitalize role for display
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

  async function handleSignOut() {
    await signOut(auth);
    clearSession();
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center justify-between px-6 py-6 mt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-sm">
              <Pill className="h-5 w-5 text-amber" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">MEDIKIOSK</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40">{displayRole}</div>
            </div>
          </div>
          <NotificationBell />
        </div>
        <nav className="mt-4 flex flex-1 flex-col gap-1 px-4">
          {items.map((item) => (
            <SidebarItem 
                key={item.label} 
                item={item} 
                activeLabel={activeLabel} 
                onClick={onItemClick} 
            />
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}

