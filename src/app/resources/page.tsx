import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { Download, FolderOpen, ExternalLink } from "lucide-react";
import type { Resource } from "@/types";
import { RESOURCE_CATEGORIES } from "@/types";

const categoryIcons: Record<string, string> = {
  "שאלונים": "📝",
  "מצגות": "📊",
  "מאמרים": "📄",
  "ספרים": "📚",
  "טפסי עבודה": "📋",
  "קישורים לסרטונים": "🎥",
};

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();

  const { data: resources } = await service
    .from("resources")
    .select("*")
    .eq("is_published", true)
    .order("category")
    .order("created_at", { ascending: false });

  const byCategory = RESOURCE_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = (resources ?? []).filter((r: Resource) => r.category === cat);
      return acc;
    },
    {} as Record<string, Resource[]>
  );

  const totalCount = (resources ?? []).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          <FolderOpen className="w-6 h-6" />
          מרכז משאבים
        </h1>
        <p className="text-slate-500 mt-1">
          טפסים קליניים, שאלונים ומדריכים להורדה — {totalCount} קבצים
        </p>
      </div>

      {totalCount === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">אין משאבים זמינים כרגע</p>
          <p className="text-slate-400 text-sm mt-1">החומרים יתווספו בקרוב</p>
        </div>
      )}

      {RESOURCE_CATEGORIES.map((cat) => {
        const items = byCategory[cat];
        if (!items || items.length === 0) return null;

        return (
          <section key={cat}>
            <h2 className="text-base font-bold text-brand-900 flex items-center gap-2 mb-4">
              <span>{categoryIcons[cat]}</span>
              {cat}
              <span className="text-xs font-normal text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((res: Resource) => {
                const isLink = res.file_type === "link";
                return (
                  <a
                    key={res.id}
                    href={res.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...(!isLink && { download: res.file_name ?? true })}
                    className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all group p-4"
                  >
                    <div className="bg-brand-50 rounded-xl p-3 shrink-0 group-hover:bg-brand-100 transition-colors">
                      {isLink
                        ? <ExternalLink className="w-5 h-5 text-brand-500" />
                        : <Download className="w-5 h-5 text-brand-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{res.title_he}</p>
                      {res.description_he && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{res.description_he}</p>
                      )}
                      {!isLink && res.file_type && (
                        <span className="inline-block text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase mt-2">
                          {res.file_type}
                        </span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
