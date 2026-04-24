"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, Clock, Send } from "lucide-react";
import type { ExerciseSubmission } from "@/types";

const CASE_STUDY = `פרטים דמוגרפיים ורקע:
רון, בן 32, מהנדס תוכנה במקצועו. בדרך כלל מתפקד היטב, ללא היסטוריה פסיכיאטרית קודמת. לאחרונה, חברת ההייטק בה הוא עובד עברה למשרדים חדשים הממוקמים בקומה ה-28 של מגדל זכוכית מודרני. המעליות בבניין הן מעליות שקופות (חיצוניות), וקירות המשרד עשויים מזכוכית מהרצפה ועד התקרה.

תיאור הבעיה:
מאז המעבר, רון חווה מצוקה יומיומית חריפה. הוא מתאר כי המחשבה על ההגעה לעבודה מעוררת בו חרדה כבר מהערב שלפני. כאשר הוא מגיע לבניין, הוא מסרב לעלות במעלית השקופה ובוחר לטפס 28 קומות ברגל בחדר המדרגות האטום, דבר שגורם לו להגיע מותש ומיוזע.
בתוך המשרד, רון נמנע מלהתקרב לחלונות. אם הוא נאלץ לעבור במסדרון שקוף, הוא נצמד לקיר הפנימי, משפיל את מבטו, ואוחז בחוזקה בקיר.

סימפטומים:

גופניים: דפיקות לב מואצות, הזעה בכפות הידיים, סחרחורת, ותחושה של "רפיון ברגליים" כשהוא קרוב לחלון.

קוגניטיביים: מחשבות אוטומטיות כגון: "הזכוכית עלולה להישבר ואני אפול", "אני אאבד שליטה ואקפוץ", "הסחרחורת תגרום לי להתעלף וכולם יצחקו עליי".

התנהגותיים: הימנעות ממעליות שקופות, טיפוס במדרגות, הצמדות לקירות, הימנעות מהבטה מבעד לחלון.

השפעה על התפקוד:
רון מתחיל לחשוב על התפטרות מעבודתו למרות שהוא אוהב אותה, משום שההתמודדות היומיומית גוזלת ממנו אנרגיה רבה ופוגעת בריכוז שלו. הוא מתבייש לשתף את הקולגות שלו בבעיה.`;

const QUESTIONS = [
  {
    key: "q1" as const,
    label: "שאלה 1 — גורמים משמרים",
    text: "מהן התנהגויות ההימנעות (Avoidance) והתנהגויות הביטחון (Safety Behaviors) של רון? כיצד התנהגויות אלו משמרות את החרדה שלו לטווח הארוך?",
  },
  {
    key: "q2" as const,
    label: "שאלה 2 — פסיכואדיוקציה",
    text: "לקראת תחילת שלב החשיפות, כיצד תסבירו לרון את הרציונל שמאחורי טיפול בחשיפה? התייחסו למושג ההתרגלות (Habituation) ולמידת הכחדה.",
  },
  {
    key: "q3" as const,
    label: "שאלה 3 — אתגרים בחשיפה",
    text: "במהלך אחת מפעולות החשיפה, רון מדווח על רמת חרדה של 95/100, מתחיל לרעוד ומבקש לעצור מיד ולצאת. כמטפלים, כיצד תגיבו באותו הרגע?",
  },
];

const HIERARCHY_STEPS = [1, 2, 3, 4, 5] as const;

type HierarchyKey = "h1" | "h2" | "h3" | "h4" | "h5";

interface Props {
  moduleId: string;
  userId: string;
  existingSubmission: ExerciseSubmission | null;
  backHref: string;
}

