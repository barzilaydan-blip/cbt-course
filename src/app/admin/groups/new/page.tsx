"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Group } from "@/types";

export default function AdminGroupNewPage() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createGroup() {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("groups")
      .insert({ name: name.trim(), is_active: true, course_start_date: startDate || null })
      .select()
      .single();
    if (err || !data) {
      setError(err?.message ?? "שגיאה ביצירת הקבוצה");
      setCreating(false);
      return;
    }
    router.push(`/admin/groups/${(data as Group).id}`);
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="קבוצה חדשה" description="שם המחזור — שאר הפרטים (Zoom, לוח זמנים, גישה, משתתפים) ממלאים בדף הקבוצה אחרי היצירה." />

      <div className="surface p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">שם הקבוצה</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createGroup()}
            placeholder="למשל: מחזור א׳ 2026"
            className="input-he w-full"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">תאריך פתיחת קורס (אופציונלי)</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-he"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          onClick={createGroup}
          disabled={creating || !name.trim()}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {creating ? "יוצר..." : "צור קבוצה והמשך"}
        </button>
      </div>
    </div>
  );
}
