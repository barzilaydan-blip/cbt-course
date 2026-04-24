import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import AdminModuleEditor from "@/components/admin/AdminModuleEditor";
import type { Module, Quiz } from "@/types";

export default async function AdminModulePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const service = createServiceClient();

  const [{ data: mod }, { data: quiz }] = await Promise.all([
    service.from("modules").select("*").eq("id", params.id).single(),
    service.from("quizzes").select("*").eq("module_id", params.id).maybeSingle(),
  ]);

  if (!mod) notFound();

  return (
    <AdminModuleEditor
      mod={mod as Module}
      initialQuiz={quiz as Quiz | null}
    />
  );
}
