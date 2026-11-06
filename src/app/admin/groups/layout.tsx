import { createServiceClient } from "@/lib/supabase/service";
import AdminGroupNav from "@/components/admin/AdminGroupNav";
import type { Group } from "@/types";

export default async function AdminGroupsLayout({ children }: { children: React.ReactNode }) {
  const service = createServiceClient();
  const { data: groups } = await service.from("groups").select("*").order("created_at");

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <AdminGroupNav groups={(groups ?? []) as Group[]} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
