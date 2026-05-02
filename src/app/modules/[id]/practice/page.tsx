import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";
import PracticeChat from "@/components/practice/PracticeChat";
import SortingGame from "@/components/practice/SortingGame";
import MatchingGame from "@/components/practice/MatchingGame";
import ClinicalExercise from "@/components/practice/ClinicalExercise";
import ExpectationsForm from "@/components/practice/ExpectationsForm";
import CoreBeliefsGame from "@/components/practice/CoreBeliefsGame";
import type { Module, ExerciseSubmission } from "@/types";

export default async function PracticePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();

  const [{ data: mod }, { data: progress }, { data: existingSubmission }] = await Promise.all([
    service.from("modules").select("*").eq("id", params.id).single(),
    service.from("progress").select("practice_completed").eq("user_id", user.id).eq("module_id", params.id).maybeSingle(),
    service.from("exercise_submissions").select("id, answers, status, admin_feedback, points_awarded, submitted_at, reviewed_at").eq("user_id", user.id).eq("module_id", params.id).maybeSingle(),
  ]);
  if (!mod) notFound();

  const module = mod as Module;
  const alreadyCompleted = progress?.practice_completed === true;

  // Module 1 gets the expectations/intro form instead of AI chat
  if (module.order_number === 1) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-900">היכרות ראשונית — {module.title_he}</h1>
          <p className="text-slate-500 mt-1 text-sm">ספר לנו קצת על עצמך ועל הציפיות שלך מהקורס</p>
        </div>
        <ExpectationsForm
          moduleId={module.id}
          userId={user.id}
          existingSubmission={existingSubmission as ExerciseSubmission | null}
          backHref={`/modules/${module.id}`}
        />
      </div>
    );
  }

  // Module 3 gets the matching game
  if (module.order_number === 3) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-900">משחק התאמה — {module.title_he}</h1>
          <p className="text-slate-500 mt-1 text-sm">התאם כל מושג לפרט המתאים מהמקרה הקליני</p>
        </div>
        <MatchingGame moduleId={module.id} userId={user.id} backHref={`/modules/${module.id}`} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  // Module 2 gets the sorting game instead of AI chat
  if (module.order_number === 2) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-900">משחק מיון — {module.title_he}</h1>
          <p className="text-slate-500 mt-1 text-sm">
            התאם כל פריט לקטגוריה הנכונה שלו על פי המודל הקוגניטיבי
          </p>
        </div>
        <SortingGame moduleId={module.id} userId={user.id} backHref={`/modules/${module.id}`} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  // Module 5 gets the core beliefs game
  if (module.order_number === 5) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-900">עדשות האמונות — {module.title_he}</h1>
          <p className="text-slate-500 mt-1 text-sm">זהה אמונות יסוד דרך מחשבות אוטומטיות</p>
        </div>
        <CoreBeliefsGame moduleId={module.id} userId={user.id} backHref={`/modules/${module.id}`} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  // Module 4 gets the clinical exercise instead of AI chat
  if (module.order_number === 4) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-900">תרגיל קליני — {module.title_he}</h1>
          <p className="text-slate-500 mt-1 text-sm">ניתוח מקרה קליני — שלח למרצה לבדיקה</p>
        </div>
        <ClinicalExercise
          moduleId={module.id}
          userId={user.id}
          existingSubmission={existingSubmission as ExerciseSubmission | null}
          backHref={`/modules/${module.id}`}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PracticeChat mod={module} userId={user.id} />
    </div>
  );
}
