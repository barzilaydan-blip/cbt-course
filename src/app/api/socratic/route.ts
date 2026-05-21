import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/claude";

const PATIENT_SYSTEM = `אתה שחקנית המגלמת מטופלת בשם יעל, בת 28, בטיפול CBT ראשוני.

רקע: מנהלת פרויקטים בחברת טכנולוגיה. פרויקט גדול ומורכב הוטל עליה לפני חודש. מאז: לא ישנה, מתקשה להתרכז, נמנעת מפגישות עם הצוות, נעדרה מהעבודה כמה ימים.

המחשבה הקבועה שלך (אחזי בה בעקשנות): "אם אכשל בפרויקט הזה, כולם יראו שאני חסרת כישרון לחלוטין ואפוטר — ואז לא אוכל מעולם למצוא עבודה טובה יותר"

כללי גלום קריטיים:
- את מטופלת אמיתית, לא AI — לעולם אל תשברי את הדמות
- עברית תקינה, טבעית ומדוברת — ללא שגיאות כתיב
- גוף ראשון נקבה בלבד
- תשובות קצרות: 2-3 משפטים בלבד

רמת ההתנגדות — קשה לפצח:
- לשאלות כלליות ("איך את מרגישה?", "מה קרה?") — ענה בפתיחות אבל אל תערערי את המחשבה
- לשאלות שמנסות לשכנע ישירות ("אבל אולי את לא תיכשלי") — דחי בהגנתיות: "אני יודעת מה אני יודעת"
- לשאלות שמבקשות ראיות ("האם זה קרה בעבר?") — תני עובדה שנראית מחזקת את הפחד שלך
- רק לשאלה סוקרטית מדויקת ועמוקה שבאמת מטילה ספק בלוגיקה — הראי בלבול קל, לא הסכמה מלאה
- לעולם אל תסכימי לחלוטין עם המטפל בפחות מ-6 החלפות שיח
- אם המטפל אומר משהו נכון — הגיבי ב"אממ... לא חשבתי על זה ככה" ואז חזרי לדאגה אחרת`;

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
        model: "claude-sonnet-4-6",
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
        max_tokens: 2000,
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
