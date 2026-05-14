import { Link } from "@tanstack/react-router";
import { Pill } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-4 left-1/2 z-50 w-[min(96%,1100px)] -translate-x-1/2">
      <nav className="glass-light flex items-center justify-between rounded-full border border-border/60 px-3 py-2 shadow-soft">
        <Link to="/" className="flex items-center gap-2 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-amber">
            <Pill className="h-4 w-4 text-surface" strokeWidth={2.5} />
          </div>
          <span className="text-base font-semibold tracking-tight text-surface">MEDIKIOSK</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-surface/80 md:flex">
          <a href="/#how" className="transition hover:text-surface">How It Works</a>
          <a href="/#roles" className="transition hover:text-surface">Roles</a>
          <a href="/#faq" className="transition hover:text-surface">FAQ</a>
        </div>
        <Link
          to="/auth"
          className="flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 text-sm font-medium text-surface-foreground shadow-soft transition hover:opacity-90"
        >
          Get Started
        </Link>
      </nav>
    </header>
  );
}
