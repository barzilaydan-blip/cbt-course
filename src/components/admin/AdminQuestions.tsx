"use client";
import { useState } from "react";
import { CheckCircle, Clock, ChevronDown, ChevronUp, Send } from "lucide-react";
import type { Question } from "@/types";

interface Props {
  initialQuestions: Question[];
}

export default function AdminQuestions({ initialQuestions }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("pending");

  const filtered = questions.filter(q =>
    filter === "all" ? true : q.status === filter
  );

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("he-IL", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }

  async function saveReply(q: Question) {
    const reply = replies[q.id]?.trim();
    setSaving(q.id);
    const res = await fetch("/api/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: q.id,
        admin_reply: reply || q.admin_reply,
        status: "answered",
      }),
    });
    if (res.ok) {
      setQuestions(prev => prev.map(item =>
        item.id === q.id
          ? { ...item, status: "answered", admin_reply: reply || item.admin_reply, answered_at: new Date().toISOString() }
          : item
      ));
      setExpanded(null);
    }
    setSaving(null);
  }

  async function toggleStatus(q: Question) {
    const newStatus = q.status === "answered" ? "pending" : "answered";
    const res = await fetch("/api/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: q.id, status: newStatus }),
    });
    if (res.ok) {
      setQuestions(prev => prev.map(item =>
        item.id === q.id ? { ...item, status: newStatus } : item
      ));
    }
  }

  const pendingCount = questions.filter(q => q.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(["pending", "answered", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              filter === f
                ? "bg-brand-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300"
            }`}
          >
            {f === "pending" ? `ממתינות${pendingCount > 0 ? ` (${pendingCount})` : ""}` :
             f === "answered" ? "נענו" : "הכל"}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          {filter === "pending" ? "אין שאלות ממתינות 🎉" : "אין שאלות"}
        </div>
      )}

      {filtered.map(q => {
        const senderName = q.profiles?.name || q.profiles?.email || "משתמש";
        const isExpanded = expanded === q.id;

        return (
          <div key={q.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${
            q.status === "pending" ? "border-amber-200" : "border-slate-200"
          }`}>
            {/* Question row */}
            <div
              className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : q.id)}
            >
              {/* Status icon */}
              <div className="shrink-0 mt-0.5">
                {q.status === "answered"
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <Clock className="w-5 h-5 text-amber-400" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-800 text-sm">{senderName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    q.type === "professional"
                      ? "bg-brand-100 text-brand-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {q.type === "professional" ? "🧠 מקצועית" : "⚙️ טכנית"}
                  </span>
                  <span className="text-xs text-slate-400">{formatTime(q.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{q.content}</p>
                {q.admin_reply && !isExpanded && (
                  <p className="text-xs text-green-600 mt-1 line-clamp-1">↩ {q.admin_reply}</p>
                )}
              </div>

              <div className="shrink-0 text-slate-400">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {/* Expanded panel */}
            {isExpanded && (
              <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4">
                {/* Full question */}
                <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">שאלה מלאה</p>
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{q.content}</p>
                </div>

                {/* Reply */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                    תשובה למרצה (לא נראית לסטודנט כרגע — לשימוש פנימי)
                  </label>
                  <textarea
                    value={replies[q.id] ?? q.admin_reply ?? ""}
                    onChange={e => setReplies(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="כתוב הערות פנימיות או תשובה..."
                    rows={3}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveReply(q)}
                    disabled={saving === q.id}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 scale-x-[-1]" />
                    {saving === q.id ? "שומר..." : "סמן כנענה"}
                  </button>
                  {q.status === "answered" && (
                    <button
                      onClick={() => toggleStatus(q)}
                      className="text-sm text-slate-500 hover:text-amber-600 border border-slate-200 hover:border-amber-300 px-3 py-2.5 rounded-xl transition-colors"
                    >
                      החזר לממתינות
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
