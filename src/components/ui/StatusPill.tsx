import { CheckCircle2, CircleDashed, CircleDot, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SessionStatus = "complete" | "in-progress" | "not-started" | "locked" | "attention";

const config: Record<SessionStatus, { label: string; className: string; Icon: typeof Lock }> = {
  complete: { label: "הושלם", className: "bg-emerald-50 text-emerald-800 ring-emerald-200", Icon: CheckCircle2 },
  "in-progress": { label: "בתהליך", className: "bg-brand-50 text-brand-700 ring-brand-200", Icon: CircleDot },
  "not-started": { label: "טרם התחלת", className: "bg-slate-100 text-slate-700 ring-slate-200", Icon: CircleDashed },
  locked: { label: "נעול", className: "bg-slate-100 text-slate-600 ring-slate-200", Icon: Lock },
  attention: { label: "דורש פעולה", className: "bg-amber-50 text-amber-800 ring-amber-200", Icon: AlertTriangle },
};

interface StatusPillProps {
  status: SessionStatus;
  /** Override the default Hebrew label, e.g. "בתהליך · 50%" */
  label?: string;
  className?: string;
}

/** Status is always icon + text, never colour alone. */
export function StatusPill({ status, label, className }: StatusPillProps) {
  const { label: defaultLabel, className: tone, Icon } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap",
        tone,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {label ?? defaultLabel}
    </span>
  );
}
