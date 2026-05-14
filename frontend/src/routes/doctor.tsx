import { createFileRoute } from '@tanstack/react-router'
import {
  Home,
  Inbox,
  AlertCircle,
  CheckCircle2,
  History as HistoryIcon,
  BarChart3,
  Stethoscope,
  Clock,
  ChevronRight,
  XCircle,
  AlertTriangle,
  Users,
  Search,
  MessageSquare,
  Phone,
  Pill,
  Trash2,
  Save,
  Loader2,
  TrendingUp,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { showNotification, notificationTemplates } from "@/lib/notifications";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [{ title: "Doctor Command Center — MEDIKIOSK" }],
  }),
  component: DoctorDashboard,
});

const NAV: (count?: any) => NavItem[] = (counts) => [
  { to: "/doctor", label: "Dashboard", icon: Home },
  { to: "/doctor", label: "Queue", icon: Inbox, badge: counts?.queue },
  { to: "/doctor", label: "Urgent", icon: AlertCircle, badge: counts?.urgent, badgeColor: "bg-red-500" },
  { to: "/doctor", label: "Approved", icon: CheckCircle2 },
  { to: "/doctor", label: "History", icon: HistoryIcon },
  { to: "/doctor", label: "Analytics", icon: BarChart3 },
];

type Tab = "Dashboard" | "Queue" | "Urgent" | "Approved" | "History" | "Analytics";


function statusStyle(s: string) {
  if (s === "pending" || s === "urgent") return "bg-amber/15 text-amber";
  if (s === "approved") return "bg-success/15 text-success";
  return "bg-destructive/15 text-destructive";
}

