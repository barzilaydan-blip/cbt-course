"use client";
import { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle, Send } from "lucide-react";
import type { ExerciseSubmission } from "@/types";

const DURATION = 120; // seconds

const REFLECTION = [
  { key: "r1" as const, text: "האם הצלחת להישאר ממוקד/ת במחשבות?" },
  { key: "r2" as const, text: "מה המחשבה המתעוררת לנוכח חלוקת המחשבות בין הסלים?" },
  { key: "r3" as const, text: "האם חווית התרגיל הייתה כפי שציפית?" },
];

function playBell() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    [0, 0.3, 0.6].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 528;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 1.2);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 1.2);
    });
  } catch (_) {}
}

interface Props {
  moduleId: string;
  userId: string;
  existingSubmission: ExerciseSubmission | null;
  backHref: string;
}

type Phase = "intro" | "active" | "summary" | "submitted";

export default function ThoughtBasketExercise({ moduleId, existingSubmission, backHref }: Props) {
  const [phase, setPhase] = useState<Phase>(existingSubmission ? "submitted" : "intro");
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [counts, setCounts] = useState({ positive: 0, neutral: 0, negative: 0 });
  const [reflection, setReflection] = useState({ r1: "", r2: "", r3: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastSubmitted, setLastSubmitted] = useState<Record<string, unknown> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function start() {
    setCounts({ positive: 0, neutral: 0, negative: 0 });
    setTimeLeft(DURATION);
    setPhase("active");
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          playBell();
          setPhase("summary");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function add(type: "positive" | "neutral" | "negative") {
    setCounts(p => ({ ...p, [type]: p[type] + 1 }));
  }

  async function submit() {
    if (!reflection.r1.trim() || !reflection.r2.trim() || !reflection.r3.trim()) {
      setError("יש למלא את כל שאלות הרפלקציה לפני ההגשה");
      return;
    }
    setSubmitting(true);
    setError("");
    const answers = {
      positive_count: counts.positive,
      neutral_count: counts.neutral,
      negative_count: counts.negative,
      total_count: counts.positive + counts.neutral + counts.negative,
      ...reflection,
    };
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, answers }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "שגיאה בהגשה");
      setLastSubmitted(answers);
      setPhase("submitted");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
    } finally {
      setSubmitting(false);
    }
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const total = counts.positive + counts.neutral + counts.negative;

  /* ── Submitted / Reviewed ── */
  if (phase === "submitted") {
    const ans = existingSubmission?.answers ?? lastSubmitted ?? {};
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
                : "המרצה יבדוק אותו ויחזור אליך עם משוב בקרוב."}
            </p>
          </div>
        </div>

        {isReviewed && existingSubmission?.admin_feedback && (
          <div className="bg-white border border-green-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">משוב המרצה</p>
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{existingSubmission.admin_feedback}</p>
          </div>
        )}

        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">סיכום המחשבות</p>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "מחשבות טובות", key: "positive_count", cls: "bg-green-100 text-green-800" },
              { label: "מחשבות ניטרליות", key: "neutral_count", cls: "bg-slate-200 text-slate-700" },
              { label: "מחשבות רעות", key: "negative_count", cls: "bg-red-100 text-red-800" },
            ].map(b => (
              <div key={b.key} className={`${b.cls} rounded-2xl px-5 py-4 text-center flex-1 min-w-[90px]`}>
                <div className="text-3xl font-bold">{ans[b.key] as number ?? 0}</div>
                <div className="text-xs mt-1 font-medium">{b.label}</div>
              </div>
            ))}
          </div>
          {REFLECTION.map((q, i) => (
            <div key={q.key}>
              <p className="text-xs font-semibold text-brand-700 mb-1">{i + 1}. {q.text}</p>
              <p className="text-sm text-slate-700 bg-white rounded-xl border border-slate-100 px-4 py-3 leading-relaxed">
                {(ans[q.key] as string) || <span className="text-slate-300 italic">לא מולא</span>}
              </p>
            </div>
          ))}
        </div>
        <a href={backHref} className="inline-flex text-sm text-brand-600 hover:text-brand-800 font-medium">← חזור למפגש</a>
      </div>
    );
  }

  /* ── Summary + Reflection ── */
  if (phase === "summary") {
    return (
      <div className="space-y-6">
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5">
          <p className="font-bold text-brand-900 text-lg mb-1">✓ הזמן הסתיים!</p>
          <p className="text-brand-700 text-sm mb-4">סיכום המחשבות שמיינת:</p>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "מחשבות טובות", count: counts.positive, cls: "bg-green-100 text-green-800 border-green-200" },
              { label: "מחשבות ניטרליות", count: counts.neutral, cls: "bg-slate-100 text-slate-700 border-slate-300" },
              { label: "מחשבות רעות", count: counts.negative, cls: "bg-red-100 text-red-800 border-red-200" },
            ].map(b => (
              <div key={b.label} className={`${b.cls} border rounded-2xl px-5 py-4 text-center flex-1 min-w-[90px]`}>
                <div className="text-3xl font-bold">{b.count}</div>
                <div className="text-xs mt-1 font-medium">{b.label}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-brand-600 mt-3 font-medium">סה&quot;כ {total} מחשבות</p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-brand-900">רפלקציה קצרה</h3>
          {REFLECTION.map((q, i) => (
            <div key={q.key} className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-brand-700 mb-3">{i + 1}. {q.text}</p>
              <textarea
                value={reflection[q.key]}
                onChange={e => setReflection(p => ({ ...p, [q.key]: e.target.value }))}
                placeholder="כתוב/י את תשובתך כאן..."
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={submitting || !reflection.r1.trim() || !reflection.r2.trim() || !reflection.r3.trim()}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <Send className="w-4 h-4 scale-x-[-1]" />
            {submitting ? "מגיש..." : "הגש תרגיל"}
          </button>
          <a href={backHref} className="text-sm text-slate-500 hover:text-slate-700">← חזור</a>
        </div>
      </div>
    );
  }

  /* ── Active Exercise ── */
  if (phase === "active") {
    return (
      <div className="space-y-6 select-none">
        <style>{`
          @keyframes breathe {
            0%,100% { transform:scale(1); box-shadow:0 0 12px 4px rgba(0,0,0,.12); }
            50%      { transform:scale(1.9); box-shadow:0 0 48px 16px rgba(0,0,0,.08); }
          }
        `}</style>

        {/* Timer */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 bg-slate-800 text-white rounded-2xl px-5 py-2 font-mono font-bold text-lg">
            <Clock className="w-4 h-4 opacity-60" />
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>

        {/* Pulsing dot */}
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <div style={{
            width: 70, height: 70,
            backgroundColor: "#000",
            borderRadius: "50%",
            animation: "breathe 6s ease-in-out infinite",
          }} />
        </div>

        {/* Instruction reminder */}
        <p className="text-center text-sm text-slate-400">
          כשתתעורר מחשבה — לחץ/י על הסל המתאים
        </p>

        {/* Baskets – RTL: right=רעות, center=ניטרליות, left=טובות */}
        <div dir="rtl" className="flex gap-3 justify-center">
          <button
            onClick={() => add("negative")}
            className="flex-1 max-w-[140px] bg-red-50 hover:bg-red-100 active:scale-95 border-2 border-red-200 hover:border-red-400 rounded-2xl py-5 px-2 text-center transition-all"
          >
            <div className="text-4xl mb-2">🗑️</div>
            <div className="font-semibold text-red-800 text-xs leading-tight">מחשבות<br/>רעות</div>
            <div className="text-red-600 text-3xl font-bold mt-3">{counts.negative}</div>
          </button>

          <button
            onClick={() => add("neutral")}
            className="flex-1 max-w-[140px] bg-slate-50 hover:bg-slate-100 active:scale-95 border-2 border-slate-200 hover:border-slate-400 rounded-2xl py-5 px-2 text-center transition-all"
          >
            <div className="text-4xl mb-2">🧺</div>
            <div className="font-semibold text-slate-600 text-xs leading-tight">מחשבות<br/>ניטרליות</div>
            <div className="text-slate-600 text-3xl font-bold mt-3">{counts.neutral}</div>
          </button>

          <button
            onClick={() => add("positive")}
            className="flex-1 max-w-[140px] bg-green-50 hover:bg-green-100 active:scale-95 border-2 border-green-200 hover:border-green-400 rounded-2xl py-5 px-2 text-center transition-all"
          >
            <div className="text-4xl mb-2">✨</div>
            <div className="font-semibold text-green-800 text-xs leading-tight">מחשבות<br/>טובות</div>
            <div className="text-green-600 text-3xl font-bold mt-3">{counts.positive}</div>
          </button>
        </div>

        <p className="text-center text-xs text-slate-300">סה&quot;כ {total} מחשבות</p>
      </div>
    );
  }

  /* ── Intro ── */
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-bold text-brand-900 text-lg mb-4">מדיטציית מיון מחשבות</h2>
        <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 leading-relaxed space-y-3">
          <p>
            בשתי הדקות הקרובות תתמקד/י בנקודה השחורה.
            נסה/י לרוקן את הראש מכל מחשבה.
          </p>
          <p>
            כשתתעורר מחשבה — לכוד/י אותה והכניס/י אותה לאחד הסלים בהתאם לתוכנה,
            ולאחר מכן החזר/י את תשומת הלב לנקודה השחורה.
          </p>
          <div dir="rtl" className="flex gap-2 flex-wrap mt-3">
            <span className="bg-red-100 text-red-800 rounded-lg px-3 py-1.5 text-xs font-medium">🗑️ מחשבות רעות — ימין</span>
            <span className="bg-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium">🧺 מחשבות ניטרליות — אמצע</span>
            <span className="bg-green-100 text-green-800 rounded-lg px-3 py-1.5 text-xs font-medium">✨ מחשבות טובות — שמאל</span>
          </div>
          <p className="text-slate-500 text-xs pt-1">
            התרגיל ימשך 2 דקות. בסיומו ישמע צליל ויופיעו שאלות רפלקציה קצרות.
          </p>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={start}
          className="bg-brand-500 hover:bg-brand-700 text-white font-bold px-12 py-4 rounded-2xl text-lg transition-colors shadow-lg"
        >
          ▶ התחל
        </button>
      </div>

      <a href={backHref} className="inline-flex text-sm text-slate-500 hover:text-slate-700">← חזור</a>
    </div>
  );
}
