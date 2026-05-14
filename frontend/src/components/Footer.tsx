import { Pill } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-surface text-surface-foreground">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-amber">
              <Pill className="h-5 w-5 text-surface" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold">MEDIKIOSK</span>
          </div>
          <p className="max-w-md text-balance text-base text-surface-foreground/70">
            Your prescription. Verified. Dispensed. Care made instant, accurate, and human.
          </p>
          <div className="mt-4 flex gap-8 text-sm text-surface-foreground/60">
            <a href="/#how" className="hover:text-surface-foreground">How it works</a>
            <a href="/#roles" className="hover:text-surface-foreground">Roles</a>
            <a href="/#faq" className="hover:text-surface-foreground">FAQ</a>
          </div>
          <p className="mt-8 text-xs text-surface-foreground/40">
            © {new Date().getFullYear()} MEDIKIOSK. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
