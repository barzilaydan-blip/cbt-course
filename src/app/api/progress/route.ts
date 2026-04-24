import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { POINTS } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { moduleId, userId, field, value, quiz_score, quiz_completed } = body;

    // Build the update patch
    const patch: Record<string, unknown> = {
      user_id: userId,
      module_id: moduleId,
    };

    if (field === "quiz") {
      patch.quiz_completed = quiz_completed;
      patch.quiz_score = quiz_score;
    } else {
      patch[field] = value;
    }

    // Upsert progress row
    const { data: existing } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .maybeSingle();

    const merged = { ...(existing ?? {}), ...patch };

    // Recalculate points
    let pts = 0;
    if (merged.video_watched) pts += POINTS.VIDEO;
    if (merged.article_read) pts += POINTS.ARTICLE;
    if (merged.quiz_completed && merged.quiz_score != null) {
      pts += Math.round((merged.quiz_score / 100) * POINTS.QUIZ_MAX);
    }
    if (merged.practice_completed) pts += POINTS.PRACTICE;
    pts += merged.exercise_points ?? 0;

    merged.points_earned = pts;

    // Mark complete if all done
    if (merged.video_watched && merged.article_read && merged.quiz_completed && merged.practice_completed) {
      merged.completed_at = new Date().toISOString();
    }

    await supabase.from("progress").upsert(merged, { onConflict: "user_id,module_id" });

    // Update total_points on profile
    const { data: allProgress } = await supabase
      .from("progress")
      .select("points_earned")
      .eq("user_id", userId);

    const totalPoints = (allProgress ?? []).reduce(
      (sum: number, p: { points_earned: number }) => sum + (p.points_earned ?? 0), 0
    );

    await supabase
      .from("profiles")
      .update({ total_points: totalPoints })
      .eq("id", userId);

    return NextResponse.json({ success: true, points_earned: pts });
  } catch (err) {
    console.error("Progress API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
