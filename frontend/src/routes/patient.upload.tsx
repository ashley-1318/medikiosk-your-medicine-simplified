import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}
import {
  Upload,
  Camera,
  CheckCircle2,
  Loader2,
  Sparkles,
  Send,
  PackageCheck,
  Download,
  CreditCard,
  QrCode,
  IndianRupee,
  Clock,
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import { PatientChatbot } from "@/components/PatientChatbot";
import { getSession } from "@/lib/session";
import { showNotification, notificationTemplates } from "@/lib/notifications";
import { downloadReceipt } from "@/lib/receipt";
import { usePayment } from "@/hooks/usePayment";
import { cn } from "@/lib/utils";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

export const Route = createFileRoute("/patient/upload")({
  head: () => ({
    meta: [{ title: "Patient — MEDIKIOSK" }],
  }),
  component: PatientDashboard,
});

type Stage = "upload" | "processing" | "result" | "payment" | "dispense" | "done";

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
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  
  const [session, setSession] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const {
    orderData,
    qrData,
    paymentStatus,
    timeLeft,
    initializePayment,
    payByCard
  } = usePayment();

  useEffect(() => {
    setSession(getSession());
    setIsMounted(true);
    
    // Load Razorpay Script
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (paymentStatus === 'paid' && stage === 'payment') {
      showNotification("Payment Successful", "Your medicines are being prepared.");
      startDispense();
    }
  }, [paymentStatus, stage]);

  const patientName = session?.name ?? "User";
  const patientPhone = session?.phone ?? "";
  const dispensedSmsSent = useRef(false);

  const chatStatus: "draft" | "pending" | "approved" | "dispensed" =
    stage === "upload" || stage === "processing"
      ? "draft"
      : stage === "result" || stage === "payment"
        ? "pending"
        : stage === "dispense"
          ? "approved"
          : "dispensed";

  const [extractedMeds, setExtractedMeds] = useState<any[]>([]);

  async function onFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setStage("processing");
    setAiStep(0);

    const interval = setInterval(() => {
      setAiStep((s) => (s < 3 ? s + 1 : s));
    }, 1500);

    try {
      const formData = new FormData();
      formData.append("prescription", file);
      formData.append("patient_id", session?.id || "");

      const res = await fetch(`${BACKEND}/ai/process-prescription`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(interval);

      if (data.success) {
        setAiStep(4);
        setPrescriptionId(data.prescription.id);
        setExtractedMeds(data.extracted_data || []);
        setTimeout(() => setStage("result"), 800);
      } else {
        throw new Error(data.error || "Processing failed");
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error("[Prescription] Upload error:", err);
      showNotification("Error", err.message || "Failed to process prescription. Please try again.");
      setStage("upload");
    }
  }

  async function handleConfirmResult() {
    if (!prescriptionId || !session?.id) return;
    setStage("payment");
    initializePayment(prescriptionId, session.id);
  }

  async function startDispense() {
    const tpl = notificationTemplates.newPrescription(patientName);
    showNotification(tpl.title, tpl.body);
    setStage("dispense");
    setDispenseStep(0);

    [1, 2, 3].forEach((i) => {
      setTimeout(() => {
        setDispenseStep(i);
        if (i === 3) {
          setTimeout(async () => {
            setStage("done");
            if (session?.id) {
              try {
                await fetch(`${BACKEND}/notifications/send`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    trigger: "dispensed",
                    user_id: session.id,
                    name: patientName,
                    date_time: new Date().toLocaleString("en-IN"),
                  }),
                });
              } catch (err) {
                console.error("[Dispense] Notification error:", err);
              }
            }
          }, 1200);
        }
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
      meds: extractedMeds.length ? extractedMeds : SAMPLE_MEDS,
    });
  }

  function reset() {
    setStage("upload");
    setPreview(null);
    setAiStep(0);
    setDispenseStep(0);
    setPrescriptionId(null);
  }

  if (!isMounted) return null;

  return (
    <div className="animate-fade-in">
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
      {stage === "result" && (
        <ResultView preview={preview} meds={extractedMeds} onConfirm={handleConfirmResult} />
      )}
      {stage === "payment" && (
        <PaymentView 
          status={paymentStatus}
          orderData={orderData}
          qrData={qrData}
          timeLeft={timeLeft}
          onPayCard={payByCard}
        />
      )}
      {stage === "dispense" && <DispenseView step={dispenseStep} />}
      {stage === "done" && (
        <DoneView 
          onReset={reset} 
          onDownload={handleDownloadReceipt} 
          name={patientName} 
          meds={extractedMeds} 
        />
      )}

      <PatientChatbot patientName={patientName} meds={extractedMeds.length ? extractedMeds : SAMPLE_MEDS} status={chatStatus} />
    </div>
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
      <div className="overflow-hidden rounded-3xl bg-card shadow-card border border-border">
        {preview && (
          <img src={preview} alt="Prescription" className="h-full max-h-[480px] w-full object-cover" />
        )}
      </div>
      <div className="rounded-3xl bg-card p-8 shadow-card border border-border">
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
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ",
                    done
                      ? "bg-success text-success-foreground"
                      : active
                      ? "bg-amber/20 text-amber"
                      : "bg-mint text-muted-foreground"
                  )}
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
                  className={cn(
                    "text-sm transition ",
                    done || active ? "text-surface" : "text-muted-foreground"
                  )}
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
  meds,
  onConfirm,
}: {
  preview: string | null;
  meds: any[];
  onConfirm: () => void;
}) {
  const displayMeds = meds.length ? meds : SAMPLE_MEDS;

  return (
    <div className="grid animate-fade-up gap-6 md:grid-cols-[1fr,1.4fr]">
      <div className="overflow-hidden rounded-3xl bg-card shadow-card border border-border">
        {preview && <img src={preview} alt="" className="h-full max-h-[480px] w-full object-cover" />}
      </div>
      <div className="rounded-3xl bg-card p-8 shadow-card border border-border">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </div>
        <h3 className="text-2xl font-semibold text-surface">Extracted medicines</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {displayMeds.length > 0 
            ? "Review the details below. Once confirmed, you can proceed to payment and dispensing."
            : "We couldn't detect any medicines clearly. You can still proceed to payment (minimum fee) or try a clearer photo."}
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
              {displayMeds.length > 0 ? (
                displayMeds.map((m, i) => (
                  <tr key={i} className="bg-card">
                    <td className="px-4 py-3 font-medium text-surface">{m.medicine_name || m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.dosage}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.frequency}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.duration}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No medicines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={onConfirm}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-surface px-6 py-3.5 text-sm font-semibold text-surface-foreground hover:opacity-90"
        >
          <Send className="h-4 w-4" />
          {displayMeds.length > 0 ? "Confirm & Proceed to Payment" : "Proceed Anyway (Min. Fee)"}
        </button>
      </div>
    </div>
  );
}

function PaymentView({ 
  status, 
  orderData, 
  qrData, 
  timeLeft, 
  onPayCard 
}: { 
  status: string; 
  orderData: any; 
  qrData: any; 
  timeLeft: number;
  onPayCard: () => void;
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-card p-12 text-center border border-border">
        <Loader2 className="h-12 w-12 animate-spin text-amber mb-4" />
        <h3 className="text-xl font-semibold text-surface">Initialising Payment</h3>
        <p className="text-sm text-muted-foreground">Generating order and QR code...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-card p-12 text-center border border-border">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold text-surface">Payment Failed</h3>
        <p className="text-sm text-muted-foreground mb-6">Something went wrong while creating your order.</p>
        <button onClick={() => window.location.reload()} className="rounded-full bg-surface px-6 py-3 text-sm font-medium text-surface-foreground">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="grid animate-fade-up gap-8 lg:grid-cols-2">
      {/* Order Summary */}
      <div className="rounded-3xl bg-card p-8 shadow-card border border-border">
        <h3 className="text-xl font-semibold text-surface flex items-center gap-2 mb-6">
          <CreditCard className="h-5 w-5 text-amber" />
          Order Summary
        </h3>
        
        <div className="space-y-4">
          {orderData?.medicines?.map((m: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{m.name} x {m.qty}</span>
              <span className="font-medium text-surface">₹{(m.price * m.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-4 border-t border-border flex justify-between text-sm">
            <span className="text-muted-foreground">Service Fee (5%)</span>
            <span className="font-medium text-surface">₹{orderData?.service_fee?.toFixed(2)}</span>
          </div>
          <div className="pt-4 border-t-2 border-dashed border-border flex justify-between">
            <span className="text-lg font-bold text-surface">Total Amount</span>
            <span className="text-2xl font-bold text-amber">₹{orderData?.amount?.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Payment Methods</p>
          <button 
            onClick={onPayCard}
            className="flex w-full items-center justify-between rounded-2xl bg-mint/40 p-4 transition hover:bg-mint"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-surface p-2.5">
                <CreditCard className="h-5 w-5 text-surface-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-surface">Credit / Debit Card</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Powered by Razorpay</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-4 rounded-2xl border border-border p-4 opacity-50 grayscale cursor-not-allowed">
            <div className="rounded-xl bg-background p-2.5">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-surface">Cash at Counter</p>
              <p className="text-[10px] text-muted-foreground">Visit help desk</p>
            </div>
          </div>
        </div>
      </div>

      {/* UPI / QR Section */}
      <div className="rounded-3xl bg-card p-8 shadow-card border border-border text-center flex flex-col items-center justify-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
          <QrCode className="h-3 w-3" />
          Scan to Pay
        </div>
        
        <div className="relative p-4 rounded-3xl bg-white mb-6">
          {qrData?.qr_image_url ? (
            <img src={qrData.qr_image_url} alt="Payment QR" className="w-64 h-64 mx-auto" />
          ) : (
            <div className="w-64 h-64 bg-background flex flex-col items-center justify-center rounded-2xl p-6 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-surface">QR Code Unavailable</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                UPI QR is currently disabled for this account. Please use the **Card Payment** option.
              </p>
            </div>
          )}
          <div className="absolute inset-0 border-2 border-amber/20 rounded-3xl pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="h-4 w-4 text-amber" />
          <span>QR expires in <span className="font-bold text-surface">{formatTime(timeLeft)}</span></span>
        </div>
        
        <p className="text-xs text-muted-foreground max-w-[240px]">
          Open any UPI app (GPay, PhonePe, Paytm) and scan the code to complete payment.
        </p>

        <div className="mt-8 pt-8 border-t border-border w-full">
          <div className="flex items-center justify-center gap-4">
            <ShieldCheck className="h-5 w-5 text-success" />
            <span className="text-xs font-medium text-surface uppercase tracking-widest">Secure 256-bit SSL Encrypted</span>
          </div>
        </div>
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
    <div className="flex min-h-[60vh] animate-fade-up flex-col items-center justify-center rounded-3xl gradient-forest p-12 text-center border border-border">
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
  meds,
}: {
  onReset: () => void;
  onDownload: () => void;
  name: string;
  meds: any[];
}) {
  return (
    <div className="flex min-h-[60vh] animate-fade-up flex-col items-center justify-center rounded-3xl bg-card p-12 text-center shadow-card border border-border">
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

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
