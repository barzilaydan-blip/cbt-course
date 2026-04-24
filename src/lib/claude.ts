import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export function buildSystemPrompt(moduleTitle: string): string {
  return `אתה סופרוויזר CBT מנוסה ומיומן. תפקידך לעזור לסטודנט לתרגל את הכלים שנלמדו במפגש: "${moduleTitle}".

הנחיות:
- ענה תמיד בעברית מקצועית וחמה.
- הפגן הבנה אמפתית וסקרנות קלינית.
- הצג שאלות סוקרטיות שיעוררו חשיבה.
- אם הסטודנט מציג מקרה — עזור לו להחיל את הכלים שנלמדו.
- תן משוב בונה, מפורט ומעצים.
- השתמש במינוח CBT מקצועי בעברית (מחשבות אוטומטיות, עיוותי חשיבה, ניסויים התנהגותיים וכד').
- שמור על גבולות ברורים — אתה מדריך אקדמי/קליני, לא מטפל של הסטודנט.`;
}

export async function getChatResponse(
  messages: ChatMessage[],
  moduleTitle: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: buildSystemPrompt(moduleTitle),
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = response.content[0];
  if (block.type !== "text") return "";
  return block.text;
}

export async function generateSessionFeedback(
  messages: ChatMessage[],
  moduleTitle: string
): Promise<string> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "סטודנט" : "סופרוויזר"}: ${m.content}`)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 800,
    system:
      "אתה סופרוויזר CBT מנוסה. כתוב משוב מסכם קצר ומקצועי בעברית על תרגול הסטודנט.",
    messages: [
      {
        role: "user",
        content: `להלן תמליל שיחת התרגול במפגש "${moduleTitle}":\n\n${transcript}\n\nאנא כתוב משוב מסכם: מה טוב, מה לשפר, המלצות להמשך.`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") return "";
  return block.text;
}

export { anthropic };
