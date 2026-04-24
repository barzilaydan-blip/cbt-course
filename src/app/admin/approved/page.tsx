import { createServiceClient } from "@/lib/supabase/service";
import AdminApprovedEmails from "@/components/admin/AdminApprovedEmails";
import { ShieldCheck } from "lucide-react";

export default async function AdminApprovedPage() {
  const service = createServiceClient();
  const { data: emails } = await service
    .from("approved_emails")
    .select("id, email, status, source, approved_at, used_at, notes")
    .order("approved_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          ניהול גישה — מיילים מאושרים
        </h1>
        <p className="text-slate-500 mt-1">רק מיילים ברשימה זו יוכלו להתחבר עם Google</p>
      </div>

      <AdminApprovedEmails initialEmails={emails ?? []} />
    </div>
  );
}
