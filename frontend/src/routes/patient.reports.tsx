import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Activity, 
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { getSession } from "@/lib/session";
import { showNotification } from "@/lib/notifications";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

export const Route = createFileRoute("/patient/reports")({
  component: ReportsPage,
});

const REPORT_TYPES = [
    "Blood Test", "BP Report", "Sugar Test", "Thyroid", "ECG", "Scan/X-Ray"
];

const ANALYSIS_STEPS = [
    "Reading Report",
    "Extracting Values",
    "Analyzing Results",
    "Generating Summary"
];

function ReportsPage() {
  const [session] = useState(() => getSession());
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0]);
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  useEffect(() => {
    async function fetchReports() {
      if (!session?.id) return;
      try {
        const res = await fetch(`${BACKEND}/reports/patient/${session.id}`);
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error("Reports fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [session]);

  const onUpload = async (file: File) => {
    setUploading(true);
    setAnalysisStep(0);
    
    // Simulate animated steps based on real progress
    const stepInterval = setInterval(() => {
        setAnalysisStep(s => s < 3 ? s + 1 : s);
    }, 2000);

    try {
        if (!session?.id) return;
        const formData = new FormData();
        formData.append("report", file);
        formData.append("patient_id", session.id);
        formData.append("report_type", selectedType);

        const res = await fetch(`${BACKEND}/reports/analyze`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        
        clearInterval(stepInterval);
        if (data.success) {
            setAnalysisStep(4);
            setLastAnalysis(data.report);
            setReports(prev => [data.report, ...prev]);
            showNotification("Success", "Report analyzed successfully");
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        clearInterval(stepInterval);
        showNotification("Error", "Failed to analyze report");
        setAnalysisStep(-1);
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Records</p>
          <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">Health Reports</h1>
        </div>
        {lastAnalysis && (
            <button 
                onClick={() => {setLastAnalysis(null); setAnalysisStep(-1);}} 
                className="rounded-full bg-card px-4 py-2 text-xs font-medium text-surface shadow-card hover:bg-mint"
            >
                Upload another
            </button>
        )}
      </div>

      {!uploading && !lastAnalysis && (
          <div className="space-y-6">
              {/* Type Selection */}
              <div className="flex flex-wrap gap-2">
                  {REPORT_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedType(t)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                            selectedType === t ? "bg-amber text-amber-foreground shadow-soft" : "bg-card text-surface hover:bg-mint"
                        }`}
                      >
                          {t}
                      </button>
                  ))}
              </div>

              {/* Upload Zone */}
              <div className="animate-fade-up">
                <label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center transition hover:border-amber hover:bg-amber/5">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-mint text-surface">
                        <Upload className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-surface">Click or drag your {selectedType}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">PDF, JPG or PNG. Our AI will extract and summarize results.</p>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,.pdf" 
                        onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])}
                    />
                </label>
              </div>
          </div>
      )}

      {uploading && (
          <div className="rounded-3xl bg-card p-12 shadow-card text-center animate-fade-up">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-amber/15 px-4 py-2 text-xs font-bold text-amber uppercase tracking-widest">
                  <Sparkles className="h-4 w-4" /> AI Analyzing
              </div>
              <h2 className="text-2xl font-bold text-surface mb-8">Processing your {selectedType}...</h2>
              
              <div className="mx-auto max-w-sm space-y-4">
                  {ANALYSIS_STEPS.map((s, i) => {
                      const done = i < analysisStep;
                      const active = i === analysisStep;
                      return (
                          <div key={s} className="flex items-center gap-4">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                                  done ? "bg-success text-success-foreground" : active ? "bg-amber/20 text-amber" : "bg-mint text-muted-foreground"
                              }`}>
                                  {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{i+1}</span>}
                              </div>
                              <span className={`text-sm font-medium ${done || active ? "text-surface" : "text-muted-foreground"}`}>{s}</span>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {lastAnalysis && (
          <div className="animate-fade-up grid gap-6 md:grid-cols-2">
              {/* Image Preview */}
              <div className="overflow-hidden rounded-3xl bg-card shadow-card">
                  <img src={lastAnalysis.image_url} alt="Report" className="h-full w-full object-cover max-h-[500px]" />
              </div>

              {/* Analysis Result */}
              <div className="rounded-3xl bg-card p-8 shadow-card space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-[10px] font-bold text-success uppercase">
                        <Activity className="h-3 w-3" /> {lastAnalysis.report_type}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(lastAnalysis.created_at).toLocaleDateString()}</span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-mint/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-4 py-2">Test Name</th>
                                <th className="px-4 py-2">Value</th>
                                <th className="px-4 py-2 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {lastAnalysis.extracted_values?.map((v: any, i: number) => (
                                <tr key={i} className="bg-card">
                                    <td className="px-4 py-3 font-medium text-surface">{v.test_name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{v.value} {v.unit}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                            v.status === 'High' || v.status === 'Low' ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success'
                                        }`}>
                                            {v.status || 'Normal'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="rounded-2xl bg-mint/30 p-5">
                    <h4 className="text-sm font-bold text-surface mb-2 uppercase tracking-wide">AI Summary</h4>
                    <p className="text-sm text-surface/80 leading-relaxed">{lastAnalysis.ai_summary}</p>
                </div>

                <div className="rounded-2xl border border-amber/30 p-5 bg-amber/5">
                    <h4 className="text-sm font-bold text-amber mb-2 uppercase tracking-wide">Recommendation</h4>
                    <p className="text-sm text-surface/80 leading-relaxed font-medium">{lastAnalysis.ai_recommendation}</p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => {
                            // Save context to local storage for the assistant to pick up
                            localStorage.setItem('health_report_context', JSON.stringify({
                                type: lastAnalysis.report_type,
                                summary: lastAnalysis.ai_summary,
                                recommendation: lastAnalysis.ai_recommendation,
                                values: lastAnalysis.extracted_values
                            }));
                            window.location.href = '/patient/ai-assistant';
                        }}
                        className="flex-1 rounded-full bg-surface py-3 text-xs font-bold text-surface-foreground hover:opacity-90"
                    >
                        Ask AI About This
                    </button>
                    <button 
                        onClick={async () => {
                            if (!session?.id) return;
                            try {
                                showNotification("Requesting Consultation", "Connecting you with a specialist...");
                                await fetch(`${BACKEND}/prescriptions`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        patient_id: session.id,
                                        doctor_id: null,
                                        status: 'pending',
                                        type: 'consultation',
                                        report_id: lastAnalysis.id,
                                        doctor_notes: `Patient requested consultation regarding ${lastAnalysis.report_type} report.`
                                    })
                                });
                                showNotification("Consultation Booked", "A doctor will contact you soon.");
                            } catch (err) {
                                showNotification("Error", "Could not request consultation");
                            }
                        }}
                        className="flex-1 rounded-full border border-border py-3 text-xs font-bold text-surface hover:bg-mint transition"
                    >
                        Consult Doctor
                    </button>
                </div>
              </div>
          </div>
      )}

      {/* Reports History */}
      {!lastAnalysis && !uploading && (
          <div className="space-y-4">
              <h3 className="text-xl font-semibold text-surface">Recent Reports</h3>
              {reports.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {reports.map((r) => (
                          <div key={r.id} onClick={() => setLastAnalysis(r)} className="group cursor-pointer rounded-3xl bg-card p-5 shadow-card transition-hover">
                              <div className="flex items-center justify-between mb-4">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber/15 text-amber">
                                      <FileText className="h-5 w-5" />
                                  </div>
                                  {r.has_critical_values && <AlertCircle className="h-5 w-5 text-destructive" />}
                              </div>
                              <h4 className="font-bold text-surface">{r.report_type}</h4>
                              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}</span>
                                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="flex h-48 flex-col items-center justify-center rounded-3xl bg-card/50 border border-dashed border-border">
                      <FileText className="mb-2 h-8 w-8 text-muted-foreground opacity-30" />
                      <p className="text-sm text-muted-foreground">No reports found.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
