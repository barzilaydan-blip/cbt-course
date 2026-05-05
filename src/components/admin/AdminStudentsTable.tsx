"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Trash2 } from "lucide-react";
import type { Group } from "@/types";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  total_points: number;
  group_id: string | null;
  phone: string | null;
  profession: string | null;
};

interface Props {
  students: StudentRow[];
  groups: Group[];
  groupMap: Map<string, Group>;
}

export default function AdminStudentsTable({ students, groups, groupMap }: Props) {
  const router = useRouter();
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered =
    filterGroup === "all"
      ? students
      : filterGroup === "none"
      ? students.filter((s) => !s.group_id)
      : students.filter((s) => s.group_id === filterGroup);

  const avgPoints =
    filtered.length > 0
      ? Math.round(filtered.reduce((s, p) => s + p.total_points, 0) / filtered.length)
      : 0;

  const confirmStudent = students.find((s) => s.id === confirmId);

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${confirmId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "שגיאה במחיקה"); return; }
      setConfirmId(null);
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Confirm dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">מחיקת משתמש</h3>
            <p className="text-slate-600 text-sm mb-1">
              האם למחוק את <span className="font-bold">{confirmStudent?.name}</span>?
            </p>
            <p className="text-slate-400 text-xs mb-5">
              פעולה זו תמחק את כל הנתונים שלו (התקדמות, תרגילים, ביקורים) ולא ניתן לשחזר.
            </p>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors"
              >
                {deleting ? "מוחק..." : "כן, מחק"}
              </button>
              <button
                onClick={() => { setConfirmId(null); setError(null); }}
                disabled={deleting}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-brand-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          סטודנטים
          <span className="text-sm font-normal text-slate-400">({filtered.length})</span>
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">סנן לפי קבוצה:</span>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">כל הסטודנטים</option>
            <option value="none">ללא קבוצה</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filterGroup !== "all" && filtered.length > 0 && (
        <div className="flex gap-4 mb-4 text-sm">
          <div className="bg-brand-50 rounded-lg px-4 py-2">
            <span className="text-slate-500">ממוצע נקודות: </span>
            <span className="font-bold text-brand-700">{avgPoints}</span>
          </div>
          <div className="bg-green-50 rounded-lg px-4 py-2">
            <span className="text-slate-500">חברים: </span>
            <span className="font-bold text-green-700">{filtered.length}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-900 text-white">
            <tr>
              <th className="px-4 py-3 text-right font-semibold">שם</th>
              <th className="px-4 py-3 text-right font-semibold">אימייל</th>
              <th className="px-4 py-3 text-right font-semibold">טלפון</th>
              <th className="px-4 py-3 text-right font-semibold">מקצוע</th>
              <th className="px-4 py-3 text-right font-semibold">קבוצה</th>
              <th className="px-4 py-3 text-right font-semibold">נקודות</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  אין סטודנטים בקבוצה זו
                </td>
              </tr>
            )}
            {filtered.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-4 py-3 font-medium text-slate-800">{p.name || "—"}</td>
                <td className="px-4 py-3 text-slate-600 text-left" dir="ltr">{p.email}</td>
                <td className="px-4 py-3 text-slate-600" dir="ltr">{p.phone || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.profession || "—"}</td>
                <td className="px-4 py-3">
                  {p.group_id ? (
                    <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                      {groupMap.get(p.group_id)?.name ?? "—"}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">ללא קבוצה</span>
                  )}
                </td>
                <td className="px-4 py-3 font-bold text-brand-700">{p.total_points}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setConfirmId(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="מחק משתמש"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
