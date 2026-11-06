"use client";
import { useState, type ReactNode } from "react";
import { SlidersHorizontal, ShieldCheck, Activity, ClipboardList, BarChart3, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type GroupTabId = "settings" | "approved" | "attendance" | "exercises" | "quiz" | "chat";

const TABS: { id: GroupTabId; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: "settings", label: "הגדרות", icon: SlidersHorizontal },
  { id: "approved", label: "גישה ומיילים", icon: ShieldCheck },
  { id: "attendance", label: "נוכחות", icon: Activity },
  { id: "exercises", label: "תרגילים", icon: ClipboardList },
  { id: "quiz", label: "חידונים", icon: BarChart3 },
  { id: "chat", label: "צ'אט", icon: MessageCircle },
];

interface Props {
  initialTab?: GroupTabId;
  badges?: Partial<Record<GroupTabId, number>>;
  content: Record<GroupTabId, ReactNode>;
}

export default function AdminGroupTabs({ initialTab = "settings", badges, content }: Props) {
  const [tab, setTab] = useState<GroupTabId>(initialTab);

  return (
    <div>
      <div role="tablist" aria-label="ניהול קבוצה" className="flex gap-1 mb-5 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = badges?.[id];
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0",
                active ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={cn(
                  "text-xs font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center",
                  active ? "bg-white text-brand-700" : "bg-brand-500 text-white"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {content[tab]}
    </div>
  );
}
