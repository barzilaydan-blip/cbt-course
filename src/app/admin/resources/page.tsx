import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AdminResourcesManager from "@/components/admin/AdminResourcesManager";
import type { Resource, Module } from "@/types";

export default async function AdminResourcesPage() {
  const supabase = await createClient();
  const service = createServiceClient();

  const [{ data: resources }, { data: modules }] = await Promise.all([
    service.from("resources").select("*").order("created_at", { ascending: false }),
    service.from("modules").select("id, order_number, title_he").order("order_number"),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-brand-500 flex items-center gap-1 mb-2">
          <ChevronLeft className="w-4 h-4 rotate-180" />
          חזור לניהול
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">ניהול משאבים</h1>
        <p className="text-slate-500 mt-1 text-sm">העלה קבצים ושאלונים קליניים לסטודנטים</p>
      </div>

      <AdminResourcesManager
        initialResources={(resources ?? []) as Resource[]}
        modules={(modules ?? []) as Pick<Module, "id" | "order_number" | "title_he">[]}
      />
    </div>
  );
}
