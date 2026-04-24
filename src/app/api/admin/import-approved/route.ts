import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  // Auth: admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Parse multipart form
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const text = await file.text();
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return NextResponse.json({ error: "CSV is empty" }, { status: 400 });

  // Find email column (supports English and Hebrew headers)
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const emailIdx = headers.findIndex(h =>
    h === "email" || h === "אימייל" || h === "דואר אלקטרוני" || h === "mail"
  );
  if (emailIdx === -1) {
    return NextResponse.json({ error: "No email column found. Expected column named: email / אימייל" }, { status: 400 });
  }

  // Extract and validate emails
  const emails: string[] = [];
  const skipped: string[] = [];

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const raw = cols[emailIdx]?.trim() ?? "";
    const email = raw.toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emails.push(email);
    } else if (raw) {
      skipped.push(raw);
    }
  }

  if (emails.length === 0) {
    return NextResponse.json({ error: "No valid emails found in file" }, { status: 400 });
  }

  // Upsert all emails — ignoreDuplicates = skip existing, don't overwrite
  const rows = emails.map(email => ({
    email,
    status: "active",
    source: "csv_import",
  }));

  const { error } = await service
    .from("approved_emails")
    .upsert(rows, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("import-approved error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: emails.length, skipped });
}
