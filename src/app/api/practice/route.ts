import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatResponse, generateSessionFeedback } from "@/lib/claude";
import type { ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { messages, moduleTitle, moduleId, userId, generateFeedback } = body as {
      messages: ChatMessage[];
      moduleTitle: string;
      moduleId: string;
      userId: string;
      generateFeedback?: boolean;
    };

    if (generateFeedback) {
      // Generate final feedback + mark practice as complete
      const feedback = await generateSessionFeedback(messages, moduleTitle);

      // Save session and mark progress
      await supabase.from("practice_sessions").insert({
        user_id: userId,
        module_id: moduleId,
        conversation: messages,
        ai_feedback: feedback,
      });

      // Update progress
      await fetch(`${req.nextUrl.origin}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          userId,
          field: "practice_completed",
          value: true,
        }),
      });

      return NextResponse.json({ feedback });
    }

    // Regular chat turn
    const reply = await getChatResponse(messages, moduleTitle);
    return NextResponse.json({ reply });

  } catch (err) {
    console.error("Practice API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
