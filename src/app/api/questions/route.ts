import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { groupId, type, content, visibility } = body;

  if (!type || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const service = createServiceClient();

  if (visibility === "group" && groupId) {
    // Post to group chat as a formatted message
    const typeLabel = type === "professional" ? "🧠 שאלה מקצועית" : "⚙️ שאלה טכנית";
    const { error } = await service.from("messages").insert({
      user_id: user.id,
      group_id: groupId,
      content: `${typeLabel}:\n${content.trim()}`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Save as private question
    const { error } = await service.from("questions").insert({
      user_id: user.id,
      group_id: groupId ?? null,
      type,
      content: content.trim(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Get questions — admin gets all, student gets own
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role === "admin") {
    const { data, error } = await service
      .from("questions")
      .select("*, profiles(name, email)")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Student: return own questions only
  const { data, error } = await service
    .from("questions")
    .select("id, type, content, status, admin_reply, answered_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Admin: update question (mark answered + reply)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, admin_reply, status } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (admin_reply !== undefined) update.admin_reply = admin_reply;
  if (status === "answered") {
    update.status = "answered";
    update.answered_at = new Date().toISOString();
  }
  if (status === "pending") {
    update.status = "pending";
    update.answered_at = null;
  }

  const { error } = await service.from("questions").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
