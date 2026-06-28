import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { anthropic } from "@/lib/claude";

const FORMULATION_SYSTEM = `אתה פסיכולוג קליני מומחה וסופרוויזר בכיר בטיפול קוגניטיבי-התנהגותי (CBT). תפקידך לגבש "היפותזת עבודה" (המשגת מקרה טיפולית) מקיפה ואינטגרטיבית בעברית, בהתבסס על המידע המבני שמסר הסטודנט על המטופל.

הפלט חייב להיות נרטיב קליני מקצועי ורציף — לא חזרה או העתקה של שדות הקלט. עליך לקשר באופן מפורש בין אמונות היסוד והביניים של המטופל, הקשיים בוויסות הפיזיולוגי והרגשי, והתגובות ההתנהגותיות.

בנה את ההיפותזה לפי הכותרות הבאות (בעברית, בדיוק כפי שמופיעות):

1. רקע ופיתוח הבעיה (היפגעויות יסוד):
שלב את הרקע ההתפתחותי, החוויות המוקדמות וכל קושי התפתחותי או מערכתי רלוונטי. הסבר כיצד חוויות אלה עיצבו את אמונות היסוד ואמונות הביניים של המטופל.

2. פרופיל ההפעלה והטריגרים:
תאר את הטריגרים הפנימיים והחיצוניים המרכזיים. הסבר מדוע טריגרים ספציפיים אלה טעונים במיוחד עבור מטופל זה, בהתבסס על אמונותיו והטיות הקשב/הקוגניציה שלו.

3. חווית המטופל ברגע המשבר:
בצע מיקרו-ניתוח של חוויית המטופל כאשר טריגר מופעל. פרט את האינטראקציה בין מחשבות אוטומטיות ועיוותי חשיבה, חוסר ויסות רגשי (עוצמה, לאביליות ורגשות ספציפיים), ותחושות גופניות ויכולתו (או חוסר יכולתו) של המטופל לוויסות עוררות פיזיולוגית.

4. מעגל השימור וההנצחה (סעיף קריטי):
זוהי ליבת ההיפותזה. תאר את מעגל ההזנה השלילי: כיצד ההתמודדות ההתנהגותית של המטופל (הימנעות, פיצוי יתר, התנהגויות ביטחון) והמיומנויות החסרות הספציפיות שלו (כגון תפקוד ניהולי, ויסות רגשי, או מיומנויות בין-אישיות) מעוררות תגובות סביבתיות אשר בסופו של דבר "מוכיחות" ומחזקות את אמונות היסוד שלו.

5. כיווני עבודה:
מפה בקצרה כיצד החוזקות הנוכחיות של המטופל עשויות לסייע בבניית המיומנויות החסרות ובפריצת מעגל ההנצחה שתואר לעיל.

סגנון וטון:
- השתמש בעברית קלינית מקצועית, אמפתית ומדויקת.
- התמקד בניתוח פונקציונלי של ההתנהגות ובאינטראקציה בין היתוך קוגניטיבי, הטיות קשב וויסות רגשי.
- הבטח שהנרטיב יזרום באופן לוגי, ויפגין המשגה ברורה של מדוע המטופל תקוע במצבו.
- אם שדה מסוים לא מולא ("לא צוין"), דלג עליו בטבעיות ואל תציין את היעדרו.`;

const FIELD_LABELS: Record<string, string> = {
  background: "רקע והתפתחות הבעיה",
  core_beliefs: "אמונות יסוד",
  intermediate_beliefs: "אמונות ביניים",
  triggers: "טריגרים פנימיים וחיצוניים",
  automatic_thoughts: "מחשבות אוטומטיות",
  cognitive_distortions: "עיוותי חשיבה",
  attentional_biases: "הטיות קשב",
  cognitive_awareness: "מודעות וגמישות מחשבתית",
  emotions_typical: "רגשות טיפוסיים וטווח רגשי",
  emotional_awareness: "מודעות רגשית",
  emotion_regulation: "ויסות רגשי",
  physical_sensations: "תחושות גופניות מלוות",
  body_awareness: "מודעות לקשר גוף-רגש",
  sensation_triggers: "תזמון והופעת התחושות, עוצמתן וחשש מהן",
  somatic_regulation: "ויסות והרגעה גופנית",
  behaviors_typical: "דפוסי התנהגות טיפוסיים",
  environmental_response: "תגובת הסביבה לקושי",
  missing_skills: "מיומנויות חסרות",
  vicious_cycle: "מעגל השימור וההנצחה",
  strengths: "חוזקות",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await req.json();
  if (!moduleId) return NextResponse.json({ error: "Missing moduleId" }, { status: 400 });

  const service = createServiceClient();
  const { data: submission, error: fetchError } = await service
    .from("exercise_submissions")
    .select("id, answers")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (fetchError || !submission) {
    return NextResponse.json({ error: "לא נמצאה הגשת המשגה למפגש זה" }, { status: 404 });
  }

  const answers = submission.answers as Record<string, unknown>;

  function formatValue(key: string): string {
    const value = answers[key];
    if (key === "cognitive_distortions") {
      return Array.isArray(value) && value.length > 0 ? value.join(", ") : "לא צוין";
    }
    if (key === "emotional_awareness" || key === "body_awareness") {
      return typeof value === "number" ? `${value}/10` : "לא צוין";
    }
    return typeof value === "string" && value.trim() ? value.trim() : "לא צוין";
  }

  const dataText = Object.entries(FIELD_LABELS)
    .map(([key, label]) => `${label}: ${formatValue(key)}`)
    .join("\n\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8000,
      system: FORMULATION_SYSTEM,
      messages: [{ role: "user", content: `נתוני המטופל:\n\n${dataText}` }],
    });
    const block = response.content[0];
    const narrative = block.type === "text" ? block.text : "";

    await service
      .from("exercise_submissions")
      .update({ answers: { ...answers, ai_formulation_he: narrative } })
      .eq("id", submission.id);

    return NextResponse.json({ narrative });
  } catch (err) {
    console.error("Formulation AI error:", err);
    return NextResponse.json({ error: "שגיאה ביצירת ההמשגה" }, { status: 500 });
  }
}
