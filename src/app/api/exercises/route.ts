import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { anthropic } from "@/lib/claude";

type ClinicalAnswers = { q1: string; q2: string; q3: string; h1: string; h2: string; h3: string; h4: string; h5: string };

const QUESTIONS = [
  "מהן התנהגויות ההימנעות (Avoidance) והתנהגויות הביטחון (Safety Behaviors) של רון? כיצד הן משמרות את החרדה לטווח הארוך?",
  "לקראת תחילת שלב החשיפות, כיצד תסבירו לרון את הרציונל שמאחורי טיפול בחשיפה? התייחסו להתרגלות (Habituation) ולמידת הכחדה.",
  "במהלך אחת מפעולות החשיפה, רון מדווח על רמת חרדה של 95/100, מתחיל לרעוד ומבקש לעצור מיד. כמטפלים, כיצד תגיבו באותו הרגע?",
];

async function generateAIDraft(submissionId: string, answers: ClinicalAnswers) {
  try {
    const service = createServiceClient();
    const hierarchyText = [1,2,3,4,5].map(i => {
      const key = `h${i}` as keyof typeof answers;
      return `  שלב ${i}: ${answers[key] || "(לא מולא)"}`;
    }).join("\n");

    const answersText = QUESTIONS.map((q, i) => {
      const key = `q${i + 1}` as keyof typeof answers;
      return `שאלה ${i + 1}: ${q}\nתשובת הסטודנט: ${answers[key]}`;
    }).join("\n\n") + `\n\nמדרג החשיפה שבנה הסטודנט (5 שלבים):\n${hierarchyText}`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1200,
      system: `אתה סופרוויזר CBT מנוסה. בדוק את תשובות הסטודנט לשאלות על מקרה רון (אקרופוביה — פחד מגבהים).

רקע המקרה: רון, בן 32, מהנדס תוכנה. עבד לקומה 28 במגדל זכוכית. סירב לעלות במעלית השקופה — מטפס 28 קומות ברגל. בתוך המשרד נמנע מחלונות, נצמד לקירות, משפיל מבט. מחשבות אוטומטיות: "הזכוכית תישבר", "אאבד שליטה ואקפוץ", "אתעלף מול כולם". שוקל להתפטר.

בדוק:
1. האם הסטודנט זיהה נכון התנהגויות הימנעות (טיפוס במדרגות, הימנעות מחלונות) והתנהגויות ביטחון (הצמדות לקיר, הורדת מבט, אחיזה בקיר) ואת תפקידן בשימור החרדה לטווח הארוך
2. האם הסטודנט הסביר נכון את הרציונל לחשיפה — התרגלות (חרדה יורדת עם זמן אם נשארים) והכחדה (ניתוק קשר בין הגירוי לתגובת הפחד)
3. האם התגובה לחרדה 95/100 תואמת את הפרוטוקול: הישארות בחשיפה, עידוד ורגיעה, ניטור SUD, ולא בריחה מיידית שתחזק את ההימנעות
4. האם מדרג החשיפה שבנה הסטודנט (5 שלבים) הגיוני — מתחיל מרמת חרדה נמוכה ועולה בהדרגה, מכסה את הגירויים הרלוונטיים (מעלית שקופה, קומות גבוהות, חלונות), ואינו כולל התנהגויות ביטחון

ספק משוב מפורט, מקצועי ומעודד בעברית על כל תשובה. בסיום ציין ציון מוצע בין 0 ל-50.

פורמט קפדני:
<feedback>
[משוב מפורט כאן]
</feedback>
<score>[מספר בלבד, 0-50]</score>`,
      messages: [{ role: "user", content: answersText }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const feedbackMatch = text.match(/<feedback>([\s\S]*?)<\/feedback>/);
    const scoreMatch = text.match(/<score>(\d+)<\/score>/);

    const ai_draft_feedback = feedbackMatch ? feedbackMatch[1].trim() : text;
    const ai_suggested_points = scoreMatch ? Math.min(50, Math.max(0, parseInt(scoreMatch[1]))) : null;

    await service
      .from("exercise_submissions")
      .update({ ai_draft_feedback, ai_suggested_points })
      .eq("id", submissionId);
  } catch {
    // Silent fail — admin sees "טיוטת AI אינה זמינה"
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { moduleId, answers } = body;

  if (!moduleId || !answers) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const service = createServiceClient();

  // Detect form type by module order number
  const { data: moduleData } = await service.from("modules").select("order_number").eq("id", moduleId).single();
  const isExpectationsForm = moduleData?.order_number === 1;

  let safeAnswers: Record<string, string>;
  if (isExpectationsForm) {
    if (!answers.background?.trim() || !answers.reason?.trim() || !answers.success?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    safeAnswers = {
      background: answers.background,
      personal: answers.personal ?? "",
      reason: answers.reason,
      success: answers.success,
      interests: answers.interests ?? "",
    };
  } else {
    if (!answers.q1 || !answers.q2 || !answers.q3) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    safeAnswers = {
      q1: answers.q1, q2: answers.q2, q3: answers.q3,
      h1: answers.h1 ?? "", h2: answers.h2 ?? "", h3: answers.h3 ?? "",
      h4: answers.h4 ?? "", h5: answers.h5 ?? "",
    };
  }

  const { data, error } = await service
    .from("exercise_submissions")
    .insert({ user_id: user.id, module_id: moduleId, answers: safeAnswers })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "כבר הגשת את הטופס הזה" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (isExpectationsForm) {
    // Mark practice as complete immediately — no admin review needed for points
    const { data: existing } = await service
      .from("progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .maybeSingle();

    const merged: Record<string, unknown> = {
      ...(existing ?? {}),
      user_id: user.id,
      module_id: moduleId,
      practice_completed: true,
    };
    let pts = 0;
    if (merged.video_watched) pts += 10;
    if (merged.article_read) pts += 10;
    if (merged.quiz_completed && merged.quiz_score != null) {
      pts += Math.round(((merged.quiz_score as number) / 100) * 30);
    }
    pts += 20; // practice points
    pts += ((merged.exercise_points as number) ?? 0);
    merged.points_earned = pts;

    await service.from("progress").upsert(merged, { onConflict: "user_id,module_id" });

    const { data: allProgress } = await service
      .from("progress").select("points_earned").eq("user_id", user.id);
    const totalPoints = (allProgress ?? []).reduce(
      (sum: number, p: { points_earned: number }) => sum + (p.points_earned ?? 0), 0
    );
    await service.from("profiles").update({ total_points: totalPoints }).eq("id", user.id);
  } else {
    // Fire-and-forget AI draft generation for clinical exercises
    void generateAIDraft(data.id, safeAnswers as ClinicalAnswers);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).single();

  const moduleId = req.nextUrl.searchParams.get("moduleId");

  if (profile?.role === "admin") {
    const { data, error } = await service
      .from("exercise_submissions")
      .select("*, profiles(name, email), modules(order_number, title_he)")
      .order("submitted_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Student: own submission for a specific module
  if (!moduleId) return NextResponse.json({ error: "Missing moduleId" }, { status: 400 });

  const { data, error } = await service
    .from("exercise_submissions")
    .select("id, answers, status, admin_feedback, points_awarded, submitted_at, reviewed_at")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
