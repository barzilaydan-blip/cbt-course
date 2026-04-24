"use client";
import {
  CheckCircle, Lock, PlayCircle, Trophy,
  FileText, ExternalLink, Bell, Video, Star,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────
type SessionState = "complete" | "in-progress" | "locked";
interface Session { id: number; title: string; state: SessionState; done: number; total: number; }

const sessions: Session[] = [
  { id: 1, title: "מבוא ומושגי יסוד",  state: "complete",    done: 5, total: 5 },
  { id: 2, title: "יסודות העיצוב",      state: "complete",    done: 4, total: 4 },
  { id: 3, title: "חוויית משתמש UX",    state: "in-progress", done: 2, total: 6 },
  { id: 4, title: "בניית אב-טיפוס",     state: "locked",      done: 0, total: 3 },
  { id: 5, title: "פרויקט גמר",         state: "locked",      done: 0, total: 2 },
];

const leaderboard = [
  { rank: 1, name: "מיכל כ.", points: 920, initial: "מ", medal: "🥇",
    bg: "bg-yellow-500/15", border: "border-yellow-500/35", text: "text-yellow-300", avatarBg: "bg-yellow-500/30" },
  { rank: 2, name: "אורי ל.", points: 870, initial: "א", medal: "🥈",
    bg: "bg-slate-700/40",  border: "border-slate-600/50", text: "text-slate-300",  avatarBg: "bg-slate-600/50" },
  { rank: 3, name: "נועה ש.", points: 810, initial: "נ", medal: "🥉",
    bg: "bg-amber-900/20",  border: "border-amber-700/30", text: "text-amber-500",  avatarBg: "bg-amber-800/40" },
];

const userRank  = { rank: 14, points: 430, pointsToNext: 20, nextRank: 13 };
const overallPct = 65;

// ─── Circular progress ring ───────────────────────────────
function CircularProgress({ percent }: { percent: number }) {
  const r = 34, size = 88;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
           style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r}
                strokeWidth="7" stroke="#1e293b" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r}
                strokeWidth="7" stroke="#3b82f6" fill="none"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-bold text-lg leading-none">{percent}%</span>
        <span className="text-slate-400 text-[10px] mt-0.5">הושלם</span>
      </div>
    </div>
  );
}

