import { Link } from "@tanstack/react-router";
import { Pill, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 z-50 w-full transition-all duration-500 px-6 py-4",
        isScrolled ? "py-3" : "py-6"
      )}
    >
      <nav 
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between rounded-full border transition-all duration-500 px-4 py-2",
          isScrolled 
            ? "bg-surface/80 backdrop-blur-xl border-white/10 shadow-2xl" 
            : "bg-transparent border-transparent"
        )}
      >
        <Link to="/" className="flex items-center gap-2 pl-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-amber shadow-glow">
            <Pill className="h-4.5 w-4.5 text-surface" strokeWidth={2.5} />
          </div>
          <span className={cn(
            "text-lg font-bold tracking-tight transition-colors",
            isScrolled ? "text-surface-foreground" : "text-white"
          )}>MEDIKIOSK</span>
        </Link>

        {/* Desktop Nav */}
        <div className={cn(
          "hidden items-center gap-8 text-sm font-semibold md:flex transition-colors",
          isScrolled ? "text-surface-foreground/70" : "text-white/70"
        )}>
          <a href="/#how" className="hover:text-amber transition-colors">How It Works</a>
          <a href="/#roles" className="hover:text-amber transition-colors">Roles</a>
          <a href="/#faq" className="hover:text-amber transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className={cn(
              "hidden md:flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-soft",
              isScrolled 
                ? "bg-surface-foreground text-surface" 
                : "bg-white text-surface"
            )}
          >
            Get Started
          </Link>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "flex md:hidden p-2 rounded-full transition-colors",
              isScrolled ? "text-surface-foreground hover:bg-surface/10" : "text-white hover:bg-white/10"
            )}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 z-[-1] bg-surface flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden",
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <a href="/#how" onClick={() => setMobileMenuOpen(false)} className="text-3xl font-bold text-white hover:text-amber">How It Works</a>
        <a href="/#roles" onClick={() => setMobileMenuOpen(false)} className="text-3xl font-bold text-white hover:text-amber">Roles</a>
        <a href="/#faq" onClick={() => setMobileMenuOpen(false)} className="text-3xl font-bold text-white hover:text-amber">FAQ</a>
        <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="mt-4 rounded-full bg-amber px-10 py-4 text-xl font-black text-surface">Get Started</Link>
      </div>
    </header>
  );
}
