import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Clock, FileText, ChevronRight, Hash } from "lucide-react";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/patient/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [session] = useState(() => getSession());
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

  useEffect(() => {
    async function fetchHistory() {
      if (!session?.id) return;
      try {
        const res = await fetch(`${BACKEND}/prescriptions/patient/${session.id}`);
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [session, BACKEND]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Records</p>
        <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">Prescription History</h1>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item, i) => (
            <div key={item.id || i} className="group flex items-center justify-between rounded-3xl bg-card p-5 shadow-card transition-all hover:bg-mint/10">
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface/5 text-muted-foreground group-hover:bg-amber/10 group-hover:text-amber">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-surface">Prescription #{item.id?.slice(-6) || (i+1)}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'dispensed' ? 'bg-success/15 text-success' : 'bg-amber/15 text-amber'
                    }`}>
                      {item.status || 'Processed'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {item.extracted_data?.length || 0} Medicines</span>
                  </div>
                </div>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-surface-foreground transition hover:bg-amber hover:text-amber-foreground">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl bg-card p-12 text-center shadow-card">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint">
            <Clock className="h-8 w-8 text-surface" />
          </div>
          <h3 className="text-xl font-semibold text-surface">No history yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Your processed prescriptions will appear here.</p>
        </div>
      )}
    </div>
  );
}