function DoctorDashboard() {
  const session = getSession();
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [counts, setCounts] = useState({ 
    queue: 0, 
    urgent: 0, 
    approvedToday: 0, 
    rejectedToday: 0, 
    totalReviewed: 0,
    approvalRate: 0,
    weeklyData: [] as any[],
    rejectionReasons: {} as Record<string, number>
  });
  const [analytics, setAnalytics] = useState<any>({ 
    summary: { total: 0, approved: 0, rejected: 0, approvalRate: 0, avgTime: 0 }, 
    rejectionReasons: {},
    weeklyData: []
  });
  
  // Feature 1 Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Feature 6 Rejection Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  const doctorName = session?.name ?? "Doctor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  async function decide(id: string, status: string, reason?: string, note?: string) {
    if (!session?.id || deciding) return;
    try {
      setDeciding(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/prescriptions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          doctor_id: session.id,
          rejection_reason: reason,
          notes: note || (status === "approved" ? "Verified and approved." : "Rejected by physician.")
        })
      });

      if (!res.ok) throw new Error("Failed to update status");

      // Notify visually
      if (status === "approved") {
        const patientName = selected?.users?.name?.split(" ")[0] ?? "Patient";
        const tpl = notificationTemplates.approved(patientName, doctorName.split(" ").pop() || "Doctor");
        showNotification(tpl.title, tpl.body);
      } else {
        showNotification("Case Rejected", `Notification sent to ${selected?.users?.name}`);
      }

      // Refresh everything
      await fetchAll();
      
      // Auto-select next in queue if possible
      const next = list.find(r => r.id !== id && r.status === 'pending');
      setSelectedId(next?.id || null);

    } catch (err) {
      console.error("Decision error:", err);
    } finally {
      setDeciding(false);
    }
  }

  // Data Fetching
  const fetchAll = async () => {
    if (!session?.id) return;
    try {
      setLoading(true);
      
      // Fetch queue (unassigned) AND doctor's specific list (assigned/history)
      const [queueRes, historyRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/prescriptions/queue`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/prescriptions/doctor/${session.id}`)
      ]);

      if (queueRes.ok && historyRes.ok) {
        const queueData = await queueRes.json();
        const historyData = await historyRes.json();
        
        // Merge lists, removing duplicates by ID
        const merged = [...queueData, ...historyData].reduce((acc: any[], curr: any) => {
            if (!acc.find(item => item.id === curr.id)) acc.push(curr);
            return acc;
        }, []);

        const getLocalDate = (d: string) => new Date(d).toLocaleDateString('en-CA');
        const todayLocal = new Date().toLocaleDateString('en-CA');

        const approvedToday = merged.filter((r: any) => r.status === 'approved' && getLocalDate(r.updated_at || r.created_at) === todayLocal).length;
        const rejectedToday = merged.filter((r: any) => r.status === 'rejected' && getLocalDate(r.updated_at || r.created_at) === todayLocal).length;
        
        const totalApproved = merged.filter((r: any) => r.status === 'approved').length;
        const totalRejected = merged.filter((r: any) => r.status === 'rejected').length;
        const totalReviewed = totalApproved + totalRejected;
        const approvalRate = totalReviewed > 0 ? Math.round((totalApproved / totalReviewed) * 100) : 0;

        const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return fmt.format(d);
        });

        const weeklyData = last7Days.map(day => {
          const dayData = merged.filter(p => fmt.format(new Date(p.updated_at || p.created_at)) === day);
          return {
            name: day,
            App: dayData.filter(p => p.status === 'approved').length,
            Rej: dayData.filter(p => p.status === 'rejected').length
          };
        });

        const rejectionReasons = merged
          .filter(p => p.status === 'rejected' && p.rejection_reason)
          .reduce((acc: any, curr: any) => {
            acc[curr.rejection_reason] = (acc[curr.rejection_reason] || 0) + 1;
            return acc;
          }, {});

        setList(merged);
        setCounts({
          queue: queueData.filter((r: any) => r.status === 'pending' && r.type !== 'consultation').length,
          urgent: queueData.filter((r: any) => r.status === 'pending' && r.type === 'consultation').length,
          approvedToday,
          rejectedToday,
          approvalRate,
          totalReviewed,
          weeklyData,
          rejectionReasons
        });
      }

      // Fetch analytics
      const analyticsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/ai/doctor-analytics/${session.id}`);
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } else {
        // Safe default if analytics fails
        setAnalytics({ summary: { total: 0, approved: 0, rejected: 0, approvalRate: 0, avgTime: 0 }, rejectionReasons: {} });
      }

    } catch (err) {
      console.error("Data fetch error:", err);
      // Ensure we have some state to show the page
      if (!analytics) setAnalytics({ summary: { total: 0, approved: 0, rejected: 0, approvalRate: 0, avgTime: 0 }, rejectionReasons: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAll(); 
    
    // Subscribe to Realtime changes
    const channel = supabase
      .channel('doctor-dashboard')
      .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'prescriptions' 
      }, () => {
          console.log("Realtime update received");
          fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  const handleTabClick = (label: string) => {
    setActiveTab(label as Tab);
    setSelectedId(null);
  };

  const selected = list.find((r) => r.id === selectedId);

  // Feature 1: Trigger Analysis
  const runAiAnalysis = async (rxId: string) => {
    try {
      setAnalyzing(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescription_id: rxId })
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (selectedId && activeTab !== "Dashboard" && activeTab !== "Analytics") {
        setAiAnalysis(null);
        runAiAnalysis(selectedId);
    }
  }, [selectedId, activeTab]);

  return (
    <DashboardShell 
        role="Doctor" 
        items={NAV(counts)} 
        onItemClick={(item) => handleTabClick(item.label)}
        activeLabel={activeTab}
    >
      <div className="flex flex-col gap-8 pb-12">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber">Doctor Command Center</p>
            <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">
              {greeting}, {doctorName}.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              You have {counts.queue} prescriptions and {counts.urgent} urgent requests waiting.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-black/5">
                <Search className="h-5 w-5 opacity-40" />
             </div>
             <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-black/5">
                <AlertCircle className="h-5 w-5 text-red-500" />
                {counts.urgent > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                        {counts.urgent}
                    </span>
                )}
             </div>
          </div>
        </div>

        {activeTab === "Dashboard" && (
          <div className="grid gap-8 animate-fade-up">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Pending Today", val: counts.queue, icon: Clock, color: "text-amber" },
                { label: "Approved Today", val: (counts as any).approvedToday, icon: CheckCircle2, color: "text-success" },
                { label: "Rejected Today", val: (counts as any).rejectedToday, icon: XCircle, color: "text-red-500" },
                { label: "Approval Rate", val: `${(counts as any).approvalRate}%`, icon: TrendingUp, color: "text-sidebar-accent-foreground" }
              ].map((s, i) => (
                <div key={i} className="rounded-3xl bg-white p-6 shadow-soft transition-all hover:scale-[1.02]">
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-surface">{s.val}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <h3 className="mb-4 text-sm font-bold text-surface uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" /> Urgent Alerts
                    </h3>
                    <div className="space-y-3">
                        {list.filter(r => r.type === 'consultation' && r.status === 'pending').map((u, i) => (
                            <div key={i} onClick={() => { setActiveTab("Urgent"); setSelectedId(u.id); }} className="group cursor-pointer rounded-2xl bg-red-50 p-4 border border-red-100 flex items-center gap-3 transition-all hover:bg-red-100">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-red-900">{u.users?.name}</p>
                                    <p className="text-xs text-red-700 opacity-80 line-clamp-1">{u.notes || "Reported Symptoms"}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                        {counts.urgent === 0 && (
                            <div className="rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center text-muted-foreground">
                                <p className="text-sm opacity-50">No urgent alerts at this moment</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <h3 className="mb-4 text-sm font-bold text-surface uppercase tracking-widest">Recent Activity</h3>
                    <div className="rounded-3xl bg-white shadow-soft overflow-hidden">
                        {list.slice(0, 5).map((r, i) => (
                            <div key={i} className="flex items-center gap-4 border-b border-gray-50 p-4 last:border-0 hover:bg-gray-50 transition-colors">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${r.status === 'approved' ? 'bg-success/10 text-success' : r.status === 'pending' ? 'bg-amber/10 text-amber' : 'bg-red-50 text-red-500'}`}>
                                    {r.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : r.status === 'pending' ? <Clock className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-surface">{r.users?.name}</p>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">{r.status} — {new Date(r.updated_at || r.created_at).toLocaleTimeString()}</p>
                                </div>
                                <button onClick={() => { setActiveTab(r.status === 'pending' ? 'Queue' : 'History'); setSelectedId(r.id); }} className="text-xs font-bold text-amber hover:underline px-4 py-2 bg-amber/5 rounded-lg">View Details</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}

        {(activeTab === "Queue" || activeTab === "Urgent" || activeTab === "Approved" || activeTab === "History") && (
            <div className="grid gap-6 lg:grid-cols-[1fr,1.8fr] animate-fade-up">
                <div className="space-y-3">
                    {list.filter(r => {
                        if (activeTab === "Queue") return r.status === 'pending' && r.type !== 'consultation';
                        if (activeTab === "Urgent") return r.status === 'pending' && r.type === 'consultation';
                        if (activeTab === "Approved") return r.status === 'approved';
                        if (activeTab === "History") return r.status !== 'pending';
                        return true;
                    }).map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setSelectedId(r.id)}
                            className={
                                `group flex w-full items-center gap-4 rounded-2xl p-4 text-left shadow-card transition-all hover:-translate-y-0.5  ${
                                    selectedId === r.id ? "ring-2 ring-amber bg-white" : "bg-white/60 hover:bg-white"
                                }`
                            }
                        >
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm ${r.type === 'consultation' ? 'bg-red-100 text-red-600' : 'bg-mint text-surface'}`}>
                                {r.type === 'consultation' ? <AlertCircle className="h-5 w-5" /> : <Stethoscope className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="truncate text-sm font-bold text-surface">
                                        {r.users?.name || "Unknown Patient"}
                                    </span>
                                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle(r.status)}`}>
                                        {r.status}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                    <span className="opacity-60">#{r.id.slice(0, 8)}</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition-transform ${selectedId === r.id ? "translate-x-1 text-amber" : "text-muted-foreground opacity-30"}`} />
                        </button>
                    ))}
                    {list.filter(r => {
                        if (activeTab === "Queue") return r.status === 'pending' && r.type !== 'consultation';
                        if (activeTab === "Urgent") return r.status === 'pending' && r.type === 'consultation';
                        if (activeTab === "Approved") return r.status === 'approved';
                        if (activeTab === "History") return r.status !== 'pending';
                        return true;
                    }).length === 0 && (
                        <div className="rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center text-muted-foreground">
                            <p className="text-sm font-semibold opacity-40 uppercase tracking-widest">No cases in {activeTab}</p>
                        </div>
                    )}
                </div>

                {selected ? (
                    <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
                        <div className="rounded-3xl bg-white p-6 shadow-soft md:p-8 flex flex-col gap-8">
                             {/* AI Analysis View */}
                             {analyzing ? (
                                <div className="rounded-2xl bg-surface p-6 text-white animate-pulse">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-amber" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-70">Deep Case Analysis...</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-3 w-¾ bg-white/10 rounded" />
                                        <div className="h-3 w-½ bg-white/10 rounded" />
                                    </div>
                                </div>
                             ) : aiAnalysis && (
                                <div className="rounded-2xl bg-surface p-6 text-white shadow-lg shadow-black/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber/20 text-amber">
                                                <TrendingUp className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-amber">AI Clinical Safety Analysis</h4>
                                        </div>
                                        <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                            aiAnalysis.risk_level === 'low' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            <div className={`h-1.5 w-1.5 rounded-full ${aiAnalysis.risk_level === 'low' ? 'bg-success' : 'bg-red-400'}`} />
                                            {aiAnalysis.risk_level} Risk
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[11px] font-medium border-y border-white/5 py-4 mb-4">
                                       <div className="space-y-1">
                                          <p className="opacity-30 uppercase tracking-tighter">Drug Interaction</p>
                                          <p className="flex items-center gap-1.5 line-clamp-1"><CheckCircle2 className="h-3 w-3 text-success" /> {aiAnalysis.drug_interaction}</p>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="opacity-30 uppercase tracking-tighter">Dosage Safety</p>
                                          <p className="flex items-center gap-1.5 line-clamp-1"><CheckCircle2 className="h-3 w-3 text-success" /> {aiAnalysis.dosage_safety}</p>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="opacity-30 uppercase tracking-tighter">Allergy Check</p>
                                          <p className="flex items-center gap-1.5 line-clamp-1"><CheckCircle2 className="h-3 w-3 text-success" /> {aiAnalysis.allergy_check}</p>
                                       </div>
                                    </div>
                                    
                                    <p className="text-sm italic opacity-90 leading-relaxed font-serif">"{aiAnalysis.suggestion}"</p>
                                </div>
                             )}

                             {/* Private Notes (Feature 8) */}
                             <div className="p-6 rounded-3xl bg-amber/5 border border-amber/10">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-dark-800 mb-3 flex items-center gap-2">
                                    <Save className="h-3 w-3" /> Private Notes
                                </h4>
                                <textarea 
                                    className="w-full bg-transparent border-0 focus:ring-0 text-sm font-medium text-surface placeholder:text-amber/40 min-h-[80px]"
                                    placeholder="Click to add private clinical notes..."
                                />
                             </div>

                             {selected.status === "pending" && (
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <button
                                        disabled={deciding}
                                        onClick={() => decide(selected.id, "approved")}
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-success px-6 py-4 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-success/20 disabled:opacity-50"
                                    >
                                        {deciding ? <Loader2 className="animate-spin h-5 w-5" /> : <><CheckCircle2 className="h-5 w-5" /> APPROVE</>}
                                    </button>
                                    <button
                                        disabled={deciding}
                                        onClick={() => setShowRejectModal(true)}
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-6 py-4 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-500/20"
                                    >
                                        <XCircle className="h-5 w-5" /> REJECT
                                    </button>
                                </div>
                             )}
                        </div>

                        {/* Patient Panel (Feature 5) */}
                        <div className="flex flex-col gap-6">
                            <div className="rounded-3xl bg-white p-6 shadow-soft flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-surface">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-surface">{selected.users?.name}</h3>
                                        <p className="text-xs font-bold text-muted-foreground opacity-60 tracking-tighter">{selected.users?.phone_number}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Age", val: selected.users?.age || "—" },
                                        { label: "Blood", val: selected.users?.blood_group || "O+" },
                                        { label: "Weight", val: `${selected.users?.weight || "65"} kg` },
                                        { label: "Height", val: `${selected.users?.height || "165"} cm` }
                                    ].map((h, i) => (
                                        <div key={i} className="rounded-2xl bg-gray-50/50 p-4 border border-gray-100">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-40">{h.label}</p>
                                            <p className="text-sm font-bold text-surface">{h.val}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 px-1">
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 opacity-30">Chronic Conditions</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(selected.users?.conditions || ["None reported"]).map((c: string, j: number) => (
                                                <span key={j} className="rounded-lg bg-sidebar-accent/10 px-2.5 py-1 text-[10px] font-bold text-sidebar-accent-foreground">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 opacity-30">Known Allergies</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(selected.users?.allergies || ["None reported"]).map((a: string, j: number) => (
                                                <span key={j} className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${a === "None reported" ? "bg-gray-100 text-gray-400" : "bg-red-50 text-red-600"}`}>
                                                    {a === "None reported" ? "" : "⚠ "} {a}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-[500px] flex-col items-center justify-center rounded-3xl bg-white border-2 border-dashed border-gray-100 text-muted-foreground p-12">
                        <div className="h-16 w-16 rounded-full bg-mint/10 flex items-center justify-center mb-6">
                            <Search className="h-8 w-8 text-mint" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest opacity-30">Select a case to begin review</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === "Analytics" && (
            <div className="grid gap-8 animate-fade-up">
                {/* Stats Row */}
                <div className="grid gap-6 md:grid-cols-3">
                     {[
                        { label: "Total Reviewed", val: (counts as any).totalReviewed, icon: Users, delta: "Live" },
                        { label: "Avg Review Time", val: `${analytics?.summary?.avgTime ?? 0}m`, icon: Clock, delta: "Trend" },
                        { label: "Decision Accuracy", val: `${(counts as any).approvalRate}%`, icon: Stethoscope, delta: "High" }
                     ].map((a, i) => (
                        <div key={i} className="rounded-3xl bg-white p-6 shadow-soft border border-white">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-surface text-amber">
                                    <a.icon className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-mint/10 text-mint uppercase tracking-widest">
                                    {a.delta}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-surface">{a.val}</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{a.label}</p>
                        </div>
                     ))}
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Weekly Decisions */}
                    <div className="rounded-3xl bg-white p-8 shadow-soft border border-white min-h-[420px] flex flex-col">
                        <h4 className="mb-8 text-sm font-bold text-surface uppercase tracking-widest">Decision Breakdown (Weekly)</h4>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(counts as any).weeklyData?.length ? (counts as any).weeklyData : [
                                    { name: 'Mon', App: 0, Rej: 0 },
                                    { name: 'Tue', App: 0, Rej: 0 },
                                    { name: 'Wed', App: 0, Rej: 0 },
                                    { name: 'Thu', App: 0, Rej: 0 },
                                    { name: 'Fri', App: 0, Rej: 0 },
                                    { name: 'Sat', App: 0, Rej: 0 },
                                    { name: 'Sun', App: 0, Rej: 0 },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }} 
                                    />
                                    <Bar dataKey="App" fill="#1a3a2a" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="Rej" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Rejection Reasons */}
                    <div className="rounded-3xl bg-white p-8 shadow-soft border border-white min-h-[420px] flex flex-col justify-center text-center">
                        <h4 className="mb-0 text-sm font-bold text-surface uppercase tracking-widest">Root Causes for Rejection</h4>
                        <div className="flex-1 w-full min-h-[300px] flex flex-col justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={Object.keys((counts as any).rejectionReasons || {}).length > 0 
                                            ? Object.entries((counts as any).rejectionReasons).map(([name, value]) => ({ name, value }))
                                            : [{ name: 'No Rejections', value: 1 }]
                                        } 
                                        innerRadius={70} 
                                        outerRadius={100} 
                                        paddingAngle={8} 
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {[ '#d4a853', '#1a3a2a', '#ef4444', '#10b981', '#6366f1' ].map((color, i) => <Cell key={i} fill={color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {!Object.keys(analytics?.rejectionReasons || {}).length && (
                                <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">No record of clinical rejection yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
      {/* FEATURE 6: REJECTION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-surface">Reason for Rejection</h2>
            <p className="mt-2 text-sm text-muted-foreground font-medium">Please select a reason for denying this prescription. This will be shared with the patient.</p>
            
            <div className="mt-6 space-y-2">
              {[
                  "Image quality too low",
                  "Prescription expired",
                  "Incomplete prescription",
                  "Suspected forgery",
                  "Wrong dosage requested",
                  "Medicine not available in stock",
                  "Other"
              ].map((reason) => (
                  <button 
                    key={reason}
                    onClick={() => setRejectReason(reason)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        rejectReason === reason ? 'border-amber bg-amber/5 text-surface' : 'border-gray-50 text-muted-foreground hover:border-gray-100'
                    }`}
                  >
                    <span className="text-sm font-bold">{reason}</span>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${rejectReason === reason ? 'border-amber' : 'border-gray-200'}`}>
                        {rejectReason === reason && <div className="h-2.5 w-2.5 rounded-full bg-amber" />}
                    </div>
                  </button>
              ))}
            </div>

            <textarea 
                className="mt-6 w-full rounded-2xl border-2 border-gray-50 bg-gray-50/30 p-4 text-sm font-medium placeholder:text-muted-foreground/30 focus:border-amber/20 focus:ring-0 transition-all font-serif italic"
                placeholder="Additional note (optional)..."
                onChange={(e) => setRejectNote(e.target.value)}
            />

            <div className="mt-8 grid grid-cols-2 gap-3">
               <button onClick={() => setShowRejectModal(false)} className="rounded-2xl px-6 py-4 text-sm font-bold text-muted-foreground hover:bg-gray-50 transition-colors uppercase tracking-widest">Cancel</button>
               <button 
                onClick={() => {
                    if (selected) {
                        decide(selected.id, "rejected", rejectReason, rejectNote);
                        setShowRejectModal(false);
                    }
                }}
                disabled={!rejectReason || deciding}
                className="rounded-2xl bg-red-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 uppercase tracking-widest"
               >
                 {deciding ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirm Reject"}
               </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>

  );
}



