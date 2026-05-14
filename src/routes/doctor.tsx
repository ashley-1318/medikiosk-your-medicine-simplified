import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  History,
  ChevronRight,
  Stethoscope,
  Clock,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { DoctorAIAnalysis } from "@/components/DoctorAIAnalysis";
import { showNotification, notificationTemplates } from "@/lib/notifications";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [{ title: "Doctor — MEDIKIOSK" }],
  }),
  component: DoctorDashboard,
});

const NAV: NavItem[] = [
  { to: "/doctor", label: "Queue", icon: Inbox },
  { to: "/doctor", label: "Approved", icon: CheckCircle2 },
  { to: "/doctor", label: "History", icon: History },
];

type Status = "Pending" | "Approved" | "Rejected";

type Rx = {
  id: string;
  patient: string;
  phone: string;
  age: number;
  time: string;
  status: Status;
  meds: { name: string; dosage: string; frequency: string; duration: string }[];
  notes: string;
};

const QUEUE: Rx[] = [
  {
    id: "RX-2841",
    patient: "Sarah Johnson",
    phone: "+1 555 123 4567",
    age: 32,
    time: "2 min ago",
    status: "Pending",
    notes: "Mild fever and sore throat for 3 days.",
    meds: [
      { name: "Amoxicillin", dosage: "500 mg", frequency: "3× daily", duration: "7 days" },
      { name: "Paracetamol", dosage: "650 mg", frequency: "2× daily", duration: "5 days" },
      { name: "Vitamin D3", dosage: "1000 IU", frequency: "1× daily", duration: "30 days" },
    ],
  },
  {
    id: "RX-2840",
    patient: "Michael Chen",
    phone: "+1 555 987 6543",
    age: 45,
    time: "8 min ago",
    status: "Pending",
    notes: "Routine BP medication refill.",
    meds: [
      { name: "Amlodipine", dosage: "5 mg", frequency: "1× daily", duration: "30 days" },
      { name: "Ibuprofen", dosage: "400 mg", frequency: "2× daily", duration: "5 days" },
    ],
  },
  {
    id: "RX-2839",
    patient: "Anita Patel",
    phone: "+1 555 222 1199",
    age: 28,
    time: "21 min ago",
    status: "Approved",
    notes: "Seasonal allergies.",
    meds: [
      { name: "Cetirizine", dosage: "10 mg", frequency: "1× daily", duration: "10 days" },
    ],
  },
  {
    id: "RX-2838",
    patient: "Daniel Rivera",
    phone: "+1 555 444 7788",
    age: 51,
    time: "47 min ago",
    status: "Rejected",
    notes: "Image quality too low — re-upload requested.",
    meds: [],
  },
];

function statusStyle(s: Status) {
  if (s === "Pending") return "bg-amber/15 text-amber";
  if (s === "Approved") return "bg-success/15 text-success";
  return "bg-destructive/15 text-destructive";
}

function DoctorDashboard() {
  const [list, setList] = useState(QUEUE);
  const [selectedId, setSelectedId] = useState(QUEUE[0].id);
  const selected = list.find((r) => r.id === selectedId)!;
  const session = getSession();
  const doctorLastName = (session?.role === "Doctor" ? session.name : "Iyer").replace(/^Dr\.?\s*/i, "");

  function decide(id: string, status: Status) {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (status === "Approved") {
      const rx = list.find((r) => r.id === id);
      if (rx) {
        const tpl = notificationTemplates.approved(
          rx.patient.split(" ")[0],
          doctorLastName,
        );
        showNotification(tpl.title, tpl.body);
      }
    }
  }

  return (
    <DashboardShell role="Doctor" items={NAV}>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Doctor</p>
        <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">
          Good morning, Dr. Iyer.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {list.filter((r) => r.status === "Pending").length} prescriptions awaiting your review.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.6fr]">
        {/* Queue */}
        <div className="space-y-3">
          {list.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={
                "flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-card transition hover:-translate-y-0.5 " +
                (selectedId === r.id ? "ring-2 ring-amber" : "")
              }
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-surface">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-surface">
                    {r.patient}
                  </span>
                  <span
                    className={
                      "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                      statusStyle(r.status)
                    }
                  >
                    {r.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{r.id}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {r.time}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="rounded-3xl bg-card p-6 shadow-card md:p-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground">{selected.id}</p>
              <h2 className="mt-1 text-2xl font-semibold text-surface">{selected.patient}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Age {selected.age} · Submitted {selected.time}
              </p>
            </div>
            <span
              className={
                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider " +
                statusStyle(selected.status)
              }
            >
              {selected.status}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-mint">
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mint to-accent text-xs text-muted-foreground">
                Prescription image
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Patient note
              </h4>
              <p className="mt-2 text-sm text-surface">{selected.notes}</p>

              <h4 className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Extracted medicines
              </h4>
              <ul className="mt-3 space-y-2">
                {selected.meds.map((m) => (
                  <li
                    key={m.name}
                    className="rounded-xl border border-border bg-mint/40 p-3 text-sm"
                  >
                    <div className="font-semibold text-surface">{m.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {m.dosage} · {m.frequency} · {m.duration}
                    </div>
                  </li>
                ))}
                {selected.meds.length === 0 && (
                  <li className="text-sm text-muted-foreground">No items.</li>
                )}
              </ul>
            </div>
          </div>

          <DoctorAIAnalysis meds={selected.meds} rxId={selected.id} />

          {selected.status === "Pending" && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <button
                onClick={() => decide(selected.id, "Approved")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-success px-6 py-4 text-sm font-semibold text-success-foreground transition hover:opacity-90"
              >
                <CheckCircle2 className="h-5 w-5" />
                APPROVE
              </button>
              <button
                onClick={() => decide(selected.id, "Rejected")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-destructive px-6 py-4 text-sm font-semibold text-destructive-foreground transition hover:opacity-90"
              >
                <XCircle className="h-5 w-5" />
                REJECT
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
