import { useState, useEffect, useRef } from "react";
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
  Play,
  CheckCircle2,
  XCircle,
  Quote,
  Zap,
  Mic,
  RefreshCw,
  Search,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import CountUpImport from "react-countup";
const CountUp = (CountUpImport as any).default || CountUpImport;


import heroBg from "@/assets/hero-bg.jpg";
import fan1 from "@/assets/fan/step1.png";
import fan2 from "@/assets/fan/step2.png";
import fan3 from "@/assets/fan/step3.png";
import fan4 from "@/assets/fan/step4.png";
import fan5 from "@/assets/fan/step5.png";
import fan6 from "@/assets/fan/step6.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MEDIKIOSK — AI-powered medicine dispensing" },
      {
        name: "description",
        content:
          "Your prescription, verified and dispensed by AI. No queues, no errors — just care.",
      },
    ],
  }),
  component: Landing,
});

// --- Data ---

const stats = [
  { value: 98.7, suffix: "%", label: "AI Accuracy" },
  { value: 30, prefix: "< ", suffix: " sec", label: "Dispense Time" },
  { value: 24, suffix: " / 7", label: "Available" },
];

const features = [
  {
    icon: Search,
    title: "Prescription Verification",
    desc: "AI detects real vs fake prescriptions automatically — 24/7, zero human needed",
  },
  {
    icon: Mic,
    title: "Voice Health Assistant",
    desc: "Ask about your medicines by voice. Get instant personalized answers from your own health records.",
  },
  {
    icon: Stethoscope,
    title: "Smart Doctor Routing",
    desc: "On-call doctor system ensures someone always reviews urgent cases. AI handles the safe ones instantly.",
  },
  {
    icon: RefreshCw,
    title: "Live Inventory Sync",
    desc: "Never dispensed an out-of-stock medicine. Real-time kiosk slot tracking.",
  },
];

const testimonials = [
  {
    text: "MEDIKIOSK reduced our pharmacy queue time by 80% in the first week. The AI prescription reading is incredibly accurate.",
    author: "Dr. Priya Kumar",
    role: "Head Pharmacist, City Hospital Salem",
    accent: true
  },
  {
    text: "I uploaded my prescription at 2 AM and had my medicines in 3 minutes. I didn't know this was even possible.",
    author: "Ravi K.",
    role: "Patient, Salem",
  },
  {
    text: "Managing inventory used to take hours every day. Now the system alerts us automatically. Game changer.",
    author: "Admin Team",
    role: "Government Hospital, Tamil Nadu",
  },
];

