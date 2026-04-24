"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, CheckCircle } from "lucide-react";
import type { CourseSettings } from "@/types";

export default function AdminCourseSettings({ settings }: { settings: CourseSettings | null }) {
  const supabase = createClient();
  const [zoomUrl, setZoomUrl] = useState(settings?.zoom_url ?? "");
  const [syllabusUrl, setSyllabusUrl] = useState(settings?.syllabus_url ?? "");
  const [meetingTime, setMeetingTime] = useState(settings?.meeting_time ?? "18:00");
  const [meetingDayHe, setMeetingDayHe] = useState(settings?.meeting_day_he ?? "שלישי");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from("course_settings").upsert({
      id: 1,
      zoom_url: zoomUrl.trim() || null,
      syllabus_url: syllabusUrl.trim() || null,
      meeting_time: meetingTime.trim() || "18:00",
      meeting_day_he: meetingDayHe.trim() || "שלישי",
    }, { onConflict: "id" });
    setSaving(false);
    setSaved(true);
  }

  const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-bold text-brand-900">⚙️ הגדרות קורס כלליות</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "שומר..." : saved ? "נשמר!" : "שמור"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">📅 יום קבוע של המפגשים</label>
          <select
            value={meetingDayHe}
            onChange={(e) => { setMeetingDayHe(e.target.value); setSaved(false); }}
            className="input-he"
          >
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">🕕 שעה קבועה</label>
          <input
            type="time"
            value={meetingTime}
            onChange={(e) => { setMeetingTime(e.target.value); setSaved(false); }}
            className="input-he"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">🎥 קישור Zoom קבוע לקורס</label>
        <input
          type="url"
          value={zoomUrl}
          onChange={(e) => { setZoomUrl(e.target.value); setSaved(false); }}
          placeholder="https://zoom.us/j/..."
          className="input-he"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">📄 קישור לסילבוס</label>
        <input
          type="url"
          value={syllabusUrl}
          onChange={(e) => { setSyllabusUrl(e.target.value); setSaved(false); }}
          placeholder="https://drive.google.com/..."
          className="input-he"
          dir="ltr"
        />
      </div>

      <p className="text-xs text-slate-400">
        היום והשעה הקבועים יופיעו בהודעת המפגש הקרוב בדשבורד הסטודנטים. את התאריך הספציפי לכל מפגש מגדירים בעריכת המפגש.
      </p>
    </div>
  );
}
