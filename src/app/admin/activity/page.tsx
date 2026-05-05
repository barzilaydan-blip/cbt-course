import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, ChevronLeft, Clock, Users } from "lucide-react";
import type { Group } from "@/types";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds} שנ'`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} דק'`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours} שע' ${rem} דק'` : `${hours} שע'`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(d);
  const time = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(d);
  return { date, time };
}

type Visit = {
  id: string;
  user_id: string;
  module_id: string;
  entered_at: string;
  exited_at: string | null;
  duration_seconds: number | null;
};

type Profile = { id: string; name: string; group_id: string | null };
type Module  = { id: string; order_number: number; title_he: string };

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { groupId?: string; days?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const filterGroupId = searchParams.groupId ?? "all";
  const filterDays    = Number(searchParams.days ?? 7);

  const since = new Date(Date.now() - filterDays * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: visits }, { data: profiles }, { data: modules }, { data: groups }] = await Promise.all([
    service
      .from("page_visits")
      .select("id, user_id, module_id, entered_at, exited_at, duration_seconds")
      .gte("entered_at", since)
      .order("entered_at", { ascending: false })
      .limit(500),
    service.from("profiles").select("id, name, group_id").eq("role", "student"),
    service.from("modules").select("id, order_number, title_he").order("order_number"),
    service.from("groups").select("*").order("name"),
  ]);

  const profileMap = new Map<string, Profile>((profiles ?? []).map((p: Profile) => [p.id, p]));
  const moduleMap  = new Map<string, Module>((modules ?? []).map((m: Module) => [m.id, m]));

  const allVisits = (visits ?? []) as Visit[];

  const filtered = filterGroupId === "all"
    ? allVisits
    : allVisits.filter((v) => profileMap.get(v.user_id)?.group_id === filterGroupId);

  // Summary stats
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const activeNow = filtered.filter((v) => !v.exited_at && v.entered_at >= twoHoursAgo);
  const uniqueStudents = new Set(filtered.map((v) => v.user_id)).size;
  const withDuration = filtered.filter((v) => v.duration_seconds !== null);
  const avgDuration = withDuration.length > 0
    ? Math.round(withDuration.reduce((s, v) => s + (v.duration_seconds ?? 0), 0) / withDuration.length)
    : null;

  const buildUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams({ groupId: filterGroupId, days: String(filterDays), ...params });
    return `/admin/activity?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-slate-400 hover:text-brand-500 transition-colors">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            מעקב נוכחות — מרחב הלמידה
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">זמני כניסה ושהייה של סטודנטים בכל מפגש</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="bg-green-50 rounded-xl p-2.5">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">פעיל עכשיו</p>
            <p className="text-xl font-bold text-brand-900">{activeNow.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="bg-blue-50 rounded-xl p-2.5">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">סטודנטים ייחודיים</p>
            <p className="text-xl font-bold text-brand-900">{uniqueStudents}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="bg-purple-50 rounded-xl p-2.5">
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">סה"כ כניסות</p>
            <p className="text-xl font-bold text-brand-900">{filtered.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="bg-amber-50 rounded-xl p-2.5">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">ממוצע שהייה</p>
            <p className="text-xl font-bold text-brand-900">{formatDuration(avgDuration)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-500">קבוצה:</span>
          <div className="flex gap-1">
            <Link href={buildUrl({ groupId: "all" })}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filterGroupId === "all" ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              הכל
            </Link>
            {(groups ?? []).map((g: Group) => (
              <Link key={g.id} href={buildUrl({ groupId: g.id })}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filterGroupId === g.id ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {g.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-500">תקופה:</span>
          <div className="flex gap-1">
            {[7, 14, 30, 90].map((d) => (
              <Link key={d} href={buildUrl({ days: String(d) })}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filterDays === d ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {d} ימים
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-900 text-white">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">סטודנט</th>
                <th className="px-4 py-3 text-right font-semibold">קבוצה</th>
                <th className="px-4 py-3 text-right font-semibold">מפגש</th>
                <th className="px-4 py-3 text-right font-semibold">תאריך</th>
                <th className="px-4 py-3 text-right font-semibold">שעת כניסה</th>
                <th className="px-4 py-3 text-right font-semibold">משך שהייה</th>
                <th className="px-4 py-3 text-right font-semibold">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    אין נתונים לתקופה שנבחרה
                  </td>
                </tr>
              )}
              {filtered.map((visit, i) => {
                const student = profileMap.get(visit.user_id);
                const mod     = moduleMap.get(visit.module_id);
                const group   = (groups ?? []).find((g: Group) => g.id === student?.group_id);
                const { date, time } = formatDateTime(visit.entered_at);
                const isActive = !visit.exited_at && visit.entered_at >= twoHoursAgo;

                return (
                  <tr key={visit.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {student?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {group?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {mod ? (
                        <span className="text-slate-700">
                          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded me-1.5">
                            {mod.order_number}
                          </span>
                          {mod.title_he}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs tabular-nums">{date}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs tabular-nums">{time}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 tabular-nums">
                      {isActive ? (
                        <span className="text-green-600 font-semibold">פעיל כעת</span>
                      ) : (
                        formatDuration(visit.duration_seconds)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isActive ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                          מחובר
                        </span>
                      ) : visit.exited_at ? (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                          יצא
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                          לא סגור
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            מציג {filtered.length} כניסות מהימים האחרונים
          </div>
        )}
      </div>
    </div>
  );
}
