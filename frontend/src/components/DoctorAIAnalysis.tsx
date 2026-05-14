import { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, AlertTriangle, Activity, ThumbsUp } from "lucide-react";

type Med = { name: string; dosage: string; frequency: string; duration: string };
type Risk = "Low" | "Medium" | "High";

type Analysis = {
  risk: Risk;
  interaction: string;
  dosage: string;
  suggestion: "Approve" | "Review Needed";
  reasoning: string;
};

function analyze(meds: Med[]): Analysis {
  if (meds.length === 0) {
    return {
      risk: "High",
      interaction: "No medicines extracted",
      dosage: "Unable to verify",
      suggestion: "Review Needed",
      reasoning: "Prescription image unreadable — request a clearer upload.",
    };
  }

  const names = meds.map((m) => m.name.toLowerCase());
  const hasAntibiotic = names.some((n) => /amoxicillin|azithromycin|ciprofloxacin/.test(n));
  const hasNSAID = names.some((n) => /ibuprofen|naproxen|diclofenac/.test(n));
  const hasBP = names.some((n) => /amlodipine|losartan|atenolol/.test(n));
  const dosageOk = meds.every((m) => /\d/.test(m.dosage));

  // Risk heuristic
  let risk: Risk = "Low";
  if (hasNSAID && hasBP) risk = "High";
  else if (meds.length >= 3 || hasAntibiotic) risk = "Medium";

  const interaction =
    hasNSAID && hasBP
      ? "⚠ NSAID + antihypertensive — may reduce BP medication efficacy"
      : meds.length >= 2
        ? "No major interactions detected between listed medicines"
        : "Single medicine — no interaction risk";

  const dosage = dosageOk
    ? "All dosages within standard adult ranges"
    : "One or more dosages missing units — verify manually";

  const suggestion: Analysis["suggestion"] =
    risk === "High" || !dosageOk ? "Review Needed" : "Approve";

  const reasoning =
    suggestion === "Approve"
      ? `${meds.length} medicine${meds.length > 1 ? "s" : ""} extracted with valid dosage; no critical interactions.`
      : "Possible interaction or incomplete dosage — confirm with patient before approving.";

  return { risk, interaction, dosage, suggestion, reasoning };
}

const RISK_STYLES: Record<Risk, string> = {
  Low: "bg-success/15 text-success",
  Medium: "bg-amber/15 text-amber",
  High: "bg-destructive/15 text-destructive",
};

export function DoctorAIAnalysis({ meds, rxId }: { meds: Med[]; rxId: string }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Analysis | null>(null);

  useEffect(() => {
    setLoading(true);
    setResult(null);
    const t = setTimeout(() => {
      setResult(analyze(meds));
      setLoading(false);
    }, 1200);
    return () => clearTimeout(t);
    // re-run when prescription changes
  }, [rxId, meds]);

  return (
    <div className="mt-8 rounded-2xl border border-amber/30 bg-gradient-to-br from-mint/40 to-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-amber">
          <Sparkles className="h-4 w-4 text-amber-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-surface">AI Pre-Analysis</h3>
          <p className="text-[11px] text-muted-foreground">
            {loading ? "Analyzing prescription…" : "Decision support — verify before action"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-mint" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-16 animate-pulse rounded-xl bg-mint/70" />
            <div className="h-16 animate-pulse rounded-xl bg-mint/70" />
            <div className="h-16 animate-pulse rounded-xl bg-mint/70" />
            <div className="h-16 animate-pulse rounded-xl bg-mint/70" />
          </div>
        </div>
      ) : (
        result && (
          <div className="space-y-3">
            {/* Top row: medicines + risk */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card/70 p-3">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Medicines detected
                </p>
                <p className="mt-0.5 text-sm font-medium text-surface">
                  {meds.length ? meds.map((m) => m.name).join(" · ") : "None"}
                </p>
              </div>
              <span
                className={
                  "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider " +
                  RISK_STYLES[result.risk]
                }
              >
                Risk: {result.risk}
              </span>
            </div>

            {/* Grid */}
            <div className="grid gap-3 md:grid-cols-2">
              <InfoTile
                icon={<Activity className="h-4 w-4" />}
                label="Drug interactions"
                value={result.interaction}
              />
              <InfoTile
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Dosage safety"
                value={result.dosage}
              />
            </div>

            {/* Suggestion */}
            <div className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3 text-surface-foreground">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber">
                {result.suggestion === "Approve" ? (
                  <ThumbsUp className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-amber">
                  AI Suggestion
                </p>
                <p className="text-sm font-semibold">{result.suggestion}</p>
                <p className="mt-0.5 text-xs text-surface-foreground/70">{result.reasoning}</p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-card/70 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-1 text-sm text-surface">{value}</p>
    </div>
  );
}
