"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, CheckCircle, Loader2 } from "lucide-react";
import type { ExerciseSubmission } from "@/types";

const FIELD_KEYS = [
  "background", "core_beliefs", "intermediate_beliefs",
  "triggers",
  "automatic_thoughts", "cognitive_distortions", "attentional_biases", "cognitive_awareness",
  "emotions_typical", "emotional_awareness", "emotion_regulation",
  "physical_sensations", "body_awareness", "sensation_triggers", "somatic_regulation",
  "behaviors_typical",
  "environmental_response", "missing_skills", "vicious_cycle",
  "strengths", "treatment_goals",
] as const;

type FieldKey = typeof FIELD_KEYS[number];
type FormData = Record<FieldKey, string>;

const EMPTY_DATA: FormData = FIELD_KEYS.reduce((acc, k) => ({ ...acc, [k]: "" }), {} as FormData);

const REQUIRED_FIELDS: FieldKey[] = [
  "background", "core_beliefs", "intermediate_beliefs", "triggers",
  "automatic_thoughts", "behaviors_typical", "vicious_cycle", "treatment_goals",
];

const FIELD_LABELS: Record<FieldKey, string> = {
  background: "רקע והתפתחות הבעיה",
  core_beliefs: "אמונות יסוד",
  intermediate_beliefs: "אמונות ביניים",
  triggers: "טריגרים פנימיים וחיצוניים",
  automatic_thoughts: "מחשבות אוטומטיות",
  cognitive_distortions: "עיוותי חשיבה",
  attentional_biases: "הטיות קשב",
  cognitive_awareness: "מודעות וגמישות מחשבתית",
  emotions_typical: "רגשות טיפוסיים וטווח רגשי",
  emotional_awareness: "מודעות רגשית",
  emotion_regulation: "ויסות רגשי",
  physical_sensations: "תחושות גופניות מלוות",
  body_awareness: "מודעות לקשר גוף-רגש",
  sensation_triggers: "תזמון והופעת התחושות, עוצמתן וחשש מהן",
  somatic_regulation: "ויסות והרגעה גופנית",
  behaviors_typical: "דפוסי התנהגות טיפוסיים",
  environmental_response: "תגובת הסביבה לקושי",
  missing_skills: "מיומנויות חסרות",
  vicious_cycle: "מעגל השימור וההנצחה",
  strengths: "חוזקות",
  treatment_goals: "מטרות טיפול (מודל SMART)",
};

interface Props {
  moduleId: string;
  userId: string;
  existingSubmission: ExerciseSubmission | null;
  backHref: string;
}

