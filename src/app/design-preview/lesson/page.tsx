import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import PreviewShell from "../PreviewShell";
import LessonActivityBar from "@/components/modules/LessonActivityBar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fakeModule } from "../mock";
import type { Progress } from "@/types";

const progress = { video_watched: true, article_read: true, quiz_completed: false, practice_completed: false } as Progress;

export default function Page() {
  return (
    <PreviewShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        <nav aria-label="פירורי לחם" className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="#" className="hover:text-brand-700 underline-offset-4 hover:underline">מפגשים</Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span aria-current="page" className="text-slate-800 font-medium">מפגש 3</span>
        </nav>
        <header>
          <p className="eyebrow mb-1.5">מפגש 3 מתוך 14</p>
          <h1 className="page-title text-balance">{fakeModule.title_he}</h1>
          <p className="page-lead max-w-[68ch] leading-relaxed">טכניקות לאתגור קוגניטיבי, שאלות סוקרטיות והצגת חלופות מאוזנות למחשבה.</p>
          <div className="mt-5 flex items-center gap-3 max-w-md">
            <ProgressBar value={50} label="התקדמות במפגש" className="flex-1" />
            <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">50% הושלם</span>
          </div>
        </header>

        <section aria-label="סרטון המפגש" className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="aspect-video bg-slate-100 flex items-center justify-center">
            <p className="text-slate-600 text-sm">סרטון יתווסף בקרוב</p>
          </div>
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <div>
              <p className="font-semibold text-brand-900">סרטון הרצאה</p>
              <p className="text-sm text-slate-600 mt-0.5">צפה וסמן כנצפה לקבלת נקודות</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 bg-emerald-50 ring-1 ring-inset ring-emerald-200 px-3 py-1.5 rounded-lg">
              <Check className="w-4 h-4" aria-hidden="true" />נצפה
            </span>
          </div>
        </section>

        <LessonActivityBar
          moduleId="m3" userId="s1" module={fakeModule} progress={progress}
          exerciseStatus={null} resources={[]}
          weeklyChallenge={fakeModule.weekly_challenge} weeklyChallengeUrl={null}
        />

        <nav aria-label="מעבר בין מפגשים" className="grid gap-3 sm:grid-cols-2 pt-2">
          <Link href="#" className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-brand-300 hover:shadow-card transition-all">
            <ChevronRight className="w-5 h-5 text-brand-500 shrink-0" aria-hidden="true" />
            <span><span className="block text-xs text-slate-600">מפגש קודם</span><span className="block font-semibold text-slate-900">מפגש 2</span></span>
          </Link>
          <Link href="#" className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-brand-300 hover:shadow-card transition-all">
            <span><span className="block text-xs text-slate-600">מפגש הבא</span><span className="block font-semibold text-slate-900">מפגש 4</span></span>
            <ChevronLeft className="w-5 h-5 text-brand-500 shrink-0" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </PreviewShell>
  );
}
