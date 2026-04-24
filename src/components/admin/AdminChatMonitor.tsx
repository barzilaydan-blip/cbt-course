"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Trash2, FileText, Trash } from "lucide-react";
import type { Group, GroupMessage } from "@/types";

interface Props {
  groups: Group[];
  initialMessages: GroupMessage[];
}

const STORAGE_KEY = "admin_chat_last_seen";

function getLastSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setLastSeen(groupId: string) {
  const current = getLastSeen();
  current[groupId] = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export default function AdminChatMonitor({ groups, initialMessages }: Props) {
  const supabase = createClient();
  const [activeGroup, setActiveGroup] = useState<string>(groups[0]?.id ?? "");
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages);
  const [lastSeen, setLastSeenState] = useState<Record<string, string>>({});
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLastSeenState(getLastSeen());
  }, []);

  const openGroup = useCallback((groupId: string) => {
    setActiveGroup(groupId);
    setLastSeen(groupId);
    setLastSeenState(prev => ({ ...prev, [groupId]: new Date().toISOString() }));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [activeGroup, messages]);

  useEffect(() => {
    if (groups[0]?.id) {
      setLastSeen(groups[0].id);
      setLastSeenState(prev => ({ ...prev, [groups[0].id]: new Date().toISOString() }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
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
  }, [supabase]);

  async function deleteMsg(id: string) {
    await supabase.from("messages").delete().eq("id", id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  async function deleteAllGroupMessages(groupId: string) {
    const groupName = groups.find(g => g.id === groupId)?.name ?? "הקבוצה";
    if (!confirm(`האם למחוק את כל ההודעות של "${groupName}"?\n\nפעולה זו אינה הפיכה.`)) return;
    setDeletingGroup(groupId);
    const { error } = await supabase.from("messages").delete().eq("group_id", groupId);
    if (!error) {
      setMessages(prev => prev.filter(m => m.group_id !== groupId));
    }
    setDeletingGroup(null);
  }

  const filtered = messages.filter((m) => m.group_id === activeGroup);
  const activeGroupName = groups.find((g) => g.id === activeGroup)?.name ?? "—";

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("he-IL", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  function getUnreadCount(groupId: string): number {
    const seen = lastSeen[groupId];
    if (!seen) return messages.filter((m) => m.group_id === groupId).length;
    return messages.filter(
      (m) => m.group_id === groupId && new Date(m.created_at) > new Date(seen)
    ).length;
  }

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 220px)" }}>
      {/* Sidebar — groups */}
      <div className="w-56 shrink-0 bg-white rounded-xl border border-slate-200 overflow-y-auto">
        <div className="p-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">קבוצות</p>
        </div>
        {groups.length === 0 && (
          <p className="text-xs text-slate-400 p-4">אין קבוצות</p>
        )}
        {groups.map((g) => {
          const unread = getUnreadCount(g.id);
          const isActive = activeGroup === g.id;
          return (
            <button
              key={g.id}
              onClick={() => openGroup(g.id)}
              className={`w-full text-right px-4 py-3 text-sm transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between gap-2 ${
                isActive
                  ? "bg-brand-50 text-brand-800 font-semibold"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{g.name}</span>
              </div>
              {unread > 0 && !isActive && (
                <span className="shrink-0 bg-brand-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {unread}
                </span>
              )}
              {(unread === 0 || isActive) && (
                <span className="text-xs text-slate-300 shrink-0">
                  {messages.filter(m => m.group_id === g.id).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chat view */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="font-semibold text-slate-700">{activeGroupName}</p>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400">{filtered.length} הודעות</p>
            {activeGroup && filtered.length > 0 && (
              <button
                onClick={() => deleteAllGroupMessages(activeGroup)}
                disabled={deletingGroup === activeGroup}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
                title="מחק את כל ההודעות של הקבוצה"
              >
                <Trash className="w-3.5 h-3.5" />
                {deletingGroup === activeGroup ? "מוחק..." : "מחק הכל"}
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              אין הודעות בקבוצה זו
            </div>
          )}
          {filtered.map((msg) => {
            const senderName = msg.profiles?.name || msg.profiles?.email || "משתמש";
            const isImage = msg.file_type?.startsWith("image/");
            const isPdf = msg.file_type === "application/pdf";
            return (
              <div key={msg.id} className="flex items-start gap-3 group">
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {senderName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-brand-700">{senderName}</span>
                    <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
                  </div>
                  {msg.file_url && isImage && (
                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.file_url}
                        alt={msg.file_name ?? "תמונה"}
                        className="max-h-48 max-w-xs rounded-lg border border-slate-200 object-cover"
                      />
                    </a>
                  )}
                  {msg.file_url && isPdf && (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-1 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 text-sm transition-colors"
                    >
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-slate-700 truncate max-w-[200px]">{msg.file_name ?? "קובץ PDF"}</span>
                    </a>
                  )}
                  {msg.content && (
                    <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteMsg(msg.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 shrink-0"
                  title="מחק הודעה"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
