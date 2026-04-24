import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
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
        <div className="text-center bg-white rounded-2xl border border-slate-200 p-12 max-w-sm w-full">
          <span className="text-5xl">💬</span>
          <h2 className="text-lg font-bold text-brand-900 mt-4">טרם שויכת לקבוצה</h2>
          <p className="text-slate-500 text-sm mt-2">
            פנה למנהל הקורס כדי להצטרף לקבוצת הלימוד שלך
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
