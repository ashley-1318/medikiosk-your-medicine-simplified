import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Filter, ArrowUpDown, Info, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/prices")({
  component: PatientPrices,
});

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

type MedicinePrice = {
  id: string;
  name: string;
  category: string;
  price: number;
};

function PatientPrices() {
  const [prices, setPrices] = useState<MedicinePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(`${BACKEND}/payment/prices`);
        if (res.ok) {
          const data = await res.json();
          setPrices(data);
        }
      } catch (err) {
        console.error("Fetch prices error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
  }, []);

  const filteredPrices = prices
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortOrder === "asc" ? a.price - b.price : b.price - a.price);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface">Real-time Prices</h1>
          <p className="text-surface-foreground/60 mt-1">Live inventory pricing at MEDIKIOSK-001</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search medicines..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 w-full rounded-2xl border-none bg-surface/50 pl-10 pr-4 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-amber/50 md:w-64"
                />
            </div>
            <button 
                onClick={() => setSortOrder(v => v === "asc" ? "desc" : "asc")}
                className="flex h-11 items-center gap-2 rounded-2xl bg-surface/50 px-4 text-sm font-medium ring-1 ring-border hover:bg-surface"
            >
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === "asc" ? "Low to High" : "High to Low"}
            </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-surface/50" />
          ))}
        </div>
      ) : filteredPrices.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrices.map((med) => (
            <div 
              key={med.id} 
              className="group relative overflow-hidden rounded-3xl bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-glow ring-1 ring-border"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/10 text-amber">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-mint/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-surface">
                  In Stock
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-surface">{med.name}</h3>
              <p className="text-xs text-surface-foreground/50 mb-4">{med.category || 'General Medicine'}</p>
              
              <div className="flex items-end justify-between border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price per tab</p>
                  <p className="text-2xl font-black text-amber">₹{med.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                    <Info className="h-3 w-3" />
                    TAX INCLUDED
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-surface/50 p-6">
                <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-surface">No medicines found</h3>
            <p className="text-surface-foreground/60">Try searching with a different name</p>
        </div>
      )}

      <div className="rounded-3xl bg-surface p-8 text-center ring-1 ring-border">
          <Sparkles className="mx-auto h-8 w-8 text-amber mb-4" />
          <h3 className="text-lg font-bold text-surface">Can't find your medicine?</h3>
          <p className="text-sm text-surface-foreground/60 max-w-md mx-auto mt-2">
              Our inventory is updated daily. If a specific prescription is not listed, our AI will automatically suggest the closest verified alternative.
          </p>
      </div>
    </div>
  );
}

