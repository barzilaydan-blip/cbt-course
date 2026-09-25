import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft, CalendarDays, Check, ChevronLeft, FileText, Lock, Trophy, Video,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill, type SessionStatus } from "@/components/ui/StatusPill";
import { cn } from "@/lib/utils";

// ── View-model types (built in dashboard/page.tsx from real data) ────────────
export interface SessionVM {
  id: string;
  order: number;
  title: string;
  description: string | null;
  pct: number;
  status: SessionStatus; // complete | in-progress | not-started | locked
  isAsync: boolean;
  href: string;
  lockReason: string | null;
  steps: { key: string; label: string; done: boolean }[];
}

export interface DashboardViewProps {
  name: string;
  sessions: SessionVM[];
  completedCount: number;
  overallPct: number;
  /** Alert banners (pending exercises, feedback received) rendered above everything */
  banners?: ReactNode;
  zoomUrl: string | null;
  zoomPassword: string | null;
  nextMeeting: { order: number; title: string; dateText: string; day: string | null; time: string | null } | null;
  hasGroup: boolean;
  leaderboard: { id: string; name: string; points: number }[];
  userRank: number; // 0 = not ranked
  userPoints: number;
}

function initial(name: string) {
  return name.trim().charAt(0) || "?";
}

// ── Continue learning ────────────────────────────────────────────────────────
function ContinueCard({ target, allDone, total }: { target: SessionVM | null; allDone: boolean; total: number }) {
  if (allDone) {
    return (
      <section className="surface p-6 sm:p-7 border-r-4 border-r-emerald-600">
        <p className="eyebrow">המשך ללמוד</p>
        <h2 className="text-xl font-bold text-brand-900 mt-1">השלמת את כל {total} המפגשים</h2>
        <p className="text-slate-600 mt-1">אפשר לחזור לכל מפגש כדי לרענן חומרים ולתרגל שוב.</p>
        <Link href="/modules" className="btn-secondary mt-5">
          לרשימת המפגשים
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  if (!target) {
    return (
      <section className="surface p-6 sm:p-7">
        <p className="eyebrow">המשך ללמוד</p>
        <h2 className="text-xl font-bold text-brand-900 mt-1">אין כרגע מפגש פתוח</h2>
        <p className="text-slate-600 mt-1">המפגש הבא ייפתח בהתאם ללוח הזמנים של הקורס. אפשר לעיין בסילבוס בינתיים.</p>
        <Link href="/syllabus" className="btn-secondary mt-5">
          לסילבוס הקורס
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  const started = target.status === "in-progress";
  return (
    <section className="surface p-6 sm:p-7 border-r-4 border-r-brand-500">
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow">{started ? "המשך ללמוד" : "המפגש הבא שלך"}</p>
        {target.isAsync && (
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">הקלטה</span>
        )}
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-brand-900 mt-1 leading-snug text-balance">
        מפגש {target.order} · {target.title}
      </h2>
      {target.description && (
        <p className="text-slate-600 mt-2 line-clamp-2 max-w-2xl">{target.description}</p>
      )}

      <ul className="flex flex-wrap gap-2 mt-4" aria-label="שלבי המפגש">
        {target.steps.map((s) => (
          <li
            key={s.key}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset",
              s.done
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-slate-50 text-slate-700 ring-slate-200"
            )}
          >
            {s.done ? (
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <span className="w-2 h-2 rounded-full border border-slate-400" aria-hidden="true" />
            )}
            {s.label}
            <span className="sr-only">{s.done ? " — הושלם" : " — טרם הושלם"}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-6">
        <Link href={target.href} className="btn-primary px-6">
          {started ? "המשך למפגש" : "התחל את המפגש"}
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        {started && (
          <div className="flex items-center gap-3 min-w-[10rem]">
            <ProgressBar value={target.pct} label={`התקדמות במפגש ${target.order}`} className="w-32" />
            <span className="text-sm font-semibold text-slate-700">{target.pct}%</span>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Progress map ─────────────────────────────────────────────────────────────
function Indicator({ s }: { s: SessionVM }) {
  const base = "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold";
  if (s.status === "complete")
    return (
      <span className={cn(base, "bg-emerald-600 text-white")} aria-hidden="true">
        <Check className="w-5 h-5" />
      </span>
    );
  if (s.status === "in-progress")
    return <span className={cn(base, "bg-brand-500 text-white")} aria-hidden="true">{s.order}</span>;
  if (s.status === "locked")
    return (
      <span className={cn(base, "bg-slate-100 text-slate-500")} aria-hidden="true">
        <Lock className="w-4 h-4" />
      </span>
    );
  return (
    <span className={cn(base, "bg-white text-slate-700 border-2 border-slate-300")} aria-hidden="true">
      {s.order}
    </span>
  );
}

function SessionRow({ s }: { s: SessionVM }) {
  const locked = s.status === "locked";
  const content = (
    <>
      <Indicator s={s} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500">
          מפגש {s.order}
          {s.isAsync && <span> · הקלטה</span>}
        </p>
        <p className={cn("font-semibold leading-snug", locked ? "text-slate-700" : "text-slate-900")}>{s.title}</p>
        {locked && s.lockReason && (
          <p className="text-sm text-slate-600 mt-0.5">{s.lockReason}</p>
        )}
        {s.status === "in-progress" && (
          <ProgressBar value={s.pct} label={`התקדמות במפגש ${s.order}`} className="mt-2 max-w-[16rem] h-1.5" />
        )}
      </div>
      <StatusPill
        status={s.status}
        label={s.status === "in-progress" ? `בתהליך · ${s.pct}%` : undefined}
        className="hidden sm:inline-flex"
      />
      {!locked && <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />}
    </>
  );

  const shared = "flex items-center gap-4 px-4 py-3.5";
  if (locked)
    return <li className={cn(shared, "bg-slate-50/60")}>{content}</li>;

  return (
    <li>
      <Link
        href={s.href}
        className={cn(shared, "hover:bg-brand-50/50 transition-colors focus-visible:outline-offset-[-2px]")}
      >
        {content}
        {/* Status text for small screens where the pill is hidden */}
        <span className="sr-only sm:hidden">
          {s.status === "complete" ? "הושלם" : s.status === "in-progress" ? `בתהליך ${s.pct}%` : "טרם התחלת"}
        </span>
      </Link>
    </li>
  );
}

function ProgressMap({ sessions, completedCount, overallPct }: Pick<DashboardViewProps, "sessions" | "completedCount" | "overallPct">) {
  return (
    <section aria-labelledby="progress-map-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-3">
        <div>
          <h2 id="progress-map-title" className="section-title">מפת ההתקדמות שלי</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {completedCount} מתוך {sessions.length} מפגשים הושלמו
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[16rem]">
          <ProgressBar value={overallPct} label="התקדמות כוללת בקורס" className="flex-1" />
          <span className="text-sm font-bold text-brand-900 w-10 text-end">{overallPct}%</span>
        </div>
      </div>

      <ol className="surface divide-y divide-slate-100 overflow-hidden">
        {sessions.map((s) => (
          <SessionRow key={s.id} s={s} />
        ))}
      </ol>
    </section>
  );
}

// ── Aside ────────────────────────────────────────────────────────────────────
function CourseLinks({ zoomUrl, zoomPassword, nextMeeting }: Pick<DashboardViewProps, "zoomUrl" | "zoomPassword" | "nextMeeting">) {
  return (
    <section className="surface p-5 space-y-4" aria-labelledby="course-links-title">
      <h2 id="course-links-title" className="font-bold text-brand-900">מפגשים חיים וסילבוס</h2>

      {nextMeeting && (
        <div className="flex gap-3 rounded-lg bg-brand-50 px-3.5 py-3">
          <CalendarDays className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-slate-800 leading-relaxed">
            <p className="font-semibold text-brand-900">המפגש הקרוב</p>
            <p>
              מפגש {nextMeeting.order} — {nextMeeting.title}
            </p>
            <p className="text-slate-600">
              {nextMeeting.day ? `יום ${nextMeeting.day}, ` : ""}
              {nextMeeting.dateText}
              {nextMeeting.time ? ` · ${nextMeeting.time}` : ""}
            </p>
          </div>
        </div>
      )}

      {zoomUrl ? (
        <div className="space-y-2">
          <a href={zoomUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
            <Video className="w-4 h-4" aria-hidden="true" />
            הצטרפות ל-Zoom
          </a>
          {zoomPassword && (
            <p className="flex items-center justify-between text-sm rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
              <span className="text-slate-600">סיסמה</span>
              <bdi className="font-bold tracking-wider text-slate-900" dir="ltr">{zoomPassword}</bdi>
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-600 flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
          <Video className="w-4 h-4 shrink-0" aria-hidden="true" />
          קישור ה-Zoom טרם הוגדר
        </p>
      )}

      <Link href="/syllabus" className="btn-secondary w-full">
        <FileText className="w-4 h-4" aria-hidden="true" />
        סילבוס הקורס
      </Link>
    </section>
  );
}

function Leaderboard({ leaderboard, userRank, userPoints }: Pick<DashboardViewProps, "leaderboard" | "userRank" | "userPoints">) {
  return (
    <section className="surface p-5" aria-labelledby="leaderboard-title">
      <h2 id="leaderboard-title" className="font-bold text-brand-900 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-600" aria-hidden="true" />
        מובילי הקבוצה
      </h2>

      {leaderboard.length > 0 ? (
        <ol className="mt-3 space-y-1.5">
          {leaderboard.map((m, i) => (
            <li key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  i === 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                )}
              >
                {i + 1}
              </span>
              <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 text-sm font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                {initial(m.name)}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-800">{m.name}</span>
              <span className="text-sm font-semibold text-slate-700">{m.points}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-slate-600 mt-3">עדיין אין נתונים לקבוצה</p>
      )}

      {userRank > 0 && (
        <p className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-700 flex items-center justify-between">
          <span>המיקום שלך: <bdi className="font-semibold">#{userRank}</bdi></span>
          <span className="text-slate-600">{userPoints} נק׳</span>
        </p>
      )}
    </section>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardView(props: DashboardViewProps) {
  const { name, sessions, completedCount, overallPct, banners, hasGroup } = props;

  const open = sessions.filter((s) => s.status !== "locked");
  // No "last activity" timestamp exists in progress data, so the current session is the
  // first one in progress, otherwise the first open session that has not been completed.
  const target =
    sessions.find((s) => s.status === "in-progress") ??
    open.find((s) => s.status !== "complete") ??
    null;
  const allDone = sessions.length > 0 && completedCount === sessions.length;

  return (
    <div className="space-y-8">
      {banners && <div className="space-y-3">{banners}</div>}

      <header>
        <h1 className="page-title">שלום {name}</h1>
        <p className="page-lead">ברוך הבא ללוח הבקרה — כאן תמצא את המשך הלמידה שלך.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8 min-w-0">
          <ContinueCard target={target} allDone={allDone} total={sessions.length} />
          <ProgressMap sessions={sessions} completedCount={completedCount} overallPct={overallPct} />
        </div>

        <aside className="space-y-5" aria-label="מידע נוסף">
          <CourseLinks zoomUrl={props.zoomUrl} zoomPassword={props.zoomPassword} nextMeeting={props.nextMeeting} />
          {hasGroup && <Leaderboard leaderboard={props.leaderboard} userRank={props.userRank} userPoints={props.userPoints} />}
        </aside>
      </div>
    </div>
  );
}

