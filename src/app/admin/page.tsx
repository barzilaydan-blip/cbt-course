import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import AdminHomeView from "@/components/admin/AdminHomeView";
import AdminStudentsTable from "@/components/admin/AdminStudentsTable";
import type { Module, Group } from "@/types";

type RawProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  total_points: number;
  group_id: string | null;
  phone: string | null;
  profession: string | null;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const service = createServiceClient();

  const [{ data: modules }, { data: profiles }, { data: progress }, { data: groups }, { data: pendingExercises }, { data: pendingQuestions }] =
    await Promise.all([
      service.from("modules").select("*").order("order_number"),
      service.from("profiles").select("id, name, email, role, total_points, group_id, phone, profession"),
      service.from("progress").select("user_id, module_id, points_earned, quiz_completed, practice_completed"),
      service.from("groups").select("*").order("created_at"),
      service.from("exercise_submissions").select("id").eq("status", "submitted"),
      service.from("questions").select("id").eq("status", "pending"),
    ]);

  const students = (profiles ?? []).filter((p: RawProfile) => p.role === "student");
  const groupMap = new Map<string, Group>((groups ?? []).map((g: Group) => [g.id, g]));

  // Per-group stats
  const groupStats = (groups ?? []).map((g: Group) => {
    const members = students.filter((s: RawProfile) => s.group_id === g.id);
    const avgPoints =
      members.length > 0
        ? Math.round(members.reduce((sum: number, s: RawProfile) => sum + s.total_points, 0) / members.length)
        : 0;
    const memberProgress = (progress ?? []).filter((p: { user_id: string }) =>
      members.some((m: RawProfile) => m.id === p.user_id)
    );
    const completions = memberProgress.filter((p: { practice_completed: boolean }) => p.practice_completed).length;
    return { id: g.id, name: g.name, memberCount: members.length, avgPoints, completions, isActive: g.is_active };
  });

  return (
    <AdminHomeView
      studentsCount={students.length}
      groupsCount={(groups ?? []).length}
      modulesCount={modules?.length ?? 0}
      practiceCompletions={(progress ?? []).filter((p: { practice_completed: boolean }) => p.practice_completed).length}
      pendingExercises={(pendingExercises ?? []).length}
      pendingQuestions={(pendingQuestions ?? []).length}
      groupStats={groupStats}
      modules={(modules ?? []) as Module[]}
      studentsTable={
        <AdminStudentsTable
          students={students}
          groups={(groups ?? []) as Group[]}
          groupMap={groupMap}
        />
      }
    />
  );
}
