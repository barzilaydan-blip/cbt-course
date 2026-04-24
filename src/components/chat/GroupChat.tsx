"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Users, Paperclip, FileText, X } from "lucide-react";
import type { GroupMessage } from "@/types";

interface Props {
  initialMessages: GroupMessage[];
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function GroupChat({ initialMessages, groupId, groupName, userId }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMsg = payload.new as GroupMessage;
          const { data: sender } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", newMsg.user_id)
            .single();
          setMessages((prev) => [...prev, { ...newMsg, profiles: sender ?? null }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, supabase]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFileError("הקובץ גדול מדי — מקסימום 10MB");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setFileError("סוג קובץ לא נתמך — ניתן לשלוח תמונות ו-PDF בלבד");
      return;
    }
    setFileError("");
    setPendingFile(file);
    e.target.value = "";
  }

  async function sendMessage() {
    const text = input.trim();
    if ((!text && !pendingFile) || sending) return;

    setSending(true);
    setInput("");
    const fileToSend = pendingFile;
    setPendingFile(null);

    let file_url: string | null = null;
    let file_name: string | null = null;
    let file_type: string | null = null;

    if (fileToSend) {
      const ext = fileToSend.name.split(".").pop();
      const path = `${groupId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(path, fileToSend, { contentType: fileToSend.type });

      if (uploadError) {
        setFileError("שגיאה בהעלאת הקובץ — נסה שוב");
        setPendingFile(fileToSend);
        setInput(text);
        setSending(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(uploadData.path);
      file_url = urlData.publicUrl;
      file_name = fileToSend.name;
      file_type = fileToSend.type;
    }

    const { error } = await supabase.from("messages").insert({
      user_id: userId,
      group_id: groupId,
      content: text,
      file_url,
      file_name,
      file_type,
    });

    if (error) {
      setInput(text);
      if (fileToSend) setPendingFile(fileToSend);
    }

    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  }

  const grouped: { date: string; msgs: GroupMessage[] }[] = [];
  for (const msg of messages) {
    const d = new Date(msg.created_at).toDateString();
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== d) {
      grouped.push({ date: d, msgs: [msg] });
    } else {
      last.msgs.push(msg);
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-brand-900 text-white px-5 py-4 flex items-center gap-3">
        <div className="bg-brand-500 rounded-xl p-2">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base">{groupName}</h1>
          <p className="text-blue-200 text-xs">צ׳אט קבוצתי • Real-time</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ minHeight: 0, maxHeight: "calc(100vh - 280px)" }}>
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            <div className="text-center">
              <span className="text-4xl block mb-3">💬</span>
              היו הראשון לכתוב הודעה בקבוצה
            </div>
          </div>
        )}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {formatDate(msgs[0].created_at)}
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {msgs.map((msg, i) => {
              const isOwn = msg.user_id === userId;
              const showSender = !isOwn && (i === 0 || msgs[i - 1]?.user_id !== msg.user_id);
              const senderName = msg.profiles?.name || msg.profiles?.email || "משתמש";
              const isImage = msg.file_type?.startsWith("image/");
              const isPdf = msg.file_type === "application/pdf";

              return (
                <div key={msg.id} className={`flex gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  {!isOwn && (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${
                      showSender ? "bg-brand-100 text-brand-700" : "opacity-0"
                    }`}>
                      {senderName.charAt(0)}
                    </div>
                  )}

                  <div className={`max-w-[72%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                    {showSender && !isOwn && (
                      <span className="text-xs text-brand-600 font-semibold mb-0.5 pe-1">
                        {senderName}
                      </span>
                    )}
                    <div className={`rounded-2xl overflow-hidden text-sm leading-relaxed ${
                      isOwn
                        ? "bg-brand-500 text-white rounded-tl-sm"
                        : "bg-slate-100 text-slate-800 rounded-tr-sm"
                    }`}>
                      {/* File attachment */}
                      {msg.file_url && isImage && (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.file_url}
                            alt={msg.file_name ?? "תמונה"}
                            className="max-w-full max-h-60 object-cover block"
                          />
                        </a>
                      )}
                      {msg.file_url && isPdf && (
                        <a
                          href={msg.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 px-4 py-3 ${
                            isOwn ? "hover:bg-brand-600" : "hover:bg-slate-200"
                          } transition-colors`}
                        >
                          <FileText className="w-5 h-5 shrink-0" />
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {msg.file_name ?? "קובץ PDF"}
                          </span>
                        </a>
                      )}
                      {/* Text content */}
                      {msg.content && (
                        <p className="px-4 py-2.5 whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                      {/* File only, no text — add small padding */}
                      {!msg.content && msg.file_url && !isPdf && <div className="pb-1" />}
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 px-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={endRef} />
      </div>

      {/* File preview */}
      {pendingFile && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2 text-sm">
            {pendingFile.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={URL.createObjectURL(pendingFile)}
                alt="preview"
                className="h-12 w-12 object-cover rounded-lg shrink-0"
              />
            ) : (
              <FileText className="w-5 h-5 text-brand-600 shrink-0" />
            )}
            <span className="flex-1 truncate text-slate-700">{pendingFile.name}</span>
            <button
              onClick={() => setPendingFile(null)}
              className="text-slate-400 hover:text-red-500 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {fileError && (
        <p className="px-4 pb-1 text-xs text-red-500">{fileError}</p>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 px-4 py-3 bg-white">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="text-slate-400 hover:text-brand-600 transition-colors p-1 shrink-0 mb-1.5 disabled:opacity-40"
            title="צרף קובץ"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="כתוב הודעה לקבוצה..."
            rows={1}
            disabled={sending}
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 max-h-28"
            style={{ overflowY: "auto" }}
          />
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !pendingFile) || sending}
            className="bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors shrink-0"
            title="שלח"
          >
            <Send className="w-5 h-5 scale-x-[-1]" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Enter לשליחה • Shift+Enter לשורה חדשה • 📎 לצירוף תמונה או PDF
        </p>
      </div>
    </div>
  );
}
