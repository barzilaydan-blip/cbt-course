import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string; // accessible name
  tone?: "brand" | "complete";
  className?: string;
}

/** Thin, accessible progress bar. Completion turns green; everything else is brand blue. */
export function ProgressBar({ value, label = "התקדמות", tone, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color = (tone ?? (pct === 100 ? "complete" : "brand")) === "complete" ? "bg-emerald-600" : "bg-brand-500";
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 w-full rounded-full bg-slate-200 overflow-hidden", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
