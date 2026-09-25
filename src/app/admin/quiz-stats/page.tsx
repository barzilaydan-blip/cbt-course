import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle, BarChart3, Users } from "lucide-react";
import type { QuizQuestion } from "@/types";

type QuizRow = { module_id: string; questions: QuizQuestion[] };
type ProgressRow = { module_id: string; quiz_answers: number[] | null };
type ModuleRow = { id: string; order_number: number; title_he: string };

export default async function QuizStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: quizzes }, { data: progressRows }, { data: modulesData }] = await Promise.all([
    service.from("quizzes").select("module_id, questions"),
    service.from("progress").select("module_id, quiz_answers").not("quiz_answers", "is", null),
    service.from("modules").select("id, order_number, title_he").order("order_number"),
  ]);

  const moduleMap = new Map<string, ModuleRow>(
    (modulesData ?? []).map((m: ModuleRow) => [m.id, m])
  );

  // Group progress rows by module
  const progressByModule = new Map<string, number[][]>();
  for (const row of (progressRows ?? []) as ProgressRow[]) {
    if (!row.quiz_answers) continue;
    const existing = progressByModule.get(row.module_id) ?? [];
    existing.push(row.quiz_answers);
    progressByModule.set(row.module_id, existing);
  }

  // Build stats per module
  const moduleStats = ((quizzes ?? []) as QuizRow[])
    .map(quiz => {
      const mod = moduleMap.get(quiz.module_id);
      if (!mod) return null;
      const responses = progressByModule.get(quiz.module_id) ?? [];
      const total = responses.length;

      const questionStats = quiz.questions.map((q, qi) => {
        const answered = responses.filter(r => r[qi] !== undefined).length;
        const wrong = responses.filter(r => r[qi] !== undefined && r[qi] !== q.correct_index).length;
        const errorRate = answered > 0 ? wrong / answered : 0;
        return { question: q, answered, wrong, errorRate, flagged: answered >= 3 && errorRate > 0.5 };
      });

      const flaggedCount = questionStats.filter(q => q.flagged).length;
      return { mod, total, questionStats, flaggedCount };
    })
    .filter(Boolean)
    .sort((a, b) => a!.mod.order_number - b!.mod.order_number);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          ניתוח חידונים — שאלות בעייתיות
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          שאלות שמעל 50% מהמשיבים ענו עליהן באופן שגוי מסומנות באייקון אזהרה
          {" "}(מינימום 3 משיבים לסימון)
        </p>
      </div>

      {moduleStats.every(s => s!.total === 0) && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm">אין עדיין נתוני תשובות — הנתונים יצטברו לאחר שסטודנטים ימלאו חידונים.</p>
          <p className="text-slate-400 text-xs mt-1">הנתונים נאספים רק מחידונים שנמלאו לאחר עדכון הקוד.</p>
        </div>
      )}

      {moduleStats.map(stat => {
        if (!stat) return null;
        const { mod, total, questionStats, flaggedCount } = stat;
        if (total === 0) return null;

        return (
          <section key={mod.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Module header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {mod.order_number}
                </span>
                <h2 className="font-bold text-brand-900">{mod.title_he}</h2>
                {flaggedCount > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    {flaggedCount} שאלות בעייתיות
                  </span>
                )}
                {flaggedCount === 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    תקין
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                <Users className="w-3 h-3" />
                {total} משיבים
              </div>
            </div>

            {/* Questions */}
            <div className="divide-y divide-slate-100">
              {questionStats.map((qs, qi) => {
                const pct = qs.answered > 0 ? Math.round(qs.errorRate * 100) : 0;
                return (
                  <div key={qi} className={`px-5 py-4 ${qs.flagged ? "bg-red-50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {qs.flagged
                          ? <AlertTriangle className="w-4 h-4 text-red-500" />
                          : <CheckCircle className="w-4 h-4 text-green-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-snug">
                          <span className="text-slate-400 text-xs ml-1">שאלה {qi + 1}</span>{" "}
                          {qs.question.question_he}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          תשובה נכונה: <span className="font-semibold text-green-700">
                            {qs.question.options_he[qs.question.correct_index]}
                          </span>
                        </p>
                        {qs.answered > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all ${pct > 50 ? "bg-red-400" : pct > 30 ? "bg-amber-400" : "bg-green-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-12 text-left shrink-0 ${pct > 50 ? "text-red-600" : pct > 30 ? "text-amber-600" : "text-green-600"}`}>
                              {pct}% שגוי
                            </span>
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
  );
}
