import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity, AlertTriangle, BarChart3, BookOpen, CheckCircle2, ChevronLeft, ClipboardList, FileText,
  FolderOpen, Headphones, MessageCircle, ShieldCheck, SlidersHorizontal, Users, Video, type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Module } from "@/types";

export interface AdminHomeViewProps {
  studentsCount: number;
  groupsCount: number;
  modulesCount: number;
  practiceCompletions: number;
  pendingExercises: number;
  pendingQuestions: number;
  groupStats: { id: string; name: string; memberCount: number; avgPoints: number; completions: number; isActive: boolean }[];
  modules: Module[];
  /** The students table (client component) */
  studentsTable: ReactNode;
}

interface ActionLink {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  badge?: number;
  badgeLabel?: string;
}

function ActionGroup({ title, links }: { title: string; links: ActionLink[] }) {
  return (
    <section className="surface overflow-hidden" aria-label={title}>
      <h2 className="px-5 py-3 text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200">{title}</h2>
      <ul className="divide-y divide-slate-100">
        {links.map(({ href, icon: Icon, label, desc, badge, badgeLabel }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-brand-50/50 transition-colors focus-visible:outline-offset-[-2px]"
            >
              <span className="bg-brand-50 text-brand-600 rounded-lg p-2.5 shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-slate-900">{label}</span>
                <span className="block text-sm text-slate-600">{desc}</span>
              </span>
              {badge !== undefined && badge > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200 px-2.5 py-0.5 text-xs font-bold whitespace-nowrap">
                  {badge}
                  <span className="font-semibold">{badgeLabel}</span>
                </span>
              )}
              <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="surface flex items-center gap-3 px-4 py-3">
      <span className="bg-slate-100 text-slate-700 rounded-lg p-2">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs text-slate-600 leading-tight">{label}</p>
        <p className="text-xl font-bold text-brand-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

export default function AdminHomeView(p: AdminHomeViewProps) {
  const pending = p.pendingExercises + p.pendingQuestions;

  const groups: { title: string; links: ActionLink[] }[] = [
    {
      title: "קורס ומפגשים",
      links: [
        { href: "/admin/settings", icon: SlidersHorizontal, label: "הגדרות קורס", desc: "Zoom, סילבוס, יום ושעת מפגשים" },
        { href: "/admin/quiz-stats", icon: BarChart3, label: "ניתוח חידונים", desc: "שאלות שמעל 50% ענו עליהן בצורה שגויה" },
      ],
    },
    {
      title: "משתתפים וקבוצות",
      links: [
        { href: "/admin/groups", icon: Users, label: "ניהול קבוצות", desc: "יצירת קבוצות ושיוך משתתפים" },
        { href: "/admin/approved", icon: ShieldCheck, label: "גישה — מיילים מאושרים", desc: "ייבוא מיילים מ-Smoove לאישור גישה" },
        { href: "/admin/activity", icon: Activity, label: "מעקב נוכחות", desc: "זמני כניסה ושהייה של משתתפים" },
      ],
    },
    {
      title: "תרגילים ומשוב",
      links: [
        { href: "/admin/exercises", icon: ClipboardList, label: "תרגילים קליניים", desc: "בדיקת הגשות ומתן משוב", badge: p.pendingExercises, badgeLabel: "ממתינים" },
      ],
    },
    {
      title: "משאבים ותקשורת",
      links: [
        { href: "/admin/resources", icon: FolderOpen, label: "ניהול משאבים", desc: "העלאת קבצים ושאלונים" },
        { href: "/admin/chat", icon: MessageCircle, label: "ניטור צ'אט ושאלות", desc: "צפייה בשיחות הקבוצות ומענה לשאלות", badge: p.pendingQuestions, badgeLabel: "שאלות ממתינות" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="פאנל ניהול" description="ניהול קורס, קבוצות, תרגילים ומשאבים" />

      {/* Pending items: compact and prominent */}
      {pending > 0 ? (
        <section aria-label="פריטים הממתינים לטיפול" className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            ממתין לטיפולך
          </p>
          <div className="flex flex-wrap gap-2">
            {p.pendingExercises > 0 && (
              <Link href="/admin/exercises" className="inline-flex items-center gap-2 min-h-[40px] bg-white border border-amber-300 text-amber-900 text-sm font-semibold px-3.5 rounded-lg hover:bg-amber-100 transition-colors">
                <span className="bg-amber-700 text-white text-xs font-bold min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center">{p.pendingExercises}</span>
                תרגילים לבדיקה
              </Link>
            )}
            {p.pendingQuestions > 0 && (
              <Link href="/admin/chat" className="inline-flex items-center gap-2 min-h-[40px] bg-white border border-amber-300 text-amber-900 text-sm font-semibold px-3.5 rounded-lg hover:bg-amber-100 transition-colors">
                <span className="bg-amber-700 text-white text-xs font-bold min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center">{p.pendingQuestions}</span>
                שאלות למענה
              </Link>
            )}
          </div>
        </section>
      ) : (
        <p className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 ring-1 ring-inset ring-emerald-200 rounded-lg px-4 py-2.5 w-fit">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          אין תרגילים או שאלות שממתינים לטיפול
        </p>
      )}

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Users} label="משתתפים" value={p.studentsCount} />
        <Stat icon={Users} label="קבוצות" value={p.groupsCount} />
        <Stat icon={BookOpen} label="מפגשים" value={p.modulesCount} />
        <Stat icon={BarChart3} label="השלמות תרגול" value={p.practiceCompletions} />
      </div>

      {/* Actions by topic */}
      <div className="grid gap-5 lg:grid-cols-2 items-start">
        {groups.map((g) => (
          <ActionGroup key={g.title} title={g.title} links={g.links} />
        ))}
      </div>

      {/* Group stats table */}
      {p.groupStats.length > 0 && (
        <section aria-labelledby="group-stats-title">
          <h2 id="group-stats-title" className="section-title mb-3">סטטיסטיקה קבוצתית</h2>
          <div className="surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">שם קבוצה</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">חברים</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">ממוצע נקודות</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">השלמות תרגול</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {p.groupStats.map((g) => (
                  <tr key={g.id}>
                    <th scope="row" className="px-4 py-3 text-right font-semibold text-slate-900">{g.name}</th>
                    <td className="px-4 py-3 text-slate-700">{g.memberCount}</td>
                    <td className="px-4 py-3 font-semibold text-brand-700">{g.avgPoints}</td>
                    <td className="px-4 py-3 text-slate-700">{g.completions}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ring-1 ring-inset ${
                        g.isActive ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}>
                        {g.isActive ? "פעיל" : "לא פעיל"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modules list */}
      <section aria-labelledby="modules-title">
        <h2 id="modules-title" className="section-title mb-3">ניהול מפגשים</h2>
        <ul className="surface divide-y divide-slate-100 overflow-hidden">
          {p.modules.map((mod) => {
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
      </section>

      {p.studentsTable}
    </div>
  );
}
