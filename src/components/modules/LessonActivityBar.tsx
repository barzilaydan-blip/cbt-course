"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Mic, MessageSquare, HelpCircle, Download,
  ExternalLink, Check, ChevronLeft, ArrowLeft, Target,
} from "lucide-react";
import type { Module, Progress, Resource } from "@/types";

interface Props {
  moduleId: string;
  userId: string;
  module: Module;
  progress: Progress | null;
  exerciseStatus: "submitted" | "reviewed" | null;
  resources: Resource[];
  weeklyChallenge: string | null;
  weeklyChallengeUrl: string | null;
}

type TabId = "article" | "podcast" | "practice" | "quiz" | "challenge" | "downloads";

export default function LessonActivityBar({
  moduleId,
  userId,
  module,
  progress,
  exerciseStatus,
  resources,
  weeklyChallenge,
  weeklyChallengeUrl,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("article");
  const [readDone, setReadDone] = useState(progress?.article_read ?? false);
  const [saving, setSaving] = useState(false);

  const hasArticle = !!module.article_url;
  const hasPodcast = !!module.podcast_url;
  const hasResources = resources.length > 0;
  const quizDone = progress?.quiz_completed ?? false;
  const practiceDone =
    module.order_number === 4 || module.order_number === 1
      ? !!exerciseStatus
      : progress?.practice_completed ?? false;

  async function markRead() {
    if (readDone || saving) return;
    setSaving(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, userId, field: "article_read", value: true }),
    });
    setReadDone(true);
    setSaving(false);
    router.refresh();
  }

  // ── Tab definitions ─────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: React.ReactNode; done: boolean; hidden?: boolean }[] = [
    {
      id: "article",
      label: "מאמר",
      icon: <FileText className="w-5 h-5" />,
      done: readDone,
      hidden: false,
    },
    {
      id: "podcast",
      label: "פודקאסט",
      icon: <Mic className="w-5 h-5" />,
      done: readDone,
      hidden: false,
    },
    {
      id: "practice",
      label: module.order_number === 2 ? "משחק" : module.order_number === 4 ? "תרגיל" : "תרגול",
      icon: <MessageSquare className="w-5 h-5" />,
      done: practiceDone,
    },
    {
      id: "quiz",
      label: "חידון",
      icon: <HelpCircle className="w-5 h-5" />,
      done: quizDone,
    },
    {
      id: "challenge",
      label: "אתגר",
      icon: <Target className="w-5 h-5" />,
      done: false,
      hidden: !weeklyChallenge,
    },
    {
      id: "downloads",
      label: "חומרים",
      icon: <Download className="w-5 h-5" />,
      done: false,
      hidden: !hasResources,
    },
  ].filter(t => !t.hidden);

  // ── Tab content ──────────────────────────────────────────────
  function TabContent() {
    switch (activeTab) {
      case "article":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-brand-900 mb-1">מאמר רלוונטי</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                קריאה משלימה לחיזוק הלמידה — כ־8 דקות קריאה
              </p>
            </div>
            {hasArticle ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={module.article_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { if (!readDone) markRead(); }}
                  className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  פתח מאמר
                </a>
                {!readDone && (
                  <button
                    onClick={markRead}
                    disabled={saving}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-5 py-2.5 rounded-xl transition-all duration-300 disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "שומר..." : "סמן כנקרא · +10 נק'"}
                  </button>
                )}
                {readDone && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                    הושלם
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">מאמר יתווסף בקרוב</p>
            )}
          </div>
        );

      case "podcast":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-brand-900 mb-1">פודקאסט</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                האזנה לתוכן מורחב — כ־20 דקות האזנה
              </p>
            </div>
            {hasPodcast ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={module.podcast_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { if (!readDone) markRead(); }}
                  className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  פתח פודקאסט
                </a>
                {!readDone && (
                  <button
                    onClick={markRead}
                    disabled={saving}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-5 py-2.5 rounded-xl transition-all duration-300 disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "שומר..." : "סמן כהאזנה · +10 נק'"}
                  </button>
                )}
                {readDone && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                    הושלם
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">פודקאסט יתווסף בקרוב</p>
            )}
          </div>
        );

      case "practice":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-brand-900 mb-1">
                {module.order_number === 1
                  ? "בוא נכיר"
                  : module.order_number === 2
                  ? "משחק מיון"
                  : module.order_number === 4
                  ? "תרגיל קליני"
                  : "תרגול עם AI"}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {module.order_number === 1
                  ? "ספר לנו קצת על עצמך ועל הציפיות שלך מהקורס"
                  : module.order_number === 2
                  ? "התאם כל פריט לקטגוריה הנכונה על פי המודל הקוגניטיבי — כ־15 דקות"
                  : module.order_number === 4
                  ? "ניתוח מקרה קליני — שלח למרצה לבדיקה ומשוב"
                  : "שיחת תרגול עם סופרוויזר AI ומשוב אישי — כ־15 דקות"}
              </p>
            </div>

            {(module.order_number === 1 || module.order_number === 4) && exerciseStatus && (
              <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl w-fit ${
                exerciseStatus === "reviewed"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {module.order_number === 1
                  ? exerciseStatus === "reviewed" ? "✓ תגובת המרצה התקבלה" : "⏳ ממתין לתגובת המרצה"
                  : exerciseStatus === "reviewed" ? "✓ נבדק ומשוב התקבל" : "⏳ ממתין לבדיקת המרצה"}
              </div>
            )}

            {practiceDone && module.order_number !== 4 && module.order_number !== 1 && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                הושלם
              </span>
            )}

            <a
              href={`/modules/${moduleId}/practice`}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {module.order_number === 1
                ? exerciseStatus === "reviewed" ? "צפה בתגובה" : exerciseStatus ? "צפה בטופס" : "מלא טופס"
                : module.order_number === 4
                ? exerciseStatus === "reviewed" ? "צפה במשוב" : exerciseStatus ? "צפה בתרגיל" : "התחל תרגיל"
                : practiceDone
                ? module.order_number === 2 ? "שחק שוב" : "תרגל שוב"
                : module.order_number === 2 ? "התחל משחק" : "התחל תרגול"}
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-brand-900 mb-1">בחן את עצמך</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                חידון הבנה לבדיקת הידע שנצבר — כ־10 דקות
              </p>
            </div>
            {quizDone && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 w-fit">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">★</span>
                <span className="text-sm font-semibold text-amber-700">ציון: {progress?.quiz_score}%</span>
              </div>
            )}
            <a
              href={`/modules/${moduleId}/quiz`}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {quizDone ? "חזור לחידון" : "התחל חידון"}
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        );

      case "challenge":
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-brand-900 mb-1">אתגר אישי שבועי</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                תרגול עצמאי וחוויתי של מה שנלמד במפגש זה — במהלך השבוע הקרוב
              </p>
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm mb-3">
                <Target className="w-4 h-4" />
                האתגר שלך לשבוע הקרוב
              </div>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{weeklyChallenge}</p>
            </div>
            {weeklyChallengeUrl && (
              <a
                href={weeklyChallengeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                פתח טופס / סרטון
              </a>
            )}
          </div>
        );

      case "downloads":
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-brand-900 mb-1">חומרים להורדה</h3>
              <p className="text-sm text-slate-500">טפסים וכלים לשיעור זה</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {resources.map(res => (
                <a
                  key={res.id}
                  href={res.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={res.file_name ?? true}
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-xl transition-all group"
                >
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 group-hover:text-brand-700 truncate">{res.title_he}</p>
                    {res.file_type && <span className="text-xs text-slate-400 uppercase">{res.file_type}</span>}
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        );
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "relative flex flex-col items-center gap-1.5 px-6 py-4 text-xs font-medium whitespace-nowrap",
              "transition-colors duration-200 shrink-0 border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            {/* Icon with completion badge */}
            <div className="relative">
              <span className={activeTab === tab.id ? "text-brand-500" : "text-slate-400"}>
                {tab.icon}
              </span>
              {tab.done && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Check className="w-2 h-2 text-white stroke-[3]" />
                </span>
              )}
            </div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-7 py-8">
        <TabContent />
      </div>
    </div>
  );
}