// ─── Single session card ──────────────────────────────────
function SessionCard({ s }: { s: Session }) {
  const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;

  if (s.state === "complete") {
    return (
      <div className="flex items-center gap-4 bg-slate-800 border border-emerald-500/25
                      rounded-2xl p-4 hover:border-emerald-400/50 hover:shadow-md
                      hover:shadow-emerald-900/30 transition-all cursor-pointer group">
        <div className="w-11 h-11 bg-emerald-500/15 border border-emerald-500/35
                        rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-semibold text-emerald-500/80
                             bg-emerald-500/10 px-2 py-0.5 rounded-full">
              מפגש {s.id}
            </span>
          </div>
          <p className="font-semibold text-white truncate">{s.title}</p>
          <p className="text-xs text-emerald-400 mt-0.5">
            משימות שהושלמו: {s.done} מתוך {s.total} ✓
          </p>
        </div>
        <span className="text-emerald-400 font-bold text-sm shrink-0">100%</span>
      </div>
    );
  }

  if (s.state === "in-progress") {
    return (
      <div className="flex items-center gap-4 bg-slate-800 border border-blue-400/50
                      ring-1 ring-blue-400/10 rounded-2xl p-4
                      shadow-lg shadow-blue-900/20 cursor-pointer
                      hover:border-blue-300/65 transition-all">
        <div className="relative w-11 h-11 bg-blue-500/15 border border-blue-400/45
                        rounded-xl flex items-center justify-center shrink-0">
          <PlayCircle className="w-5 h-5 text-blue-400" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full
                           border-2 border-gray-900 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-semibold text-blue-400/80
                             bg-blue-400/10 px-2 py-0.5 rounded-full">
              מפגש {s.id}
            </span>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10
                             px-2 py-0.5 rounded-full">
              ● בתהליך
            </span>
          </div>
          <p className="font-semibold text-white truncate">{s.title}</p>
          <p className="text-xs text-blue-300 mt-0.5">
            משימות שהושלמו: {s.done} מתוך {s.total}
          </p>
          <div className="mt-2 bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-l from-blue-400 to-amber-400 h-1.5 rounded-full
                            transition-all duration-700"
                 style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="text-blue-400 font-bold text-sm shrink-0">{pct}%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50
                    rounded-2xl p-4 opacity-40 cursor-not-allowed select-none">
      <div className="w-11 h-11 bg-slate-700/50 rounded-xl flex items-center
                      justify-center shrink-0">
        <Lock className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-700/50
                           px-2 py-0.5 rounded-full">
            מפגש {s.id}
          </span>
        </div>
        <p className="font-semibold text-slate-400 truncate">{s.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          משימות שהושלמו: {s.done} מתוך {s.total}
        </p>
      </div>
      <Lock className="w-4 h-4 text-slate-600 shrink-0" />
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────
export default function DashboardPreview() {
  return (
    <div dir="rtl"
         className="min-h-screen bg-gray-900 text-white"
         style={{ fontFamily: "var(--font-heebo, system-ui, sans-serif)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              שלום עידו, המשך למידה נעימה! 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm">ברוך הבא ללוח הבקרה שלך</p>
          </div>

          {/* Overall progress pill */}
          <div className="flex items-center gap-4 bg-slate-800 border border-slate-700
                          rounded-2xl px-5 py-3 shadow-xl shadow-slate-900/50">
            <CircularProgress percent={overallPct} />
            <div>
              <p className="text-xs text-slate-400 mb-0.5">התקדמות כוללת בקורס</p>
              <p className="text-white font-bold text-lg leading-tight">
                {overallPct}% הושלם
              </p>
              <p className="text-xs text-blue-400 mt-0.5">3 מתוך 5 מפגשים הושלמו</p>
            </div>
          </div>
        </div>

        {/* ── Two-column layout (sidebar right, main left — RTL natural) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── SIDEBAR (col-1 → RIGHT in RTL) ── */}
          <aside className="space-y-4">

            {/* Course Info Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-400" />
                מידע על הקורס
              </h2>

              {/* Zoom button */}
              <button className="w-full bg-blue-500 hover:bg-blue-400 active:scale-[0.98]
                                 text-white font-bold py-3 px-4 rounded-xl
                                 transition-all duration-200 flex items-center
                                 justify-center gap-2
                                 shadow-lg shadow-blue-500/30 hover:shadow-blue-400/40">
                <Video className="w-4 h-4" />
                הצטרף ל-Zoom
              </button>

              {/* Syllabus */}
              <button className="w-full bg-slate-700/50 hover:bg-slate-700 border
                                 border-slate-600 text-slate-300 hover:text-white
                                 font-medium py-2.5 px-4 rounded-xl transition-all
                                 duration-200 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                סילבוס הקורס
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Announcements */}
              <div className="border-t border-slate-700 pt-3 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase
                               tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  הודעות מהמרצה
                </p>
                <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-xs text-blue-200 leading-relaxed">
                    📢 מפגש 4 יתקיים ביום ג׳ הקרוב בשעה 18:00. קישור ל-Zoom ישלח עד הערב.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">לפני יומיים</p>
                </div>
              </div>
            </div>

            {/* Leaderboard Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                מובילי הקורס
              </h2>

              {/* Top 3 */}
              <div className="space-y-2">
                {leaderboard.map(s => (
                  <div key={s.rank}
                       className={`flex items-center gap-3 ${s.bg} border ${s.border}
                                   rounded-xl px-3 py-2.5`}>
                    <span className="text-base leading-none w-5 text-center shrink-0">
                      {s.medal}
                    </span>
                    <div className={`w-8 h-8 ${s.avatarBg} rounded-full flex items-center
                                    justify-center text-sm font-bold ${s.text} shrink-0`}>
                      {s.initial}
                    </div>
                    <p className={`text-sm font-semibold ${s.text} flex-1 min-w-0 truncate`}>
                      {s.name}
                    </p>
                    <span className={`text-sm font-bold ${s.text} shrink-0`}>
                      {s.points}
                    </span>
                  </div>
                ))}
              </div>

              {/* User rank */}
              <div className="border-t border-slate-700 pt-3">
                <div className="flex items-center gap-3 bg-blue-500/10 border
                                border-blue-500/25 rounded-xl px-3 py-2.5">
                  <span className="text-base w-5 text-center shrink-0">👤</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-300">
                      המיקום שלך: #{userRank.rank}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      עוד {userRank.pointsToNext} נקודות למקום ה-{userRank.nextRank}!
                    </p>
                  </div>
                  <span className="text-sm font-bold text-blue-400 shrink-0">
                    {userRank.points}
                  </span>
                </div>
              </div>
            </div>

          </aside>

          {/* ── MAIN — Learning Journey (col-2 → LEFT in RTL) ── */}
          <main className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-400" />
                מפת התקדמות
              </h2>
              <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700
                               px-3 py-1 rounded-full">
                5 מפגשים
              </span>
            </div>

            {/* Connector line + cards */}
            <div className="relative">
              {/* Vertical connector */}
              <div className="absolute top-6 bottom-6 right-[1.625rem]
                              w-0.5 bg-gradient-to-b from-emerald-500/40 via-blue-400/30
                              to-slate-700/20 hidden sm:block" />

              <div className="space-y-3 relative">
                {sessions.map(s => <SessionCard key={s.id} s={s} />)}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                הושלם
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                בתהליך
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                נעול
              </span>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
