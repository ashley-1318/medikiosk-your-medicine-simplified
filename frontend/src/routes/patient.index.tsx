import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { 
  Activity, 
  Pill, 
  FileText, 
  History, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock,
  LayoutDashboard
} from "lucide-react";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/patient/")({
  component: DashboardOverview,
});

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000"

function DashboardOverview() {
  const [session] = useState(() => getSession());
  const [profileName, setProfileName] = useState(session?.name || "Patient");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    prescriptions: 0,
    activeMeds: 0,
    reports: 0,
    lastActivity: "No activity"
  });
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!session?.id) {
          setLoading(false);
          return;
        }
        // 0. Sync Profile Name
        const profileRes = await fetch(`${BACKEND}/auth/profile/${session.id}`);
        if (profileRes.ok) {
          const userData = await profileRes.json();
          if (userData.name) setProfileName(userData.name);
        }
        // 1. Fetch Stats counts
        const prescRes = await fetch(`${BACKEND}/prescriptions/patient/${session.id}`);
        const prescDataRaw = prescRes.ok ? await prescRes.json() : [];
        const prescCount = prescDataRaw.length;
        const approvedPresc = prescDataRaw.filter((p: any) => p.status === "approved");
        const activeMedsCount = approvedPresc.reduce((acc: number, curr: any) => acc + (curr.extracted_data?.medicines?.length || curr.extracted_data?.length || 0), 0);

        const reportsRes = await fetch(`${BACKEND}/reports/patient/${session.id}`);
        const reports = reportsRes.ok ? await reportsRes.json() : [];
        const reportCount = reports.length;

        // 2. Fetch Timeline Data (example: sugar/bp from reports)
        const mappedTimeline = reports.map((r: any) => {
            const vals = r.extracted_values || {};
            let sugarVal = 0;
            let bpVal = 0;
            
            const parseVal = (v: any) => {
                if (!v) return 0;
                const num = parseFloat(v.toString().replace(/[^0-9.]/g, ""));
                return isNaN(num) ? 0 : num;
            };

            if (Array.isArray(vals)) {
              const sugarObj = vals.find(v => v.test_name?.toLowerCase().includes("sugar") || v.test_name?.toLowerCase().includes("glucose"));
              const bpObj = vals.find(v => v.test_name?.toLowerCase().includes("bp") || v.test_name?.toLowerCase().includes("pressure") || v.test_name?.toLowerCase().includes("hemoglobin"));
              sugarVal = parseVal(sugarObj?.value);
              bpVal = parseVal(bpObj?.value);
            } else {
              sugarVal = parseVal(vals.sugar || vals["Blood Sugar"] || vals["Glucose"]);
              bpVal = parseVal(vals.bp || vals["Blood Pressure"] || vals["Hemoglobin"]);
            }

            return {
                date: new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                sugar: sugarVal,
                bp: bpVal,
                fullDate: new Date(r.created_at).toLocaleDateString()
            };
        }).filter((d: any) => d.sugar > 0 || d.bp > 0).reverse();

        // 3. Recent Activity 
        const logsRes = await fetch(`${BACKEND}/prescriptions/dispense-logs/${session.id}`);
        const dispenseLogs = logsRes.ok ? await logsRes.json() : [];

        const activities = [
            ...(prescDataRaw.map((p: any) => ({
                id: `p-${p.id}`,
                type: "Prescription",
                status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
                time: p.created_at,
                icon: CheckCircle2,
                color: p.status === 'approved' ? "text-success bg-success/15" : "text-amber bg-amber/15"
            }))),
            ...(dispenseLogs.map((l: any) => ({
                id: `l-${l.id}`,
                type: "Medicine",
                status: "Dispensed",
                time: l.dispensed_at,
                icon: Pill,
                color: "text-mint bg-mint/15"
            }))),
            ...(reports.map((r: any) => ({
                id: `r-${r.id}`,
                type: "Report",
                status: "Uploaded",
                time: r.created_at,
                icon: FileText,
                color: "text-sidebar-accent-foreground bg-sidebar-accent/15"
            })))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

        const lastAct = activities[0]?.time ? 
            new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                Math.round((new Date(activities[0].time).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                "day"
            ) : "No recent activity";

        setTimelineData(mappedTimeline);
        setRecentActivity(activities);

        setStats({
          prescriptions: prescCount,
          activeMeds: activeMedsCount,
          reports: reportCount,
          lastActivity: activities.length > 0 ? lastAct : "No activity"
        });



      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session]);

  const firstName = profileName.split(" ")[0] || "Patient";

  if (loading) {
    return (
        <div className="animate-pulse space-y-8">
            <div className="h-10 w-48 rounded bg-card"></div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-3xl bg-card"></div>)}
            </div>
            <div className="h-64 rounded-3xl bg-card"></div>
        </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-semibold text-surface">Hello, {firstName}. 👋</h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s your health overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Prescriptions", val: stats.prescriptions, icon: FileText, color: "bg-amber/10 text-amber" },
          { label: "Active Medicines", val: stats.activeMeds, icon: Pill, color: "bg-success/10 text-success" },
          { label: "Reports Uploaded", val: stats.reports, icon: Activity, color: "bg-sidebar-accent/10 text-sidebar-accent-foreground" },
          { label: "Last Activity", val: stats.lastActivity, icon: Clock, color: "bg-mint/60 text-surface" },
        ].map((s, i) => (
          <div key={i} className="flex flex-col rounded-3xl bg-card p-6 shadow-card transition-hover">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold text-surface">{s.val}</span>
            <span className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Health Timeline Graph */}
      <div className="rounded-3xl bg-card p-8 shadow-card">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-surface">Health Timeline</h3>
            <p className="text-sm text-muted-foreground">BP, Sugar & Vitals trends from your reports</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber"></div>
                <span className="text-xs font-medium">Sugar/Glucose</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-sidebar-accent-foreground"></div>
                <span className="text-xs font-medium">BP/Hemoglobin</span>
             </div>
          </div>
        </div>


        <div className="h-[300px] w-full">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a853" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d4a853" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a3a2a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1a3a2a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#6b7280'}} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#6b7280'}} 
                />
                <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="sugar" stroke="#d4a853" strokeWidth={3} fillOpacity={1} fill="url(#colorSugar)" />
                <Area type="monotone" dataKey="bp" stroke="#1a3a2a" strokeWidth={3} fillOpacity={1} fill="url(#colorBP)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <LayoutDashboard className="mb-4 h-12 w-12 opacity-20" />
                <p className="text-sm">No report data available yet. Upload a health report to see trends.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-3xl bg-card p-8 shadow-card">
          <h3 className="mb-6 text-xl font-semibold text-surface">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.length > 0 ? recentActivity.map((act) => (
              <div key={act.id} className="group flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${act.color}`}>
                    <act.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-surface">{act.type} {act.status}</h4>
                    <p className="text-xs text-muted-foreground">{new Date(act.time).toLocaleString()}</p>
                  </div>
                </div>
                {act.type === "Prescription" && act.status === "Approved" && (
                  <Link 
                    to="/patient/payment" 
                    className="rounded-full bg-amber px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-foreground shadow-soft transition-all hover:scale-105 active:scale-95"
                  >
                    Pay & Collect
                  </Link>
                )}
                <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </div>
            )) : (
              <p className="text-center text-sm text-muted-foreground py-8">No recent activity detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
