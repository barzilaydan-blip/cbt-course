import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { moduleCompletion, isModuleAccessible, getModuleUnlockStatus } from "@/lib/utils";
import { BookOpen, Video, FileText, CheckCircle, MessageSquare, ChevronLeft, AlertTriangle, Lock } from "lucide-react";
import type { Module, Progress, GroupModuleDate } from "@/types";

export default async function ModulesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();
  const [{ data: profile }, { data: modules }, { data: progressList }, { data: exerciseSubs }] = await Promise.all([
    service.from("profiles").select("role, group_id").eq("id", user.id).single(),
    service.from("modules").select("*").eq("is_published", true).order("order_number"),
    service.from("progress").select("*").eq("user_id", user.id),
    service.from("exercise_submissions").select("module_id").eq("user_id", user.id),
  ]);

  const isAdmin = profile?.role === "admin";

  // Fetch group schedule data
  const groupId = profile?.group_id ?? null;
  let courseStartDate: string | null = null;
  let moduleDateOverrides = new Map<string, string>(); // module_id → unlock_date

  if (groupId && !isAdmin) {
    const [{ data: groupData }, { data: overrides }] = await Promise.all([
      service.from("groups").select("course_start_date").eq("id", groupId).single(),
      service.from("group_module_dates").select("module_id, unlock_date").eq("group_id", groupId),
    ]);
    courseStartDate = groupData?.course_start_date ?? null;
    (overrides ?? []).forEach((o: GroupModuleDate) => moduleDateOverrides.set(o.module_id, o.unlock_date));
  }
  const progressMap = new Map<string, Progress>(
    (progressList ?? []).map((p: Progress) => [p.module_id, p])
  );
  const submittedModuleIds = new Set((exerciseSubs ?? []).map((s: { module_id: string }) => s.module_id));
  const allMods = (modules ?? []) as Module[];

  // Pre-calculate pct for each module (needed for sequential unlock check)
  const modPcts = allMods.map((mod) => {
    const prog = progressMap.get(mod.id);
    const hasExercise = mod.order_number === 1 || mod.order_number === 4;
    const effectiveProg = hasExercise ? { ...prog, practice_completed: submittedModuleIds.has(mod.id) } : prog;
    return moduleCompletion(effectiveProg ?? null);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          רשימת מפגשים
        </h1>
        <p className="text-slate-500 mt-1">12 מפגשים — CBT טיפול קוגניטיבי-התנהגותי</p>
      </div>

      <div className="grid gap-4">
        {allMods.map((mod, idx) => {
          const prog = progressMap.get(mod.id);
          const hasExercise = mod.order_number === 1 || mod.order_number === 4;
          const exerciseSubmitted = hasExercise && submittedModuleIds.has(mod.id);
          const exercisePending = mod.order_number === 4 && !exerciseSubmitted;
          const effectiveProg = hasExercise ? { ...prog, practice_completed: exerciseSubmitted } : prog;
          const pct = modPcts[idx];
          const prevPct = idx > 0 ? modPcts[idx - 1] : 100;
          const isComplete = pct === 100;

          // Group-based schedule unlock
          const { unlocked: scheduleUnlocked, unlockDate } = getModuleUnlockStatus(
            mod.order_number,
            courseStartDate,
            moduleDateOverrides.get(mod.id) ?? null,
          );

          const accessible = isAdmin
            ? true
            : mod.access_mode === "open"
            ? true
            : mod.access_mode === "locked"
            ? false
            : scheduleUnlocked || prevPct === 100;

          const cardContent = (
            <div className={`bg-white rounded-xl border transition-all group overflow-hidden ${
              !accessible
                ? "border-slate-200 opacity-60 cursor-not-allowed"
                : exercisePending
                ? "border-amber-300 hover:border-amber-400 hover:shadow-md"
                : "border-slate-200 hover:border-brand-300 hover:shadow-md"
            }`}>
              <div className="flex items-start gap-4 p-5">
                {/* Number / icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                  !accessible
                    ? "bg-slate-100 text-slate-400"
                    : isComplete
                    ? "bg-green-500 text-white"
                    : pct > 0
                    ? "bg-brand-500 text-white"
                    : "bg-brand-50 text-brand-700"
                }`}>
                  {!accessible
                    ? <Lock className="w-5 h-5" />
                    : isComplete
                    ? <CheckCircle className="w-6 h-6" />
                    : mod.order_number}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-base leading-snug">{mod.title_he}</h3>
                    {!accessible && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                        <Lock className="w-3 h-3" />
                        {mod.access_mode === "locked" ? "נעול" : "טרם נפתח"}
                      </span>
                    )}
                    {accessible && exercisePending && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                        תרגיל ממתין
                      </span>
                    )}
                  </div>
                  {mod.description_he && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{mod.description_he}</p>
                  )}

                  {accessible && (
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${prog?.video_watched ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        <Video className="w-3 h-3" />סרטון
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${prog?.article_read ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        <FileText className="w-3 h-3" />מאמר
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${prog?.quiz_completed ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        <CheckCircle className="w-3 h-3" />חידון
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        hasExercise
                          ? exerciseSubmitted ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                          : prog?.practice_completed ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        <MessageSquare className="w-3 h-3" />
                        {hasExercise ? "תרגיל" : "תרגול"}
                      </span>
                    </div>
                  )}

                  {!accessible && unlockDate && (
                    <p className="text-xs text-slate-400 mt-2">
                      ייפתח ב-{new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(unlockDate)}
                    </p>
                  )}
                  {!accessible && !unlockDate && !isAdmin && (
                    <p className="text-xs text-slate-400 mt-2">טרם נקבע תאריך פתיחה</p>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-center gap-1">
                  {accessible && <ProgressRing percent={pct} size={52} />}
                  {accessible && <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />}
                  {!accessible && <Lock className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              <div className="h-1 bg-slate-100">
                <div
                  className={`h-1 transition-all duration-500 ${isComplete ? "bg-green-500" : "bg-brand-500"}`}
                  style={{ width: `${accessible ? pct : 0}%` }}
                />
              </div>
            </div>
          );

          return accessible
            ? <Link key={mod.id} href={`/modules/${mod.id}`}>{cardContent}</Link>
            : <div key={mod.id}>{cardContent}</div>;
        })}
      </div>
    </div>
  );
}
