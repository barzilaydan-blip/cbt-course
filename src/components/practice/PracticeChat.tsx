"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, ChevronLeft, Bot, User, Sparkles, CheckCircle } from "lucide-react";
import type { Module, ChatMessage } from "@/types";

interface Props {
  mod: Module;
  userId: string;
}

export default function PracticeChat({ mod, userId }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `שלום! אני הסופרוויזר ה-AI שלך למפגש זה: **${mod.title_he}**.\n\nאני כאן לעזור לך לתרגל את הכלים שנלמדו. תוכל להציג מקרה, לשאול שאלות, או לתרגל יישום של טכניקות CBT.\n\nכיצד אוכל לעזור לך היום?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          moduleTitle: mod.title_he,
          moduleId: mod.id,
          userId,
        }),
      });

      const data = await res.json();

      setMessages([...updatedMessages, {
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages([...updatedMessages, {
        role: "assistant",
        content: "מצטער, אירעה שגיאה. נסה שוב.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function finishSession() {
    if (messages.length < 3) return;
    setCompleting(true);

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          moduleTitle: mod.title_he,
          moduleId: mod.id,
          userId,
          generateFeedback: true,
        }),
      });

      const data = await res.json();
      setFeedback(data.feedback);
      setCompleted(true);
      router.refresh();
    } catch {
      setFeedback("לא ניתן לייצר משוב כרגע. תרגול הושלם.");
      setCompleted(true);
    } finally {
      setCompleting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/modules/${mod.id}`} className="text-sm text-slate-500 hover:text-brand-500 flex items-center gap-1 mb-1">
            <ChevronLeft className="w-4 h-4 rotate-180" />
            חזור למפגש
          </Link>
          <h1 className="text-xl font-bold text-brand-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-green-600" />
            תרגול עם AI — מפגש {mod.order_number}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{mod.title_he}</p>
        </div>
        {!completed && messages.length > 3 && (
          <button
            onClick={finishSession}
            disabled={completing}
            className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {completing ? "מייצר משוב..." : "סיים וקבל משוב"}
          </button>
        )}
        {completed && (
          <div className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
            <CheckCircle className="w-5 h-5" />
            הושלם
          </div>
        )}
      </div>

      {/* AI Feedback panel */}
      {feedback && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-5">
          <h3 className="font-bold text-brand-900 flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-500" />
            משוב סופרוויזר AI
          </h3>
          <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{feedback}</div>
        </div>
      )}

      {/* Chat window */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-[480px] overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "assistant" ? "bg-green-100" : "bg-brand-100"
              }`}>
                {msg.role === "assistant"
                  ? <Bot className="w-4 h-4 text-green-600" />
                  : <User className="w-4 h-4 text-brand-600" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "assistant"
                  ? "bg-slate-100 text-slate-800 rounded-tr-sm"
                  : "bg-brand-500 text-white rounded-tl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-green-600" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tr-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="כתוב הודעה... (Enter לשליחה, Shift+Enter לשורה חדשה)"
              rows={2}
              disabled={loading || completed}
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || completed}
              className="bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white p-3 rounded-xl transition-colors shrink-0"
            >
              <Send className="w-5 h-5 scale-x-[-1]" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Enter לשליחה • Shift+Enter לשורה חדשה • לסיום לחץ &quot;סיים וקבל משוב&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
