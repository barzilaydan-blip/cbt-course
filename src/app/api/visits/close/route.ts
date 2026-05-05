import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  let body: { visitId?: string; durationSeconds?: number };
  try {
    const text = await req.text();
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { visitId, durationSeconds } = body;
  if (!visitId) return NextResponse.json({ error: "Missing visitId" }, { status: 400 });

  const service = createServiceClient();
  await service
    .from("page_visits")
    .update({
      exited_at: new Date().toISOString(),
      duration_seconds: typeof durationSeconds === "number" ? durationSeconds : null,
    })
    .eq("id", visitId);

  return NextResponse.json({ ok: true });
}
