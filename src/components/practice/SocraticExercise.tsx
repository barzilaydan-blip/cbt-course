"use client";
import { useState, useRef, useEffect } from "react";
import { Send, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { ExerciseSubmission } from "@/types";

const CASE = {
  name: "יעל",
  background: `יעל, בת 28, מנהלת פרויקטים בחברת טכנולוגיה. היא תמיד נחשבה לעובדת מצטיינת, אך לאחרונה קיבלה על עצמה פרויקט גדול ומורכב. מאז, היא חווה חרדה עזה, מתקשה לישון, ומוצאת עצמה בודקת את עבודתה שוב ושוב.`,
  context: `יעל מגיעה לפגישה לאחר שנעדרה מהעבודה כמה ימים. היא נמנעת מפגישות עם הצוות, נסוגה מאחריות, ומרגישה שהתמוטטות קרובה.`,
  thought: `"אם אכשל בפרויקט הזה, כולם יראו שאני חסרת כישרון לחלוטין ואפוטר — ואז לא אוכל מעולם למצוא עבודה טובה יותר"`,
  opening: `שלום... (נושמת עמוק) אני לא בטוחה מאיפה להתחיל. הפרויקט הזה מציף אותי. אני לא ישנה, לא מצליחה להתרכז... אני פשוט יודעת שאני הולכת להיכשל.`,
};

const MIN_QUESTIONS = 2;

type Phase = "intro" | "chat" | "analyzing" | "feedback" | "submitted";

interface ChatMsg { role: "user" | "assistant"; content: string; }

interface Props {
  moduleId: string;
  userId: string;
  existingSubmission: ExerciseSubmission | null;
  backHref: string;
}

export default function SocraticExercise({ moduleId, existingSubmission, backHref }: Props) {
  const [phase, setPhase] = useState<Phase>(existingSubmission ? "submitted" : "intro");
  const [caseOpen, setCaseOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function startChat() {
    setMessages([{ role: "assistant", content: CASE.opening }]);
    setPhase("chat");
    setCaseOpen(false);
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/socratic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", messages: updated }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "...לא הצלחתי לענות. נסה שוב." }]);
    } finally {
      setLoading(false);
    }
  }

  async function finish() {
    const qCount = messages.filter(m => m.role === "user").length;
    if (qCount < MIN_QUESTIONS) {
      setError(`יש לשאול לפחות ${MIN_QUESTIONS} שאלות לפני הסיום`);
      return;
    }
    setError("");
    setPhase("analyzing");
    try {
      const res = await fetch("/api/socratic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "feedback", messages }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } catch {
      setFeedback("לא ניתן לייצר משוב כרגע.");
    }
    setPhase("feedback");
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          answers: {
            conversation: messages,
            ai_feedback: feedback,
            question_count: messages.filter(m => m.role === "user").length,
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "שגיאה");
      setPhase("submitted");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בהגשה");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const qCount = messages.filter(m => m.role === "user").length;

  /* ── Submitted ── */
  if (phase === "submitted") {
    const isReviewed = existingSubmission?.status === "reviewed";
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl px-5 py-4 flex items-start gap-3 border ${isReviewed ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          {isReviewed
            ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            : <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
          <div>
            <p className={`font-semibold ${isReviewed ? "text-green-800" : "text-amber-800"}`}>
              {isReviewed ? "התרגיל נבדק!" : "התרגיל הוגש בהצלחה!"}
            </p>
            <p className={`text-sm mt-0.5 ${isReviewed ? "text-green-700" : "text-amber-700"}`}>
              {isReviewed
                ? `קיבלת ${existingSubmission?.points_awarded} נקודות`
                : "המרצה יעיין בשיחה ובמשוב ה-AI ויחזור אליך."}
            </p>
          </div>
        </div>
        {isReviewed && existingSubmission?.admin_feedback && (
          <div className="bg-white border border-green-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">משוב המרצה</p>
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{existingSubmission.admin_feedback}</p>
          </div>
        )}
        <a href={backHref} className="inline-flex text-sm text-brand-600 hover:text-brand-800 font-medium">← חזור למפגש</a>
      </div>
    );
  }

  /* ── Analyzing ── */
  if (phase === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-700 font-semibold text-lg">מנתח את השאלות הסוקרטיות שלך...</p>
        <p className="text-slate-400 text-sm">זה עשוי לקחת כמה שניות</p>
      </div>
    );
  }

  /* ── Feedback ── */
  if (phase === "feedback") {
    const sections = feedback.split(/(?=✅|⚠️|💡)/g).filter(Boolean);
    return (
      <div className="space-y-5">
        <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4">
          <h3 className="font-bold text-brand-900 text-lg">משוב על השאלות הסוקרטיות</h3>
          <p className="text-brand-600 text-sm mt-1">שאלת {qCount} שאלות בשיחה עם יעל</p>
        </div>

        {sections.length > 1 ? (
          <div className="space-y-3">
            {sections.map((section, i) => {
              const isPositive = section.startsWith("✅");
              const isImprovement = section.startsWith("⚠️");
              const isSummary = section.startsWith("💡");
              return (
                <div key={i} className={`rounded-2xl p-5 border ${
                  isPositive ? "bg-green-50 border-green-200" :
                  isImprovement ? "bg-amber-50 border-amber-200" :
                  isSummary ? "bg-blue-50 border-blue-200" :
                  "bg-white border-slate-200"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{section.trim()}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{feedback}</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <Send className="w-4 h-4 scale-x-[-1]" />
            {submitting ? "שומר..." : "הגש למרצה"}
          </button>
          <a href={backHref} className="text-sm text-slate-500 hover:text-slate-700">← חזור</a>
        </div>
      </div>
    );
  }

  /* ── Chat ── */
  if (phase === "chat") {
    return (
      <div className="space-y-4">
        {/* Collapsible case */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setCaseOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-3 text-right hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-600">📋 רקע המקרה — יעל</span>
            {caseOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {caseOpen && (
            <div className="px-5 pb-4 border-t border-slate-100 space-y-3 mt-3">
              <p className="text-xs text-slate-600 leading-relaxed">{CASE.background}</p>
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-orange-700 mb-1">המחשבה המטרידה:</p>
                <p className="text-sm text-orange-900 font-medium leading-relaxed">{CASE.thought}</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat window */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-rose-200 flex items-center justify-center text-sm">י</div>
              <span className="text-sm font-semibold text-slate-700">יעל (מטופלת)</span>
              <span className="text-xs text-slate-400 bg-slate-200 rounded-full px-2 py-0.5">AI</span>
            </div>
            <span className="text-xs text-slate-400">{qCount} שאלות</span>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto" style={{ minHeight: 300, maxHeight: 420 }} dir="rtl">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand-500 text-white rounded-tr-sm"
                    : "bg-slate-100 text-slate-800 rounded-tl-sm"
                }`}>
                  <span className={`text-xs font-semibold block mb-1 ${msg.role === "user" ? "text-brand-200" : "text-slate-400"}`}>
                    {msg.role === "user" ? "אתה (מטפל)" : "יעל"}
                  </span>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200 p-3 flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="כתוב/י שאלה סוקרטית... (Enter לשליחה)"
              rows={2}
              dir="rtl"
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors shrink-0"
            >
              <Send className="w-4 h-4 scale-x-[-1]" />
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={finish}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            סיים וקבל משוב
          </button>
          <span className="text-xs text-slate-400">לפחות {MIN_QUESTIONS} שאלות לפני סיום</span>
        </div>
      </div>
    );
  }

  /* ── Intro ── */
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setCaseOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-right hover:bg-slate-50 transition-colors"
        >
          <span className="font-bold text-brand-900">📋 רקע המקרה — יעל (חרדת ביצוע)</span>
          {caseOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {caseOpen && (
          <div className="px-5 pb-6 border-t border-slate-100 space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed mt-4">{CASE.background}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{CASE.context}</p>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">המחשבה המטרידה</p>
              <p className="text-base text-orange-900 font-semibold leading-relaxed">{CASE.thought}</p>
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-brand-700 mb-2">🎯 המשימה שלך</p>
              <p className="text-sm text-brand-800 leading-relaxed">
                השתמש/י בשאלות סוקרטיות כדי לערער את המחשבה של יעל — לא לשכנע בכוח,
                אלא לפתוח פתח לחשיבה גמישה יותר. יעל תגיב ברמת התנגדות בינונית.
                בסיום תקבל/י משוב אוטומטי על איכות השאלות.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={startChat}
          className="bg-brand-500 hover:bg-brand-700 text-white font-bold px-12 py-4 rounded-2xl text-lg transition-colors shadow-lg"
        >
          ▶ התחל שיחה עם יעל
        </button>
      </div>

      <a href={backHref} className="inline-flex text-sm text-slate-500 hover:text-slate-700">← חזור</a>
    </div>
  );
}
