import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  QrCode, 
  RefreshCcw, 
  Loader2,
  Package
} from "lucide-react";
import { usePayment } from "@/hooks/usePayment";
import { CountdownTimer } from "@/components/CountdownTimer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/payment")({
  component: PaymentPage,
});

function PaymentPage() {
  const { 
    orderData, 
    qrData, 
    paymentStatus, 
    timeLeft, 
    initializePayment, 
    payByCard 
  } = usePayment();
  
  const navigate = useNavigate();

  // For demo/testing purposes, we'll use a dummy ID if none provided
  // In production, this would come from the search params or state
  const prescriptionId = "rx_demo_123";
  const patientId = "patient_demo_123";

  useEffect(() => {
    initializePayment(prescriptionId, patientId);
  }, []);

  if (paymentStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-amber" />
          <p className="mt-4 text-lg font-medium text-surface-foreground/60">Initializing secure payment...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === "paid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-8 text-center animate-in zoom-in-95 duration-500">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-success/20 text-success">
            <CheckCircle2 className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-surface-foreground">Payment Successful!</h1>
            <p className="mt-2 text-xl text-surface-foreground/60">₹{orderData?.amount} received</p>
            <p className="mt-4 text-xs font-mono text-surface-foreground/40 uppercase tracking-widest">
              ID: {orderData?.order_id}
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/patient/dispense" })}
            className="group flex w-full items-center justify-center gap-3 rounded-3xl bg-surface-foreground py-6 text-xl font-bold text-surface transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
          >
            <Package className="h-6 w-6" />
            Collect Your Medicine
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed" || paymentStatus === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-8 text-center animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 text-red-500">
            <XCircle className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-surface-foreground">
              {paymentStatus === "expired" ? "QR Expired" : "Payment Failed"}
            </h1>
            <p className="mt-2 text-lg text-surface-foreground/60">
              {paymentStatus === "expired" 
                ? "The payment session has timed out. Please generate a new QR code." 
                : "Something went wrong with the transaction. Please try again."}
            </p>
          </div>
          <div className="grid gap-4">
            <button
              onClick={() => initializePayment(prescriptionId, patientId)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber py-4 font-bold text-surface transition-all hover:bg-amber/90"
            >
              <RefreshCcw className="h-5 w-5" />
              Generate New QR
            </button>
            <button
              onClick={payByCard}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-surface-foreground transition-all hover:bg-white/10"
            >
              <CreditCard className="h-5 w-5" />
              Try Card Payment
            </button>
            <Link
              to="/patient/profile"
              className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-surface-foreground/40 hover:text-surface-foreground/60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-white/5 bg-surface/30 px-8 py-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              to="/patient/profile"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-surface-foreground transition-all hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-surface-foreground">💊 Complete Payment</h1>
              <p className="text-surface-foreground/50">Prescription approved by Dr. Iyer</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs uppercase tracking-widest text-surface-foreground/30">Total Payable</p>
             <p className="text-4xl font-black text-amber">₹{orderData?.amount}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-12 p-8 lg:grid-cols-2 lg:items-center">
        
        {/* Left: Order Summary */}
        <div className="space-y-8">
           <div className="rounded-[2.5rem] bg-surface/20 p-10 ring-1 ring-white/10">
              <h3 className="mb-8 text-xl font-bold uppercase tracking-widest text-surface-foreground/40">Order Summary</h3>
              <div className="space-y-6">
                 {orderData?.medicines.map((med: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/10 text-amber font-bold">
                             {med.qty}
                          </div>
                          <div>
                             <p className="font-bold text-surface-foreground">{med.name}</p>
                             <p className="text-xs text-surface-foreground/40">₹{med.price} per unit</p>
                          </div>
                       </div>
                       <p className="font-bold text-surface-foreground">₹{med.price * med.qty}</p>
                    </div>
                 ))}
              </div>

              <div className="mt-10 space-y-4 border-t border-white/5 pt-8">
                 <div className="flex items-center justify-between text-surface-foreground/60">
                    <span>Subtotal</span>
                    <span>₹{orderData?.medicines_cost}</span>
                 </div>
                 <div className="flex items-center justify-between text-surface-foreground/60">
                    <span>Service Fee (5%)</span>
                    <span>₹{orderData?.service_fee}</span>
                 </div>
                 <div className="flex items-center justify-between pt-4 text-2xl font-black text-surface-foreground">
                    <span>TOTAL</span>
                    <span className="text-amber">₹{orderData?.amount}</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4 px-6 text-sm text-surface-foreground/40">
              <ShieldCheck className="h-5 w-5 text-success" />
              Secure transaction powered by Razorpay. Your medical data is encrypted.
           </div>
        </div>

        {/* Right: Payment Methods */}
        <div className="flex flex-col items-center">
           <div className="w-full max-w-md space-y-8 rounded-[3rem] bg-white p-12 shadow-2xl">
              <div className="text-center">
                 <h3 className="text-lg font-black uppercase tracking-[0.2em] text-surface">Pay with QR Code</h3>
                 <p className="mt-1 text-sm text-surface/50">Scan with any UPI app</p>
              </div>

              {/* QR Container */}
              <div className="relative aspect-square overflow-hidden rounded-3xl border-4 border-surface/5 p-4 bg-white shadow-inner">
                 {qrData?.qr_image_url ? (
                    <img 
                       src={qrData.qr_image_url} 
                       alt="Payment QR" 
                       className="h-full w-full object-contain"
                    />
                 ) : (
                    <div className="flex h-full w-full items-center justify-center">
                       <Loader2 className="h-10 w-10 animate-spin text-surface/20" />
                    </div>
                 )}
                 {/* Decorative corners */}
                 <div className="absolute inset-0 border-[20px] border-transparent pointer-events-none ring-1 ring-surface/10 rounded-3xl" />
              </div>

              <div className="flex flex-col items-center gap-6">
                 <CountdownTimer seconds={timeLeft} />
                 
                 <div className="flex flex-wrap justify-center gap-3 opacity-40">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4 grayscale" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo.svg" alt="GPay" className="h-4 grayscale" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-3 grayscale" />
                 </div>
              </div>
           </div>

           <div className="mt-12 flex w-full max-w-md flex-col gap-4">
              <div className="relative flex items-center justify-center py-4">
                 <div className="absolute h-[1px] w-full bg-white/5" />
                 <span className="relative bg-background px-4 text-xs font-bold uppercase tracking-widest text-surface-foreground/20">OR</span>
              </div>

              <button 
                onClick={payByCard}
                className="flex items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 py-5 font-bold text-surface-foreground transition-all hover:bg-white/10 active:scale-95"
              >
                 <CreditCard className="h-5 w-5 text-amber" />
                 Pay by Card / Net Banking
              </button>
           </div>
        </div>

      </main>
    </div>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
