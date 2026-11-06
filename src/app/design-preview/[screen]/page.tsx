import PreviewShell from "../PreviewShell";
import { notFound } from "next/navigation";
import GroupChat from "@/components/chat/GroupChat";
import FormulationForm from "@/components/formulation/FormulationForm";
import MatchingGame from "@/components/practice/MatchingGame";
import SortingGame from "@/components/practice/SortingGame";
import QuizEngine from "@/components/quiz/QuizEngine";
import LoginPage from "@/app/page";
import { Users } from "lucide-react";
import { fakeModule } from "../mock";
import type { GroupMessage, Quiz } from "@/types";

const now = new Date().toISOString();
const messages = [
  { id: "1", user_id: "u2", group_id: "g1", content: "שלום לכולם! מישהו ניסה את תרגיל הרשומה השבועי?", file_url: null, file_name: null, file_type: null, created_at: now, profiles: { name: "מיכל לוי", email: "m@x.com" } },
  { id: "2", user_id: "s1", group_id: "g1", content: "כן, מצאתי אותו מאתגר אבל מועיל מאוד.", file_url: null, file_name: null, file_type: null, created_at: now, profiles: { name: "דנה כהן", email: "d@x.com" } },
] as unknown as GroupMessage[];

const quiz: Quiz = {
  id: "q1", module_id: "m3",
  questions: [
    { question_he: "איזה מהבאים הוא דוגמה לעיוות חשיבה מסוג קטסטרופיזציה?", options_he: ["אם אכשל בבחינה, החיים שלי נגמרו", "אני מרגיש עצוב כשיורד גשם", "כנראה שהמטפל שלי אוהב אותי", "אני צריך לנוח קצת"], correct_index: 0, explanation_he: "קטסטרופיזציה היא הערכת תוצאה עתידית כאסון בלתי נסבל." },
    { question_he: "מה מטרת שאלה סוקרטית בטיפול?", options_he: ["לספק למטופל את התשובה", "להנחות את המטופל לבחון בעצמו את המחשבה", "לסיים את המפגש", "לאבחן"], correct_index: 1, explanation_he: "" },
  ],
};

export default function Page({ params }: { params: { screen: string } }) {
  switch (params.screen) {
    case "chat":
      return (
        <PreviewShell width="max-w-4xl">
          <GroupChat initialMessages={messages} groupId="g1" groupName="מחזור אביב 2026" userId="s1" userName="דנה" />
        </PreviewShell>
      );
    case "chat-empty":
      return (
        <PreviewShell width="max-w-4xl">
          <GroupChat initialMessages={[]} groupId="g1" groupName="מחזור אביב 2026" userId="s1" userName="דנה" />
        </PreviewShell>
      );
    case "chat-nogroup":
      return (
        <PreviewShell width="max-w-4xl">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-white rounded-2xl border border-slate-200 shadow-card px-8 py-12 max-w-md w-full">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
                <Users className="w-7 h-7 text-brand-500" aria-hidden="true" />
              </span>
              <h1 className="text-xl font-bold text-brand-900">טרם שויכת לקבוצה</h1>
              <p className="text-slate-600 mt-2">הצ׳אט פעיל לחברי קבוצות הלימוד בלבד. לאחר ששיוך לקבוצה יתבצע על ידי מנהל הקורס, הצ׳אט יופיע כאן.</p>
            </div>
          </div>
        </PreviewShell>
      );
    case "formulation":
      return (
        <PreviewShell width="max-w-5xl">
          <FormulationForm initialData={null} userId="s1" />
        </PreviewShell>
      );
    case "matching":
      return (
        <PreviewShell width="max-w-3xl">
          <MatchingGame moduleId="m2" userId="s1" backHref="#" alreadyCompleted={false} />
        </PreviewShell>
      );
    case "sorting":
      return (
        <PreviewShell width="max-w-3xl">
          <SortingGame moduleId="m2" userId="s1" backHref="#" alreadyCompleted={false} />
        </PreviewShell>
      );
    case "quiz":
      return (
        <PreviewShell width="max-w-2xl">
          <QuizEngine module={fakeModule} quiz={quiz} userId="s1" />
        </PreviewShell>
      );
    case "login":
      if (process.env.NODE_ENV === "production") notFound();
      return <LoginPage />;
    default:
      notFound();
  }
}
