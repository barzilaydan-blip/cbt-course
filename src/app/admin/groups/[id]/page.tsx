import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import AdminGroupSettings from "@/components/admin/AdminGroupSettings";
import AdminApprovedEmails from "@/components/admin/AdminApprovedEmails";
import AdminExercisesReviewer from "@/components/admin/AdminExercisesReviewer";
import AdminQuestions from "@/components/admin/AdminQuestions";
import AdminChatMonitor from "@/components/admin/AdminChatMonitor";
import AdminChatTabs from "@/components/admin/AdminChatTabs";
import AdminGroupTabs, { type GroupTabId } from "@/components/admin/AdminGroupTabs";
import type { Group, Profile, ExerciseSubmission, Question, GroupMessage, QuizQuestion } from "@/types";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds} שנ'`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} דק'`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours} שע' ${rem} דק'` : `${hours} שע'`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const tz = { timeZone: "Asia/Jerusalem" };
  const date = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", ...tz }).format(d);
  const time = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit", ...tz }).format(d);
  return { date, time };
}

const REVIEW_MODULES = [1, 4, 9];

export default async function AdminGroupPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string; days?: string };
}) {
  const service = createServiceClient();
  const groupId = params.id;

  const { data: group } = await service.from("groups").select("*").eq("id", groupId).maybeSingle();
  if (!group) notFound();

  const filterDays = Number(searchParams.days ?? 7);
  const since = new Date(Date.now() - filterDays * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: profiles },
    { data: submissions },
    { data: approvedEmails },
    { data: messages },
    { data: questions },
    { data: visits },
    { data: modules },
    { data: quizzes },
    { data: progressRows },
  ] = await Promise.all([
    service.from("profiles").select("id, name, email, role, total_points, group_id, phone, profession").eq("role", "student"),
    service.from("exercise_submissions").select("*, profiles(name, email, group_id), modules(order_number, title_he)").order("submitted_at", { ascending: false }),
    service.from("approved_emails").select("id, email, status, source, linked_user_id, group_id, approved_at, used_at, notes").eq("group_id", groupId).order("approved_at", { ascending: false }),
    service.from("messages").select("*, profiles(name, email)").eq("group_id", groupId).order("created_at", { ascending: false }).limit(200),
    service.from("questions").select("*, profiles(name, email, group_id)").order("created_at", { ascending: false }),
    service.from("page_visits").select("id, user_id, module_id, entered_at, exited_at, duration_seconds").gte("entered_at", since).order("entered_at", { ascending: false }).limit(500),
    service.from("modules").select("id, order_number, title_he").order("order_number"),
    service.from("quizzes").select("module_id, questions"),
    service.from("progress").select("user_id, module_id, quiz_answers").not("quiz_answers", "is", null),
  ]);

  const allStudents = (profiles ?? []) as Profile[];
  const groupMemberIds = new Set(allStudents.filter((s) => s.group_id === groupId).map((s) => s.id));

  // ── Exercises badge/count ──
  const pendingExercisesCount = (submissions ?? []).filter(
    (s: ExerciseSubmission) => s.status === "submitted" && s.profiles?.group_id === groupId && REVIEW_MODULES.includes(s.modules?.order_number ?? 0)
  ).length;

  // ── Questions badge/count ──
  const pendingQuestionsCount = (questions ?? []).filter(
    (q: Question) => q.status === "pending" && q.profiles?.group_id === groupId
  ).length;

  // ── Attendance (scoped to this group's members) ──
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  type Visit = { id: string; user_id: string; module_id: string; entered_at: string; exited_at: string | null; duration_seconds: number | null };
  const groupVisits = ((visits ?? []) as Visit[]).filter((v) => groupMemberIds.has(v.user_id));
  const activeNow = groupVisits.filter((v) => !v.exited_at && v.entered_at >= twoHoursAgo);
  const uniqueStudents = new Set(groupVisits.map((v) => v.user_id)).size;
  const withDuration = groupVisits.filter((v) => v.duration_seconds !== null);
  const avgDuration = withDuration.length > 0 ? Math.round(withDuration.reduce((s, v) => s + (v.duration_seconds ?? 0), 0) / withDuration.length) : null;
  const studentMap = new Map(allStudents.map((s) => [s.id, s]));
  const moduleMap = new Map((modules ?? []).map((m: { id: string; order_number: number; title_he: string }) => [m.id, m]));
  const buildDaysUrl = (days: number) => `/admin/groups/${groupId}?tab=attendance&days=${days}`;

  // ── Quiz stats (scoped to this group's members) ──
  type QuizRow = { module_id: string; questions: QuizQuestion[] };
  type ProgressRow = { user_id: string; module_id: string; quiz_answers: number[] | null };
  const groupProgress = ((progressRows ?? []) as ProgressRow[]).filter((p) => groupMemberIds.has(p.user_id));
  const progressByModule = new Map<string, number[][]>();
  for (const row of groupProgress) {
    if (!row.quiz_answers) continue;
    const existing = progressByModule.get(row.module_id) ?? [];
    existing.push(row.quiz_answers);
    progressByModule.set(row.module_id, existing);
  }
  const moduleStats = ((quizzes ?? []) as QuizRow[])
    .map((quiz) => {
      const mod = moduleMap.get(quiz.module_id) as { id: string; order_number: number; title_he: string } | undefined;
      if (!mod) return null;
      const responses = progressByModule.get(quiz.module_id) ?? [];
      const total = responses.length;
      const questionStats = quiz.questions.map((q, qi) => {
        const answered = responses.filter((r) => r[qi] !== undefined).length;
        const wrong = responses.filter((r) => r[qi] !== undefined && r[qi] !== q.correct_index).length;
        const errorRate = answered > 0 ? wrong / answered : 0;
        return { question: q, answered, wrong, errorRate, flagged: answered >= 3 && errorRate > 0.5 };
      });
      const flaggedCount = questionStats.filter((q) => q.flagged).length;
      return { mod, total, questionStats, flaggedCount };
    })
    .filter(Boolean)
    .sort((a, b) => a!.mod.order_number - b!.mod.order_number);

  const initialTab = (["settings", "approved", "attendance", "exercises", "quiz", "chat"] as GroupTabId[]).includes(searchParams.tab as GroupTabId)
    ? (searchParams.tab as GroupTabId)
    : "settings";

  return (
    <div className="space-y-6">
      <PageHeader title={group.name} description={`${groupMemberIds.size} חברים · ${group.is_active ? "פעיל" : "לא פעיל"}`} />

      <AdminGroupTabs
        initialTab={initialTab}
        badges={{ exercises: pendingExercisesCount, chat: pendingQuestionsCount }}
        content={{
          settings: <AdminGroupSettings group={group as Group} allStudents={allStudents} />,

          approved: (
            <AdminApprovedEmails initialEmails={approvedEmails ?? []} groupId={groupId} />
          ),

          attendance: (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="bg-green-50 rounded-xl p-2.5"><Users className="w-5 h-5 text-green-600" /></div>
                  <div><p className="text-xs text-slate-500">פעיל עכשיו</p><p className="text-xl font-bold text-brand-900">{activeNow.length}</p></div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="bg-blue-50 rounded-xl p-2.5"><Users className="w-5 h-5 text-blue-600" /></div>
                  <div><p className="text-xs text-slate-500">סטודנטים ייחודיים</p><p className="text-xl font-bold text-brand-900">{uniqueStudents}</p></div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="bg-purple-50 rounded-xl p-2.5"><Activity className="w-5 h-5 text-purple-600" /></div>
                  <div><p className="text-xs text-slate-500">סה"כ כניסות</p><p className="text-xl font-bold text-brand-900">{groupVisits.length}</p></div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="bg-amber-50 rounded-xl p-2.5"><Clock className="w-5 h-5 text-amber-600" /></div>
                  <div><p className="text-xs text-slate-500">ממוצע שהייה</p><p className="text-xl font-bold text-brand-900">{formatDuration(avgDuration)}</p></div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-sm text-slate-500">תקופה:</span>
                <div className="flex gap-1">
                  {[7, 14, 30, 90].map((d) => (
                    <Link key={d} href={buildDaysUrl(d)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filterDays === d ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {d} ימים
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-right font-semibold">סטודנט</th>
                        <th className="px-4 py-3 text-right font-semibold">מפגש</th>
                        <th className="px-4 py-3 text-right font-semibold">תאריך</th>
                        <th className="px-4 py-3 text-right font-semibold">שעת כניסה</th>
                        <th className="px-4 py-3 text-right font-semibold">משך שהייה</th>
                        <th className="px-4 py-3 text-right font-semibold">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupVisits.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">אין נתונים לתקופה שנבחרה</td></tr>
                      )}
                      {groupVisits.map((visit, i) => {
                        const student = studentMap.get(visit.user_id);
                        const mod = moduleMap.get(visit.module_id) as { order_number: number; title_he: string } | undefined;
                        const { date, time } = formatDateTime(visit.entered_at);
                        const isActive = !visit.exited_at && visit.entered_at >= twoHoursAgo;
                        return (
                          <tr key={visit.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            <td className="px-4 py-3 font-semibold text-slate-800">{student?.name ?? "—"}</td>
                            <td className="px-4 py-3">
                              {mod ? (
                                <span className="text-slate-700">
                                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded me-1.5">{mod.order_number}</span>
                                  {mod.title_he}
                                </span>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs tabular-nums">{date}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs tabular-nums">{time}</td>
                            <td className="px-4 py-3 font-medium text-slate-700 tabular-nums">
                              {isActive ? <span className="text-green-600 font-semibold">פעיל כעת</span> : formatDuration(visit.duration_seconds)}
                            </td>
                            <td className="px-4 py-3">
                              {isActive ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />מחובר
                                </span>
                              ) : visit.exited_at ? (
                                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full w-fit">יצא</span>
                              ) : (
                                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit">לא סגור</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ),

          exercises: (
            <AdminExercisesReviewer
              submissions={(submissions ?? []) as ExerciseSubmission[]}
              groups={[]}
              lockedGroupId={groupId}
            />
          ),

          quiz: (
            <div className="space-y-8">
              <p className="text-sm text-slate-500">
                שאלות שמעל 50% מהמשיבים בקבוצה זו ענו עליהן באופן שגוי מסומנות באייקון אזהרה (מינימום 3 משיבים לסימון)
              </p>
              {moduleStats.every((s) => s!.total === 0) && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-500 text-sm">אין עדיין נתוני תשובות לקבוצה זו.</p>
                </div>
              )}
              {moduleStats.map((stat) => {
                if (!stat || stat.total === 0) return null;
                const { mod, total, questionStats, flaggedCount } = stat;
                return (
                  <section key={mod.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-brand-900 text-white text-sm font-bold flex items-center justify-center shrink-0">{mod.order_number}</span>
                        <h2 className="font-bold text-brand-900">{mod.title_he}</h2>
                        {flaggedCount > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />{flaggedCount} שאלות בעייתיות
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />תקין
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0"><Users className="w-3 h-3" />{total} משיבים</div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {questionStats.map((qs, qi) => {
                        const pct = qs.answered > 0 ? Math.round(qs.errorRate * 100) : 0;
                        return (
                          <div key={qi} className={`px-5 py-4 ${qs.flagged ? "bg-red-50" : ""}`}>
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 mt-0.5">{qs.flagged ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-400" />}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 leading-snug">
                                  <span className="text-slate-400 text-xs ml-1">שאלה {qi + 1}</span> {qs.question.question_he}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  תשובה נכונה: <span className="font-semibold text-green-700">{qs.question.options_he[qs.question.correct_index]}</span>
                                </p>
                                {qs.answered > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-2 rounded-full transition-all ${pct > 50 ? "bg-red-400" : pct > 30 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className={`text-xs font-bold w-12 text-left shrink-0 ${pct > 50 ? "text-red-600" : pct > 30 ? "text-amber-600" : "text-green-600"}`}>{pct}% שגוי</span>
                                    <span className="text-xs text-slate-400 shrink-0">({qs.wrong}/{qs.answered})</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ),

          chat: (
            <AdminChatTabs
              pendingCount={pendingQuestionsCount}
              chatContent={<AdminChatMonitor groups={[group as Group]} initialMessages={(messages ?? []).reverse() as GroupMessage[]} />}
              questionsContent={<AdminQuestions initialQuestions={(questions ?? []) as Question[]} groups={[]} lockedGroupId={groupId} />}
            />
          ),
        }}
      />
    </div>
  );
}
