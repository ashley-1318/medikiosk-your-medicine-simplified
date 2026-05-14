import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Pill,
  ArrowRight,
  Phone,
  Loader2,
  ShieldCheck,
  User,
  Stethoscope,
  Settings,
  Mail,
} from "lucide-react";
import { setSession } from "@/lib/session";
import { showNotification, notificationTemplates } from "@/lib/notifications";
import { requestNotificationPermission } from "@/lib/fcm";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MEDIKIOSK" },
      { name: "description", content: "Sign in to MEDIKIOSK with your phone or email." },
    ],
  }),
  component: AuthPage,
});

const ROLES = ["Patient", "Doctor", "Admin"] as const;
type Role = (typeof ROLES)[number];

const ROLE_ICONS = { Patient: User, Doctor: Stethoscope, Admin: Settings };

type Step = "phone" | "otp" | "profile";

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [role, setRole] = useState<Role>("Patient");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [activeTab, setActiveTab] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [timer, setTimer] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

  // Timer logic for Resend OTP
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // ── Step 1 (Phone): Send OTP via Backend (Twilio) ──────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    
    try {
      // Bypass for dev
      if (phone === "9999999999") {
        setStep("otp");
        setTimer(60);
        showNotification("Success", "Development bypass active. Use 123456.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setStep("otp");
      setTimer(60); 
      showNotification("Success", "SMS sent successfully!");
    } catch (err: any) {
      console.error("[Auth] OTP send error:", err);
      setError(err?.message ?? "Failed to send SMS.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1 (Email): Send OTP via Backend (Nodemailer) ──────────────────────
  async function handleSendEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/auth/email/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send Email OTP");

      setStep("otp");
      setTimer(300); // 5 minutes
      showNotification("Success", "OTP sent to your email!");
    } catch (err: any) {
      console.error("[Auth] Email OTP send error:", err);
      setError(err?.message ?? "Failed to send email.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 (General): Verify OTP (Handles both Phone and Email) ─────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length < 6) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === "email" ? "/auth/email/verify-otp" : "/auth/verify";
      const body = activeTab === "email" 
        ? { email, otp: code, role: role.toLowerCase() }
        : { phone, code, role: role.toLowerCase() };

      const res = await fetch(`${BACKEND}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Verification failed");

      const jwt = data.jwt || data.token;
      setIsNewUser(!!data.user.is_new_user);
      
      if (!data.user.name) {
        (window as any).__pendingAuth = { jwt, user: data.user };
        setStep("profile");
      } else {
        await finaliseLogin({
          jwt,
          user: data.user,
          role: (data.user.role || role).toLowerCase() === 'admin' ? 'Admin' : 
                (data.user.role || role).toLowerCase() === 'doctor' ? 'Doctor' : 'Patient'
        });
      }
    } catch (err: any) {
      console.error("[Auth] Verify error:", err);
      setError(err?.message ?? "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Save profile (new users only) ─────────────────────────────────
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      const pending = (window as any).__pendingAuth;
      if (!pending) throw new Error("Session lost, please sign in again.");

      await fetch(`${BACKEND}/auth/update-profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pending.jwt}`,
          },
          body: JSON.stringify({ name: name.trim(), role: role.toLowerCase() }),
        },
      );

      await finaliseLogin({
        jwt: pending.jwt,
        user: { ...pending.user, name: name.trim() },
        role,
      });
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function finaliseLogin({
    jwt,
    user,
    role,
  }: {
    jwt: string;
    user: any;
    role: Role;
  }) {
    const rawRole = (user.role ?? role ?? "patient").toLowerCase();

    setSession({
      id: user.id,
      name: user.name ?? name ?? "User",
      phone: user.phone_number ?? (activeTab === 'phone' ? `+91${phone}` : ''),
      email: user.email ?? (activeTab === 'email' ? email : ''),
      role: rawRole as Role,
      jwt,
      address: user.address,
      age: user.age,
      blood_group: user.blood_group,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      allergies: user.allergies,
      conditions: user.conditions,
    });

    if (isNewUser) {
      const tpl = notificationTemplates.welcome(user.name ?? name ?? "User");
      showNotification(tpl.title, tpl.body);
    }

    setTimeout(() => {
      requestNotificationPermission(user.id, async (userId, token) => {
        await fetch(`${BACKEND}/auth/fcm-token`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify({ user_id: userId, fcm_token: token }),
          },
        );
      });
    }, 2000);

    const target = rawRole === "patient" ? "/patient" : rawRole === "doctor" ? "/doctor" : "/admin";
    navigate({ to: target });
  }

  function handleOtp(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-forest px-6 py-12">
      <div className="absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber/20 blur-3xl" />

      <Link
        to="/"
        className="absolute left-6 top-6 flex items-center gap-2 text-surface-foreground/80 transition hover:text-surface-foreground"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-amber">
          <Pill className="h-4 w-4 text-surface" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold tracking-tight">MEDIKIOSK</span>
      </Link>

      <div className="relative w-full max-w-md animate-fade-up rounded-3xl glass p-8 shadow-soft md:p-10">
        {step === "phone" && (
          <div>
            <h1 className="text-balance text-3xl font-semibold leading-tight text-surface-foreground">
              Welcome back.
            </h1>
            <p className="mt-2 text-sm text-surface-foreground/60">
              Sign in to your MEDIKIOSK account.
            </p>

            <div className="mt-8 flex border-b border-white/10">
                <button 
                    onClick={() => { setActiveTab('phone'); setError(""); }}
                    className={`flex-1 pb-4 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'phone' ? 'text-amber border-b-2 border-amber' : 'text-surface-foreground/40 border-b-2 border-transparent'}`}
                >
                    <Phone className="h-4 w-4" />
                    Phone OTP
                </button>
                <button 
                    onClick={() => { setActiveTab('email'); setError(""); }}
                    className={`flex-1 pb-4 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'email' ? 'text-amber border-b-2 border-amber' : 'text-surface-foreground/40 border-b-2 border-transparent'}`}
                >
                    <Mail className="h-4 w-4" />
                    Email OTP
                </button>
            </div>

            <div className="mt-8 inline-flex w-full rounded-full border border-white/15 bg-white/5 p-1">
              {ROLES.map((r) => {
                const Icon = ROLE_ICONS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={
                      "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition " +
                      (role === r
                        ? "bg-amber text-amber-foreground shadow-soft"
                        : "text-surface-foreground/70 hover:text-surface-foreground")
                    }
                  >
                    <Icon className="h-3 w-3" />
                    {r}
                  </button>
                );
              })}
            </div>

            {activeTab === 'phone' ? (
                <form onSubmit={handleSendOtp} className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <label className="mt-6 block">
                        <span className="text-xs font-medium uppercase tracking-wider text-surface-foreground/60">
                            Phone number
                        </span>
                        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-surface-foreground transition focus-within:border-amber/60">
                            <Phone className="h-4 w-4 text-surface-foreground/50" />
                            <span className="text-sm text-surface-foreground/60">+91</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                placeholder="9876543210"
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-surface-foreground/30"
                                required
                            />
                        </div>
                    </label>

                    {error && (
                        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
                            <p>{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3.5 text-sm font-semibold text-amber-foreground shadow-soft transition hover:scale-[1.01] disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>Send OTP <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></>
                        )}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleSendEmailOtp} className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <label className="mt-6 block">
                        <span className="text-xs font-medium uppercase tracking-wider text-surface-foreground/60">
                            Email address
                        </span>
                        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-surface-foreground transition focus-within:border-amber/60">
                            <Mail className="h-4 w-4 text-surface-foreground/50" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-surface-foreground/30"
                                required
                            />
                        </div>
                    </label>

                    {error && (
                        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
                            <p>{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3.5 text-sm font-semibold text-amber-foreground shadow-soft transition hover:scale-[1.01] disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>Send Email OTP <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></>
                        )}
                    </button>
                </form>
            )}
          </div>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-amber/20">
              <ShieldCheck className="h-6 w-6 text-amber" />
            </div>
            <h1 className="text-2xl font-semibold text-surface-foreground">
              Enter verification code
            </h1>
            <p className="mt-2 text-sm text-surface-foreground/60">
              We sent a 6-digit code to {activeTab === 'email' ? email : `+91${phone}`}
            </p>

            <div className="mt-8 grid grid-cols-6 gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  value={d}
                  onChange={(e) => handleOtp(i, e.target.value)}
                  onKeyDown={(e) => handleKey(i, e)}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-14 w-full min-w-0 rounded-xl border border-white/15 bg-white/5 text-center text-lg font-semibold text-surface-foreground outline-none transition focus:border-amber/60 focus:ring-2 focus:ring-amber/30"
                />
              ))}
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3.5 text-sm font-semibold text-amber-foreground shadow-soft transition hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Continue"}
            </button>

            <div className="mt-6 flex justify-center text-xs text-surface-foreground/60">
                {timer > 0 ? (
                    <span>Resend OTP in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
                ) : (
                    <button 
                        type="button" 
                        onClick={activeTab === 'email' ? handleSendEmailOtp : handleSendOtp}
                        className="text-amber hover:underline font-semibold"
                    >
                        Resend OTP
                    </button>
                )}
            </div>

            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="mt-4 w-full text-center text-xs text-surface-foreground/50 hover:text-surface-foreground underline"
            >
              ← Start Over / Change {activeTab === 'email' ? 'Email' : 'Phone'}
            </button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={handleProfileSubmit}>
            <h1 className="text-2xl font-semibold text-surface-foreground">
              One last step 👋
            </h1>
            <p className="mt-2 text-sm text-surface-foreground/60">
              Tell us your name to personalise your experience.
            </p>

            <label className="mt-8 block">
              <span className="text-xs font-medium uppercase tracking-wider text-surface-foreground/60">
                Your name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-surface-foreground outline-none placeholder:text-surface-foreground/30 focus:border-amber/60"
                required
              />
            </label>

            <div className="mt-5 inline-flex w-full rounded-full border border-white/15 bg-white/5 p-1">
              {ROLES.map((r) => {
                const Icon = ROLE_ICONS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={
                      "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition " +
                      (role === r
                        ? "bg-amber text-amber-foreground shadow-soft"
                        : "text-surface-foreground/70 hover:text-surface-foreground")
                    }
                  >
                    <Icon className="h-3 w-3" />
                    {r}
                  </button>
                );
              })}
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3.5 text-sm font-semibold text-amber-foreground shadow-soft transition hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go to Dashboard →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
