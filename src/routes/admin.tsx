import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Boxes,
  Server,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Pencil,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — MEDIKIOSK" }],
  }),
  component: AdminDashboard,
});

const NAV: NavItem[] = [
  { to: "/admin", label: "Inventory", icon: Boxes },
  { to: "/admin", label: "Machine Status", icon: Server },
  { to: "/admin", label: "Dispense Logs", icon: ScrollText },
];

const INVENTORY = [
  { name: "Amoxicillin 500mg", stock: 12, expiry: "2026-04-12" },
  { name: "Paracetamol 650mg", stock: 240, expiry: "2027-01-30" },
  { name: "Cetirizine 10mg", stock: 84, expiry: "2026-09-15" },
  { name: "Amlodipine 5mg", stock: 9, expiry: "2026-02-08" },
  { name: "Vitamin D3 1000IU", stock: 320, expiry: "2027-06-20" },
  { name: "Metformin 500mg", stock: 56, expiry: "2026-11-03" },
];

const LOGS = [
  { time: "10:42", patient: "Sarah Johnson", med: "Amoxicillin 500mg", qty: 21 },
  { time: "10:31", patient: "Michael Chen", med: "Amlodipine 5mg", qty: 30 },
  { time: "09:58", patient: "Anita Patel", med: "Cetirizine 10mg", qty: 10 },
  { time: "09:21", patient: "Lina Park", med: "Paracetamol 650mg", qty: 14 },
  { time: "08:46", patient: "Tom Becker", med: "Vitamin D3", qty: 30 },
];

const USAGE = [
  { name: "Paracetamol", count: 142 },
  { name: "Amoxicillin", count: 98 },
  { name: "Cetirizine", count: 76 },
  { name: "Amlodipine", count: 54 },
  { name: "Vitamin D3", count: 121 },
  { name: "Metformin", count: 67 },
];

function AdminDashboard() {
  const [online, setOnline] = useState(true);
  const lowStock = INVENTORY.filter((i) => i.stock < 20);

  return (
    <DashboardShell role="Admin" items={NAV}>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Admin</p>
        <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">
          Kiosk overview
        </h1>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Dispensed today</p>
          <p className="mt-2 text-3xl font-semibold text-surface">128</p>
          <p className="mt-1 text-xs text-success">+12% vs yesterday</p>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Active SKUs</p>
          <p className="mt-2 text-3xl font-semibold text-surface">{INVENTORY.length}</p>
          <p className="mt-1 text-xs text-amber">{lowStock.length} low-stock</p>
        </div>
        <MachineStatusCard online={online} setOnline={setOnline} />
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
          <div className="text-sm">
            <p className="font-semibold text-surface">Low stock warning</p>
            <p className="mt-0.5 text-muted-foreground">
              {lowStock.map((i) => i.name).join(", ")} — restock recommended within 48h.
            </p>
          </div>
        </div>
      )}

      {/* Chart + Inventory */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="text-base font-semibold text-surface">Medicine usage · this week</h3>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={USAGE} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.012 110)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.45 0.025 158)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.45 0.025 158)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "oklch(0.94 0.025 165 / 0.5)" }}
                  contentStyle={{
                    border: "none",
                    borderRadius: 12,
                    boxShadow: "0 10px 30px -12px oklch(0.25 0.04 160 / 0.18)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.34 0.05 158)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-surface">Recent dispenses</h3>
            <span className="text-xs text-muted-foreground">Last 5</span>
          </div>
          <ul className="divide-y divide-border">
            {LOGS.map((l, i) => (
              <li key={i} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-surface">{l.patient}</p>
                  <p className="text-xs text-muted-foreground">{l.med}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-muted-foreground">{l.time}</p>
                  <p className="text-xs text-muted-foreground">qty {l.qty}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Inventory table */}
      <div className="mt-6 rounded-3xl bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-surface">Inventory</h3>
            <p className="text-xs text-muted-foreground">Medicines available in this kiosk</p>
          </div>
          <button className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs font-medium text-surface-foreground hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />
            Add medicine
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Medicine</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Expiry</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {INVENTORY.map((i) => {
                const low = i.stock < 20;
                return (
                  <tr key={i.name}>
                    <td className="px-3 py-3 font-medium text-surface">{i.name}</td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-semibold " +
                          (low ? "bg-amber/20 text-amber" : "bg-success/15 text-success")
                        }
                      >
                        {i.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{i.expiry}</td>
                    <td className="px-3 py-3 text-right">
                      <button className="inline-flex items-center gap-1 rounded-full bg-mint px-3 py-1 text-xs text-surface hover:bg-accent">
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

function MachineStatusCard({
  online,
  setOnline,
}: {
  online: boolean;
  setOnline: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-card p-5 shadow-card">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Machine status</p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={
            "h-2.5 w-2.5 rounded-full " + (online ? "bg-success animate-pulse" : "bg-destructive")
          }
        />
        <span className="text-2xl font-semibold text-surface">
          {online ? "Online" : "Offline"}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Last active 12s ago</p>
        <button
          onClick={() => setOnline(!online)}
          className={
            "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition " +
            (online
              ? "bg-mint text-surface hover:bg-accent"
              : "bg-success text-success-foreground hover:opacity-90")
          }
        >
          <CheckCircle2 className="h-3 w-3" />
          {online ? "Take offline" : "Bring online"}
        </button>
      </div>
    </div>
  );
}
