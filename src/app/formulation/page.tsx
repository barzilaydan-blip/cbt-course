import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import FormulationForm from "@/components/formulation/FormulationForm";
import type { DynamicFormulation } from "@/types";

export default async function FormulationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();

  const { data: formulation } = await service
    .from("dynamic_formulation")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <FormulationForm
      initialData={formulation as DynamicFormulation | null}
      userId={user.id}
    />
  );
}