export default function CaseFormulationExercise({ moduleId, existingSubmission, backHref }: Props) {
  const router = useRouter();
  const [data, setData] = useState<FormData>(() => {
    if (!existingSubmission) return EMPTY_DATA;
    const a = existingSubmission.answers as Partial<FormData>;
    return FIELD_KEYS.reduce((acc, k) => ({ ...acc, [k]: a[k] ?? "" }), {} as FormData);
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingSubmission);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [narrative, setNarrative] = useState<string>(
    (existingSubmission?.answers as Record<string, string> | undefined)?.ai_formulation_he ?? ""
  );

  function update(key: FieldKey, value: string) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  const missingRequired = REQUIRED_FIELDS.filter(k => !data[k].trim());

  async function handleSubmit() {
    if (missingRequired.length > 0) {
      setError("יש למלא את כל השדות החשובים המסומנים לפני ההגשה");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, answers: data }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "שגיאה בהגשה");
      setSubmitted(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
    } finally {
      setSubmitting(false);
    }
  }

  async function requestAI() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/formulation-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "שגיאה ביצירת ההמשגה");
      const json = await res.json();
      setNarrative(json.narrative);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
    } finally {
      setGenerating(false);
    }
  }

  function field(key: FieldKey, placeholder = "", rows = 3) {
    const isRequired = REQUIRED_FIELDS.includes(key);
    return (
      <div>
        <label className="block text-sm font-semibold text-brand-900 mb-1.5">
          {FIELD_LABELS[key]}
          {isRequired && <span className="text-red-500"> *</span>}
        </label>
        <textarea
          rows={rows}
          value={data[key]}
          onChange={e => update(key, e.target.value)}
          placeholder={placeholder}
          disabled={submitted}
          className="input-he resize-none disabled:bg-slate-50 disabled:text-slate-600"
        />
      </div>
    );
  }

  // ── Submitted view ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">ההמשגה הוגשה בהצלחה!</p>
            <p className="text-green-700 text-sm mt-0.5">
              אפשר עדיין לעיין בנתונים שמילאת, וליצור היפותזת עבודה בעזרת AI.
            </p>
          </div>
        </div>

        {/* AI narrative */}
        <div className="bg-white border border-brand-200 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-bold text-brand-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              היפותזת עבודה (נוצרה ע&quot;י AI)
            </p>
            <button
              onClick={requestAI}
              disabled={generating}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "כותב..." : narrative ? "צור מחדש" : "בקש מה-AI לכתוב את ההמשגה"}
            </button>
          </div>
          {narrative ? (
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{narrative}</p>
          ) : (
            <p className="text-sm text-slate-400">לא נוצרה היפותזה עדיין — לחץ על הכפתור כדי לבקש מה-AI לכתוב אותה על סמך הנתונים שמילאת.</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Read-only data */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">הנתונים שמילאת</p>
          {FIELD_KEYS.map(k => data[k] && (
            <div key={k}>
              <p className="text-xs font-semibold text-brand-700 mb-1">{FIELD_LABELS[k]}</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white rounded-xl border border-slate-100 px-4 py-3">
                {data[k]}
              </p>
            </div>
          ))}
        </div>

        <a href={backHref} className="inline-flex text-sm text-brand-600 hover:text-brand-800 font-medium">
          ← חזור למפגש
        </a>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">🧬 רקע ואמונות</h2>
        {field("background", "חוויות ילדות, נסיבות משפחתיות, קשיים התפתחותיים...", 4)}
        <div className="grid md:grid-cols-2 gap-4">
          {field("core_beliefs", "ערך עצמי נמוך, חוסר בנאהבות, חוסר אונים...")}
          {field("intermediate_beliefs", "עמדות, השקפות וכללים על העצמי/העולם/האחר...")}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">⚡ טריגרים</h2>
        {field("triggers", "גורמים פנימיים וחיצוניים המפעילים את הסכמה...", 3)}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">🧠 חוויה קוגניטיבית</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {field("automatic_thoughts", "מחשבות אוטומטיות אופייניות...")}
          {field("cognitive_distortions", "עיוותי חשיבה בולטים...")}
          {field("attentional_biases", "הטיות קשב...")}
          {field("cognitive_awareness", "מודעות למחשבות, רמת הזדהות, גמישות מחשבתית...")}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">💛 חוויה רגשית</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {field("emotions_typical", "רגשות טיפוסיים וטווח רגשי...")}
          {field("emotional_awareness", "מודעות רגשית, הבחנה בין רגשות...")}
          {field("emotion_regulation", "עוצמה, משך, לאביליות, יכולת מיתון...")}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">💪 חוויה גופנית (תחושות)</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {field("physical_sensations", "תחושות גופניות המלוות את הטריגרים...")}
          {field("body_awareness", "מודעות לקשר גוף-רגש, שיום תחושות...")}
          {field("sensation_triggers", "תזמון הופעה, עוצמה, חשש מעצם התחושה...")}
          {field("somatic_regulation", "יכולת ויסות והרגעה גופנית...")}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">🎭 התנהגות והתמודדות</h2>
        {field("behaviors_typical", "הימנעות, התנהגויות ביטחון, הסחת דעת, פתרון בעיות...", 3)}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">🔄 מעגל שימור והנצחה</h2>
        {field("environmental_response", "כיצד הסביבה מגיבה לקושי...")}
        {field("missing_skills", "מיומנויות חסרות — תקשורת, התמדה, ניהול זמן...")}
        {field("vicious_cycle", "כיצד ההתנהגויות והמיומנויות החסרות מחזקות את אמונות היסוד והביניים...", 4)}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-brand-900 border-b border-slate-100 pb-3">🌱 משאבים ומטרות</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {field("strengths", "חוזקות — מוטיבציה, מודעות עצמית...")}
          {field("treatment_goals", "מטרות טיפול על פי מודל SMART...")}
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          <Send className="w-4 h-4 scale-x-[-1]" />
          {submitting ? "מגיש..." : "הגש המשגה"}
        </button>
        <a href={backHref} className="text-sm text-slate-500 hover:text-slate-700">
          ← חזור
        </a>
      </div>
    </div>
  );
}
