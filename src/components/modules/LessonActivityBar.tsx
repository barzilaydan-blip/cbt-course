"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Mic, MessageSquare, HelpCircle, Download,
  ExternalLink, Check, ChevronLeft, ArrowLeft, Target, Clock,
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
              <h3 className="text-lg font-bold text-brand-900 mb-1">מאמר רלוונטי</h3>
              <p className="text-base text-slate-600 leading-relaxed">
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
                  className="btn-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                  פתח מאמר
                </a>
                {!readDone && (
                  <button
                    onClick={markRead}
                    disabled={saving}
                    className="btn-secondary"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "שומר..." : "סמן כנקרא · +10 נק'"}
                  </button>
                )}
                {readDone && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                    <Check className="w-4 h-4" aria-hidden="true" />
                    הושלם
                  </span>
                )}
              </div>
            ) : (
              <p className="text-base text-slate-600 italic">מאמר יתווסף בקרוב</p>
            )}
          </div>
        );

      case "podcast":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-brand-900 mb-1">פודקאסט</h3>
              <p className="text-base text-slate-600 leading-relaxed">
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
                  className="btn-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                  פתח פודקאסט
                </a>
                {!readDone && (
                  <button
                    onClick={markRead}
                    disabled={saving}
                    className="btn-secondary"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "שומר..." : "סמן כהאזנה · +10 נק'"}
                  </button>
                )}
                {readDone && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                    <Check className="w-4 h-4" aria-hidden="true" />
                    הושלם
                  </span>
                )}
              </div>
            ) : (
              <p className="text-base text-slate-600 italic">פודקאסט יתווסף בקרוב</p>
            )}
          </div>
        );

      case "practice":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-brand-900 mb-1">
                {module.order_number === 1
                  ? "בוא נכיר"
                  : module.order_number === 2
                  ? "משחק מיון"
                  : module.order_number === 4
                  ? "תרגיל קליני"
                  : module.order_number === 6
                  ? "תרגיל מיינדפולנס"
                  : module.order_number === 9
                  ? "בניית המשגה קלינית"
                  : module.order_number === 10
                  ? "נווט הדאגה"
                  : "תרגול עם AI"}
              </h3>
              <p className="text-base text-slate-600 leading-relaxed">
                {module.order_number === 1
                  ? "ספר לנו קצת על עצמך ועל הציפיות שלך מהקורס"
                  : module.order_number === 2
                  ? "התאם כל פריט לקטגוריה הנכונה על פי המודל הקוגניטיבי — כ־15 דקות"
                  : module.order_number === 4
                  ? "ניתוח מקרה קליני — שלח למרצה לבדיקה ומשוב"
                  : module.order_number === 6
                  ? "תרגיל לפיתוח הערנות לזיהוי מחשבות אוטומטיות (משך — 3 דקות)"
                  : module.order_number === 9
                  ? "מילוי שדות המשגה מלאים, ולאחר ההגשה — יצירת היפותזת עבודה בעזרת AI"
                  : module.order_number === 10
                  ? "תרשים החלטה טיפולי אינטראקטיבי לטיפול בדאגנות יתר — כ 15 דק'"
                  : "שיחת תרגול עם סופרוויזר AI ומשוב אישי — כ־15 דקות"}
              </p>
            </div>

            {(module.order_number === 1 || module.order_number === 4) && exerciseStatus && (
              <div className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg w-fit ring-1 ring-inset ${
                exerciseStatus === "reviewed"
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : "bg-amber-50 text-amber-800 ring-amber-200"
              }`}>
                {exerciseStatus === "reviewed" ? <Check className="w-4 h-4" aria-hidden="true" /> : <Clock className="w-4 h-4" aria-hidden="true" />}
                {module.order_number === 1
                  ? exerciseStatus === "reviewed" ? "תגובת המרצה התקבלה" : "ממתין לתגובת המרצה"
                  : exerciseStatus === "reviewed" ? "נבדק ומשוב התקבל" : "ממתין לבדיקת המרצה"}
              </div>
            )}

            {practiceDone && module.order_number !== 4 && module.order_number !== 1 && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                <Check className="w-4 h-4" aria-hidden="true" />
                הושלם
              </span>
            )}

            <a
              href={`/modules/${moduleId}/practice`}
              className="btn-primary"
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
              <h3 className="text-lg font-bold text-brand-900 mb-1">בחן את עצמך</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                חידון הבנה לבדיקת הידע שנצבר — כ־10 דקות
              </p>
            </div>
            {quizDone && (
              <div className="flex items-center gap-2 bg-emerald-50 ring-1 ring-inset ring-emerald-200 rounded-lg px-4 py-2.5 w-fit">
                <Check className="w-4 h-4 text-emerald-800" aria-hidden="true" />
                <span className="text-sm font-semibold text-emerald-800">החידון הושלם · ציון {progress?.quiz_score}%</span>
              </div>
            )}
            <a
              href={`/modules/${moduleId}/quiz`}
              className="btn-primary"
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
              <h3 className="text-lg font-bold text-brand-900 mb-1">אתגר אישי שבועי</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                תרגול עצמאי וחוויתי של מה שנלמד במפגש זה — במהלך השבוע הקרוב
              </p>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
              <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm mb-3">
                <Target className="w-4 h-4" />
                האתגר שלך לשבוע הקרוב
              </div>
              <p className="prose-he whitespace-pre-wrap">{weeklyChallenge}</p>
            </div>
            {weeklyChallengeUrl && (
              <a
                href={weeklyChallengeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
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
              <h3 className="text-lg font-bold text-brand-900 mb-1">חומרים להורדה</h3>
              <p className="text-base text-slate-600">טפסים וכלים לשיעור זה</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {resources.map(res => (
                <a
                  key={res.id}
                  href={res.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={res.file_name ?? true}
                  className="flex items-center gap-3 px-4 py-3 min-h-[56px] bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-xl transition-colors group"
                >
                  <Download className="w-4 h-4 text-slate-500 group-hover:text-brand-500 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">{res.title_he}</p>
                    <span className="text-xs text-brand-500 font-medium">{res.category}</span>
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        );
    }
  }

  return (
    <section aria-label="חלקי הלמידה" className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      {/* Tab Bar */}
      <div role="tablist" aria-label="חלקי הלמידה" className="flex border-b border-slate-200 bg-slate-50/60 overflow-x-auto">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active}
              aria-controls="lesson-panel"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "relative flex flex-1 flex-col items-center justify-center gap-1.5 min-w-[4.75rem] min-h-[64px] px-3 sm:px-6 py-3 text-sm font-semibold whitespace-nowrap",
                "transition-colors duration-200 shrink-0 border-b-2 -mb-px",
                active
                  ? "border-brand-500 text-brand-700 bg-white"
                  : "border-transparent text-slate-600 hover:text-brand-700 hover:bg-white/70",
              ].join(" ")}
            >
              {/* Icon with completion badge */}
              <span className="relative">
                {tab.icon}
                {tab.done && (
                  <span className="absolute -top-1.5 -end-2 w-4 h-4 bg-emerald-600 rounded-full ring-2 ring-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span>
                {tab.label}
                {tab.done && <span className="sr-only"> — הושלם</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div id="lesson-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="px-5 sm:px-8 py-6 sm:py-8">
        <TabContent />
      </div>
    </section>
  );
}
