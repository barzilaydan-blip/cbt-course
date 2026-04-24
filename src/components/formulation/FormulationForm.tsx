"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Save, CheckCircle } from "lucide-react";
import type { DynamicFormulation } from "@/types";

const COGNITIVE_DISTORTIONS = [
  "קריאת מחשבות", "ניבוי עתיד", "קטסטרופיזציה", "תיוג", "פילטר שלילי",
  "הנחה/הכחשה של החיובי", "הכללת יתר", "חשיבה דיכוטומית",
  "דרישות — צריך/חייב", "אישיות יתר", "האשמה", "השוואות בלתי-הוגנות",
  "מחשבות מה-אם", "הגיון רגשי", "אי-קבלת הוכחות נגד",
];

interface Props {
  initialData: DynamicFormulation | null;
  userId: string;
}

type FormData = Partial<Omit<DynamicFormulation, "id" | "user_id" | "updated_at" | "created_at">>;

export default function FormulationForm({ initialData, userId }: Props) {
  const supabase = createClient();
  const [data, setData] = useState<FormData>(initialData ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(field: keyof FormData, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function toggleDistortion(d: string) {
    const current = data.cognitive_distortions ?? [];
    const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d];
    update("cognitive_distortions", next);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...data, user_id: userId, updated_at: new Date().toISOString() };
    await supabase.from("dynamic_formulation").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    setSaved(true);
  }

  const field = (
    label: string,
    key: keyof FormData,
    placeholder = "",
    rows = 3
  ) => (
    <div>
      <label className="block text-sm font-semibold text-brand-900 mb-1.5">{label}</label>
      <textarea
        rows={rows}
        value={(data[key] as string) ?? ""}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
        className="input-he resize-none"
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            המשגה דינמית — מקרה רץ
          </h1>
          <p className="text-slate-500 mt-1 text-sm">בנה תמונה קלינית מלאה לאורך הקורס. הנתונים נשמרים אוטומטית.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 shrink-0"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "שומר..." : saved ? "נשמר!" : "שמור"}
        </button>
      </div>

      {/* Section: Presenting Problem */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">🎯 בעיה מוצגת ומטרות</h2>
        {field("בעיה מוצגת", "presenting_problem", "תאר את הבעיה העיקרית שהמטופל מביא לטיפול...")}
        {field("מטרות טיפוליות", "therapy_goals", "מה המטופל רוצה להשיג בטיפול?")}
        {field("היסטוריה התפתחותית", "developmental_history", "רקע משפחתי, חוויות ילדות רלוונטיות...", 4)}
      </section>

      {/* Section: ABC Model */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">🔄 מודל ABC — מצב → מחשבה → תגובה</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {field("מצב מעורר (A)", "triggering_situation", "מה קרה? מתי? עם מי?")}
          {field("מחשבות אוטומטיות (B)", "automatic_thoughts", "מה עבר לו בראש? מחשבה חמה?")}
          {field("רגשות (C)", "emotions", "מה הרגיש? עצמת רגש 0-100?")}
          {field("תחושות גוף (C)", "physical_sensations", "לב דפיק, מתח שרירים, קוצר נשימה...")}
          {field("התנהגויות (C)", "behaviors", "מה עשה? הימנע? נסוג? התפרץ?")}
        </div>
      </section>

      {/* Section: Core Beliefs */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">🧠 אמונות יסוד (סכמות)</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {field("אמונות יסוד על עצמי", "core_beliefs_self", "אני..., אני לא ראוי..., אני חלש...")}
          {field("אמונות יסוד על אחרים", "core_beliefs_others", "אנשים..., אחרים..., העולם...")}
          {field("אמונות יסוד על העולם", "core_beliefs_world", "העולם הוא..., החיים הם...")}
        </div>
        {field("הנחות וכללים (אמונות ביניים)", "intermediate_beliefs",
          "אם אני... אז..., צריך להיות..., אסור לי...")}
      </section>

      {/* Section: Behavioral Patterns */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">🛡 דפוסי ביטחון והימנעות</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {field("התנהגויות ביטחון", "safety_behaviors", "מה הוא עושה כדי לשרוד מצבים מאיימים?")}
          {field("דפוסי הימנעות", "avoidance_patterns", "ממה הוא נמנע? אילו מצבים מעורר?")}
        </div>
      </section>

      {/* Section: Cognitive Distortions */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3 mb-4">💡 עיוותי חשיבה עיקריים</h2>
        <div className="flex flex-wrap gap-2">
          {COGNITIVE_DISTORTIONS.map((d) => {
            const active = (data.cognitive_distortions ?? []).includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDistortion(d)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white text-slate-600 border-slate-300 hover:border-brand-400"
                }`}
              >
                {active ? "✓ " : ""}{d}
              </button>
            );
          })}
        </div>
      </section>

      {/* Save button (bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saving ? "שומר..." : saved ? "נשמר בהצלחה!" : "שמור המשגה"}
        </button>
      </div>
    </div>
  );
}
