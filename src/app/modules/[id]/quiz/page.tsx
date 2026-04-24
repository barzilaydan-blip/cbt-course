import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";
import QuizEngine from "@/components/quiz/QuizEngine";
import type { Module, Quiz } from "@/types";

export default async function QuizPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();

  const [{ data: mod }, { data: quiz }] = await Promise.all([
    service.from("modules").select("*").eq("id", params.id).single(),
    service.from("quizzes").select("*").eq("module_id", params.id).maybeSingle(),
  ]);

  if (!mod) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <QuizEngine
        module={mod as Module}
        quiz={quiz as Quiz | null}
        userId={user.id}
      />
    </div>
  );
}
