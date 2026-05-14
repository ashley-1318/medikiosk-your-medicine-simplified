import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Package, ArrowLeft, Download } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/patient/dispense")({
  component: DispensePage,
});

function DispensePage() {
  const [dispensing, setDispensing] = useState(true);

  useEffect(() => {
    // Simulate mechanical dispensing process
    const timer = setTimeout(() => {
      setDispensing(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-12 text-center">
        
        {dispensing ? (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="relative mx-auto h-48 w-48">
                <div className="absolute inset-0 rounded-full border-8 border-amber/10" />
                <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-amber animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Package className="h-20 w-20 text-amber animate-bounce" />
                </div>
             </div>
             <div>
                <h1 className="text-4xl font-black text-surface-foreground uppercase tracking-widest">Dispensing...</h1>
                <p className="mt-4 text-xl text-surface-foreground/40 font-medium">Please wait while the machine organizes your medicine.</p>
             </div>
             <div className="flex justify-center gap-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-2 w-2 rounded-full bg-amber/30 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
             </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in zoom-in-95 duration-500">
             <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-success/20 text-success shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                <CheckCircle2 className="h-20 w-20" />
             </div>
             
             <div className="space-y-4">
                <h1 className="text-5xl font-black text-surface-foreground">Ready!</h1>
                <p className="text-2xl text-surface-foreground/60">Please collect your medicine from the tray below.</p>
             </div>

             <div className="grid gap-4 pt-8">
                <button 
                   onClick={() => window.print()}
                   className="flex items-center justify-center gap-3 rounded-3xl bg-amber py-6 text-xl font-bold text-amber-foreground transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                >
                   <Download className="h-6 w-6" />
                   Download Receipt
                </button>
                
                <Link 
                   to="/patient"
                   className="flex items-center justify-center gap-2 py-4 text-sm font-bold text-surface-foreground/30 hover:text-surface-foreground/60 transition-colors"
                >
                   <ArrowLeft className="h-4 w-4" />
                   Back to Home
                </Link>
             </div>

             <div className="rounded-3xl bg-surface-foreground/5 p-8 border border-white/5">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-surface-foreground/20 mb-4">Safety Reminder</p>
                <p className="text-sm text-surface-foreground/50 leading-relaxed">
                   Please verify the medicine names and dosages against your prescription before leaving the kiosk. 
                   If you notice any discrepancy, contact support immediately.
                </p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
