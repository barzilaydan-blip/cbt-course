import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { moduleCompletion, getModuleUnlockStatus } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { ModulesListView, type ModuleListItemProps } from "@/components/modules/ModuleListItem";
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
  const moduleDateOverrides = new Map<string, string>(); // module_id → unlock_date

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

  const items: ModuleListItemProps[] = allMods.map((mod, idx) => {
    const prog = progressMap.get(mod.id);
    const hasExercise = mod.order_number === 1 || mod.order_number === 4;
    const exerciseSubmitted = hasExercise && submittedModuleIds.has(mod.id);
    const exercisePending = mod.order_number === 4 && !exerciseSubmitted;
    const pct = modPcts[idx];
    const prevPct = idx > 0 ? modPcts[idx - 1] : 100;

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

    let lockNote: string | null = null;
    if (!accessible) {
      if (mod.access_mode === "locked") lockNote = "המפגש נעול כרגע";
      else if (unlockDate)
        lockNote = `ייפתח ב-${new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(unlockDate)}, או עם השלמת המפגש הקודם`;
      else lockNote = "טרם נקבע תאריך פתיחה";
    }

    return {
      id: mod.id,
      order: mod.order_number,
      title: mod.title_he,
      description: mod.description_he,
      isAsync: mod.is_async ?? false,
      accessible,
      pct,
      lockNote,
      exercisePending,
      hasExercise,
      steps: {
        video: !!prog?.video_watched,
        article: !!prog?.article_read,
        quiz: !!prog?.quiz_completed,
        practice: hasExercise ? exerciseSubmitted : !!prog?.practice_completed,
      },
    };
  });

  const asyncCount = allMods.filter((m) => m.is_async).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="רשימת מפגשים"
        description={
          asyncCount > 0
            ? `${allMods.length} מפגשים, מתוכם ${asyncCount} הקלטות א-סינכרוניות — קורס CBT`
            : `${allMods.length} מפגשים — קורס CBT`
        }
      />
      <ModulesListView items={items} />
    </div>
  );
}
