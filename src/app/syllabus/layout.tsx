import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import type { Profile } from "@/types";

export default async function SyllabusLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="print:hidden">
        <Navbar profile={profile as Profile | null} />
      </div>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 print:p-0 print:max-w-none">
        {children}
      </main>
    </div>
  );
}
