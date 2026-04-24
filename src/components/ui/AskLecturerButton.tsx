"use client";
import { useState, useEffect } from "react";
import { HelpCircle, X, Send, ChevronRight, MessageSquare, Clock, CheckCircle } from "lucide-react";
import type { Question, QuestionType } from "@/types";

interface Props {
  userId: string;
  groupId: string | null;
}

type Visibility = "private" | "group";
type Step = "type" | "compose";
type ModalTab = "ask" | "my-questions";

const SEEN_KEY = "ask_lecturer_seen_replies";

function getSeenReplies(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function markRepliesSeen(ids: string[]) {
  const seen = getSeenReplies();
  ids.forEach(id => seen.add(id));
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export default function AskLecturerButton({ userId, groupId }: Props) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("ask");
  const [step, setStep] = useState<Step>("type");
  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  // Count unseen replies on mount
  useEffect(() => {
    async function checkReplies() {
      try {
        const res = await fetch("/api/questions");
        if (!res.ok) return;
        const data: Question[] = await res.json();
        const seen = getSeenReplies();
        const unseen = data.filter(q => q.status === "answered" && q.admin_reply && !seen.has(q.id));
        setUnseenCount(unseen.length);
        setMyQuestions(data);
      } catch {}
    }
    checkReplies();
  }, [userId]);

  async function loadMyQuestions() {
    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/questions");
      if (res.ok) {
        const data: Question[] = await res.json();
        setMyQuestions(data);
        // Mark all answered questions as seen
        const answeredIds = data.filter(q => q.status === "answered" && q.admin_reply).map(q => q.id);
        markRepliesSeen(answeredIds);
        setUnseenCount(0);
      }
    } finally {
      setLoadingQuestions(false);
    }
  }

  function openModal(tab: ModalTab = "ask") {
    setOpen(true);
    setActiveTab(tab);
    setStep("type");
    setQuestionType(null);
    setContent("");
    setVisibility("private");
    setDone(false);
    setError("");
    if (tab === "my-questions") loadMyQuestions();
  }

  function switchTab(tab: ModalTab) {
    setActiveTab(tab);
    if (tab === "my-questions") loadMyQuestions();
    if (tab === "ask") {
      setStep("type");
      setQuestionType(null);
      setContent("");
      setDone(false);
      setError("");
    }
  }

  function closeModal() { setOpen(false); }

  function selectType(t: QuestionType) {
    setQuestionType(t);
    setStep("compose");
  }

  async function submit() {
    if (!content.trim() || !questionType) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, groupId, type: questionType, content: content.trim(), visibility }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "שגיאה בשליחה");
      }
      setDone(true);
      // Refresh list in background
      const listRes = await fetch("/api/questions");
      if (listRes.ok) setMyQuestions(await listRes.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
    } finally {
      setSubmitting(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("he-IL", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => openModal(unseenCount > 0 ? "my-questions" : "ask")}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold transition-all hover:shadow-xl"
        title="שאל את המרצה"
      >
        <HelpCircle className="w-5 h-5" />
        <span>שאל את המרצה</span>
        {unseenCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center -mr-1">
            {unseenCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-brand-900 text-white px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-base">שאל את המרצה</h2>
              <button onClick={closeModal} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => switchTab("ask")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "ask"
                    ? "border-b-2 border-brand-500 text-brand-700 bg-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Send className="w-4 h-4" />
                שאלה חדשה
              </button>
              <button
                onClick={() => switchTab("my-questions")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "my-questions"
                    ? "border-b-2 border-brand-500 text-brand-700 bg-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                השאלות שלי
                {unseenCount > 0 && activeTab !== "my-questions" && (
                  <span className="bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unseenCount}
                  </span>
                )}
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">

              {/* ── ASK TAB ── */}
              {activeTab === "ask" && (
                done ? (
                  <div className="text-center py-6">
                    <div className="text-5xl mb-4">✅</div>
                    <p className="font-bold text-slate-800 text-lg mb-1">השאלה נשלחה!</p>
                    <p className="text-slate-500 text-sm mb-5">
                      {visibility === "private"
                        ? "המרצה יקרא את שאלתך ויחזור אליך בהקדם."
                        : "השאלה פורסמה בצ'אט הקבוצה."}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => switchTab("my-questions")}
                        className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        השאלות שלי
                      </button>
                      <button
                        onClick={closeModal}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        סגור
                      </button>
                    </div>
                  </div>
                ) : step === "type" ? (
                  <div>
                    <p className="text-slate-600 text-sm mb-4">מה סוג השאלה?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => selectType("professional")}
                        className="flex flex-col items-center gap-3 border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl p-5 transition-all"
                      >
                        <span className="text-3xl">🧠</span>
                        <div className="text-center">
                          <p className="font-semibold text-slate-800">מקצועית</p>
                          <p className="text-xs text-slate-500 mt-0.5">תוכן הקורס, CBT, קלינית</p>
                        </div>
                      </button>
                      <button
                        onClick={() => selectType("technical")}
                        className="flex flex-col items-center gap-3 border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl p-5 transition-all"
                      >
                        <span className="text-3xl">⚙️</span>
                        <div className="text-center">
                          <p className="font-semibold text-slate-800">טכנית</p>
                          <p className="text-xs text-slate-500 mt-0.5">בעיה בגישה, וידאו, אתר</p>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setStep("type")} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        questionType === "professional" ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {questionType === "professional" ? "🧠 מקצועית" : "⚙️ טכנית"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">השאלה שלך</label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="כתוב את שאלתך כאן..."
                        rows={4}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">שתף עם:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setVisibility("private")}
                          className={`flex flex-col items-center gap-1.5 border-2 rounded-xl py-3 px-2 text-sm transition-all ${
                            visibility === "private"
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-xl">🔒</span>
                          <span className="font-semibold text-xs">פרטי למרצה</span>
                        </button>
                        <button
                          onClick={() => setVisibility("group")}
                          disabled={!groupId}
                          className={`flex flex-col items-center gap-1.5 border-2 rounded-xl py-3 px-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            visibility === "group"
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-xl">👥</span>
                          <span className="font-semibold text-xs">כל הקבוצה</span>
                        </button>
                      </div>
                      {!groupId && (
                        <p className="text-xs text-slate-400 mt-1">אינך משויך לקבוצה — ניתן לשלוח שאלה פרטית בלבד</p>
                      )}
                    </div>

                    {error && (
                      <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                      onClick={submit}
                      disabled={!content.trim() || submitting}
                      className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                    >
                      <Send className="w-4 h-4 scale-x-[-1]" />
                      {submitting ? "שולח..." : "שלח שאלה"}
                    </button>
                  </div>
                )
              )}

              {/* ── MY QUESTIONS TAB ── */}
              {activeTab === "my-questions" && (
                <div className="space-y-3">
                  {loadingQuestions ? (
                    <div className="text-center py-8 text-slate-400 text-sm">טוען...</div>
                  ) : myQuestions.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-4xl block mb-3">💬</span>
                      <p className="text-slate-500 text-sm">עוד לא שלחת שאלות</p>
                    </div>
                  ) : (
                    myQuestions.map(q => {
                      const isAnswered = q.status === "answered" && q.admin_reply;
                      return (
                        <div key={q.id} className={`rounded-xl border overflow-hidden ${
                          isAnswered ? "border-green-200" : "border-slate-200"
                        }`}>
                          {/* Question */}
                          <div className="px-4 py-3 bg-slate-50">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                q.type === "professional" ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {q.type === "professional" ? "🧠 מקצועית" : "⚙️ טכנית"}
                              </span>
                              <span className="text-xs text-slate-400">{formatTime(q.created_at)}</span>
                              <div className="mr-auto flex items-center gap-1">
                                {isAnswered
                                  ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600 font-semibold">נענה</span></>
                                  : <><Clock className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs text-amber-600 font-semibold">ממתין</span></>
                                }
                              </div>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{q.content}</p>
                          </div>

                          {/* Reply */}
                          {isAnswered && (
                            <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                              <p className="text-xs font-semibold text-green-700 mb-1.5">↩ תשובת המרצה:</p>
                              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{q.admin_reply}</p>
                              {q.answered_at && (
                                <p className="text-xs text-slate-400 mt-2">{formatTime(q.answered_at)}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
