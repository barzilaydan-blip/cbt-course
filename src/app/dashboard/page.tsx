import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import ExerciseFeedbackBanner from "@/components/dashboard/ExerciseFeedbackBanner";
import DashboardView, { type SessionVM } from "@/components/dashboard/DashboardView";
import { moduleCompletion, isModuleAccessible } from "@/lib/utils";
import type { Module, Progress, CourseSettings } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatHebrewDate(dateStr: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" })
    .format(new Date(dateStr + "T00:00:00"));
}

/** Reason shown for a locked session, mirroring isModuleAccessible(): auto-mode opens 7 days before the meeting or once the previous session is complete. */
function lockReason(mod: Module): string {
  if (mod.access_mode === "locked") return "המפגש נעול כרגע";
  if (mod.meeting_date) {
    const opens = new Date(mod.meeting_date + "T00:00:00");
    opens.setDate(opens.getDate() - 7);
    const iso = `${opens.getFullYear()}-${String(opens.getMonth() + 1).padStart(2, "0")}-${String(opens.getDate()).padStart(2, "0")}`;
    return `ייפתח ב-${formatHebrewDate(iso)}, או עם השלמת המפגש הקודם`;
  }
  return "ייפתח עם השלמת המפגש הקודם";
}

function AttentionBanner({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 hover:border-amber-400 transition-colors"
    >
      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-semibold text-amber-900">{title}</p>
        <p className="text-amber-800 text-sm mt-0.5">{text}</p>
      </div>
      <ChevronLeft className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
    </Link>
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
    return { mod, pct, locked, effectiveProg };
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

  const banners = (mod4Reviewed || mod4Pending || mod1Pending) ? (
    <>
      {mod4Reviewed && (
        <ExerciseFeedbackBanner
          href={`/modules/${mod4!.id}/practice`}
          submissionId={mod4Sub!.id}
        />
      )}
      {mod4Pending && (
        <AttentionBanner
          href={`/modules/${mod4.id}/practice`}
          title="יש לך תרגיל קליני שממתין להגשה"
          text="מפגש 4 — לחץ להגשת התרגיל הקליני"
        />
      )}
      {mod1Pending && (
        <AttentionBanner
          href={`/modules/${mod1!.id}/practice`}
          title="טופס ההיכרות עדיין לא מולא"
          text="מפגש 1 — לחץ למילוי טופס ההיכרות הראשוני"
        />
      )}
    </>
  ) : null;

  const sessions: SessionVM[] = modPcts.map(({ mod, pct, locked, effectiveProg }) => {
    const hasExercise = mod.order_number === 1 || mod.order_number === 4;
    return {
      id: mod.id,
      order: mod.order_number,
      title: mod.title_he,
      description: mod.description_he,
      pct,
      status: locked ? "locked" : pct === 100 ? "complete" : pct > 0 ? "in-progress" : "not-started",
      isAsync: mod.is_async ?? false,
      href: `/modules/${mod.id}`,
      lockReason: locked ? lockReason(mod) : null,
      steps: [
        { key: "video", label: "סרטון", done: !!effectiveProg?.video_watched },
        { key: "article", label: "מאמר", done: !!effectiveProg?.article_read },
        { key: "quiz", label: "חידון", done: !!effectiveProg?.quiz_completed },
        { key: "practice", label: hasExercise ? "תרגיל" : "תרגול", done: !!effectiveProg?.practice_completed },
      ],
    };
  });

  return (
    <DashboardView
      name={profile?.name || "סטודנט"}
      sessions={sessions}
      completedCount={completedCount}
      overallPct={overallPct}
      banners={banners}
      zoomUrl={courseSettings?.zoom_url ?? null}
      zoomPassword={courseSettings?.zoom_password ?? null}
      nextMeeting={
        nextMod
          ? {
              order: nextMod.order_number,
              title: nextMod.title_he,
              dateText: formatHebrewDate(nextMod.meeting_date!),
              day: courseSettings?.meeting_day_he ?? null,
              time: courseSettings?.meeting_time ?? null,
            }
          : null
      }
      hasGroup={!!groupId}
      leaderboard={leaderboard.map((m) => ({ id: m.id, name: m.name, points: m.total_points }))}
      userRank={userGroupRank}
      userPoints={profile?.total_points ?? 0}
    />
  );
}
