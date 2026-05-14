import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Upload,
  Brain,
  Stethoscope,
  PackageCheck,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import heroBg from "@/assets/hero-bg.jpg";
import heroPill from "@/assets/hero-pill.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MEDIKIOSK — AI-powered medicine dispensing" },
      {
        name: "description",
        content:
          "Your prescription, verified and dispensed by AI. No queues, no errors — just care.",
      },
      { property: "og:title", content: "MEDIKIOSK — Your prescription, dispensed." },
      {
        property: "og:description",
        content:
          "AI scans, doctors approve, the kiosk dispenses. Care that's instant and accurate.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Upload,
    title: "Upload",
    desc: "Snap or upload your prescription in seconds.",
  },
  {
    icon: Brain,
    title: "AI Scan",
    desc: "Our model reads, extracts and validates every line.",
  },
  {
    icon: Stethoscope,
    title: "Doctor Approval",
    desc: "A licensed doctor reviews and approves remotely.",
  },
  {
    icon: PackageCheck,
    title: "Dispense",
    desc: "The kiosk releases your medicine. Done.",
  },
];

const roles = [
  {
    icon: User,
    title: "Patient",
    desc: "Upload, get verified, walk away with your meds — all in under a minute.",
    accent: "bg-amber/15 text-amber",
  },
  {
    icon: Stethoscope,
    title: "Doctor",
    desc: "Review extracted prescriptions remotely. Approve or reject with one tap.",
    accent: "bg-success/15 text-success",
  },
  {
    icon: ShieldCheck,
    title: "Admin",
    desc: "Manage inventory, monitor machines, and audit every dispense.",
    accent: "bg-mint text-surface",
  },
];

const faqs = [
  {
    q: "How accurate is the AI prescription scan?",
    a: "Our model is trained on millions of prescriptions and achieves over 99% accuracy on medicine name and dosage extraction. Every result is also reviewed by a licensed doctor before dispense.",
  },
  {
    q: "Is my prescription data secure?",
    a: "Yes. All uploads are encrypted end-to-end and stored in HIPAA-compliant infrastructure. Only authorized doctors can view your data.",
  },
  {
    q: "What if a medicine isn't in stock?",
    a: "The kiosk will instantly notify you and route you to the nearest stocked location, or place a same-day delivery order.",
  },
  {
    q: "Can I use MEDIKIOSK without an internet connection?",
    a: "An internet connection is required for AI scanning and doctor approval. The kiosk caches your verified prescription so dispense works even on intermittent connectivity.",
  },
];

function Landing() {
  return (
    <div className="bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative isolate min-h-screen overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroBg}
            alt=""
            width={1920}
            height={1280}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/60 to-surface" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-surface-foreground/80">
            <Sparkles className="h-3 w-3 text-amber" />
            AI-powered care, instantly
          </div>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] text-surface-foreground md:text-7xl lg:text-[5.5rem]">
            Your Prescription. <br />
            <span className="italic text-amber">Verified.</span> Dispensed.
          </h1>
          <p className="mt-8 max-w-xl text-balance text-lg text-surface-foreground/70 md:text-xl">
            AI-powered medicine dispensing — no queues, no errors, just care.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="group flex items-center justify-center gap-2 rounded-full bg-surface-foreground px-8 py-4 text-sm font-semibold text-surface shadow-soft transition hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="flex items-center justify-center rounded-full glass px-8 py-4 text-sm font-medium text-surface-foreground transition hover:bg-white/10"
            >
              See how it works
            </a>
          </div>

          <div className="relative mt-20 w-full max-w-md animate-float">
            <div className="absolute inset-0 -z-10 rounded-full bg-amber/30 blur-3xl" />
            <img
              src={heroPill}
              alt="Glowing capsule held by a hand"
              width={1024}
              height={1024}
              className="mx-auto w-full rounded-3xl object-cover ring-1 ring-white/10"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-background px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-amber">
              How it works
            </p>
            <h2 className="text-balance text-4xl font-semibold text-surface md:text-5xl">
              From paper to pill, <br />
              <span className="italic text-muted-foreground">in four quiet steps.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="group relative flex flex-col rounded-3xl bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="mb-12 flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      0{i + 1}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-surface transition group-hover:bg-amber group-hover:text-surface">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-surface">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="bg-mint/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-amber">
              Built for everyone
            </p>
            <h2 className="text-balance text-4xl font-semibold text-surface md:text-5xl">
              One kiosk. <span className="italic">Three experiences.</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.title}
                  className="flex flex-col rounded-3xl bg-card p-8 shadow-card transition hover:-translate-y-1"
                >
                  <div
                    className={
                      "mb-6 flex h-12 w-12 items-center justify-center rounded-2xl " +
                      role.accent
                    }
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-semibold text-surface">{role.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {role.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-background px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr,1.5fr]">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-amber">
              FAQ
            </p>
            <h2 className="text-balance text-4xl font-semibold text-surface md:text-5xl">
              Questions, <span className="italic">answered.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl bg-card p-6 shadow-card open:bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-surface marker:hidden [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="ml-4 text-amber transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
