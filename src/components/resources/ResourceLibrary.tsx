"use client";
import { useMemo, useState } from "react";
import {
  BookOpen, ClipboardList, Download, ExternalLink, FileText, FolderOpen, PenLine,
  PlayCircle, Presentation, Search, X, type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { RESOURCE_CATEGORIES, type Resource, type ResourceCategory } from "@/types";

const categoryIcons: Record<ResourceCategory, LucideIcon> = {
  "שאלונים": ClipboardList,
  "מצגות": Presentation,
  "מאמרים": FileText,
  "ספרים": BookOpen,
  "טפסי עבודה": PenLine,
  "קישורים לסרטונים": PlayCircle,
};

const LONG_DESCRIPTION = 110;

function ResourceCard({ res }: { res: Resource }) {
  const [expanded, setExpanded] = useState(false);
  const isLink = res.file_type === "link";
  const Icon = categoryIcons[res.category] ?? FileText;
  const long = (res.description_he?.length ?? 0) > LONG_DESCRIPTION;
  const typeLabel = isLink ? "קישור חיצוני" : res.file_type ? res.file_type.toUpperCase() : null;

  return (
    <article className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-card p-5 h-full">
      <div className="flex items-start gap-3">
        <span className="bg-brand-50 text-brand-600 rounded-lg p-2.5 shrink-0">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 leading-snug">{res.title_he}</h3>
          <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-2">
            <span>{res.category}</span>
            {typeLabel && (
              <>
                <span aria-hidden="true">·</span>
                <bdi>{typeLabel}</bdi>
              </>
            )}
          </p>
        </div>
      </div>

      {res.description_he && (
        <div className="mt-3">
          <p className={cn("text-sm text-slate-700 leading-relaxed", !expanded && "line-clamp-3")}>
            {res.description_he}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-1 text-sm font-semibold text-brand-600 hover:text-brand-800 underline-offset-4 hover:underline"
            >
              {expanded ? "הצג פחות" : "הצג הכל"}
            </button>
          )}
        </div>
      )}

      <a
        href={res.file_url}
        target="_blank"
        rel="noopener noreferrer"
        {...(!isLink && { download: res.file_name ?? true })}
        className="btn-secondary mt-auto self-start !min-h-[40px] !px-4 text-sm"
      >
        {isLink ? <ExternalLink className="w-4 h-4" aria-hidden="true" /> : <Download className="w-4 h-4" aria-hidden="true" />}
        {isLink ? "פתיחת הקישור" : "הורדה"}
        <span className="sr-only"> — {res.title_he}{isLink ? " (נפתח בכרטיסייה חדשה)" : ""}</span>
      </a>
    </article>
  );
}

export default function ResourceLibrary({ resources }: { resources: Resource[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ResourceCategory | "all">("all");

  const counts = useMemo(() => {
    const map = new Map<ResourceCategory, number>();
    resources.forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + 1));
    return map;
  }, [resources]);

  const categories = RESOURCE_CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0);

  const q = query.trim().toLowerCase();
  const filtered = resources.filter((r) => {
    if (category !== "all" && r.category !== category) return false;
    if (!q) return true;
    return [r.title_he, r.description_he ?? "", r.category, r.file_name ?? ""].some((v) => v.toLowerCase().includes(q));
  });

  const visibleCategories = categories.filter((c) => filtered.some((r) => r.category === c));

  if (resources.length === 0) {
    return (
      <EmptyState icon={FolderOpen} title="אין משאבים זמינים כרגע" description="החומרים יתווספו בקרוב." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search + category filter */}
      <div className="space-y-3">
        <div className="relative max-w-xl">
          <label htmlFor="resource-search" className="sr-only">חיפוש במשאבים</label>
          <Search className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" aria-hidden="true" />
          <input
            id="resource-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם, נושא או סוג קובץ"
            className="input-he ps-10 pe-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="נקה חיפוש"
              className="absolute top-1/2 -translate-y-1/2 end-1.5 w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div role="group" aria-label="סינון לפי קטגוריה" className="flex flex-wrap gap-2">
          {(["all", ...categories] as const).map((c) => {
            const active = category === c;
            const count = c === "all" ? resources.length : counts.get(c) ?? 0;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 min-h-[40px] px-4 rounded-full text-sm font-semibold border transition-colors",
                  active
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "bg-white border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-700"
                )}
              >
                {c === "all" ? "הכל" : c}
                <span className={cn("text-xs rounded-full px-1.5 min-w-[1.4rem] text-center", active ? "bg-white/20" : "bg-slate-100 text-slate-600")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-slate-600" role="status" aria-live="polite">
        {filtered.length === resources.length ? `${resources.length} קבצים` : `${filtered.length} מתוך ${resources.length} קבצים`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="לא נמצאו משאבים"
          description="נסה מילת חיפוש אחרת או בחר קטגוריה אחרת."
          action={
            <button type="button" className="btn-secondary" onClick={() => { setQuery(""); setCategory("all"); }}>
              איפוס החיפוש
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          {visibleCategories.map((cat) => {
            const items = filtered.filter((r) => r.category === cat);
            const Icon = categoryIcons[cat];
            return (
              <section key={cat} aria-labelledby={`cat-${cat}`}>
                <h2 id={`cat-${cat}`} className="section-title flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-brand-500" aria-hidden="true" />
                  {cat}
                  <span className="text-sm font-medium text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">{items.length}</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((res) => (
                    <ResourceCard key={res.id} res={res} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
