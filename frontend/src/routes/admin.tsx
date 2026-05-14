import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  Boxes,
  Server,
  ScrollText,
  AlertTriangle,
  Plus,
  Loader2,
  CheckCircle2,
  Pencil,
  LayoutDashboard,
  Bell,
  Users,
  LineChart as LineChartIcon,
  Settings,
  Search,
  Filter,
  Download,
  Trash2,
  ChevronRight,
  TrendingUp,
  Clock,
  Activity,
  Thermometer,
  Wifi,
  Cpu,
  Monitor
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { DashboardShell } from "../components/DashboardShell";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

type Tab = "overview" | "inventory" | "machine" | "logs" | "alerts" | "users" | "analytics" | "settings";

const NAV = [
  { id: "overview", label: "Kiosk Overview", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "machine", label: "Machine Status", icon: Server },
  { id: "logs", label: "Dispense Logs", icon: ScrollText },
  { id: "alerts", label: "Alerts", icon: Bell, badge: true },
  { id: "users", label: "Users", icon: Users },
  { id: "analytics", label: "Analytics", icon: LineChartIcon },
  { id: "settings", label: "Settings", icon: Settings },
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  // Modal states
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showAddMachine, setShowAddMachine] = useState(false);

  const fetchAllData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      setError(null);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/stats`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Server Response: ${res.status}`);
      const stats = await res.json();
      setData(stats);
    } catch (err: any) {
      console.error("[Admin] Fetch error:", err);
      if (err.name === 'AbortError') {
        setError("Request timed out. Mission control is taking too long to respond.");
      } else {
        setError(err.message || "Failed to synchronize with mission control.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(fetchAllData, 30000);
    return () => clearInterval(timer);
  }, []);

  const navItems = NAV.map(item => ({
    to: "#",
    label: item.label,
    icon: item.icon,
    badge: item.badge && data?.summary?.lowStockCount > 0 ? data.summary.lowStockCount : undefined
  }));

  const handleTabChange = (item: any) => {
    const navItem = NAV.find(n => n.label === item.label);
    if (navItem) {
        setActiveTab(navItem.id as Tab);
    }
  };

  // Show spinner ONLY on first load if we have NO data yet
  if (loading && !data && !error) {
    return (
      <DashboardShell 
        role="Admin" 
        items={navItems} 
        activeLabel={NAV.find(n => n.id === activeTab)?.label}
        onItemClick={handleTabChange}
      >
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-amber" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="h-4 w-4 text-amber animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-surface tracking-[0.2em] uppercase">Initializing</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">Establishing Secure Uplink...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error && !data) {
    return (
        <DashboardShell 
            role="Admin" 
            items={navItems}
            activeLabel={NAV.find(n => n.id === activeTab)?.label}
            onItemClick={handleTabChange}
        >
          <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center animate-fade-up">
            <div className="rounded-full bg-red-50 p-6 shadow-soft">
                <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-surface">System Synchronization Failed</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{error}</p>
            </div>
            <button 
                onClick={() => { setLoading(true); fetchAllData(); }}
                className="rounded-full bg-surface px-10 py-4 text-xs font-black uppercase tracking-widest text-surface-foreground shadow-soft hover:opacity-90 transition-all active:scale-95"
            >
                Retry Handshake
            </button>
          </div>
        </DashboardShell>
      );
  }

  const dashboardData = data || { 
    summary: { dispensedToday: 0, activeSkus: 0, pendingPrescriptions: 0, lowStockCount: 0 }, 
    charts: { lineChartData: [], pieChartData: [] }, 
    machines: [] 
  };

  return (
    <DashboardShell 
        role="Admin" 
        items={navItems}
        activeLabel={NAV.find(n => n.id === activeTab)?.label}
        onItemClick={handleTabChange}
    >
      {activeTab === "overview" && <OverviewPage data={dashboardData} />}
      {activeTab === "inventory" && <InventoryPage onAdd={() => setShowAddMedicine(true)} />}
      {activeTab === "machine" && <MachinePage data={dashboardData} />}
      {activeTab === "logs" && <LogsPage />}
      {activeTab === "alerts" && <AlertsPage />}
      {activeTab === "users" && <UsersPage />}
      {activeTab === "analytics" && <AnalyticsPage />}
      {activeTab === "settings" && <SettingsPage />}

      {showAddMedicine && <AddMedicineModal onClose={() => setShowAddMedicine(false)} onRefresh={fetchAllData} />}
    </DashboardShell>
  );
}

// ── Overview Page ──────────────────────────────────────────────────
function OverviewPage({ data }: { data: any }) {
  const { summary, charts, machines } = data;
  const primaryMachine = machines[0] || {};

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Mission Control</p>
        <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">Kiosk overview</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Dispensed Today" value={summary.dispensedToday} sub="Live" />
        <StatCard label="Active SKUs" value={summary.activeSkus} sub="Inventory" />
        <StatCard label="Machine Status" value={primaryMachine.status === 'online' ? 'Online' : 'Offline'} sub="MEDI-001" isStatus status={primaryMachine.status === 'online'} />
        <StatCard label="Pending" value={summary.pendingPrescriptions} sub="Prescriptions" isAmber />
        <StatCard label="Low Stock" value={summary.lowStockCount} sub="Alerts" isRed={summary.lowStockCount > 0} />
        <StatCard label="Revenue Today" value={`₹${summary.revenueToday?.toLocaleString()}`} sub="Paid" isAmber />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="text-base font-semibold text-surface">Dispense Trend · Last 30 Days</h3>
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fontSize: 11, fill: "#1a3a2a" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#1a3a2a" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="text-base font-semibold text-surface">Prescription Overview</h3>
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.pieChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6">
            {charts.pieChartData.map((d: any) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs font-medium text-surface">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inventory Page ─────────────────────────────────────────────────
function InventoryPage({ onAdd }: { onAdd: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/inventory`)
      .then(r => r.json())
      .then(d => setItems(d))
      .finally(() => setLoading(false));
  }, []);

  const lowStockItems = items.filter(i => i.stock_quantity < i.low_stock_threshold);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Pharmacy</p>
          <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">Inventory</h1>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 rounded-full bg-surface px-6 py-3 text-sm font-bold text-surface-foreground hover:opacity-90 transition-all active:scale-95 shadow-soft">
          <Plus className="h-4 w-4" />
          Add Medicine
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-6 rounded-2xl bg-amber/10 border border-amber/30 p-5 flex items-start gap-4">
          <div className="rounded-full bg-amber/20 p-2 text-amber">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-surface uppercase tracking-wider">Low Stock Alert</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {lowStockItems.length} medicines need restocking.
              <span className="ml-2 font-semibold text-surface">
                {lowStockItems.slice(0, 3).map(i => `${i.medicines.name}: ${i.stock_quantity} units`).join(" · ")}
                {lowStockItems.length > 3 && " ..."}
              </span>
            </p>
          </div>
          <button className="text-xs font-bold text-amber hover:underline">View All Alerts</button>
        </div>
      )}

      <div className="rounded-3xl bg-card p-6 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Medicine</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Stock</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Threshold</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Expiry</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-4 py-4 text-right font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const isCritical = item.stock_quantity < item.low_stock_threshold / 2;
                const isLow = item.stock_quantity < item.low_stock_threshold;
                const status = item.stock_quantity === 0 ? "Out of Stock" : isCritical ? "Critical" : isLow ? "Low" : "Good";
                const statusColor = item.stock_quantity === 0 ? "bg-red-500" : isCritical ? "bg-red-500" : isLow ? "bg-amber" : "bg-success";
                
                return (
                  <tr key={item.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-5 font-bold text-surface">
                      <div>
                        {item.medicines.name}
                        <p className="text-[10px] font-medium text-muted-foreground uppercase">{item.medicines.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-5 font-mono font-medium">{item.stock_quantity}</td>
                    <td className="px-4 py-5 text-muted-foreground">{item.low_stock_threshold}</td>
                    <td className="px-4 py-5 font-medium">{item.expiry_date}</td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${statusColor}`} />
                        <span className="text-xs font-bold text-surface">{status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-full p-2 hover:bg-gray-100 transition-colors text-muted-foreground"><Pencil className="h-4 w-4"/></button>
                        <button className="rounded-full p-2 hover:bg-red-50 transition-colors text-red-500"><Trash2 className="h-4 w-4"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Machine Status Page ───────────────────────────────────────────
function MachinePage({ data }: { data: any }) {
  const { machines } = data;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Hardware</p>
        <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">Machine Status</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {machines.map((m: any) => (
          <MachineDetailCard key={m.machine_id} machine={m} />
        ))}
      </div>
    </div>
  );
}

function MachineDetailCard({ machine }: { machine: any }) {
  const isOnline = machine.status === 'online';

  return (
    <div className="rounded-3xl bg-card p-6 shadow-card border border-border">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-surface">{machine.machine_id}</h3>
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${isOnline ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-red-500'}`} />
              {machine.status}
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{machine.location}</p>
        </div>
        <button className="rounded-full bg-background p-2 text-muted-foreground hover:bg-gray-100 transition-colors">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-background/50 p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Performance</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Dispenses</span>
              <span className="font-bold text-surface">{machine.total_dispenses || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-bold text-success">{machine.uptime_percentage || 100}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Temperature</span>
              <span className="font-bold text-surface">{machine.temperature || 24}°C</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-background/50 p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hardware</p>
          <div className="mt-3 space-y-2">
            <HardwareStatusRow label="Motor" status={machine.motor_status} />
            <HardwareStatusRow label="Scanner" status={machine.scanner_status} />
            <HardwareStatusRow label="Network" status={machine.network_status} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="flex-1 rounded-full bg-surface px-4 py-3 text-xs font-bold text-surface-foreground hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2">
          <Activity className="h-3 w-3" />
          Run Diagnostics
        </button>
        <button className="flex-1 rounded-full border border-border bg-white px-4 py-3 text-xs font-bold text-surface hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2">
          <TrendingUp className="h-3 w-3" />
          View History
        </button>
      </div>
    </div>
  );
}

function HardwareStatusRow({ label, status }: { label: string, status: string }) {
  const ok = status === 'operational' || status === 'connected';
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <div className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-success' : 'bg-red-500'}`} />
        <span className="font-medium text-surface capitalize">{status}</span>
      </div>
    </div>
  );
}

// ── Alerts Page ──────────────────────────────────────────────────
function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/alerts`)
      .then(r => r.json())
      .then(d => setAlerts(d));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-500">Center</p>
        <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">System Alerts</h1>
      </div>

      <div className="space-y-4">
        {alerts.map(a => (
          <div key={a.id} className={`rounded-3xl p-6 shadow-card flex items-start gap-4 border ${a.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber/5 border-amber/20'}`}>
            <div className={`rounded-full p-3 ${a.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber text-white'}`}>
              {a.type === 'stock' ? <Boxes className="h-5 w-5"/> : <AlertTriangle className="h-5 w-5"/>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${a.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber text-white'}`}>
                  {a.severity}
                </span>
                <span className="text-xs text-muted-foreground font-medium">{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <h3 className="mt-1 text-base font-bold text-surface">{a.title}</h3>
              <p className="text-sm text-muted-foreground">{a.message}</p>
            </div>
            {!a.is_resolved && (
              <button className="rounded-full bg-white border border-border px-4 py-2 text-xs font-bold text-surface hover:bg-gray-50 transition-all">
                Mark Resolved
              </button>
            )}
          </div>
        ))}
        {alerts.length === 0 && <div className="py-20 text-center text-muted-foreground italic">No active alerts... system is healthy.</div>}
      </div>
    </div>
  );
}

// ── Users Page ───────────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/users`)
      .then(r => r.json())
      .then(d => setUsers(d));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Community</p>
        <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">User Management</h1>
      </div>

      <div className="rounded-3xl bg-card shadow-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-background/50">
            <tr>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px]">User</th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px]">Role</th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px]">Joined</th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px]">Status</th>
              <th className="px-6 py-4 text-right font-bold text-muted-foreground uppercase text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-surface">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.phone_number}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-amber/20 text-amber' : u.role === 'doctor' ? 'bg-mint/20 text-surface' : 'bg-gray-100 text-muted-foreground'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-success' : 'bg-red-500'}`} />
                    <span className="text-xs font-medium">{u.is_active ? 'Active' : 'Disabled'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs font-bold text-surface hover:underline">View Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Analytics Page ───────────────────────────────────────────────
function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/analytics`)
      .then(r => r.json())
      .then(d => setAnalytics(d));
  }, []);

  if (!analytics) return <Loader2 className="animate-spin m-auto" />;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Performance</p>
        <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">System Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total Dispenses" value={analytics.totalDispenses} sub="All Time" />
        <StatCard label="Total Patients" value={analytics.totalPatients} sub="Registered" />
        <StatCard label="Active SKUs" value={analytics.activeMedicines} sub="In Stock" />
        <StatCard label="Top Med" value={analytics.mostDispensed} sub="High Demand" isAmber />
        <StatCard label="Total Revenue" value={`₹${analytics.totalRevenue?.toLocaleString()}`} sub="Lifetime" isAmber />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="text-base font-semibold text-surface">Revenue Growth · Last 30 Days</h3>
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fontSize: 11, fill: "#1a3a2a" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} 
                />
                <Line type="monotone" dataKey="amount" stroke="#d4a853" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="text-base font-semibold text-surface">Peak Usage Hours · 24h Heatmap</h3>
          <div className="mt-6 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.hourlyUsage}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f0e8" />
              <XAxis dataKey="hour" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f5f0e8'}} />
              <Bar dataKey="count" fill="#1a3a2a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);
}

