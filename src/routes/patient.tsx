import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  History,
  Pill,
  Camera,
  CheckCircle2,
  Loader2,
  Sparkles,
  Send,
  PackageCheck,
  Download,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { PatientChatbot } from "@/components/PatientChatbot";
import { getSession } from "@/lib/session";
import { showNotification, notificationTemplates } from "@/lib/notifications";
import { downloadReceipt } from "@/lib/receipt";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [{ title: "Patient — MEDIKIOSK" }],
  }),
  component: PatientDashboard,
});

const NAV: NavItem[] = [
  { to: "/patient", label: "Upload Prescription", icon: Upload },
  { to: "/patient", label: "My Medicines", icon: Pill },
  { to: "/patient", label: "History", icon: History },
];

type Stage = "upload" | "processing" | "result" | "dispense" | "done";

const AI_STEPS = [
  "Reading Prescription",
  "Extracting Text",
  "Identifying Medicines",
  "Validating Data",
];

const SAMPLE_MEDS = [
  { name: "Amoxicillin", dosage: "500 mg", frequency: "3× daily", duration: "7 days" },
  { name: "Paracetamol", dosage: "650 mg", frequency: "2× daily", duration: "5 days" },
  { name: "Vitamin D3", dosage: "1000 IU", frequency: "1× daily", duration: "30 days" },
];

function PatientDashboard() {
  const [stage, setStage] = useState<Stage>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [aiStep, setAiStep] = useState(0);
  const [dispenseStep, setDispenseStep] = useState(0);
  const [session] = useState(() => getSession());
  const patientName = session?.name ?? "Sarah";
  const patientPhone = session?.phone ?? "+1 555 000 0000";
  const dispensedSmsSent = useRef(false);

  const chatStatus: "draft" | "pending" | "approved" | "dispensed" =
    stage === "upload" || stage === "processing"
      ? "draft"
      : stage === "result"
        ? "pending"
        : stage === "dispense"
          ? "approved"
          : "dispensed";

  function onFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setStage("processing");
    setAiStep(0);
    AI_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setAiStep(i + 1);
        if (i === AI_STEPS.length - 1) setTimeout(() => setStage("result"), 600);
      }, (i + 1) * 900);
    });
  }

  function startDispense() {
    // Notify doctor of new prescription (in-app)
    const tpl = notificationTemplates.newPrescription(patientName);
    showNotification(tpl.title, tpl.body);
    setStage("dispense");
    setDispenseStep(0);
    [1, 2, 3].forEach((i) => {
      setTimeout(() => {
        setDispenseStep(i);
        if (i === 3) setTimeout(() => setStage("done"), 1200);
      }, i * 1500);
    });
  }

  useEffect(() => {
    if (stage === "done" && !dispensedSmsSent.current) {
      dispensedSmsSent.current = true;
      const tpl = notificationTemplates.dispensed(patientName);
      showNotification(tpl.title, tpl.body);
    }
    if (stage !== "done") dispensedSmsSent.current = false;
  }, [stage, patientName]);

  function handleDownloadReceipt() {
    downloadReceipt({
      patientName,
      patientPhone,
      doctorName: "Iyer",
      kioskId: "KIOSK-001",
      meds: SAMPLE_MEDS,
    });
  }

  function reset() {
    setStage("upload");
    setPreview(null);
    setAiStep(0);
    setDispenseStep(0);
  }

  return (
    <DashboardShell role="Patient" items={NAV}>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">
            Patient
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-surface md:text-4xl">
            Hello, {patientName.split(" ")[0]}.
          </h1>
        </div>
        {stage !== "upload" && (
          <button
            onClick={reset}
            className="rounded-full bg-card px-4 py-2 text-xs font-medium text-surface shadow-card hover:bg-mint"
          >
            Start over
          </button>
        )}
      </div>

      {stage === "upload" && <UploadView onFile={onFile} />}
      {stage === "processing" && <ProcessingView preview={preview} step={aiStep} />}
      {stage === "result" && <ResultView preview={preview} onConfirm={startDispense} />}
      {stage === "dispense" && <DispenseView step={dispenseStep} />}
      {stage === "done" && (
        <DoneView onReset={reset} onDownload={handleDownloadReceipt} name={patientName} />
      )}

      <PatientChatbot patientName={patientName} meds={SAMPLE_MEDS} status={chatStatus} />
    </DashboardShell>
  );
}

