import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import MarkWatchedButton from "@/components/modules/MarkWatchedButton";
import LessonActivityBar from "@/components/modules/LessonActivityBar";
import PageVisitTracker from "@/components/tracking/PageVisitTracker";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { moduleCompletion, isModuleAccessible, getModuleUnlockStatus } from "@/lib/utils";
import type { Module, Progress, Resource, GroupModuleDate } from "@/types";

export default async function ModulePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();

  const [{ data: profile }, { data: mod }, { data: progress }, { data: allModules }, { data: moduleResources }, { data: exerciseSub }, { data: allProgress }, { data: allExSubs }] = await Promise.all([
    service.from("profiles").select("role, group_id").eq("id", user.id).single(),
    service.from("modules").select("*").eq("id", params.id).single(),
    service.from("progress").select("*").eq("user_id", user.id).eq("module_id", params.id).maybeSingle(),
    service.from("modules").select("id,order_number,meeting_date,access_mode").eq("is_published", true).order("order_number"),
    service.from("resources").select("*").eq("module_id", params.id).eq("is_published", true).order("category"),
    service.from("exercise_submissions").select("status").eq("user_id", user.id).eq("module_id", params.id).maybeSingle(),
    service.from("progress").select("module_id,video_watched,article_read,quiz_completed,practice_completed").eq("user_id", user.id),
    service.from("exercise_submissions").select("module_id").eq("user_id", user.id),
  ]);

  if (!mod) notFound();

  // Access control — redirect students away from locked modules
  const isAdmin = profile?.role === "admin";
  const groupId = profile?.group_id ?? null;

  // Fetch group schedule for non-admins
  let courseStartDate: string | null = null;
  let moduleDateOverrides = new Map<string, string>();
  if (groupId && !isAdmin) {
    const [{ data: groupData }, { data: overrides }] = await Promise.all([
      service.from("groups").select("course_start_date").eq("id", groupId).single(),
      service.from("group_module_dates").select("module_id, unlock_date").eq("group_id", groupId),
    ]);
    courseStartDate = groupData?.course_start_date ?? null;
    ((overrides ?? []) as GroupModuleDate[]).forEach((o) => moduleDateOverrides.set(o.module_id, o.unlock_date));
  }

  const sorted = ((allModules ?? []) as { id: string; order_number: number; meeting_date: string | null; access_mode: "locked" | "open" | "auto" }[])
    .sort((a, b) => a.order_number - b.order_number);
  const modIndex = sorted.findIndex((m) => m.id === params.id);
  const progMap = new Map((allProgress ?? []).map((p: Progress) => [p.module_id, p]));

  if (modIndex !== -1 && !isAdmin) {
    const currentMeta = sorted[modIndex];
    const prevMod = modIndex > 0 ? sorted[modIndex - 1] : null;
    let prevPct = 100;
    if (prevMod) {
      const pp = progMap.get(prevMod.id);
      prevPct = moduleCompletion(pp ?? null);
    }

    const { unlocked: scheduleUnlocked } = getModuleUnlockStatus(
      (mod as Module).order_number,
      courseStartDate,
      moduleDateOverrides.get(params.id) ?? null,
    );

    const accessible =
      currentMeta.access_mode === "open"
        ? true
        : currentMeta.access_mode === "locked"
        ? false
        : modIndex === 0 || scheduleUnlocked || prevPct === 100;

    if (!accessible) redirect("/modules");
  }

  const currentMod = mod as Module;
  const prog = progress as Progress | null;
  const resources = (moduleResources ?? []) as Resource[];

  // Progress calculation (modules 1 & 4: exercise submission counts as practice)
  const effectiveProg = (currentMod.order_number === 1 || currentMod.order_number === 4)
    ? { ...prog, practice_completed: !!exerciseSub }
    : prog;
  const pct = moduleCompletion(effectiveProg ?? null);

  // Previous / Next modules (reuse sorted from access check)
  const prevModule = modIndex > 0 ? sorted[modIndex - 1] : null;
  const nextModule = modIndex < sorted.length - 1 ? sorted[modIndex + 1] : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageVisitTracker moduleId={currentMod.id} />

      {/* Breadcrumb */}
      <nav aria-label="פירורי לחם" className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/modules" className="hover:text-brand-700 underline-offset-4 hover:underline transition-colors">מפגשים</Link>
        <ChevronLeft className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
        <span aria-current="page" className="text-slate-800 font-medium">מפגש {currentMod.order_number}</span>
      </nav>

      {/* Header: number + title + progress bar */}
      <header>
        <p className="eyebrow mb-1.5">
          מפגש {currentMod.order_number} מתוך {sorted.length}
          {currentMod.is_async && " · הקלטה"}
        </p>
        <h1 className="page-title text-balance">{currentMod.title_he}</h1>
        {currentMod.description_he && (
          <p className="page-lead max-w-[68ch] leading-relaxed">{currentMod.description_he}</p>
        )}

        <div className="mt-5 flex items-center gap-3 max-w-md">
          <ProgressBar value={pct} label="התקדמות במפגש" className="flex-1" />
          <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{pct}% הושלם</span>
        </div>
      </header>

      {/* Video Hero */}
      <section aria-label="סרטון המפגש" className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {currentMod.video_url ? (
          <>
            <div className="bg-slate-900">
              {currentMod.video_url.trimStart().startsWith("<") ? (
                /* Full embed HTML (e.g. Vimeo responsive div+iframe) */
                <div
                  dangerouslySetInnerHTML={{ __html: currentMod.video_url }}
                  className="w-full [&>div]:!padding-0 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:h-auto"
                />
              ) : (
                /* Plain URL */
                <div className="aspect-video">
                  <iframe
                    src={currentMod.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
            <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div>
                <p className="font-semibold text-brand-900">סרטון הרצאה</p>
                <p className="text-sm text-slate-600 mt-0.5">צפה וסמן כנצפה לקבלת נקודות</p>
              </div>
              {prog?.video_watched ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 bg-emerald-50 ring-1 ring-inset ring-emerald-200 px-3 py-1.5 rounded-lg">
                  <Check className="w-4 h-4" aria-hidden="true" />
                  נצפה
                </span>
              ) : (
                <MarkWatchedButton moduleId={currentMod.id} userId={user.id} />
              )}
            </div>
          </>
        ) : (
          <div className="aspect-video bg-slate-100 flex items-center justify-center">
            <p className="text-slate-600 text-sm">סרטון יתווסף בקרוב</p>
          </div>
        )}
      </section>

      {/* Activity Bar */}
      <LessonActivityBar
        moduleId={currentMod.id}
        userId={user.id}
        module={currentMod}
        progress={prog}
        exerciseStatus={exerciseSub?.status ?? null}
        resources={resources}
        weeklyChallenge={currentMod.weekly_challenge ?? null}
        weeklyChallengeUrl={currentMod.weekly_challenge_url ?? null}
      />

      {/* Navigation */}
      <nav aria-label="מעבר בין מפגשים" className="grid gap-3 sm:grid-cols-2 pt-2">
        {prevModule ? (
          <Link
            href={`/modules/${prevModule.id}`}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-brand-300 hover:shadow-card transition-all"
          >
            <ChevronRight className="w-5 h-5 text-brand-500 shrink-0" aria-hidden="true" />
            <span>
              <span className="block text-xs text-slate-600">מפגש קודם</span>
              <span className="block font-semibold text-slate-900">מפגש {sorted[modIndex - 1].order_number}</span>
            </span>
          </Link>
        ) : <div />}
        {nextModule && (
          <Link
            href={`/modules/${nextModule.id}`}
            className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-brand-300 hover:shadow-card transition-all"
          >
            <span>
              <span className="block text-xs text-slate-600">מפגש הבא</span>
              <span className="block font-semibold text-slate-900">מפגש {sorted[modIndex + 1].order_number}</span>
            </span>
            <ChevronLeft className="w-5 h-5 text-brand-500 shrink-0" aria-hidden="true" />
          </Link>
        )}
      </nav>
    </div>
  );
}
