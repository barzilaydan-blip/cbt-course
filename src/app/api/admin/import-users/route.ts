import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profession?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = createServiceClient();
    const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { rows, groupId } = await req.json() as { rows: ImportRow[]; groupId: string };

    const results = { created: 0, existing: 0, errors: [] as string[] };

    for (const row of rows) {
      const email = row.email.trim().toLowerCase();
      const name = `${row.firstName.trim()} ${row.lastName.trim()}`.trim();

      // Check if user already exists in auth
      const { data: existingUsers } = await service.auth.admin.listUsers();
      const existing = existingUsers?.users.find(u => u.email === email);

      if (existing) {
        // Update their profile and assign to group
        await service.from("profiles").upsert({
          id: existing.id,
          email,
          name,
          phone: row.phone?.trim() || null,
          profession: row.profession?.trim() || null,
          group_id: groupId,
          role: "student",
        }, { onConflict: "id" });
        results.existing++;
      } else {
        // Create new user with a temporary password
        const { data: newUser, error: createErr } = await service.auth.admin.createUser({
          email,
          password: Math.random().toString(36).slice(-10) + "A1!",
          email_confirm: true,
          user_metadata: { name },
        });

        if (createErr || !newUser.user) {
          results.errors.push(`${email}: ${createErr?.message ?? "unknown error"}`);
          continue;
        }

        await service.from("profiles").upsert({
          id: newUser.user.id,
          email,
          name,
          phone: row.phone?.trim() || null,
          profession: row.profession?.trim() || null,
          group_id: groupId,
          role: "student",
        }, { onConflict: "id" });

        results.created++;
      }

      // Also approve this email for Google OAuth login
      await service.from("approved_emails").upsert(
        { email, status: "active", source: "csv_import" },
        { onConflict: "email", ignoreDuplicates: true }
      );
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
