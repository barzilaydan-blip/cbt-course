import Link from "next/link";
import { Check, ChevronLeft, Lock, FileText, Video, HelpCircle, PenLine, Headphones } from "lucide-react";
import { StatusPill, type SessionStatus } from "@/components/ui/StatusPill";
import { cn } from "@/lib/utils";

export interface ModuleListItemProps {
  id: string;
  order: number;
  title: string;
  description: string | null;
  isAsync: boolean;
  accessible: boolean;
  pct: number;
  /** Shown as a hint under a locked session */
  lockNote: string | null;
  exercisePending: boolean;
  hasExercise: boolean;
  steps: { video: boolean; article: boolean; quiz: boolean; practice: boolean };
}

/** Content types keep their own icon; completion is shown by a check + text, not by colour alone. */
function StepChip({ icon: Icon, label, done }: { icon: typeof Video; label: string; done: boolean }) {
  return (
    <li
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        done ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white text-slate-600 ring-slate-200"
      )}
    >
      {done ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      {label}
      <span className="sr-only">{done ? " — הושלם" : " — טרם הושלם"}</span>
    </li>
  );
}

export default function ModuleListItem(m: ModuleListItemProps) {
  const status: SessionStatus = !m.accessible
    ? "locked"
    : m.pct === 100
    ? "complete"
    : m.pct > 0
    ? "in-progress"
    : "not-started";

  const badge = (() => {
    const base = "w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold";
    if (status === "locked") return <span className={cn(base, "bg-slate-100 text-slate-500")}><Lock className="w-[18px] h-[18px]" aria-hidden="true" /></span>;
    if (status === "complete") return <span className={cn(base, "bg-emerald-600 text-white")}><Check className="w-5 h-5" aria-hidden="true" /></span>;
    if (status === "in-progress") return <span className={cn(base, "bg-brand-500 text-white")} aria-hidden="true">{m.order}</span>;
    return <span className={cn(base, "bg-white text-slate-700 border-2 border-slate-300")} aria-hidden="true">{m.order}</span>;
  })();

  const body = (
    <div className="flex items-start gap-4 p-4 sm:p-5">
      {badge}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500">
          מפגש {m.order}
          {m.isAsync && <span> · הקלטה</span>}
        </p>
        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug mt-0.5">{m.title}</h3>

        {m.description && (
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{m.description}</p>
        )}

        {m.accessible && (
          <ul className="flex flex-wrap gap-2 mt-3" aria-label="שלבי המפגש">
            <StepChip icon={m.isAsync ? Headphones : Video} label="סרטון" done={m.steps.video} />
            <StepChip icon={FileText} label="מאמר" done={m.steps.article} />
            <StepChip icon={HelpCircle} label="חידון" done={m.steps.quiz} />
            <StepChip icon={PenLine} label={m.hasExercise ? "תרגיל" : "תרגול"} done={m.steps.practice} />
          </ul>
        )}

        {!m.accessible && m.lockNote && <p className="text-sm text-slate-600 mt-2">{m.lockNote}</p>}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        {m.accessible && m.exercisePending && <StatusPill status="attention" label="תרגיל ממתין" />}
        <StatusPill status={status} label={status === "in-progress" ? `בתהליך · ${m.pct}%` : undefined} />
        {m.accessible && <ChevronLeft className="w-4 h-4 text-slate-400 mt-1" aria-hidden="true" />}
      </div>
    </div>
  );

  const surface = "block bg-white rounded-xl border shadow-card overflow-hidden";

  if (!m.accessible) {
    return <div className={cn(surface, "border-slate-200 bg-slate-50/60")}>{body}</div>;
  }

  return (
    <Link
      href={`/modules/${m.id}`}
      className={cn(
        surface,
        "transition-shadow hover:shadow-lift",
        m.exercisePending ? "border-amber-300" : "border-slate-200 hover:border-brand-300"
      )}
    >
      {body}
    </Link>
  );
}

/** Full list with a divider before the first recorded (async) session. */
export function ModulesListView({ items }: { items: ModuleListItemProps[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, idx) => {
        const showDivider = item.isAsync && (idx === 0 || !items[idx - 1].isAsync);
        return (
          <li key={item.id} className="space-y-3">
            {showDivider && (
              <div className="flex items-center gap-3 pt-4" role="separator" aria-label="הקלטות ממחזורים קודמים">
                <div className="flex-1 min-w-[1rem] h-px bg-slate-200" />
                <span className="text-sm font-semibold text-slate-700 text-center text-balance min-w-0">
                  מפגשים א-סינכרוניים — הקלטות ממחזורים קודמים
                </span>
                <div className="flex-1 min-w-[1rem] h-px bg-slate-200" />
              </div>
            )}
            <ModuleListItem {...item} />
          </li>
        );
      })}
    </ul>
  );
}
