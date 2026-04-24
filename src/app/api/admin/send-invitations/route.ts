import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
      const { error } = await resend.emails.send({
        from: "CBT Course <onboarding@resend.dev>",
        to: member.email,
        subject: `הוזמנת לקורס CBT — ${group?.name}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a3a5c;">שלום ${member.name || ""},</h1>
            <p style="font-size: 16px; color: #333;">הוזמנת להשתתף בקורס <strong>CBT — טיפול קוגניטיבי-התנהגותי</strong> בקבוצה: <strong>${group?.name}</strong>.</p>
            <p style="font-size: 16px; color: #333;">לחץ על הכפתור למטה כדי להתחבר לאפליקציה ולהתחיל את הקורס:</p>
            <a href="${appUrl}" style="display: inline-block; background-color: #2c6e9e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; margin: 20px 0;">
              כניסה לקורס
            </a>
            <p style="font-size: 14px; color: #666;">האימייל שלך: <strong>${member.email}</strong></p>
            <p style="font-size: 14px; color: #666;">אם קיבלת מייל זה בטעות, אנא התעלם ממנו.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #999;">קורס CBT — 12 מפגשים של טיפול קוגניטיבי-התנהגותי</p>
          </div>
        `,
      });

      if (error) {
        errors.push(`${member.email}: ${error.message}`);
      } else {
        sent++;
      }
    }

    return NextResponse.json({ sent, errors });
  } catch (err) {
    console.error("Send invitations error:", err);
    return NextResponse.json({ error: "Failed to send invitations" }, { status: 500 });
  }
}
