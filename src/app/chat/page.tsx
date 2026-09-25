import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import GroupChat from "@/components/chat/GroupChat";
import type { GroupMessage, Profile, Group } from "@/types";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();

  const { data: profile } = await service
    .from("profiles")
    .select("*, groups(id, name)")
    .eq("id", user.id)
    .single();

  const currentProfile = profile as (Profile & { groups: Group | null }) | null;

  // No group assigned — show placeholder
  if (!currentProfile?.group_id) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl border border-slate-200 shadow-card px-8 py-12 max-w-md w-full">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <Users className="w-7 h-7 text-brand-500" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-brand-900">טרם שויכת לקבוצה</h1>
          <p className="text-slate-600 mt-2">
            הצ׳אט פעיל לחברי קבוצות הלימוד בלבד. לאחר ששיוך לקבוצה יתבצע על ידי מנהל הקורס, הצ׳אט יופיע כאן.
          </p>
        </div>
      </div>
    );
  }

  // Load last 60 messages for the group
  const { data: initialMessages } = await service
    .from("messages")
    .select("*, profiles(name, email)")
    .eq("group_id", currentProfile.group_id)
    .order("created_at", { ascending: true })
    .limit(60);

  return (
    <GroupChat
      initialMessages={(initialMessages ?? []) as GroupMessage[]}
      groupId={currentProfile.group_id}
      groupName={(currentProfile.groups as Group | null)?.name ?? "הקבוצה שלי"}
      userId={user.id}
      userName={currentProfile.name || currentProfile.email}
    />
  );
}
