"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, MessageSquare, User, Star, BookOpen, Heart } from "lucide-react";
import type { ExerciseSubmission } from "@/types";

const FIELDS = [
  {
    key: "background",
    label: "רקע אקדמי / מקצועי",
    description: "בכמה מילים — מה המסלול שלך עד כה?",
    icon: User,
    placeholder: "לדוגמה: לומד/ת פסיכולוגיה קלינית, שנה שלישית...",
    rows: 3,
    required: true,
    section: 1,
  },
  {
    key: "personal",
    label: "משהו קטן שלא קשור ללימודים",
    description: "תחביב, עובדה מעניינת עליך, או משהו שפשוט כיף לדעת עליך",
    icon: Heart,
    placeholder: "לדוגמה: חובב/ת ריצה, שף/ית חובב/ת...",
    rows: 2,
    required: false,
    section: 1,
  },
  {
    key: "reason",
    label: "למה בחרת להשתתף בקורס הזה?",
    description: "האם מתוך עניין אישי, דרישת חובה, רצון לפתח מיומנות ספציפית, המלצה ממישהו?",
    icon: Star,
    placeholder: "",
    rows: 3,
    required: true,
    section: 2,
  },
  {
    key: "success",
    label: "מה ייחשב עבורך כהצלחה בקורס?",
    description: "עם איזה ידע, כלים, או תובנות היית רוצה לצאת במפגש האחרון?",
    icon: CheckCircle,
    placeholder: "",
    rows: 3,
    required: true,
    section: 2,
  },
  {
    key: "interests",
    label: "נושא מסוים שמעניין אותך במיוחד",
    description: "מתוך הסילבוס או בתחום באופן כללי",
    icon: BookOpen,
    placeholder: "",
    rows: 2,
    required: false,
    section: 2,
  },
] as const;

type AnswerKey = (typeof FIELDS)[number]["key"];
type Answers = Record<AnswerKey, string>;

interface Props {
  moduleId: string;
  userId: string;
  existingSubmission: ExerciseSubmission | null;
  backHref: string;
}

export default function ExpectationsForm({ moduleId, existingSubmission }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({
    background: "",
    personal: "",
    reason: "",
    success: "",
    interests: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Already submitted states
  if (existingSubmission) {
    const ans = existingSubmission.answers as Record<string, string>;

    if (existingSubmission.status === "reviewed") {
      return (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
              <CheckCircle className="w-5 h-5" />
              {existingSubmission.admin_feedback ? "קיבלת תגובה אישית מהמרצה" : "הטופס נקרא ✓"}
            </div>
            {existingSubmission.admin_feedback && (
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{existingSubmission.admin_feedback}</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-500">התשובות שמסרת:</p>
            {FIELDS.map(f => (
              <div key={f.key} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-1">{f.label}</p>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{ans[f.key] || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
            <Clock className="w-5 h-5" />
            הטופס הוגש — ממתין לתגובת המרצה
          </div>
          <p className="text-amber-600 text-sm">המרצה יקרא את תשובותיך ויחזור אליך עם כמה מילים אישיות.</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-500">התשובות שמסרת:</p>
          {FIELDS.map(f => (
            <div key={f.key} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">{f.label}</p>
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{ans[f.key] || "—"}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-emerald-800 mb-2">הטופס הוגש בהצלחה!</h3>
        <p className="text-emerald-700 text-sm">המרצה יקרא את תשובותיך ויחזור אליך עם כמה מילים אישיות.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!answers.background.trim() || !answers.reason.trim() || !answers.success.trim()) {
      setError("אנא מלא את שדות החובה המסומנים בכוכבית.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, answers }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "שגיאה בהגשה");
      }
      setSubmitted(true);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה לא צפויה");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = answers.background.trim() && answers.reason.trim() && answers.success.trim();
  const section1 = FIELDS.filter(f => f.section === 1);
  const section2 = FIELDS.filter(f => f.section === 2);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-brand-700 font-semibold mb-2">
          <MessageSquare className="w-5 h-5" />
          היכרות ראשונית
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">
          לפני שמתחילים — נשמח להכיר אותך קצת. המידע יגיע למרצה בלבד ויאפשר חוויית לימוד אישית יותר.
        </p>
      </div>

      {/* Section 1 */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-brand-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
          קצת עלייך
        </h2>
        {section1.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                <Icon className="w-4 h-4 text-brand-500 shrink-0" />
                {f.label}
                {f.required && <span className="text-rose-400 text-xs">*</span>}
              </div>
              <p className="text-xs text-slate-500 mb-3">{f.description}</p>
              <textarea
                rows={f.rows}
                value={answers[f.key]}
                onChange={e => setAnswers(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          );
        })}
      </div>

      {/* Section 2 */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-brand-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
          הציפיות שלך מהקורס
        </h2>
        {section2.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                <Icon className="w-4 h-4 text-brand-500 shrink-0" />
                {f.label}
                {f.required && <span className="text-rose-400 text-xs">*</span>}
              </div>
              <p className="text-xs text-slate-500 mb-3">{f.description}</p>
              <textarea
                rows={f.rows}
                value={answers[f.key]}
                onChange={e => setAnswers(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !isValid}
        className="w-full bg-brand-500 text-white font-semibold py-3 rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "שולח..." : "שלח את הטופס"}
      </button>

      <p className="text-center text-xs text-slate-400">* שדה חובה · המידע יגיע למרצה בלבד</p>
    </div>
  );
}
