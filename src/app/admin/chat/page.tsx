import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AdminChatMonitor from "@/components/admin/AdminChatMonitor";
import AdminQuestions from "@/components/admin/AdminQuestions";
import AdminChatTabs from "@/components/admin/AdminChatTabs";
import type { Group, GroupMessage, Question } from "@/types";

export default async function AdminChatPage() {
  const supabase = await createClient();
  const service = createServiceClient();

  const [{ data: groups }, { data: questions }] = await Promise.all([
    service.from("groups").select("*").order("created_at"),
    service
      .from("questions")
      .select("*, profiles(name, email)")
      .order("created_at", { ascending: false }),
  ]);

  const groupIds = (groups ?? []).map((g: Group) => g.id);

  const { data: messages } = await service
    .from("messages")
    .select("*, profiles(name, email)")
    .in("group_id", groupIds.length > 0 ? groupIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false })
    .limit(200);

  const pendingCount = (questions ?? []).filter((q: Question) => q.status === "pending").length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-brand-500 flex items-center gap-1 mb-2">
          <ChevronLeft className="w-4 h-4 rotate-180" />
          חזור לניהול
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">ניטור צ׳אט ושאלות</h1>
        <p className="text-slate-500 mt-1 text-sm">צפה בשיחות הקבוצות ובשאלות הסטודנטים</p>
      </div>

      <AdminChatTabs
        pendingCount={pendingCount}
        chatContent={
          <AdminChatMonitor
            groups={(groups ?? []) as Group[]}
            initialMessages={(messages ?? []).reverse() as GroupMessage[]}
          />
        }
        questionsContent={
          <AdminQuestions initialQuestions={(questions ?? []) as Question[]} />
        }
      />
    </div>
  );
}
