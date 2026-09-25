"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, FileText, LogOut, Settings, FolderOpen, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

interface NavbarProps {
  profile: Profile | null;
}

const navItems = [
  { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/modules", label: "מפגשים", icon: BookOpen },
  { href: "/resources", label: "משאבים", icon: FolderOpen },
  { href: "/chat", label: "צ'אט", icon: MessageCircle },
  { href: "/formulation", label: "המשגה", icon: FileText },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = profile?.role === "admin";
  const adminActive = isActive(pathname, "/admin");

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const desktopLink = (active: boolean) =>
    cn(
      "relative flex items-center gap-2 px-3.5 h-16 text-sm font-medium transition-colors",
      "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
      active
        ? "text-brand-700 after:bg-brand-500"
        : "text-slate-600 hover:text-brand-700 after:bg-transparent hover:after:bg-slate-200"
    );

  return (
    <>
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-brand-900 shrink-0">
              <span className="bg-brand-500 text-white rounded-lg p-1.5">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              </span>
              <span>קורס CBT</span>
            </Link>

            {/* Nav links — desktop */}
            <nav aria-label="ניווט ראשי" className="hidden md:flex items-stretch flex-1 mx-4">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link key={href} href={href} aria-current={active ? "page" : undefined} className={desktopLink(active)}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  aria-current={adminActive ? "page" : undefined}
                  className={cn(desktopLink(adminActive), "ms-auto")}
                >
                  <Settings className="w-4 h-4" aria-hidden="true" />
                  ניהול
                </Link>
              )}
            </nav>

            {/* User + logout (secondary) */}
            <div className="flex items-center gap-1 sm:gap-3">
              {profile && (
                <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600">
                  <span className="max-w-[10rem] truncate">{profile.name || profile.email}</span>
                  {profile.role === "student" && (
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {profile.total_points} נק׳
                    </span>
                  )}
                </div>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  aria-label="פאנל ניהול"
                  className={cn(
                    "md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors",
                    adminActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Settings className="w-5 h-5" aria-hidden="true" />
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center justify-center gap-1.5 min-w-[44px] h-11 px-2 rounded-lg text-slate-600 hover:text-brand-700 hover:bg-slate-100 transition-colors text-sm"
                aria-label="התנתק"
              >
                <LogOut className="w-[18px] h-[18px]" aria-hidden="true" />
                <span className="hidden sm:inline">התנתק</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom nav — mobile only: five learning destinations, labels always visible */}
      <nav
        aria-label="ניווט ראשי"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 grid grid-cols-5 pb-safe"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 text-xs font-medium transition-colors",
                active ? "text-brand-700" : "text-slate-600"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-12 h-7 rounded-full transition-colors",
                  active ? "bg-brand-100" : "bg-transparent"
                )}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