function UploadView({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <div className="animate-fade-up">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
        className={
          "flex min-h-[420px] flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-card p-8 text-center transition " +
          (drag ? "border-amber bg-amber/5" : "border-border")
        }
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-mint">
          <Upload className="h-8 w-8 text-surface" />
        </div>
        <h3 className="text-2xl font-semibold text-surface">Drop your prescription here</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          PDF, JPG or PNG. We&apos;ll read it, verify it, and queue it for doctor approval.
        </p>
        <div className="mt-8 flex gap-3">
          <label className="cursor-pointer rounded-full bg-surface px-6 py-3 text-sm font-medium text-surface-foreground hover:opacity-90">
            Choose file
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-mint px-6 py-3 text-sm font-medium text-surface hover:bg-accent">
            <Camera className="h-4 w-4" />
            Use camera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ProcessingView({ preview, step }: { preview: string | null; step: number }) {
  return (
    <div className="grid animate-fade-up gap-6 md:grid-cols-2">
      <div className="overflow-hidden rounded-3xl bg-card shadow-card">
        {preview && (
          <img src={preview} alt="Prescription" className="h-full max-h-[480px] w-full object-cover" />
        )}
      </div>
      <div className="rounded-3xl bg-card p-8 shadow-card">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber/15 px-3 py-1 text-xs font-medium text-amber">
          <Sparkles className="h-3 w-3" />
          AI processing
        </div>
        <h3 className="text-2xl font-semibold text-surface">Reading your prescription</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Our model is extracting and validating every detail.
        </p>

        <ul className="mt-8 space-y-4">
          {AI_STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s} className="flex items-center gap-4">
                <div
                  className={
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition " +
                    (done
                      ? "bg-success text-success-foreground"
                      : active
                      ? "bg-amber/20 text-amber"
                      : "bg-mint text-muted-foreground")
                  }
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs">{i + 1}</span>
                  )}
                </div>
                <span
                  className={
                    "text-sm transition " +
                    (done || active ? "text-surface" : "text-muted-foreground")
                  }
                >
                  {s}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ResultView({
  preview,
  onConfirm,
}: {
  preview: string | null;
  onConfirm: () => void;
}) {
  return (
    <div className="grid animate-fade-up gap-6 md:grid-cols-[1fr,1.4fr]">
      <div className="overflow-hidden rounded-3xl bg-card shadow-card">
        {preview && <img src={preview} alt="" className="h-full max-h-[480px] w-full object-cover" />}
      </div>
      <div className="rounded-3xl bg-card p-8 shadow-card">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </div>
        <h3 className="text-2xl font-semibold text-surface">Extracted medicines</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Review the details below and send to a doctor for final approval.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-mint/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Dosage</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SAMPLE_MEDS.map((m) => (
                <tr key={m.name} className="bg-card">
                  <td className="px-4 py-3 font-medium text-surface">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.dosage}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.frequency}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={onConfirm}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-surface px-6 py-3.5 text-sm font-semibold text-surface-foreground hover:opacity-90"
        >
          <Send className="h-4 w-4" />
          Confirm &amp; Send to Doctor
        </button>
      </div>
    </div>
  );
}

function DispenseView({ step }: { step: number }) {
  const messages = [
    "Dispensing in progress…",
    "Machine activated…",
    "Medicine delivered ✅",
  ];
  return (
    <div className="flex min-h-[60vh] animate-fade-up flex-col items-center justify-center rounded-3xl gradient-forest p-12 text-center">
      {step === 0 ? (
        <button
          onClick={() => {}}
          className="flex h-56 w-56 items-center justify-center rounded-full gradient-amber text-lg font-semibold text-amber-foreground shadow-glow animate-pulse-ring"
        >
          DISPENSE<br />MEDICINE
        </button>
      ) : (
        <>
          <div className="relative mb-8 flex h-56 w-56 items-center justify-center rounded-full gradient-amber shadow-glow">
            {step < 3 ? (
              <Loader2 className="h-16 w-16 animate-spin text-amber-foreground" />
            ) : (
              <PackageCheck className="h-20 w-20 text-amber-foreground" />
            )}
          </div>
          <h3 className="text-3xl font-semibold text-surface-foreground">
            {messages[step - 1]}
          </h3>
          <div className="mt-6 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={
                  "h-1.5 w-12 rounded-full transition " +
                  (i <= step ? "bg-amber" : "bg-white/15")
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DoneView({
  onReset,
  onDownload,
  name,
}: {
  onReset: () => void;
  onDownload: () => void;
  name: string;
}) {
  return (
    <div className="flex min-h-[60vh] animate-fade-up flex-col items-center justify-center rounded-3xl bg-card p-12 text-center shadow-card">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h3 className="text-3xl font-semibold text-surface">All set, {name.split(" ")[0]}.</h3>
      <p className="mt-3 max-w-md text-muted-foreground">
        Your medicines have been dispensed. A receipt has been sent to your phone.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-amber-foreground shadow-soft transition hover:scale-[1.02]"
        >
          <Download className="h-4 w-4" />
          Download Receipt
        </button>
        <button
          onClick={onReset}
          className="rounded-full bg-surface px-6 py-3 text-sm font-medium text-surface-foreground hover:opacity-90"
        >
          Start a new prescription
        </button>
      </div>
    </div>
  );
}
