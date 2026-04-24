import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AskLecturerButton from "@/components/ui/AskLecturerButton";
import type { Profile } from "@/types";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("*").eq("id", user.id).single();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar profile={profile as Profile | null} />
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 pb-24 md:pb-6">
        {children}
      </div>
      {profile?.role === "student" && (
        <AskLecturerButton userId={profile.id} groupId={profile.group_id ?? null} />
      )}
    </div>
  );
}
