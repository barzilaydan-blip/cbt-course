import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import ResourceLibrary from "@/components/resources/ResourceLibrary";
import type { Resource } from "@/types";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();

  const { data: resources } = await service
    .from("resources")
    .select("*")
    .eq("is_published", true)
    .order("category")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="מרכז משאבים"
        description="טפסים קליניים, שאלונים ומדריכים להורדה — חפש לפי שם או סנן לפי קטגוריה."
      />
      <ResourceLibrary resources={(resources ?? []) as Resource[]} />
    </div>
  );
}
