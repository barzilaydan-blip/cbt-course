"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Save, Plus, Trash2, ChevronLeft, CheckCircle } from "lucide-react";
import type { Module, Quiz, QuizQuestion } from "@/types";

interface Props {
  mod: Module;
  initialQuiz: Quiz | null;
}

export default function AdminModuleEditor({ mod, initialQuiz }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [videoUrl, setVideoUrl] = useState(mod.video_url ?? "");
  const [articleUrl, setArticleUrl] = useState(mod.article_url ?? "");
  const [podcastUrl, setPodcastUrl] = useState(mod.podcast_url ?? "");
  const [weeklyChallenge, setWeeklyChallenge] = useState(mod.weekly_challenge ?? "");
  const [weeklyChallengeUrl, setWeeklyChallengeUrl] = useState(mod.weekly_challenge_url ?? "");
  const [meetingDate, setMeetingDate] = useState(mod.meeting_date ?? "");
  const [accessMode, setAccessMode] = useState<"locked" | "open" | "auto">(mod.access_mode ?? "auto");
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuiz?.questions ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addQuestion() {
    setQuestions([...questions, {
      question_he: "",
      options_he: ["", "", "", ""],
      correct_index: 0,
      explanation_he: "",
    }]);
    setSaved(false);
  }

  function removeQuestion(i: number) {
    setQuestions(questions.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function updateQuestion(i: number, field: keyof QuizQuestion, value: unknown) {
    setQuestions(questions.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
    setSaved(false);
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuestions(questions.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = [...q.options_he];
      opts[oi] = value;
      return { ...q, options_he: opts };
    }));
    setSaved(false);
  }

  function toEmbedUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
  }

  async function handleSave() {
    setSaving(true);

    // Update module URLs + weekly challenge + meeting date
    await supabase.from("modules").update({
      video_url: toEmbedUrl(videoUrl),
      article_url: articleUrl || null,
      podcast_url: podcastUrl || null,
      weekly_challenge: weeklyChallenge.trim() || null,
      weekly_challenge_url: weeklyChallengeUrl.trim() || null,
      meeting_date: meetingDate || null,
      access_mode: accessMode,
    }).eq("id", mod.id);

    // Upsert quiz
    if (questions.length > 0) {
      await supabase.from("quizzes").upsert({
        id: initialQuiz?.id,
        module_id: mod.id,
        questions,
      }, { onConflict: "module_id" });
    }

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-brand-500 flex items-center gap-1 mb-1">
            <ChevronLeft className="w-4 h-4 rotate-180" />
            חזור לניהול
          </Link>
          <h1 className="text-xl font-bold text-brand-900">
            עריכת מפגש {mod.order_number}
          </h1>
          <p className="text-slate-600 mt-0.5">{mod.title_he}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "שומר..." : saved ? "נשמר!" : "שמור שינויים"}
        </button>
      </div>

      {/* Content URLs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-brand-900 border-b border-slate-100 pb-3">🔗 קישורי תוכן</h2>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">📹 קישור סרטון (YouTube embed URL)</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => { setVideoUrl(e.target.value); setSaved(false); }}
            placeholder="https://www.youtube.com/embed/..."
            className="input-he"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">📄 קישור מאמר</label>
          <input
            type="url"
            value={articleUrl}
            onChange={(e) => { setArticleUrl(e.target.value); setSaved(false); }}
            placeholder="https://..."
            className="input-he"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">🎙 קישור פודקאסט</label>
          <input
            type="url"
            value={podcastUrl}
            onChange={(e) => { setPodcastUrl(e.target.value); setSaved(false); }}
            placeholder="https://..."
            className="input-he"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">📅 תאריך מפגש</label>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => { setMeetingDate(e.target.value); setSaved(false); }}
            className="input-he"
            dir="ltr"
          />
          <p className="text-xs text-slate-400 mt-1">תאריך זה ישמש לסילבוס ולהצגת המפגש הקרוב בדשבורד</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">🔐 גישת סטודנטים</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {([
              { value: "auto",   icon: "⚡", title: "אוטומטי", desc: "נפתח שבוע לפני המועד או כשהשיעור הקודם הושלם" },
              { value: "open",   icon: "🔓", title: "פתוח",    desc: "פתוח תמיד לכל הסטודנטים" },
              { value: "locked", icon: "🔒", title: "נעול",    desc: "חסום לסטודנטים (רק מנהל יכול לצפות)" },
            ] as const).map(({ value, icon, title, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setAccessMode(value); setSaved(false); }}
                className={`text-right p-3 rounded-xl border-2 transition-all ${
                  accessMode === value
                    ? value === "locked"
                      ? "border-red-400 bg-red-50"
                      : value === "open"
                      ? "border-green-400 bg-green-50"
                      : "border-brand-400 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="font-semibold text-slate-800 text-sm">{icon} {title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly challenge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-brand-900 border-b border-slate-100 pb-3">🎯 אתגר אישי שבועי</h2>
        <p className="text-sm text-slate-500">
          תיאור חוויתי לתרגול עצמאי במהלך השבוע. יופיע בטאב ייעודי בדף המפגש.
        </p>
        <textarea
          rows={6}
          value={weeklyChallenge}
          onChange={(e) => { setWeeklyChallenge(e.target.value); setSaved(false); }}
          placeholder={"השבוע, נסה לשים לב למחשבה אוטומטית אחת שעולה בך ברגע של לחץ...\nשאל את עצמך:\n• מה הרגשתי?\n• מה חשבתי?\n• מה עשיתי?"}
          className="input-he resize-none leading-relaxed"
        />
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">🔗 קישור לטופס / סרטון (אופציונלי)</label>
          <input
            type="url"
            value={weeklyChallengeUrl}
            onChange={(e) => { setWeeklyChallengeUrl(e.target.value); setSaved(false); }}
            placeholder="https://forms.google.com/... או https://youtube.com/..."
            className="input-he"
            dir="ltr"
          />
        </div>
      </div>

      {/* Quiz editor */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-brand-900">✍️ שאלות חידון</h2>
          <button onClick={addQuestion} className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 font-semibold">
            <Plus className="w-4 h-4" />
            הוסף שאלה
          </button>
        </div>

        {questions.length === 0 && (
          <div className="text-center text-slate-400 py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <p>אין שאלות עדיין</p>
            <button onClick={addQuestion} className="mt-3 text-brand-500 hover:text-brand-700 font-semibold text-sm flex items-center gap-1 mx-auto">
              <Plus className="w-4 h-4" />
              הוסף שאלה ראשונה
            </button>
          </div>
        )}

        {questions.map((q, qi) => (
          <div key={qi} className="border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-700 text-sm">שאלה {qi + 1}</span>
              <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">טקסט השאלה</label>
              <textarea
                rows={2}
                value={q.question_he}
                onChange={(e) => updateQuestion(qi, "question_he", e.target.value)}
                placeholder="מהו...?"
                className="input-he resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">אפשרויות תשובה</label>
              {q.options_he.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correct_index === oi}
                    onChange={() => updateQuestion(qi, "correct_index", oi)}
                    className="accent-brand-500 shrink-0"
                    title="סמן כתשובה נכונה"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`אפשרות ${oi + 1}`}
                    className="input-he flex-1"
                  />
                  {q.correct_index === oi && (
                    <span className="text-xs text-green-600 font-semibold shrink-0">✓ נכון</span>
                  )}
                </div>
              ))}
              <p className="text-xs text-slate-400">לחץ על עיגול כדי לסמן את התשובה הנכונה</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">הסבר (יוצג לאחר תשובה)</label>
              <textarea
                rows={2}
                value={q.explanation_he}
                onChange={(e) => updateQuestion(qi, "explanation_he", e.target.value)}
                placeholder="הסבר מדוע זו התשובה הנכונה..."
                className="input-he resize-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
