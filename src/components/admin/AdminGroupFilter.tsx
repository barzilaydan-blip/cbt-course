import Link from "next/link";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminGroupFilterProps {
  groups: { id: string; name: string }[];
  /** null = "הכל" */
  activeGroupId: string | null;
  includeAll?: boolean;
  badge?: (groupId: string | null) => number | undefined;
  onSelect?: (groupId: string | null) => void;
  hrefFor?: (groupId: string | null) => string;
}

/** Consistent group-filter sidebar used across admin monitoring screens (exercises, questions, activity). */
export default function AdminGroupFilter({ groups, activeGroupId, includeAll = true, badge, onSelect, hrefFor }: AdminGroupFilterProps) {
  const items: { id: string | null; name: string }[] = [
    ...(includeAll ? [{ id: null, name: "הכל" }] : []),
    ...groups.map((g) => ({ id: g.id, name: g.name })),
  ];

  return (
    <nav aria-label="סינון לפי קבוצה" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:w-48 lg:shrink-0">
      {items.map((item) => {
        const isActive = activeGroupId === item.id;
        const count = badge?.(item.id);
        const className = cn(
          "flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors shrink-0 lg:shrink lg:w-full",
          isActive ? "bg-brand-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300"
        );
        const content = (
          <>
            <span className="flex items-center gap-1.5 min-w-0">
              {item.id !== null && <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
              <span className="truncate">{item.name}</span>
            </span>
            {count !== undefined && count > 0 && (
              <span className={cn(
                "shrink-0 text-xs font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center",
                isActive ? "bg-white text-brand-700" : "bg-brand-500 text-white"
              )}>
                {count}
              </span>
            )}
          </>
        );

        if (hrefFor) {
          return (
            <Link key={item.id ?? "all"} href={hrefFor(item.id)} aria-current={isActive ? "page" : undefined} className={className}>
              {content}
            </Link>
          );
        }
        return (
          <button key={item.id ?? "all"} type="button" onClick={() => onSelect?.(item.id)} aria-current={isActive ? "page" : undefined} className={className}>
            {content}
          </button>
        );
      })}
    </nav>
  );
}