// ── Logs & Settings Placeholders (to be detailed further) ─────────
function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/logs`)
      .then(r => r.json())
      .then(d => setLogs(d))
      .finally(() => setLoading(false));
  }, []);

  const exportToCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ["Dispensed At", "Patient", "Machine", "Medicines"];
    const rows = logs.map(l => [
      new Date(l.dispensed_at).toLocaleString(),
      l.users?.name || "Unknown",
      l.machine_id,
      (l.medicines_dispensed || []).map((m: any) => `${m.name} (${m.qty})`).join("; ")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `dispense_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Archive</p>
          <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">Dispense Logs</h1>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={logs.length === 0}
          className="flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-bold text-surface hover:bg-gray-50 transition-all shadow-soft disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export as CSV
        </button>
      </div>

      <div className="rounded-3xl bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-background/50 border-b border-border">
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Patient</th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Machine</th>
                <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Medicines Dispensed</th>
                <th className="px-6 py-4 text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-amber" /></td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    {new Date(l.dispensed_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-surface">{l.users?.name || "Anonymous"}</div>
                    <div className="text-[10px] text-muted-foreground">ID: {l.patient_id?.slice(0,8)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase text-muted-foreground">
                      {l.machine_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(l.medicines_dispensed || []).map((m: any, i: number) => (
                        <span key={i} className="rounded-lg bg-mint/10 border border-mint/20 px-2 py-1 text-[10px] font-bold text-surface">
                          {m.name} x{m.qty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {l.receipt_url ? (
                      <a href={l.receipt_url} target="_blank" className="text-xs font-bold text-amber hover:underline">View PDF</a>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">No Digital Receipt</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground italic">No dispense records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-semibold text-surface mb-8">System Settings</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-bold text-surface mb-4">Kiosk Configuration</h3>
          <div className="space-y-4">
            <SettingRow label="Low Stock Threshold" value="10 units" />
            <SettingRow label="Expiry Warning Days" value="30 days" />
            <SettingRow label="Machine Timeout" value="5 minutes" />
          </div>
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-bold text-surface mb-4">Alert Preferences</h3>
          <div className="space-y-4">
            <ToggleRow label="Push Notifications" active={true} />
            <ToggleRow label="SMS Critical Alerts" active={true} />
            <ToggleRow label="Daily Summary Email" active={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared UI Components ──────────────────────────────────────────
function StatCard({ label, value, sub, isStatus, status, isRed, isAmber }: any) {
  return (
    <div className={`rounded-2xl bg-card p-5 shadow-card border-l-4 ${isRed ? 'border-red-500' : isAmber ? 'border-amber' : 'border-mint'}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-black text-surface">{value}</p>
        <p className="text-[10px] font-medium text-muted-foreground uppercase">{sub}</p>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-bold text-surface">{value}</span>
    </div>
  );
}

function ToggleRow({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className={`h-5 w-10 rounded-full p-1 transition-colors ${active ? 'bg-success' : 'bg-gray-200'}`}>
        <div className={`h-3 w-3 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

function AddMedicineModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [form, setForm] = useState({ 
    name: '', 
    generic_name: '', 
    category: 'General', 
    stock_quantity: '0', 
    threshold: '10', 
    expiry_date: '', 
    price: '0', 
    slot: 'A1' 
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...form,
            stock_quantity: parseInt(form.stock_quantity) || 0,
            threshold: parseInt(form.threshold) || 10,
            price: parseFloat(form.price) || 0
        }),
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
          const errData = await res.json();
          alert(`Error: ${errData.error || "Failed to save product"}`);
      }
    } catch (err: any) {
        alert("Network error: Could not reach mission control.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-card p-8 shadow-2xl animate-fade-up my-auto">
        <div className="mb-6">
            <p className="text-[10px] font-black text-amber uppercase tracking-widest">Inventory Management</p>
            <h3 className="text-2xl font-bold text-surface">Register New Product</h3>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Commercial Name</label>
            <input type="text" required placeholder="e.g. Panadol 500mg" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm focus:border-amber/60 outline-none transition-all shadow-sm" />
          </div>

          <div className="col-span-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Generic Name</label>
            <input type="text" required placeholder="e.g. Paracetamol" value={form.generic_name} onChange={e => setForm({...form, generic_name: e.target.value})} className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm focus:border-amber/60 outline-none transition-all shadow-sm" />
          </div>

          <div className="col-span-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm focus:border-amber/60 outline-none transition-all shadow-sm appearance-none">
                <option value="General">General</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Painkiller">Painkiller</option>
                <option value="Chronic">Chronic</option>
                <option value="Pediatric">Pediatric</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Initial Stock</label>
            <input type="number" required value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm focus:border-amber/60 outline-none transition-all shadow-sm" />
          </div>

          <div className="col-span-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Low Stock Alert (Threshold)</label>
            <input type="number" required value={form.threshold} onChange={e => setForm({...form, threshold: e.target.value})} className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm focus:border-amber/60 outline-none transition-all shadow-sm" />
          </div>

          <div className="col-span-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Unit Price (₹)</label>
            <input type="number" step="0.01" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm focus:border-amber/60 outline-none transition-all shadow-sm" />
          </div>

          <div className="col-span-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Machine Slot ID</label>
            <input type="text" required placeholder="e.g. A1, B2" value={form.slot} onChange={e => setForm({...form, slot: e.target.value})} className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm focus:border-amber/60 outline-none transition-all shadow-sm" />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Expiry Date</label>
            <input type="date" required value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm focus:border-amber/60 outline-none transition-all shadow-sm" />
          </div>

          <div className="mt-6 col-span-2 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-full bg-background border border-border px-4 py-4 text-xs font-bold text-muted-foreground hover:bg-surface/5 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 rounded-full bg-amber px-4 py-4 text-xs font-bold text-amber-foreground shadow-soft transition-all active:scale-95 hover:shadow-lg disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin m-auto"/> : "Confirm Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
