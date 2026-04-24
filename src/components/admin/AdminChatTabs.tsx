"use client";
import { useState } from "react";
import { MessageCircle, HelpCircle } from "lucide-react";

interface Props {
  pendingCount: number;
  chatContent: React.ReactNode;
  questionsContent: React.ReactNode;
}

export default function AdminChatTabs({ pendingCount, chatContent, questionsContent }: Props) {
  const [tab, setTab] = useState<"chat" | "questions">("chat");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("chat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "chat"
              ? "bg-brand-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          צ׳אטים קבוצתיים
        </button>
        <button
          onClick={() => setTab("questions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "questions"
              ? "bg-brand-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          שאלות למרצה
          {pendingCount > 0 && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
              tab === "questions" ? "bg-white text-brand-900" : "bg-brand-500 text-white"
            }`}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {tab === "chat" ? chatContent : questionsContent}
    </div>
  );
}
