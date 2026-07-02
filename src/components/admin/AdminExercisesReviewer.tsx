"use client";
import { useState } from "react";
import { CheckCircle, Clock, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import type { ExerciseSubmission } from "@/types";

const CLINICAL_QUESTIONS = [
  { key: "q1", label: "שאלה 1 — גורמים משמרים" },
  { key: "q2", label: "שאלה 2 — פסיכואדיוקציה" },
  { key: "q3", label: "שאלה 3 — אתגרים בחשיפה" },
];

const EXPECTATIONS_FIELDS = [
  { key: "background", label: "רקע אקדמי / מקצועי" },
  { key: "personal", label: "משהו קטן שלא קשור ללימודים" },
  { key: "reason", label: "למה בחרת להשתתף בקורס?" },
  { key: "success", label: "מה ייחשב הצלחה בקורס?" },
  { key: "interests", label: "נושא מסוים שמעניין אותך" },
];

const FORMULATION_FIELDS = [
  { key: "own_hypothesis", label: "היפותזת העבודה האישית", highlight: true },
  { key: "background", label: "רקע והתפתחות הבעיה" },
  { key: "core_beliefs", label: "אמונות יסוד" },
  { key: "intermediate_beliefs", label: "אמונות ביניים" },
  { key: "triggers", label: "טריגרים פנימיים וחיצוניים" },
  { key: "automatic_thoughts", label: "מחשבות אוטומטיות" },
  { key: "attentional_biases", label: "הטיות קשב" },
  { key: "cognitive_awareness", label: "מודעות וגמישות מחשבתית" },
  { key: "emotions_typical", label: "רגשות טיפוסיים וטווח רגשי" },
  { key: "emotion_regulation", label: "ויסות רגשי" },
  { key: "physical_sensations", label: "תחושות גופניות מלוות" },
  { key: "sensation_triggers", label: "תזמון והופעת התחושות" },
  { key: "somatic_regulation", label: "ויסות והרגעה גופנית" },
  { key: "behaviors_typical", label: "דפוסי התנהגות טיפוסיים" },
  { key: "environmental_response", label: "תגובת הסביבה לקושי" },
  { key: "missing_skills", label: "מיומנויות חסרות" },
  { key: "vicious_cycle", label: "מעגל השימור וההנצחה" },
  { key: "strengths", label: "חוזקות" },
];

interface SubmissionWithProfile extends ExerciseSubmission {
  profiles?: { name: string; email: string } | null;
  modules?: { order_number: number; title_he: string } | null;
}

export default function AdminExercisesReviewer({ submissions }: { submissions: SubmissionWithProfile[] }) {
  const [filter, setFilter] = useState<"all" | "submitted" | "reviewed">("submitted");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [points, setPoints] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = submissions.filter(s =>
    filter === "all" ? true : s.status === filter
  );

  function initExpand(sub: SubmissionWithProfile) {
    if (expanded === sub.id) {
      setExpanded(null);
      return;
    }
    setExpanded(sub.id);
    if (feedbacks[sub.id] === undefined) {
      setFeedbacks(prev => ({ ...prev, [sub.id]: sub.admin_feedback ?? "" }));
    }
    if (points[sub.id] === undefined) {
      setPoints(prev => ({ ...prev, [sub.id]: sub.ai_suggested_points ?? sub.points_awarded ?? 40 }));
    }
  }

  async function handleReview(sub: SubmissionWithProfile, isExpectations: boolean) {
    setSubmitting(sub.id);
    try {
      const res = await fetch("/api/exercises/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: sub.id,
          admin_feedback: feedbacks[sub.id] ?? "",
          points_awarded: isExpectations ? 0 : (points[sub.id] ?? 40),
        }),
      });
      if (!res.ok) throw new Error("שגיאה בשמירה");
      setDone(prev => new Set(prev).add(sub.id));
      setExpanded(null);
    } catch {
      alert("שגיאה בשמירת המשוב. נסה שוב.");
    } finally {
      setSubmitting(null);
    }
  }

  function copyDraft(id: string, draft: string) {
    setFeedbacks(prev => ({ ...prev, [id]: draft }));
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const pendingCount = submissions.filter(s => s.status === "submitted").length;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {([["submitted", `ממתינות (${pendingCount})`], ["reviewed", "נבדקו"], ["all", "הכל"]] as [typeof filter, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              filter === val
                ? "bg-white border border-b-white border-slate-200 text-brand-700 -mb-px"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-8">אין הגשות להצגה</p>
      )}

      {filtered.map(sub => {
        const orderNum = sub.modules?.order_number ?? 0;
        const isExpectations = orderNum === 1;
        const isClinical = orderNum === 4;
        const isFormulation = orderNum === 9;

        const isExpanded = expanded === sub.id;
        const isDone = done.has(sub.id) || sub.status === "reviewed";
        const isReviewing = submitting === sub.id;
        const fb = feedbacks[sub.id] ?? sub.admin_feedback ?? "";
        const pts = points[sub.id] ?? sub.points_awarded ?? 40;

        const moduleLabel = isExpectations
          ? "מפגש 1 — היכרות"
          : isFormulation
          ? "מפגש 9 — המשגה קלינית"
          : sub.modules
          ? `מפגש ${sub.modules.order_number}`
          : "תרגיל קליני";

        const badgeColor = isExpectations
          ? "bg-blue-100 text-blue-700"
          : isFormulation
          ? "bg-purple-100 text-purple-700"
          : "bg-rose-100 text-rose-700";

        const answers = sub.answers as Record<string, unknown>;

        return (
          <div key={sub.id} className={`bg-white rounded-2xl border overflow-hidden ${isDone ? "border-green-200" : "border-slate-200"}`}>
            {/* Header */}
            <button
              onClick={() => initExpand(sub)}
              className="w-full flex items-center gap-4 px-5 py-4 text-right hover:bg-slate-50 transition-colors"
            >
              <div className="shrink-0">
                {isDone
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <Clock className="w-5 h-5 text-amber-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800">{sub.profiles?.name ?? "—"}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                    {moduleLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{sub.profiles?.email} · {new Date(sub.submitted_at).toLocaleDateString("he-IL")}</p>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                {isDone && isClinical && (
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    {sub.points_awarded} נק׳
                  </span>
                )}
                {isDone && (isExpectations || isFormulation) && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    נענה ✓
                  </span>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div className="border-t border-slate-100 px-5 pb-6 space-y-5 pt-4">

                {/* ── Expectations form (module 1) ── */}
                {isExpectations && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">תשובות הסטודנט</p>
                    {EXPECTATIONS_FIELDS.map(f => (
                      <div key={f.key}>
                        <p className="text-xs font-semibold text-brand-700 mb-1">{f.label}</p>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 whitespace-pre-wrap">
                          {(answers[f.key] as string) || <span className="italic text-slate-300">לא מולא</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Clinical exercise (module 4) ── */}
                {isClinical && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">תשובות הסטודנט</p>
                    {CLINICAL_QUESTIONS.map(q => (
                      <div key={q.key}>
                        <p className="text-xs font-semibold text-brand-700 mb-1">{q.label}</p>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 whitespace-pre-wrap">
                          {(answers[q.key] as string)}
                        </p>
                      </div>
                    ))}
                    <div>
                      <p className="text-xs font-semibold text-brand-700 mb-2">שאלה 4 — מדרג חשיפה</p>
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-brand-900 text-white">
                            <tr>
                              <th className="px-3 py-2 text-right font-semibold w-14">שלב</th>
                              <th className="px-3 py-2 text-right font-semibold">תיאור פעולת החשיפה</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1,2,3,4,5].map((step, i) => (
                              <tr key={step} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                <td className="px-3 py-2.5 font-bold text-brand-700 text-center">{step}</td>
                                <td className="px-3 py-2.5 text-slate-700 leading-relaxed">
                                  {(answers[`h${step}`] as string) || <span className="text-slate-300 italic">לא מולא</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Case formulation (module 9) ── */}
                {isFormulation && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">תשובות הסטודנט</p>

                    {/* Cognitive distortions + awareness scales */}
                    {Array.isArray(answers.cognitive_distortions) && (answers.cognitive_distortions as string[]).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-brand-700 mb-1">עיוותי חשיבה</p>
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
                          {(answers.cognitive_distortions as string[]).join(", ")}
                        </p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-3">
                      {typeof answers.emotional_awareness === "number" && (
                        <div>
                          <p className="text-xs font-semibold text-brand-700 mb-1">מודעות רגשית</p>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 font-bold text-brand-800">
                            {answers.emotional_awareness}/10
                          </p>
                        </div>
                      )}
                      {typeof answers.body_awareness === "number" && (
                        <div>
                          <p className="text-xs font-semibold text-brand-700 mb-1">מודעות גוף-רגש</p>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 font-bold text-brand-800">
                            {answers.body_awareness}/10
                          </p>
                        </div>
                      )}
                    </div>

                    {FORMULATION_FIELDS.map(f => {
                      const val = answers[f.key] as string | undefined;
                      if (!val?.trim()) return null;
                      return (
                        <div key={f.key}>
                          <p className={`text-xs font-semibold mb-1 ${f.highlight ? "text-purple-700" : "text-brand-700"}`}>
                            {f.label}
                            {f.highlight && " ✍️"}
                          </p>
                          <p className={`text-sm text-slate-700 leading-relaxed whitespace-pre-wrap rounded-xl border px-4 py-3 ${
                            f.highlight ? "bg-purple-50 border-purple-100" : "bg-slate-50 border-slate-100"
                          }`}>
                            {val}
                          </p>
                        </div>
                      );
                    })}

                    {/* AI-generated formulation */}
                    {typeof answers.ai_formulation_he === "string" && answers.ai_formulation_he && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-1">היפותזת עבודה (AI)</p>
                        <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap bg-amber-50 rounded-xl border border-amber-100 px-4 py-3">
                          {answers.ai_formulation_he as string}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── AI Draft — only for clinical exercises ── */}
                {isClinical && !isDone && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">טיוטת AI — לא חובה להשתמש</p>
                      {sub.ai_draft_feedback && (
                        <button
                          onClick={() => copyDraft(sub.id, sub.ai_draft_feedback!)}
                          className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {copied === sub.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied === sub.id ? "הועתק!" : "העתק לשדה המשוב"}
                        </button>
                      )}
                    </div>
                    {sub.ai_suggested_points != null && (
                      <p className="text-xs text-amber-600">
                        ציון מוצע ע״י AI: <span className="font-bold">{sub.ai_suggested_points}</span> / 50
                      </p>
                    )}
                    <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                      {sub.ai_draft_feedback ?? "טיוטת AI אינה זמינה עדיין (ייתכן שעדיין מעובד, נסה לרענן)."}
                    </p>
                  </div>
                )}

                {/* Already reviewed */}
                {isDone && sub.admin_feedback && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                      {isExpectations ? "תגובתך האישית" : "משוב שנשלח"}
                    </p>
                    <p className="text-sm text-green-900 leading-relaxed whitespace-pre-wrap">{sub.admin_feedback}</p>
                  </div>
                )}

                {/* Review form */}
                {!isDone && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        {isExpectations ? "תגובה אישית לסטודנט" : isFormulation ? "משוב אופציונלי" : "משוב למרצה"}
                      </label>
                      <textarea
                        value={fb}
                        onChange={e => setFeedbacks(prev => ({ ...prev, [sub.id]: e.target.value }))}
                        rows={isExpectations || isFormulation ? 4 : 5}
                        placeholder={isExpectations
                          ? "כתוב כאן כמה מילים אישיות לסטודנט — ברוך הבא, התרשמות, שאלה..."
                          : isFormulation
                          ? "משוב לא חובה — ניתן לכתוב הערות על ההמשגה..."
                          : "כתוב כאן את המשוב שייראה לסטודנט..."
                        }
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Points only for clinical */}
                      {isClinical && (
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1.5">נקודות (0–50)</label>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={pts}
                            onChange={e => setPoints(prev => ({ ...prev, [sub.id]: Number(e.target.value) }))}
                            className="w-24 border border-slate-300 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      )}

                      <button
                        onClick={() => handleReview(sub, isExpectations || isFormulation)}
                        disabled={isReviewing || (!isFormulation && !fb.trim())}
                        className={`flex items-center gap-2 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm ${
                          isExpectations ? "bg-blue-600 hover:bg-blue-700"
                          : isFormulation ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-brand-500 hover:bg-brand-700"
                        } ${isClinical ? "mt-5" : ""}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isReviewing
                          ? "שומר..."
                          : isExpectations ? "שלח תגובה"
                          : isFormulation ? "סמן כנצפה"
                          : "אשר ותן נקודות"
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
