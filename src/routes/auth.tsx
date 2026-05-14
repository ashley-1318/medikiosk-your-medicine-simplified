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
} from "lucide-react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { setSession } from "@/lib/session";
import { showNotification, notificationTemplates } from "@/lib/notifications";
import { requestNotificationPermission } from "@/lib/fcm";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MEDIKIOSK" },
      { name: "description", content: "Sign in to MEDIKIOSK with your phone number." },
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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  // Set up invisible reCAPTCHA on mount
  useEffect(() => {
    if (recaptchaRef.current && !(window as any).__recaptchaVerifier) {
      (window as any).__recaptchaVerifier = new RecaptchaVerifier(
        auth,
        recaptchaRef.current,
        { size: "invisible" },
      );
    }
    return () => {
      // Cleanup on unmount
      (window as any).__recaptchaVerifier = null;
    };
  }, []);

  // ── Step 1: Send OTP via Firebase ─────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    try {
      const fullPhone = `+91${phone}`; // Adjust country code as needed
      const verifier = (window as any).__recaptchaVerifier as RecaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirmationResult(result);
      setStep("otp");
    } catch (err: any) {
      console.error("[Auth] OTP error:", err);
      setError(err?.message ?? "Failed to send OTP. Try again.");
      // Reset reCAPTCHA on failure
      (window as any).__recaptchaVerifier?.clear?.();
      (window as any).__recaptchaVerifier = null;
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP and call backend ───────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length < 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
    if (!confirmationResult) {
      setError("Session expired. Please request OTP again.");
      setStep("phone");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(code);
      const firebaseToken = await userCredential.user.getIdToken();

      // Send to backend for user lookup / creation
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000"}/auth/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: firebaseToken, role }),
        },
      );

      if (!res.ok) throw new Error("Backend verification failed.");

      const data = await res.json();
      const { jwt, user, is_new_user } = data;

      setIsNewUser(!!is_new_user);

      if (is_new_user) {
        // Ask for name before saving session
        setStep("profile");
        // Temporarily store before profile complete
        (window as any).__pendingAuth = { jwt, user, role };
      } else {
        await finaliseLogin({ jwt, user, role: user.role ?? role });
      }
    } catch (err: any) {
      console.error("[Auth] Verify error:", err);
      setError(err?.message ?? "Invalid code. Please try again.");
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

      // PATCH name to backend
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000"}/auth/update-profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pending.jwt}`,
          },
          body: JSON.stringify({ name: name.trim(), role }),
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
    const sessionRole = (user.role ?? role) as Role;

    setSession({
      id: user.id,
      name: user.name ?? name ?? "User",
      phone: user.phone_number ?? `+91${phone}`,
      role: sessionRole,
      jwt,
    });

    // Show welcome notification after login
    if (isNewUser) {
      const tpl = notificationTemplates.welcome(user.name ?? name ?? "User");
      showNotification(tpl.title, tpl.body);
    }

    // Request FCM permission politely after login (not on landing page)
    setTimeout(() => {
      requestNotificationPermission(user.id, async (userId, token) => {
        await fetch(
          `${import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000"}/auth/fcm-token`,
          {
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

    const target =
      sessionRole === "Patient"
        ? "/patient"
        : sessionRole === "Doctor"
          ? "/doctor"
          : "/admin";
    navigate({ to: target });
  }

  // OTP input handlers
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
      {/* Invisible reCAPTCHA container — required by Firebase */}
      <div ref={recaptchaRef} id="recaptcha-container" />

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
        {/* ── STEP 1: Phone Number ────────────────────────────────────────── */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp}>
            <h1 className="text-balance text-3xl font-semibold leading-tight text-surface-foreground">
              Welcome back.
            </h1>
            <p className="mt-2 text-sm text-surface-foreground/60">
              Sign in with your phone number to continue.
            </p>

            {/* Role selector */}
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

            {/* Phone input */}
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

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3.5 text-sm font-semibold text-amber-foreground shadow-soft transition hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <p className="mt-6 text-center text-xs text-surface-foreground/50">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </form>
        )}

        {/* ── STEP 2: OTP Verification ────────────────────────────────────── */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-amber/20">
              <ShieldCheck className="h-6 w-6 text-amber" />
            </div>
            <h1 className="text-2xl font-semibold text-surface-foreground">
              Enter verification code
            </h1>
            <p className="mt-2 text-sm text-surface-foreground/60">
              We sent a 6-digit code to +91{phone}
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

            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="mt-4 w-full text-center text-xs text-surface-foreground/50 hover:text-surface-foreground"
            >
              ← Back to phone number
            </button>
          </form>
        )}

        {/* ── STEP 3: New-user Profile Setup ─────────────────────────────── */}
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

            {/* Role pills locked from OTP step — shown for confirmation only */}
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
