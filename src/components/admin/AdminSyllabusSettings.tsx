"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, CheckCircle, FileText } from "lucide-react";

export default function AdminSyllabusSettings({ initialUrl }: { initialUrl: string }) {
  const supabase = createClient();
  const [url, setUrl] = useState(initialUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from("course_settings").upsert(
      { id: 1, syllabus_url: url.trim() || null },
      { onConflict: "id" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="surface p-5">
      <h2 className="font-bold text-brand-900 mb-1 flex items-center gap-2">
        <FileText className="w-4 h-4" aria-hidden="true" />
        סילבוס הקורס
      </h2>
      <p className="text-xs text-slate-500 mb-4">קישור אחד, קבוע לכל הקבוצות — התוכן הלימודי זהה בכל מחזור.</p>
      <div className="flex gap-3 flex-wrap">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setSaved(false); }}
          placeholder="https://drive.google.com/..."
          className="input-he flex-1 min-w-[16rem]"
          dir="ltr"
        />
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "שומר..." : saved ? "נשמר!" : "שמור"}
        </button>
      </div>
    </div>
  );
}
