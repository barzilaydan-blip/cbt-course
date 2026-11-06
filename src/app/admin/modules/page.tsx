import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { AlertTriangle, ChevronLeft, FileText, Headphones, Video } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Module } from "@/types";

export default async function AdminModulesPage() {
  const service = createServiceClient();
  const { data: modules } = await service.from("modules").select("*").order("order_number");

  return (
    <div className="space-y-6">
      <PageHeader title="ניהול מפגשים" description="עריכת תוכן, לוח זמנים וחידון לכל מפגש" />

      <ul className="surface divide-y divide-slate-100 overflow-hidden">
        {((modules ?? []) as Module[]).map((mod) => {
          const hasContent = mod.video_url || mod.article_url || mod.podcast_url;
          return (
            <li key={mod.id}>
              <Link
                href={`/admin/modules/${mod.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-brand-50/50 transition-colors focus-visible:outline-offset-[-2px]"
              >
                <span className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold shrink-0">
                  {mod.order_number}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-slate-900">{mod.title_he}</span>
                  <span className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-sm text-slate-600">
                    {mod.video_url && <span className="inline-flex items-center gap-1"><Video className="w-3.5 h-3.5" aria-hidden="true" />סרטון</span>}
                    {mod.article_url && <span className="inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" aria-hidden="true" />מאמר</span>}
                    {mod.podcast_url && <span className="inline-flex items-center gap-1"><Headphones className="w-3.5 h-3.5" aria-hidden="true" />פודקאסט</span>}
                    {!hasContent && (
                      <span className="inline-flex items-center gap-1 text-amber-800 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />אין תוכן
                      </span>
                    )}
                  </span>
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ring-1 ring-inset whitespace-nowrap ${
                  mod.is_published ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"
                }`}>
                  {mod.is_published ? "פעיל" : "טיוטה"}
                </span>
                <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
