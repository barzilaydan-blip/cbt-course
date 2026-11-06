import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { AlertTriangle, CheckCircle2, ChevronLeft, FolderOpen, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

type RawProfile = { id: string; group_id: string | null };

export default async function AdminPage() {
  const service = createServiceClient();

  const [{ data: groups }, { data: profiles }, { data: pendingExercises }, { data: pendingQuestions }] = await Promise.all([
    service.from("groups").select("id, name").order("created_at"),
    service.from("profiles").select("id, group_id").eq("role", "student"),
    service.from("exercise_submissions").select("user_id").eq("status", "submitted"),
    service.from("questions").select("user_id").eq("status", "pending"),
  ]);

  const groupIdByUser = new Map<string, string | null>((profiles ?? []).map((p: RawProfile) => [p.id, p.group_id]));
  const pending = (groups ?? []).map((g: { id: string; name: string }) => ({
    ...g,
    exercises: (pendingExercises ?? []).filter((s: { user_id: string }) => groupIdByUser.get(s.user_id) === g.id).length,
    questions: (pendingQuestions ?? []).filter((q: { user_id: string }) => groupIdByUser.get(q.user_id) === g.id).length,
  })).filter((g) => g.exercises > 0 || g.questions > 0);

  return (
    <div className="space-y-8">
      <PageHeader title="פאנל ניהול" description="ניהול קבוצות, מפגשים ומשאבים" />

      {pending.length > 0 ? (
        <section aria-label="פריטים הממתינים לטיפול" className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            ממתין לטיפולך
          </p>
          <div className="flex flex-wrap gap-2">
            {pending.flatMap((g) => [
              g.exercises > 0 && (
                <Link key={`${g.id}-ex`} href={`/admin/groups/${g.id}?tab=exercises`} className="inline-flex items-center gap-2 min-h-[40px] bg-white border border-amber-300 text-amber-900 text-sm font-semibold px-3.5 rounded-lg hover:bg-amber-100 transition-colors">
                  <span className="bg-amber-700 text-white text-xs font-bold min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center">{g.exercises}</span>
                  {g.name} · תרגילים לבדיקה
                </Link>
              ),
              g.questions > 0 && (
                <Link key={`${g.id}-q`} href={`/admin/groups/${g.id}?tab=chat`} className="inline-flex items-center gap-2 min-h-[40px] bg-white border border-amber-300 text-amber-900 text-sm font-semibold px-3.5 rounded-lg hover:bg-amber-100 transition-colors">
                  <span className="bg-amber-700 text-white text-xs font-bold min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center">{g.questions}</span>
                  {g.name} · שאלות למענה
                </Link>
              ),
            ])}
          </div>
        </section>
      ) : (
        <p className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 ring-1 ring-inset ring-emerald-200 rounded-lg px-4 py-2.5 w-fit">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          אין תרגילים או שאלות שממתינים לטיפול
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
        <Link href="/admin/groups" className="surface p-6 flex items-center gap-4 hover:border-brand-300 transition-colors group">
          <span className="bg-brand-50 text-brand-600 rounded-xl p-3 shrink-0">
            <Users className="w-6 h-6" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-lg text-slate-900">קבוצות</span>
            <span className="block text-sm text-slate-600">לוח זמנים, גישה, נוכחות, תרגילים וחידונים לכל קבוצה</span>
          </span>
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" aria-hidden="true" />
        </Link>

        <Link href="/admin/content" className="surface p-6 flex items-center gap-4 hover:border-brand-300 transition-colors group">
          <span className="bg-teal-50 text-teal-600 rounded-xl p-3 shrink-0">
            <FolderOpen className="w-6 h-6" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-lg text-slate-900">ניהול משאבים</span>
            <span className="block text-sm text-slate-600">עריכת מפגשים והוספת קבצים/שאלונים</span>
          </span>
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
