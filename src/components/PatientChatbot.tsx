import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

type Med = { name: string; dosage: string; frequency: string; duration: string };
type Msg = { role: "user" | "ai"; text: string };

type Props = {
  patientName: string;
  meds: Med[];
  status: "draft" | "pending" | "approved" | "dispensed";
};

// Simple offline AI: pattern-match on the question + prescription context.
function generateAnswer(q: string, meds: Med[], status: Props["status"]): string {
  const lower = q.toLowerCase();
  const list = meds.map((m) => m.name).join(", ") || "your prescription";

  // Ready / when
  if (/(when|ready|time|how long|wait)/.test(lower)) {
    if (status === "draft") return "Your prescription hasn't been sent for approval yet. Confirm it from the result screen and a doctor will review it within ~5 minutes.";
    if (status === "pending") return "A doctor is reviewing your prescription right now. Approval usually takes 3–8 minutes — you'll get an SMS the moment it's ready.";
    if (status === "approved") return "✅ Already approved! Tap the DISPENSE MEDICINE button to collect from the kiosk.";
    if (status === "dispensed") return "Your medicines were dispensed successfully. A receipt is available for download.";
  }

  // Side effects
  if (/(side effect|reaction|allerg|safe)/.test(lower)) {
    return `Common side effects vary by medicine. For ${list}: mild ones include drowsiness, nausea or stomach upset. Stop use and contact your doctor if you notice rash, difficulty breathing, or swelling.`;
  }

  // What is X for
  for (const m of meds) {
    if (lower.includes(m.name.toLowerCase())) {
      const purpose = describePurpose(m.name);
      return `${m.name} (${m.dosage}, ${m.frequency} for ${m.duration}) is typically prescribed for ${purpose}. Take it ${m.frequency.toLowerCase()} as directed.`;
    }
  }

  if (/(what.*for|purpose|why)/.test(lower)) {
    return meds.length
      ? meds.map((m) => `• ${m.name} — ${describePurpose(m.name)}`).join("\n")
      : "Once your prescription is processed I can explain what each medicine is for.";
  }

  if (/(food|meal|eat|empty stomach)/.test(lower)) {
    return "Most medicines in your prescription are best taken with food to reduce stomach irritation. Your doctor will note any exceptions on approval.";
  }

  if (/(dose|dosage|how much|how often)/.test(lower)) {
    return meds.length
      ? meds.map((m) => `• ${m.name}: ${m.dosage}, ${m.frequency} for ${m.duration}`).join("\n")
      : "Your dosage details will appear here once the prescription is read.";
  }

  if (/(hello|hi|hey)/.test(lower)) {
    return `Hi! I'm your MEDIKIOSK assistant. Ask me anything about ${list} — purpose, dosage, side effects, or when it'll be ready.`;
  }

  return `I'm here to help with your prescription (${list}). Try asking what a medicine is for, possible side effects, or when it'll be ready.`;
}

function describePurpose(name: string): string {
  const map: Record<string, string> = {
    amoxicillin: "treating bacterial infections like throat or ear infections",
    paracetamol: "relieving mild-to-moderate pain and reducing fever",
    "vitamin d3": "supporting bone health and immune function",
    amlodipine: "lowering high blood pressure",
    cetirizine: "relieving seasonal allergy symptoms",
    ibuprofen: "reducing pain, fever, and inflammation",
  };
  return map[name.toLowerCase()] ?? "the condition described by your doctor";
}

export function PatientChatbot({ patientName, meds, status }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text: `Hi ${patientName.split(" ")[0]}! 👋 I'm your MEDIKIOSK assistant. Ask me about your medicines, side effects, or when your order will be ready.`,
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, typing, open]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    const delay = 700 + Math.min(q.length * 18, 1400);
    setTimeout(() => {
      const answer = generateAnswer(q, meds, status);
      setMsgs((m) => [...m, { role: "ai", text: answer }]);
      setTyping(false);
    }, delay);
  }

  const suggestions = [
    "What is this medicine for?",
    "Any side effects?",
    "When will my medicine be ready?",
  ];

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open assistant"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-amber shadow-glow transition hover:scale-105 md:h-16 md:w-16"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber/70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber" />
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed bottom-24 right-4 z-40 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm animate-fade-up flex-col overflow-hidden rounded-3xl bg-card shadow-glow ring-1 ring-border md:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 bg-surface px-5 py-4 text-surface-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-amber">
              <Sparkles className="h-4 w-4 text-amber-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">MEDIKIOSK Assistant</p>
              <p className="text-[11px] text-surface-foreground/60">
                {meds.length} medicine{meds.length === 1 ? "" : "s"} in context
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-surface-foreground/60 hover:bg-white/10 hover:text-surface-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-mint/30 p-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm " +
                  (m.role === "user"
                    ? "ml-auto bg-amber text-amber-foreground"
                    : "bg-card text-surface ring-1 ring-border")
                }
              >
                {m.text.split("\n").map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>
            ))}
            {typing && (
              <div className="max-w-[60%] rounded-2xl bg-card px-4 py-3 text-sm shadow-sm ring-1 ring-border">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
                </span>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {msgs.length <= 1 && (
            <div className="flex flex-wrap gap-2 border-t border-border bg-card px-3 py-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                  }}
                  className="rounded-full bg-mint px-3 py-1 text-[11px] font-medium text-surface hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-border bg-card p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your prescription…"
              className="flex-1 rounded-full border border-border bg-mint/40 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-amber/60"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber text-amber-foreground transition hover:scale-105 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
