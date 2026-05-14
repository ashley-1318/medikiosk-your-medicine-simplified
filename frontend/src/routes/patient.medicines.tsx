import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Upload, Pill, History, Search, Calendar, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/patient/medicines")({
  component: MedicinesPage,
});

function MedicinesPage() {
  const [session] = useState(() => getSession());
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

  useEffect(() => {
    async function fetchMeds() {
      if (!session?.id) return;
      try {
        const res = await fetch(`${BACKEND}/prescriptions/patient/${session.id}`);
        const data = await res.json();
        // Extract all meds from all prescriptions
        const allMeds = data.flatMap((p: any) => {
            const ex = p.extracted_data;
            if (Array.isArray(ex)) return ex;
            if (ex && typeof ex === 'object' && Array.isArray(ex.medicines)) return ex.medicines;
            return [];
        });
        setMeds(allMeds);
      } catch (err) {
        console.error("Failed to fetch meds:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeds();
  }, [session, BACKEND]);

  const displayRole = (session?.role || "Patient");

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Active Treatments</p>
        <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">My Medicines</h1>
      </div>


      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your medicines..."
            className="w-full rounded-2xl border-none bg-card py-3 pl-11 pr-4 text-sm shadow-card focus:ring-2 focus:ring-amber"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
        </div>
      ) : meds.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meds.map((med, i) => (
            <div key={i} className="group overflow-hidden rounded-3xl bg-card p-6 shadow-card transition-all hover:shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/15 text-amber">
                  <Pill className="h-6 w-6" />
                </div>
                <div className="rounded-full bg-success/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-success">
                  Active
                </div>
              </div>
              <h3 className="text-lg font-semibold text-surface">{med.medicine_name || med.name}</h3>
              <p className="text-sm text-muted-foreground">{med.dosage}</p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-surface/80">{med.frequency}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-surface/80">{med.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl bg-card p-12 text-center shadow-card">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint">
            <Pill className="h-8 w-8 text-surface" />
          </div>
          <h3 className="text-xl font-semibold text-surface">No medicines found</h3>
          <p className="mt-2 text-sm text-muted-foreground">Upload a prescription to see your active medicines here.</p>
        </div>
      )}
    </div>
  );
}

