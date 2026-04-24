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

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Top bar */}
      <header className="bg-brand-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
              <span className="bg-brand-500 rounded-lg p-1.5">
                <BookOpen className="w-5 h-5" />
              </span>
              <span>קורס CBT</span>
            </Link>

            {/* Nav links — desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname.startsWith(href)
                      ? "bg-brand-500 text-white"
                      : "text-blue-200 hover:bg-brand-700 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              {profile?.role === "admin" && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname.startsWith("/admin")
                      ? "bg-brand-500 text-white"
                      : "text-blue-200 hover:bg-brand-700 hover:text-white"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  ניהול
                </Link>
              )}
            </nav>

            {/* User + logout */}
            <div className="flex items-center gap-3">
              {profile && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-blue-200">
                  <span className="font-medium text-white">{profile.name || profile.email}</span>
                  <span className="bg-yellow-500 text-yellow-900 font-bold text-xs px-2 py-0.5 rounded-full">
                    {profile.total_points} נק׳
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm"
                title="התנתק"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">התנתק</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 flex items-center justify-around pb-safe">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors",
                active ? "text-brand-600" : "text-slate-400"
              )}
            >
              <Icon className={cn("w-5 h-5", active ? "text-brand-500" : "text-slate-400")} />
              {label}
            </Link>
          );
        })}
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors",
              pathname.startsWith("/admin") ? "text-brand-600" : "text-slate-400"
            )}
          >
            <Settings className={cn("w-5 h-5", pathname.startsWith("/admin") ? "text-brand-500" : "text-slate-400")} />
            ניהול
          </Link>
        )}
      </nav>
    </>
  );
}
