import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || "";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = createServiceClient();
    const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { groupId } = await req.json() as { groupId: string };

    // Get group name and members
    const { data: group } = await service.from("groups").select("name").eq("id", groupId).single();
    const { data: members } = await service
      .from("profiles")
      .select("name, email")
      .eq("group_id", groupId)
      .eq("role", "student");

    if (!members || members.length === 0) {
      return NextResponse.json({ error: "No members in group" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let sent = 0;
    const errors: string[] = [];

    for (const member of members) {
      try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: member.email,
            name: member.name || "",
            groupName: group?.name || "",
            appUrl,
          }),
        });
        const data = await res.json();
        if (data.success) {
          sent++;
        } else {
          errors.push(`${member.email}: ${data.error || "unknown error"}`);
        }
      } catch (e) {
        errors.push(`${member.email}: ${e instanceof Error ? e.message : "unknown error"}`);
      }
    }

    return NextResponse.json({ sent, errors });
  } catch (err) {
    console.error("Send invitations error:", err);
    return NextResponse.json({ error: "Failed to send invitations" }, { status: 500 });
  }
}
