import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  seconds: number;
}

export function CountdownTimer({ seconds }: CountdownTimerProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds < 120;
  
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm font-medium transition-colors",
      isUrgent ? "text-red-500 animate-pulse" : "text-surface-foreground/60"
    )}>
      <span className="h-2 w-2 rounded-full bg-current" />
      ⏱ Expires in {mins}:{secs.toString().padStart(2, '0')}
    </div>
  );
}
