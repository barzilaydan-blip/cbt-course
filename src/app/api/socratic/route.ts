import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/claude";

const PATIENT_SYSTEM = `אתה מגלמת מטופלת בשם יעל, בת 28, שמגיעה לטיפול CBT בגלל חרדת ביצוע.

רקע: מנהלת פרויקטים בחברת טכנולוגיה. קיבלת לאחרונה פרויקט גדול ומרגישה לחץ עצום. לא ישנה טוב, מתקשה להתרכז, נמנעת מפגישות עם הצוות.

המחשבה שמציקה לך: "אם אכשל בפרויקט הזה, כולם יראו שאני חסרת כישרון לחלוטין ואפוטר — ואז לא אוכל מעולם למצוא עבודה טובה יותר"

הנחיות:
- ענה כמו מטופלת אמיתית — לא כ-AI
- היי מאתגרת ברמה בינונית: אל תיכנעי לשאלות שטחיות, אבל כשהשאלה הסוקרטית טובה ומדויקת — הראי פתיחות קטנה ועיוּן מחדש
- הביעי רגשות אותנטיים: חרדה, ספק, הגנתיות, ולעתים הקלה קלה
- דברי בגוף ראשון נקבה, בעברית טבעית ומדוברת
- תשובות קצרות-בינוניות (2-4 משפטים)
- אל תסבירי שאת AI ואל תשתמשי במינוח קליני`;

const FEEDBACK_SYSTEM = `אתה סופרוויזר CBT מנוסה המתמחה בשאלות סוקרטיות ובפיתוח כישורים קליניים של סטודנטים.`;

interface MsgItem { role: string; content: string; }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mode, messages } = await req.json() as { mode: string; messages: MsgItem[] };

    if (mode === "chat") {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 350,
        system: PATIENT_SYSTEM,
        messages: messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      });
      const block = response.content[0];
      return NextResponse.json({ reply: block.type === "text" ? block.text : "" });
    }

    if (mode === "feedback") {
      const studentQs = messages
        .filter(m => m.role === "user")
        .map((m, i) => `שאלה ${i + 1}: "${m.content}"`)
        .join("\n");

      const transcript = messages
        .map(m => `${m.role === "user" ? "מטפל" : "יעל"}: ${m.content}`)
        .join("\n\n");

      const response = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 900,
        system: FEEDBACK_SYSTEM,
        messages: [{
          role: "user",
          content: `להלן שיחה בין סטודנט CBT למטופלת יעל עם חרדת ביצוע.
מטרת הסטודנט: להשתמש בשאלות סוקרטיות כדי לערער את המחשבה:
"אם אכשל בפרויקט הזה, כולם יראו שאני חסרת כישרון לחלוטין ואפוטר".

שאלות הסטודנט:
${studentQs}

תמליל מלא:
${transcript}

כתוב משוב מסכם מקצועי בעברית. חלק אותו לשלושה חלקים ברורים:

✅ נקודות חזקות
(פרט 2-3 דברים ספציפיים שהסטודנט עשה טוב — עם ציטוט קצר מהשאלה)

⚠️ נקודות לשיפור
(פרט 2-3 הצעות קונקרטיות — מה ניתן לשפר ואיך)

💡 המלצה כללית
(משפט מסכם על הביצוע הכולל)`,
        }],
      });
      const block = response.content[0];
      return NextResponse.json({ feedback: block.type === "text" ? block.text : "" });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("Socratic API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
