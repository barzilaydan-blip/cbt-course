import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await req.json();
  if (!moduleId) return NextResponse.json({ error: "Missing moduleId" }, { status: 400 });

  const service = createServiceClient();
  const { data, error } = await service
    .from("page_visits")
    .insert({ user_id: user.id, module_id: moduleId })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ visitId: data.id });
}