export default function ClinicalExercise({ moduleId, existingSubmission, backHref }: Props) {
  const [caseOpen, setCaseOpen] = useState(true);
  const [answers, setAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [hierarchy, setHierarchy] = useState<Record<HierarchyKey, string>>({
    h1: "", h2: "", h3: "", h4: "", h5: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isReviewed = existingSubmission?.status === "reviewed";
  const isSubmitted = !!existingSubmission || submitted;

  async function handleSubmit() {
    if (!answers.q1.trim() || !answers.q2.trim() || !answers.q3.trim()) {
      setError("יש למלא את כל שלוש השאלות לפני ההגשה");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, answers: { ...answers, ...hierarchy } }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "שגיאה בהגשה");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Read-only hierarchy table (after submission) ───────────────
  function HierarchyReadOnly({ sub }: { sub: ExerciseSubmission }) {
    return (
      <div>
        <p className="text-xs font-semibold text-brand-700 mb-2">שאלה 4 — מדרג חשיפה</p>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-brand-900 text-white">
              <tr>
                <th className="px-3 py-2 text-right font-semibold w-16">שלב</th>
                <th className="px-3 py-2 text-right font-semibold">תיאור פעולת החשיפה</th>
              </tr>
            </thead>
            <tbody>
              {HIERARCHY_STEPS.map((step, i) => {
                const key = `h${step}` as HierarchyKey;
                return (
                  <tr key={step} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-3 py-2.5 font-bold text-brand-700 text-center">{step}</td>
                    <td className="px-3 py-2.5 text-slate-700 leading-relaxed">
                      {sub.answers[key] || <span className="text-slate-300 italic">לא מולא</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Reviewed state ────────────────────────────────────────────
  if (isReviewed && existingSubmission) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">התרגיל נבדק!</p>
            <p className="text-green-700 text-sm mt-0.5">
              קיבלת <span className="font-bold">{existingSubmission.points_awarded}</span> נקודות
            </p>
          </div>
        </div>

        <div className="bg-white border border-green-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">משוב המרצה</p>
          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
            {existingSubmission.admin_feedback}
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">התשובות שלך</p>
          {QUESTIONS.map(q => (
            <div key={q.key}>
              <p className="text-xs font-semibold text-brand-700 mb-1">{q.label}</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white rounded-xl border border-slate-100 px-4 py-3">
                {existingSubmission.answers[q.key]}
              </p>
            </div>
          ))}
          <HierarchyReadOnly sub={existingSubmission} />
        </div>

        <a href={backHref} className="inline-flex text-sm text-brand-600 hover:text-brand-800 font-medium">
          ← חזור למפגש
        </a>
      </div>
    );
  }

  // ── Submitted / pending review ────────────────────────────────
  if (isSubmitted) {
    const sub = existingSubmission;
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">התרגיל הוגש בהצלחה!</p>
            <p className="text-amber-700 text-sm mt-0.5">
              המרצה יבדוק אותו ויחזור אליך עם משוב בקרוב.
            </p>
          </div>
        </div>

        {sub && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">התשובות שהגשת</p>
            {QUESTIONS.map(q => (
              <div key={q.key}>
                <p className="text-xs font-semibold text-brand-700 mb-1">{q.label}</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white rounded-xl border border-slate-100 px-4 py-3">
                  {sub.answers[q.key]}
                </p>
              </div>
            ))}
            <HierarchyReadOnly sub={sub} />
          </div>
        )}

        <a href={backHref} className="inline-flex text-sm text-brand-600 hover:text-brand-800 font-medium">
          ← חזור למפגש
        </a>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Case study */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setCaseOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-right hover:bg-slate-50 transition-colors"
        >
          <span className="font-bold text-brand-900">📋 תיאור המקרה — רון (אקרופוביה)</span>
          {caseOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
        </button>
        {caseOpen && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mt-4">
              {CASE_STUDY}
            </p>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {QUESTIONS.map((q, i) => (
          <div key={q.key} className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">
              שאלה {i + 1} מתוך 4
            </p>
            <p className="font-semibold text-slate-800 text-sm leading-relaxed mb-3">{q.text}</p>
            <textarea
              value={answers[q.key]}
              onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
              placeholder="כתוב את תשובתך כאן..."
              rows={5}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
            <p className="text-xs text-slate-400 mt-1 text-left">{answers[q.key].length} תווים</p>
          </div>
        ))}

        {/* Exposure hierarchy table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">
            שאלה 4 מתוך 4
          </p>
          <p className="font-semibold text-slate-800 text-sm leading-relaxed mb-4">
            בנו מדרג חשיפה של חמישה שלבים עבור רון, מהשלב הקל ביותר (רמת חרדה נמוכה) ועד השלב המאתגר ביותר. תארו כל שלב בבירור — מה בדיוק עושה רון, היכן, וכמה זמן.
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-300">
            <table className="w-full text-sm">
              <thead className="bg-brand-900 text-white">
                <tr>
                  <th className="px-3 py-2.5 text-right font-semibold w-16 shrink-0">שלב</th>
                  <th className="px-3 py-2.5 text-right font-semibold">תיאור פעולת החשיפה</th>
                </tr>
              </thead>
              <tbody>
                {HIERARCHY_STEPS.map((step, i) => {
                  const key = `h${step}` as HierarchyKey;
                  return (
                    <tr key={step} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-3 py-2 font-bold text-brand-700 text-center align-top pt-3">
                        {step}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={hierarchy[key]}
                          onChange={e => setHierarchy(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={`תאר את שלב ${step}...`}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2">מלא לפחות חלק מהשלבים — הטבלה אינה חובה להגשה</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || !answers.q1.trim() || !answers.q2.trim() || !answers.q3.trim()}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          <Send className="w-4 h-4 scale-x-[-1]" />
          {submitting ? "מגיש..." : "הגש תרגיל"}
        </button>
        <a href={backHref} className="text-sm text-slate-500 hover:text-slate-700">
          ← חזור
        </a>
      </div>
    </div>
  );
}
