import Link from "next/link";
import { BookOpen, ChevronLeft, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="ניהול משאבים" description="עריכת תוכן המפגשים או הוספת קבצים ושאלונים" />

      <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
        <Link href="/admin/modules" className="surface p-6 flex items-center gap-4 hover:border-brand-300 transition-colors group">
          <span className="bg-brand-50 text-brand-600 rounded-xl p-3 shrink-0">
            <BookOpen className="w-6 h-6" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-lg text-slate-900">ניהול מפגשים</span>
            <span className="block text-sm text-slate-600">וידאו, מאמר, פודקאסט וחידון לכל מפגש</span>
          </span>
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" aria-hidden="true" />
        </Link>

        <Link href="/admin/resources" className="surface p-6 flex items-center gap-4 hover:border-brand-300 transition-colors group">
          <span className="bg-teal-50 text-teal-600 rounded-xl p-3 shrink-0">
            <FolderOpen className="w-6 h-6" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-lg text-slate-900">הוספת משאבים</span>
            <span className="block text-sm text-slate-600">קבצים, שאלונים וקישורים לספריית המשאבים</span>
          </span>
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
