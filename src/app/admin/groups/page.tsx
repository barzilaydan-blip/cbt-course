import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AdminGroupsManager from "@/components/admin/AdminGroupsManager";
import type { Group, Profile } from "@/types";

export default async function AdminGroupsPage() {
  const supabase = await createClient();
  const service = createServiceClient();

  const [{ data: groups }, { data: profiles }] = await Promise.all([
    service.from("groups").select("*").order("created_at"),
    service.from("profiles").select("id, name, email, role, total_points, group_id").eq("role", "student"),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-brand-500 flex items-center gap-1 mb-2">
          <ChevronLeft className="w-4 h-4 rotate-180" />
          חזור לניהול
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">ניהול קבוצות (מחזורים)</h1>
        <p className="text-slate-500 mt-1 text-sm">צור קבוצות לימוד ושייך סטודנטים</p>
      </div>

      <AdminGroupsManager
        initialGroups={(groups ?? []) as Group[]}
        students={(profiles ?? []) as Profile[]}
      />
    </div>
  );
}
