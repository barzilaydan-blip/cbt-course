import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? service : null;
}

// GET: List approved emails, optionally scoped to a group
export async function GET(req: NextRequest) {
  const service = await requireAdmin();
  if (!service) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const groupId = req.nextUrl.searchParams.get("groupId");

  let query = service
    .from("approved_emails")
    .select("id, email, status, source, linked_user_id, group_id, approved_at, used_at, notes")
    .order("approved_at", { ascending: false });
  if (groupId) query = query.eq("group_id", groupId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST: Add a single email manually
export async function POST(req: NextRequest) {
  const service = await requireAdmin();
  if (!service) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, notes, groupId } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { error } = await service.from("approved_emails").upsert(
    { email: email.trim().toLowerCase(), status: "active", source: "manual", notes: notes ?? null, group_id: groupId ?? null },
    { onConflict: "email" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH: Update status (e.g., revoke)
export async function PATCH(req: NextRequest) {
  const service = await requireAdmin();
  if (!service) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  const allowed = ["active", "revoked", "pending_link"];
  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await service.from("approved_emails").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