const steps = [
  { icon: Upload, title: "Upload", desc: "Snap or upload your prescription in seconds." },
  { icon: Brain, title: "AI Scan", desc: "Our model reads, extracts and validates every line." },
  { icon: Stethoscope, title: "Doctor Approval", desc: "A licensed doctor reviews and approves remotely." },
  { icon: PackageCheck, title: "Dispense", desc: "The kiosk releases your medicine. Done." },
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

const fanSteps = [
  { img: fan1, label: "Upload Prescription", num: "#01" },
  { img: fan2, label: "AI Scanning", num: "#02" },
  { img: fan3, label: "Medicine Extraction", num: "#03" },
  { img: fan4, label: "Doctor Approval", num: "#04" },
  { img: fan5, label: "Payment", num: "#05" },
  { img: fan6, label: "Medicine Dispensed", num: "#06" },
];

// --- Sub-components ---

const SectionHeading = ({ amber, main, light }: { amber?: string, main: React.ReactNode, light?: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="mb-16"
  >
    {amber && <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber">{amber}</p>}
    <h2 className={cn(
      "text-balance text-4xl font-semibold md:text-5xl lg:text-6xl",
      light ? "text-white" : "text-surface"
    )}>
      {main}
    </h2>
  </motion.div>
);

const DemoVideoSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="bg-[#f5f0e8] px-6 py-24 md:py-40 flex flex-col items-center">
      <SectionHeading amber="LIVE DEMO" main="See it in action" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative w-full max-w-5xl aspect-video rounded-[2rem] bg-surface shadow-[0_50px_100px_rgba(0,0,0,0.2)] overflow-hidden border-[12px] border-surface cursor-pointer group"
        onClick={togglePlay}
      >
        {/* Mockup Header */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-surface/50 backdrop-blur-md flex items-center px-4 gap-1.5 z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
        </div>
        
        <video 
          ref={videoRef}
          loop 
          playsInline 
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src="/demo.mp4" type="video/mp4" />
        </video>
        
        <AnimatePresence>
          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-surface/20 backdrop-blur-[2px]"
            >
              <div className="h-24 w-24 rounded-full bg-white/90 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                <Play className="h-10 w-10 text-surface fill-surface ml-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="mt-12 text-lg md:text-xl font-medium text-surface opacity-60">From prescription to medicine in under 2 minutes.</p>
      <button 
        onClick={togglePlay}
        className="mt-8 flex items-center gap-3 text-sm font-black uppercase tracking-widest text-surface hover:text-amber transition-colors group"
      >
        <div className="h-10 w-10 rounded-full border border-surface/20 flex items-center justify-center group-hover:border-amber group-hover:bg-amber group-hover:text-surface transition-all">
          {isPlaying ? <RefreshCw className="h-4 w-4 animate-spin-slow" /> : <Play className="h-4 w-4" />}
        </div>
        {isPlaying ? "Restart Demo" : "Watch Full Demo"}
      </button>
    </section>
  );
};

function Landing() {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  
  return (
    <div className="relative bg-background selection:bg-amber selection:text-surface overflow-x-hidden">
      {/* Background Enhancements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] grayscale bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(26,58,42,0.05)_0%,transparent_100%)]" />
      </div>

      <Navbar />

      {/* HERO */}
      <section className="relative isolate min-h-screen overflow-hidden flex flex-col items-center">
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute inset-0 -z-10"
        >
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/80 to-surface" />
        </motion.div>

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 pt-40 pb-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/90"
          >
            <Sparkles className="h-3 w-3 text-amber animate-pulse" />
            The Future of Pharmacy is here
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-balance text-5xl font-semibold leading-[1.05] text-white md:text-7xl lg:text-8xl"
          >
            Your Prescription. <br />
            <span className="italic text-amber">Verified.</span> Dispensed.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8 max-w-2xl text-balance text-lg text-white/70 md:text-xl lg:text-2xl"
          >
            AI-powered medicine dispensing — no queues, no errors, just care.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 flex flex-col gap-4 sm:flex-row"
          >
            <Link to="/auth" className="group relative flex items-center justify-center gap-2 rounded-full bg-white px-10 py-5 text-sm font-black uppercase tracking-widest text-surface shadow-2xl transition hover:scale-[1.02] active:scale-95 overflow-hidden">
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-amber opacity-0 group-hover:opacity-10 transition-opacity" />
            </Link>
            <a href="#how" className="flex items-center justify-center rounded-full border border-white/20 glass px-10 py-5 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95">
              See how it works
            </a>
          </motion.div>

          {/* ADD 1 — TRUST STATS SECTION */}
          <div className="mt-24 w-full max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-surface/50 backdrop-blur-md rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
              {stats.map((stat, i) => (
                <div key={i} className="bg-surface/30 p-10 flex flex-col items-center justify-center relative group">
                  <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-baseline">
                    <span className="text-2xl opacity-50 mr-1">{stat.prefix}</span>
                    <CountUp end={stat.value} duration={2.5} decimals={stat.value % 1 !== 0 ? 1 : 0} enableScrollSpy scrollSpyOnce />
                    <span className="text-2xl opacity-50 ml-1">{stat.suffix}</span>
                  </div>
                  <p className="text-[10px] font-black text-amber uppercase tracking-[0.3em]">{stat.label}</p>
                  {i < stats.length - 1 && <div className="hidden md:block absolute right-0 top-1/4 bottom-1/4 w-px bg-white/10" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INFINITE MARQUEE SECTION */}
        <div className="relative mt-20 w-full overflow-hidden py-10">
          <div className="absolute top-0 bottom-0 left-0 w-40 bg-gradient-to-r from-surface to-transparent z-10" />
          <div className="absolute top-0 bottom-0 right-0 w-40 bg-gradient-to-l from-surface to-transparent z-10" />
          
          <motion.div 
            className="flex gap-8 items-start w-max px-4"
            animate={{ 
              x: [0, -1728] // Width of one set of cards (260px + 32px gap) * 6
            }}
            transition={{ 
              duration: 40, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            {[...fanSteps, ...fanSteps, ...fanSteps].map((step, idx) => (
              <div 
                key={idx}
                className="w-[280px] shrink-0 group flex flex-col items-center"
              >
                <div className="relative w-full aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover:ring-amber/50 transition-all duration-500">
                  <img src={step.img} alt={step.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-40 group-hover:opacity-20" />
                </div>
                <div className="mt-6 flex flex-col items-center text-center">
                  <span className="text-[10px] font-black text-amber tracking-[0.2em] mb-1">{step.num}</span>
                  <span className="text-[11px] font-bold text-white uppercase tracking-widest whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
                    {step.label}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ADD 2 — VIDEO DEMO SECTION */}
      <DemoVideoSection />

      {/* HOW IT WORKS */}
      <section id="how" className="bg-background px-6 py-24 md:py-40">
        <div className="mx-auto max-w-6xl">
          <SectionHeading amber="PROCESS" main={<>From paper to pill, <br/><span className="italic text-muted-foreground">in four quiet steps.</span></>} />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative flex flex-col rounded-[2.5rem] bg-card p-8 shadow-card transition-all hover:-translate-y-2 hover:shadow-soft border border-border/50"
                >
                  <div className="mb-12 flex items-center justify-between">
                    <span className="text-xs font-black text-amber tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">0{i + 1}</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-surface transition group-hover:bg-amber group-hover:text-surface group-hover:rotate-12">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-surface">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ADD 3 — FEATURES DEEP DIVE SECTION */}
      <section className="bg-[#f5f0e8] px-6 py-24 md:py-40">
        <div className="mx-auto max-w-6xl text-center">
          <SectionHeading amber="WHY MEDIKIOSK" main={<>Built different. <br/> For a reason.</>} />

          <div className="mt-20 grid gap-8 md:grid-cols-2">
            {features.map((f, i) => {
                const Icon = f.icon;
                return (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-start text-left p-10 bg-white rounded-[3rem] shadow-card hover:-translate-y-2 hover:border-amber/30 border border-transparent transition-all group"
                    >
                        <div className="h-14 w-14 rounded-full bg-mint flex items-center justify-center mb-8 shadow-soft group-hover:scale-110 transition-transform">
                            <Icon className="h-7 w-7 text-surface" />
                        </div>
                        <h3 className="text-2xl font-bold text-surface mb-4">{f.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                    </motion.div>
                )
            })}
          </div>
        </div>
      </section>

      {/* ADD 4 — COMPARISON SECTION */}
      <section className="bg-background px-6 py-24 md:py-40 overflow-hidden">
        <div className="mx-auto max-w-5xl text-center">
          <SectionHeading main="The old way. The new way." />

          <div className="mt-20 relative flex flex-col md:flex-row gap-8 items-stretch">
            {/* Old Way */}
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="flex-1 p-10 bg-card/50 rounded-[3rem] border border-border/40 grayscale opacity-60"
            >
              <h4 className="text-xl font-black text-surface/40 uppercase tracking-widest mb-10 flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5" /> The Old Way
              </h4>
              <ul className="space-y-6 text-left">
                {["30-45 minute queue", "Manual prescription reading", "Human errors in dispensing", "Limited pharmacy hours", "Paper records lost easily", "No medicine interaction check"].map(item => (
                  <li key={item} className="flex items-center gap-4 text-sm font-medium text-surface/60">
                    <span className="text-red-500/50">❌</span> {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* VS Divider */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-16 w-16 items-center justify-center rounded-full bg-amber text-surface font-black shadow-glow">
              VS
            </div>

            {/* New Way */}
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="flex-1 p-10 bg-surface rounded-[3rem] shadow-glow border border-amber/20"
            >
              <h4 className="text-xl font-black text-amber uppercase tracking-widest mb-10 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> MEDIKIOSK
              </h4>
              <ul className="space-y-6 text-left">
                {["Under 2 minutes", "AI reads any handwriting", "Zero dispensing errors", "24/7 availability", "Permanent digital records", "Automatic safety validation"].map(item => (
                  <li key={item} className="flex items-center gap-4 text-sm font-bold text-white">
                    <span className="text-success">✅</span> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ADD 5 — TESTIMONIALS SECTION */}
      <section className="bg-[#f5f0e8] px-6 py-24 md:py-40">
        <div className="mx-auto max-w-6xl">
          <SectionHeading amber="STORIES" main="Patients. Doctors. All saying the same thing." />

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                    "relative p-10 bg-white rounded-[3rem] shadow-card flex flex-col",
                    t.accent && "border-l-8 border-amber"
                )}
              >
                <Quote className="h-10 w-10 text-amber opacity-20 mb-6" />
                <p className="text-lg font-medium text-surface leading-relaxed mb-10 flex-1 italic">"{t.text}"</p>
                <div>
                  <p className="font-bold text-surface">{t.author}</p>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="bg-background px-6 py-24 md:py-40">
        <div className="mx-auto max-w-6xl">
          <SectionHeading amber="ROLES" main={<>One kiosk. <br/><span className="italic">Three experiences.</span></>} />

          <div className="grid gap-8 md:grid-cols-3">
            {roles.map((role, i) => {
              const Icon = role.icon;
              return (
                <motion.div
                  key={role.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col rounded-[3rem] bg-card p-10 shadow-card transition-all hover:-translate-y-2 border border-border/40 group"
                >
                  <div className={cn("mb-8 flex h-14 w-14 items-center justify-center rounded-[1.25rem] transition-all group-hover:rotate-6", role.accent)}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-bold text-surface">{role.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">{role.desc}</p>
                  <button className="mt-10 flex items-center gap-2 text-sm font-black text-surface uppercase tracking-widest hover:text-amber transition-colors">
                    Explore Role <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#f5f0e8] px-6 py-24 md:py-40">
        <div className="mx-auto grid max-w-6xl gap-20 md:grid-cols-[1fr,1.5fr]">
          <SectionHeading amber="FAQ" main={<>Questions, <br/><span className="italic">answered.</span></>} />
          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <motion.details
                key={faq.q}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-3xl bg-white p-8 shadow-card open:ring-2 open:ring-amber/30 transition-all"
              >
                <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-surface marker:hidden [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-surface transition group-open:rotate-45 group-open:bg-amber group-open:text-surface">
                    <span className="text-xl">+</span>
                  </div>
                </summary>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ADD 6 — FINAL CTA SECTION */}
      <section className="bg-surface px-6 py-32 md:py-48 text-center relative overflow-hidden">
        {/* Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber/10 blur-[150px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <p className="mb-6 text-xs font-black uppercase tracking-[0.4em] text-amber">READY TO START?</p>
          <h2 className="text-4xl md:text-7xl font-bold text-white mb-8 leading-tight">Your health journey starts with a single upload.</h2>
          <p className="text-lg md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto">No appointments. No queues. Just medicines you can trust.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/auth" className="rounded-full bg-amber px-12 py-5 text-sm font-black uppercase tracking-widest text-surface shadow-glow transition hover:scale-105 active:scale-95">
              Get Started →
            </Link>
            <button className="rounded-full border border-white/20 glass px-12 py-5 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95">
              Watch Demo
            </button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secure</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Instant</span>
            <span className="flex items-center gap-2"><Brain className="h-4 w-4" /> AI-Powered</span>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
