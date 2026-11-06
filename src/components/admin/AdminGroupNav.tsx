"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Group } from "@/types";

interface Props {
  groups: Group[];
}

export default function AdminGroupNav({ groups }: Props) {
  const pathname = usePathname();
  const active = groups.filter((g) => g.is_active);
  const inactive = groups.filter((g) => !g.is_active);

  function item(g: Group) {
    const href = `/admin/groups/${g.id}`;
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={g.id}
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors truncate",
          isActive ? "bg-brand-500 text-white" : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{g.name}</span>
      </Link>
    );
  }

  return (
    <nav aria-label="קבוצות" className="lg:w-56 shrink-0 surface p-2 space-y-1 lg:sticky lg:top-20 lg:self-start">
      {active.map(item)}
      {inactive.length > 0 && (
        <>
          <p className="px-3.5 pt-2 pb-1 text-xs font-semibold text-slate-400">לא פעילות</p>
          {inactive.map(item)}
        </>
      )}
      {groups.length === 0 && (
        <p className="px-3.5 py-2 text-sm text-slate-400">אין קבוצות עדיין</p>
      )}
      <Link
        href="/admin/groups/new"
        aria-current={pathname === "/admin/groups/new" ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors border border-dashed",
          pathname === "/admin/groups/new"
            ? "border-brand-400 text-brand-700 bg-brand-50"
            : "border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
        )}
      >
        <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
        הוסף קבוצה
      </Link>
    </nav>
  );
}
