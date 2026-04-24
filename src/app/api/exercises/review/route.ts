import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { submissionId, admin_feedback, points_awarded } = await req.json();
  if (!submissionId) return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });

  const pts = Math.min(50, Math.max(0, Number(points_awarded) || 0));

  // 1. Update the submission
  const { data: submission, error: subErr } = await service
    .from("exercise_submissions")
    .update({
      status: "reviewed",
      admin_feedback,
      points_awarded: pts,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .select("user_id, module_id")
    .single();

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

  const { user_id, module_id } = submission;

  // Check if this is an expectations form (module 1) — points already awarded on submission
  const { data: mod } = await service.from("modules").select("order_number").eq("id", module_id).single();
  const isExpectationsForm = mod?.order_number === 1;

  // 2. Upsert progress row with exercise_points (skip for expectations form)
  const { data: existing } = await service
    .from("progress")
    .select("*")
    .eq("user_id", user_id)
    .eq("module_id", module_id)
    .maybeSingle();

  const merged = { ...(existing ?? {}), user_id, module_id, exercise_points: isExpectationsForm ? (existing?.exercise_points ?? 0) : pts };

  // Recalculate points_earned
  let totalPts = 0;
  if (merged.video_watched) totalPts += 10;
  if (merged.article_read) totalPts += 10;
  if (merged.quiz_completed && merged.quiz_score != null) {
    totalPts += Math.round((merged.quiz_score / 100) * 30);
  }
  if (merged.practice_completed) totalPts += 20;
  totalPts += pts;
  merged.points_earned = totalPts;

  await service.from("progress").upsert(merged, { onConflict: "user_id,module_id" });

  // 3. Recalculate total_points on profile
  const { data: allProgress } = await service
    .from("progress")
    .select("points_earned")
    .eq("user_id", user_id);

  const totalPoints = (allProgress ?? []).reduce(
    (sum: number, p: { points_earned: number }) => sum + (p.points_earned ?? 0), 0
  );

  await service.from("profiles").update({ total_points: totalPoints }).eq("id", user_id);

  return NextResponse.json({ ok: true });
}
