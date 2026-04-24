import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import MarkWatchedButton from "@/components/modules/MarkWatchedButton";
import LessonActivityBar from "@/components/modules/LessonActivityBar";
import { moduleCompletion, isModuleAccessible } from "@/lib/utils";
import type { Module, Progress, Resource } from "@/types";

export default async function ModulePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();

  const [{ data: profile }, { data: mod }, { data: progress }, { data: allModules }, { data: moduleResources }, { data: exerciseSub }, { data: allProgress }, { data: allExSubs }] = await Promise.all([
    service.from("profiles").select("role").eq("id", user.id).single(),
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
  const sorted = ((allModules ?? []) as { id: string; order_number: number; meeting_date: string | null; access_mode: "locked" | "open" | "auto" }[])
    .sort((a, b) => a.order_number - b.order_number);
  const modIndex = sorted.findIndex((m) => m.id === params.id);
  const exSubIds = new Set((allExSubs ?? []).map((s: { module_id: string }) => s.module_id));
  const progMap = new Map((allProgress ?? []).map((p: Progress) => [p.module_id, p]));

  if (modIndex !== -1) {
    const prevMod = modIndex > 0 ? sorted[modIndex - 1] : null;
    let prevPct = 100;
    if (prevMod) {
      const pp = progMap.get(prevMod.id);
      prevPct = moduleCompletion(pp ?? null);
    }
    const accessible = isModuleAccessible({
      accessMode: (mod as Module).access_mode,
      meetingDate: (mod as Module).meeting_date,
      isAdmin,
      isFirst: modIndex === 0,
      prevPct,
    });
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

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/modules" className="hover:text-brand-500 transition-colors">מפגשים</Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-slate-600">מפגש {currentMod.order_number}</span>
      </div>

      {/* Header: number + title + progress bar */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-brand-500 bg-brand-50 px-3 py-1 rounded-full">
            מפגש {currentMod.order_number} מתוך 12
          </span>
        </div>
        <h1 className="text-2xl font-bold text-brand-900 leading-snug">{currentMod.title_he}</h1>
        {currentMod.description_he && (
          <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">{currentMod.description_he}</p>
        )}

        {/* Linear progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">התקדמות במפגש</span>
            <span className="text-xs font-semibold text-brand-600">{pct}%</span>
          </div>
          <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Video Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {currentMod.video_url ? (
          <>
            <div className="aspect-video bg-slate-900">
              <iframe
                src={currentMod.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100">
              <div>
                <p className="text-sm font-semibold text-brand-900">סרטון הרצאה</p>
                <p className="text-xs text-slate-400 mt-0.5">צפה וסמן כנצפה לקבלת נקודות</p>
              </div>
              {prog?.video_watched ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                  נצפה
                </span>
              ) : (
                <MarkWatchedButton moduleId={currentMod.id} userId={user.id} />
              )}
            </div>
          </>
        ) : (
          <div className="aspect-video bg-slate-50 flex items-center justify-center">
            <p className="text-slate-400 text-sm">סרטון יתווסף בקרוב</p>
          </div>
        )}
      </div>

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
      <div className="flex justify-between pt-2 border-t border-slate-100">
        {prevModule ? (
          <Link
            href={`/modules/${prevModule.id}`}
            className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-700 font-medium transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            מפגש קודם
          </Link>
        ) : <div />}
        {nextModule && (
          <Link
            href={`/modules/${nextModule.id}`}
            className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-700 font-medium transition-colors"
          >
            מפגש הבא
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
