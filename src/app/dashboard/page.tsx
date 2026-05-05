import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Lock, PlayCircle, Trophy,
  FileText, Bell, Video, Star,
  AlertTriangle, ChevronLeft,
} from "lucide-react";
import ExerciseFeedbackBanner from "@/components/dashboard/ExerciseFeedbackBanner";
import { moduleCompletion, isModuleAccessible } from "@/lib/utils";
import type { Module, Progress, CourseSettings } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getModuleState(pct: number): "complete" | "in-progress" | "not-started" {
  if (pct === 100) return "complete";
  if (pct > 0) return "in-progress";
  return "not-started";
}

function getInitial(name: string) { return name.trim().charAt(0) || "?"; }

function formatHebrewDate(dateStr: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" })
    .format(new Date(dateStr + "T00:00:00"));
}

// ── Circular progress ring ────────────────────────────────────────────────────
function CircularProgress({ percent }: { percent: number }) {
  const r = 34, size = 88, circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
           style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="7" stroke="#1e293b" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="7" stroke="#3b82f6" fill="none"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-bold text-lg leading-none">{percent}%</span>
        <span className="text-slate-400 text-[10px] mt-0.5">הושלם</span>
      </div>
    </div>
  );
}

// ── Session card ─────────────────────────────────────────────────────────────
function SessionCard({
  mod, pct, href, locked,
}: { mod: Module; pct: number; href: string; locked: boolean }) {
  if (locked) return (
    <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 opacity-40 select-none">
      <div className="w-11 h-11 bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0">
        <Lock className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
          מפגש {mod.order_number}
        </span>
        <p className="font-semibold text-slate-400 truncate mt-0.5">{mod.title_he}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {mod.access_mode === "locked" ? "נעול" : "טרם נפתח"}
          {mod.access_mode === "auto" && mod.meeting_date && ` · יפתח ${new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" }).format(new Date(mod.meeting_date + "T00:00:00"))}`}
        </p>
      </div>
      <Lock className="w-4 h-4 text-slate-600 shrink-0" />
    </div>
  );

  const state = getModuleState(pct);

  if (state === "complete") return (
    <Link href={href}
      className="flex items-center gap-4 bg-slate-800 border border-emerald-500/25 rounded-2xl p-4
                 hover:border-emerald-400/50 hover:shadow-md hover:shadow-emerald-900/30 transition-all group">
      <div className="w-11 h-11 bg-emerald-500/15 border border-emerald-500/35 rounded-xl flex items-center justify-center shrink-0">
        <CheckCircle className="w-5 h-5 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          מפגש {mod.order_number}
        </span>
        <p className="font-semibold text-white truncate mt-0.5">{mod.title_he}</p>
        <p className="text-xs text-emerald-400 mt-0.5">הושלם ✓</p>
      </div>
      <span className="text-emerald-400 font-bold text-sm shrink-0">100%</span>
    </Link>
  );

  if (state === "in-progress") return (
    <Link href={href}
      className="flex items-center gap-4 bg-slate-800 border border-blue-400/50 ring-1 ring-blue-400/10
                 rounded-2xl p-4 shadow-lg shadow-blue-900/20 hover:border-blue-300/65 transition-all">
      <div className="relative w-11 h-11 bg-blue-500/15 border border-blue-400/45 rounded-xl flex items-center justify-center shrink-0">
        <PlayCircle className="w-5 h-5 text-blue-400" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-gray-900 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-semibold text-blue-400/80 bg-blue-400/10 px-2 py-0.5 rounded-full">
            מפגש {mod.order_number}
          </span>
          <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
            ● בתהליך
          </span>
        </div>
        <p className="font-semibold text-white truncate">{mod.title_he}</p>
        <div className="mt-2 bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-l from-blue-400 to-amber-400 h-1.5 rounded-full transition-all duration-700"
               style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-blue-400 font-bold text-sm shrink-0">{pct}%</span>
    </Link>
  );

  return (
    <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 opacity-40 select-none">
      <div className="w-11 h-11 bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0">
        <Lock className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
          מפגש {mod.order_number}
        </span>
        <p className="font-semibold text-slate-400 truncate mt-0.5">{mod.title_he}</p>
      </div>
      <Lock className="w-4 h-4 text-slate-600 shrink-0" />
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  // Phase 1 — profile first (needed for group_id)
  const { data: profile } = await service.from("profiles").select("*").eq("id", user.id).single();
  const groupId = profile?.group_id ?? null;

  // Phase 2 — everything else in parallel (including group leaderboard)
  const [
    { data: modules },
    { data: progressList },
    { data: settings },
    { data: exerciseSubs },
    { data: groupMembers },
  ] = await Promise.all([
    service.from("modules").select("*").eq("is_published", true).order("order_number"),
    service.from("progress").select("*").eq("user_id", user.id),
    service.from("course_settings").select("*").eq("id", 1).maybeSingle(),
    service.from("exercise_submissions").select("id, module_id, status").eq("user_id", user.id),
    groupId
      ? service.from("profiles").select("id, name, total_points").eq("group_id", groupId).eq("role", "student").order("total_points", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const courseSettings = settings as CourseSettings | null;

  const leaderboard = ((groupMembers ?? []) as Array<{ id: string; name: string; total_points: number }>).slice(0, 3);
  const userGroupRank = (groupMembers ?? []).findIndex((m: { id: string }) => m.id === user.id) + 1;

  // Derived data
  const progressMap = new Map<string, Progress>(
    (progressList ?? []).map((p: Progress) => [p.module_id, p])
  );
  const exerciseMap = new Map(
    (exerciseSubs ?? []).map((s: { module_id: string; id: string; status: string }) => [s.module_id, s])
  );

  const allMods = (modules ?? []) as Module[];

  const modPcts = allMods.map((mod, idx) => {
    const prog = progressMap.get(mod.id);
    const hasExercise = mod.order_number === 1 || mod.order_number === 4;
    const effectiveProg = hasExercise
      ? { ...prog, practice_completed: !!exerciseMap.get(mod.id) }
      : prog;
    const pct = moduleCompletion(effectiveProg ?? null);
    const prevPct = idx > 0 ? moduleCompletion((() => {
      const pm = allMods[idx - 1];
      const pp = progressMap.get(pm.id);
      const pe = pm.order_number === 1 || pm.order_number === 4;
      return pe ? { ...pp, practice_completed: !!exerciseMap.get(pm.id) } : pp;
    })() ?? null) : 100;
    const locked = !isModuleAccessible({
      accessMode: mod.access_mode,
      meetingDate: mod.meeting_date,
      isAdmin: false, // dashboard always shows student view
      isFirst: idx === 0,
      prevPct,
    });
    return { mod, pct, locked };
  });

  const completedCount = modPcts.filter(({ pct }) => pct === 100).length;
  const totalMods = allMods.length;
  const overallPct = totalMods > 0 ? Math.round((completedCount / totalMods) * 100) : 0;

  // Next upcoming session from syllabus
  const nextMod = allMods.find((m) => m.meeting_date && m.meeting_date >= today);

  // Exercise banners — only show if the module is accessible (not locked)
  const mod1Entry = modPcts.find(({ mod }) => mod.order_number === 1);
  const mod4Entry = modPcts.find(({ mod }) => mod.order_number === 4);

  const mod1 = mod1Entry?.mod;
  const mod4 = mod4Entry?.mod;

  const mod1Sub = mod1 ? exerciseMap.get(mod1.id) : null;
  const mod4Sub = mod4 ? exerciseMap.get(mod4.id) : null;

  const mod1Accessible = mod1Entry && !mod1Entry.locked;
  const mod4Accessible = mod4Entry && !mod4Entry.locked;

  const mod1Pending = mod1 && mod1Accessible && !mod1Sub;
  const mod4Pending = mod4 && mod4Accessible && !mod4Sub;
  const mod4Reviewed = mod4 && mod4Accessible && mod4Sub?.status === "reviewed";

  // Leaderboard display helpers
  const MEDALS = ["🥇", "🥈", "🥉"];
  const MEDAL_STYLES = [
    { bg: "bg-yellow-500/15", border: "border-yellow-500/35", text: "text-yellow-300", avatarBg: "bg-yellow-500/30" },
    { bg: "bg-slate-700/40",  border: "border-slate-600/50",  text: "text-slate-300",  avatarBg: "bg-slate-600/50" },
    { bg: "bg-amber-900/20",  border: "border-amber-700/30",  text: "text-amber-500",  avatarBg: "bg-amber-800/40" },
  ];

  return (
    <div dir="rtl" className="space-y-8">

      {/* ── Exercise feedback banners ── */}
      {mod4Reviewed && (
        <ExerciseFeedbackBanner
          href={`/modules/${mod4!.id}/practice`}
          submissionId={mod4Sub!.id}
        />
      )}
      {mod4Pending && (
        <Link href={`/modules/${mod4.id}/practice`}
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 hover:border-amber-400/50 transition-colors">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300">יש לך תרגיל קליני שממתין להגשה</p>
            <p className="text-amber-400/70 text-sm mt-0.5">מפגש 4 — לחץ להגשת התרגיל הקליני</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-amber-400 shrink-0" />
        </Link>
      )}
      {mod1Pending && (
        <Link href={`/modules/${mod1!.id}/practice`}
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 hover:border-amber-400/50 transition-colors">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300">טופס ההיכרות עדיין לא מולא</p>
            <p className="text-amber-400/70 text-sm mt-0.5">מפגש 1 — לחץ למילוי טופס ההיכרות הראשוני</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-amber-400 shrink-0" />
        </Link>
      )}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            שלום {profile?.name || "סטודנט"}, המשך למידה נעימה! 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">ברוך הבא ללוח הבקרה שלך</p>
        </div>

        {/* Overall progress ring */}
        <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 shadow-xl shadow-slate-900/50">
          <CircularProgress percent={overallPct} />
          <div>
            <p className="text-xs text-slate-400 mb-0.5">התקדמות כוללת בקורס</p>
            <p className="text-white font-bold text-lg leading-tight">{overallPct}% הושלם</p>
            <p className="text-xs text-blue-400 mt-0.5">{completedCount} מתוך {totalMods} מפגשים הושלמו</p>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

        {/* ── SIDEBAR (RIGHT in RTL) ── */}
        <aside className="space-y-4">

          {/* Course info card */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              מידע על הקורס
            </h2>

            {courseSettings?.zoom_url ? (
              <a href={courseSettings.zoom_url} target="_blank" rel="noopener noreferrer"
                className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 rounded-xl
                           transition-all duration-200 flex items-center justify-center gap-2
                           shadow-lg shadow-blue-500/30 hover:shadow-blue-400/40">
                <Video className="w-4 h-4" />
                הצטרף ל-Zoom
              </a>
            ) : (
              <button disabled
                className="w-full bg-blue-500/30 text-blue-300/50 font-bold py-3 px-4 rounded-xl
                           flex items-center justify-center gap-2 cursor-not-allowed">
                <Video className="w-4 h-4" />
                הצטרף ל-Zoom
              </button>
            )}

            <Link href="/syllabus"
              className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300
                         hover:text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200
                         flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              סילבוס הקורס
            </Link>

            {/* Next session announcement */}
            {nextMod && (
              <div className="border-t border-slate-700 pt-3 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  מפגש קרוב
                </p>
                <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-xs text-blue-200 leading-relaxed">
                    📢 מפגש {nextMod.order_number} —{" "}
                    <span className="font-semibold">{nextMod.title_he}</span>
                    {" "}יתקיים ביום{" "}
                    {courseSettings?.meeting_day_he ?? ""}
                    {" "}{formatHebrewDate(nextMod.meeting_date!)}
                    {courseSettings?.meeting_time && ` בשעה ${courseSettings.meeting_time}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {groupId && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                מובילי הקבוצה
              </h2>

              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((member, i) => {
                    const style = MEDAL_STYLES[i];
                    return (
                      <div key={member.id}
                        className={`flex items-center gap-3 ${style.bg} border ${style.border} rounded-xl px-3 py-2.5`}>
                        <span className="text-base leading-none w-5 text-center shrink-0">{MEDALS[i]}</span>
                        <div className={`w-8 h-8 ${style.avatarBg} rounded-full flex items-center justify-center text-sm font-bold ${style.text} shrink-0`}>
                          {getInitial(member.name)}
                        </div>
                        <p className={`text-sm font-semibold ${style.text} flex-1 min-w-0 truncate`}>
                          {member.name}
                        </p>
                        <span className={`text-sm font-bold ${style.text} shrink-0`}>
                          {member.total_points}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">אין עדיין נתונים לקבוצה</p>
              )}

              {/* User rank */}
              {userGroupRank > 0 && (
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/25 rounded-xl px-3 py-2.5">
                    <span className="text-base w-5 text-center shrink-0">👤</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-300">המיקום שלך: #{userGroupRank}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{profile?.total_points ?? 0} נקודות</p>
                    </div>
                    <span className="text-sm font-bold text-blue-400 shrink-0">
                      {profile?.total_points ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── MAIN — Learning Journey ── */}
        <main className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-400" />
              מפת התקדמות
            </h2>
            <Link href="/modules"
              className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full hover:border-slate-600 transition-colors">
              {totalMods} מפגשים
            </Link>
          </div>

          {/* Session cards with connector */}
          <div className="relative">
            <div className="absolute top-6 bottom-6 right-[1.625rem] w-0.5
                            bg-gradient-to-b from-emerald-500/40 via-blue-400/30 to-slate-700/20 hidden sm:block" />
            <div className="space-y-3 relative">
              {modPcts.map(({ mod, pct, locked }) => (
                <SessionCard key={mod.id} mod={mod} pct={pct} href={`/modules/${mod.id}`} locked={locked} />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />הושלם
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />בתהליך
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />טרם התחיל
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
