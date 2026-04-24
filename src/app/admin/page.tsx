import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { Settings, Users, BookOpen, ChevronLeft, FolderOpen, MessageCircle, BarChart3, ShieldCheck, ClipboardList, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/Card";
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

  const [{ data: modules }, { data: profiles }, { data: progress }, { data: groups }] =
    await Promise.all([
      service.from("modules").select("*").order("order_number"),
      service.from("profiles").select("id, name, email, role, total_points, group_id, phone, profession"),
      service.from("progress").select("user_id, module_id, points_earned, quiz_completed, practice_completed"),
      service.from("groups").select("*").order("created_at"),
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
    return { group: g, memberCount: members.length, avgPoints, completions };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          פאנל ניהול
        </h1>
        <p className="text-slate-500 mt-1">ניהול קורס, קבוצות ומשאבים</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="bg-brand-50 rounded-xl p-2.5">
            <Users className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">סטודנטים</p>
            <p className="text-xl font-bold text-brand-900">{students.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="bg-purple-50 rounded-xl p-2.5">
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">קבוצות</p>
            <p className="text-xl font-bold text-brand-900">{(groups ?? []).length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="bg-green-50 rounded-xl p-2.5">
            <BookOpen className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">מפגשים</p>
            <p className="text-xl font-bold text-brand-900">{modules?.length ?? 0}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="bg-amber-50 rounded-xl p-2.5">
            <BarChart3 className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">השלמות תרגול</p>
            <p className="text-xl font-bold text-brand-900">
              {(progress ?? []).filter((p: { practice_completed: boolean }) => p.practice_completed).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: "/admin/groups", icon: Users, label: "ניהול קבוצות", desc: "צור קבוצות ושייך סטודנטים", color: "bg-purple-50 text-purple-600" },
          { href: "/admin/approved", icon: ShieldCheck, label: "גישה — מיילים מאושרים", desc: "ייבא מיילים מ-Smoove לאישור גישה", color: "bg-green-50 text-green-600" },
          { href: "/admin/resources", icon: FolderOpen, label: "ניהול משאבים", desc: "העלה קבצים ושאלונים", color: "bg-teal-50 text-teal-600" },
          { href: "/admin/chat", icon: MessageCircle, label: "ניטור צ'אט", desc: "צפה בשיחות הקבוצות", color: "bg-blue-50 text-blue-600" },
          { href: "/admin/exercises", icon: ClipboardList, label: "תרגילים קליניים", desc: "בדוק הגשות ותן משוב לסטודנטים", color: "bg-rose-50 text-rose-600" },
          { href: "/admin/settings", icon: SlidersHorizontal, label: "הגדרות קורס", desc: "Zoom, סילבוס, יום ושעת מפגשים", color: "bg-slate-50 text-slate-600" },
        ].map(({ href, icon: Icon, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:shadow-sm transition-all group"
          >
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Group stats table */}
      {groupStats.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-brand-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            סטטיסטיקה קבוצתית
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">שם קבוצה</th>
                  <th className="px-4 py-3 text-right font-semibold">חברים</th>
                  <th className="px-4 py-3 text-right font-semibold">ממוצע נקודות</th>
                  <th className="px-4 py-3 text-right font-semibold">השלמות תרגול</th>
                  <th className="px-4 py-3 text-right font-semibold">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {groupStats.map(({ group, memberCount, avgPoints, completions }, i) => (
                  <tr key={group.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{group.name}</td>
                    <td className="px-4 py-3 text-slate-600">{memberCount}</td>
                    <td className="px-4 py-3 font-bold text-brand-700">{avgPoints}</td>
                    <td className="px-4 py-3 text-slate-600">{completions}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        group.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {group.is_active ? "פעיל" : "לא פעיל"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modules list */}
      <div>
        <h2 className="text-lg font-bold text-brand-900 mb-4">ניהול מפגשים</h2>
        <div className="grid gap-3">
          {(modules ?? []).map((mod: Module) => (
            <Link
              key={mod.id}
              href={`/admin/modules/${mod.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold shrink-0">
                {mod.order_number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{mod.title_he}</p>
                <div className="flex gap-2 mt-1 text-xs text-slate-400">
                  {mod.video_url && <span>📹 סרטון</span>}
                  {mod.article_url && <span>📄 מאמר</span>}
                  {mod.podcast_url && <span>🎙 פודקאסט</span>}
                  {!mod.video_url && !mod.article_url && !mod.podcast_url && (
                    <span className="text-amber-500">⚠ אין תוכן</span>
                  )}
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                mod.is_published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
              }`}>
                {mod.is_published ? "פעיל" : "טיוטה"}
              </span>
              <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Students table with group filter */}
      <AdminStudentsTable
        students={students}
        groups={(groups ?? []) as Group[]}
        groupMap={groupMap}
      />
    </div>
  );
}
