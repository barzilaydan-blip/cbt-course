"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Mic, CircleCheck, MessageSquare, Download } from "lucide-react";
import LessonResourceCard from "./LessonResourceCard";
import type { Module, Progress, Resource } from "@/types";

interface Props {
  moduleId: string;
  userId: string;
  module: Module;
  progress: Progress | null;
  exerciseStatus: "submitted" | "reviewed" | null;
  resources: Resource[];
}

export default function LessonResourcesGrid({
  moduleId,
  userId,
  module,
  progress,
  exerciseStatus,
  resources,
}: Props) {
  const router = useRouter();
  const [articleDone, setArticleDone] = useState(progress?.article_read ?? false);
  const [podcastDone, setPodcastDone] = useState(progress?.article_read ?? false);
  const [saving, setSaving] = useState<"article" | "podcast" | null>(null);

  async function markComplete(field: "article_read") {
    const key = field === "article_read" ? (module.article_url ? "article" : "podcast") : "article";
    setSaving(key as "article" | "podcast");
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, userId, field, value: true }),
      });
      if (field === "article_read") {
        setArticleDone(true);
        setPodcastDone(true); // both map to same DB field
      }
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  // Practice card label/status for module 4
  const practiceTitle =
    module.order_number === 2
      ? "משחק מיון"
      : module.order_number === 4
      ? "תרגיל קליני"
      : "תרגול עם AI";

  const practiceDescription =
    module.order_number === 2
      ? "התאם כל פריט לקטגוריה הנכונה"
      : module.order_number === 4
      ? "ניתוח מקרה קליני — שלח למרצה לבדיקה"
      : "שיחת תרגול עם סופרוויזר AI ומשוב אישי";

  const practiceCompleted =
    module.order_number === 4
      ? exerciseStatus === "reviewed"
      : progress?.practice_completed ?? false;

  const practiceLabel =
    module.order_number === 4
      ? exerciseStatus === "reviewed"
        ? "נבדק ✓"
        : exerciseStatus
        ? "ממתין לבדיקה"
        : undefined
      : progress?.practice_completed
      ? "הושלם ✓"
      : undefined;

  const hasArticle = !!module.article_url;
  const hasPodcast = !!module.podcast_url;
  const hasResources = resources.length > 0;
  const readDone = articleDone || podcastDone;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* Article */}
      <LessonResourceCard
        icon={FileText}
        iconBg="bg-violet-100"
        iconColor="text-violet-600"
        title="מאמר רלוונטי"
        description="קריאה משלימה לחיזוק הלמידה"
        duration="~8 דק' קריאה"
        isCompleted={readDone}
        externalHref={module.article_url ?? undefined}
        onClick={hasArticle && !readDone ? () => markComplete("article_read") : undefined}
        disabled={!hasArticle}
      />

      {/* Podcast */}
      <LessonResourceCard
        icon={Mic}
        iconBg="bg-pink-100"
        iconColor="text-pink-600"
        title="פודקאסט"
        description="האזנה לתוכן מורחב"
        duration="~20 דק' האזנה"
        isCompleted={readDone}
        externalHref={module.podcast_url ?? undefined}
        onClick={hasPodcast && !readDone ? () => markComplete("article_read") : undefined}
        disabled={!hasPodcast}
      />

      {/* Quiz */}
      <LessonResourceCard
        icon={CircleCheck}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        title="בחן את עצמך"
        description="חידון הבנה + נקודות"
        duration="~10 דק' חידון"
        isCompleted={progress?.quiz_completed ?? false}
        completedLabel={progress?.quiz_completed ? `ציון: ${progress.quiz_score}%` : undefined}
        href={`/modules/${moduleId}/quiz`}
      />

      {/* Practice */}
      <LessonResourceCard
        icon={MessageSquare}
        iconBg="bg-teal-100"
        iconColor="text-teal-600"
        title={practiceTitle}
        description={practiceDescription}
        duration="~15 דק' תרגול"
        isCompleted={practiceCompleted}
        completedLabel={practiceLabel}
        href={`/modules/${moduleId}/practice`}
      />

      {/* Downloads — only if resources exist */}
      {hasResources && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 rounded-xl p-2.5">
              <Download className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-brand-900">חומרים להורדה</h3>
              <p className="text-xs text-slate-500">טפסים וכלים לשיעור זה · הורדה מיידית</p>
            </div>
          </div>
          <div className="grid gap-2">
            {resources.map((res) => (
              <a
                key={res.id}
                href={res.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download={res.file_name ?? true}
                className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all group"
              >
                <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-teal-700 truncate">
                    {res.title_he}
                  </p>
                  {res.file_type && (
                    <span className="text-xs text-slate-400 uppercase">{res.file_type}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
