import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import AdminExercisesReviewer from "@/components/admin/AdminExercisesReviewer";
import type { ExerciseSubmission } from "@/types";

export default async function AdminExercisesPage({ searchParams }: { searchParams: { groupId?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: submissions }, { data: groups }] = await Promise.all([
    service
      .from("exercise_submissions")
      .select("*, profiles(name, email, group_id), modules(order_number, title_he)")
      .order("submitted_at", { ascending: false }),
    service.from("groups").select("id, name").order("created_at"),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">תרגילים קליניים והגשות</h1>
        <p className="text-slate-500 mt-1 text-sm">
          טפסי היכרות, תרגילים קליניים — צפה בהגשות וכתוב תגובה לסטודנטים
        </p>
      </div>

      <AdminExercisesReviewer
        submissions={(submissions ?? []) as ExerciseSubmission[]}
        groups={(groups ?? []) as { id: string; name: string }[]}
        initialGroupId={searchParams.groupId ?? null}
      />
    </div>
  );
}
