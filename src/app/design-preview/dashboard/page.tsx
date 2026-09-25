import PreviewShell from "../PreviewShell";
import DashboardView from "@/components/dashboard/DashboardView";
import { leaderboard, sessions } from "../mock";

export default function Page({ searchParams }: { searchParams: { state?: string } }) {
  const state = searchParams.state;
  const list =
    state === "alldone"
      ? sessions.map((s) => ({ ...s, status: "complete" as const, pct: 100, lockReason: null }))
      : state === "none-open"
      ? sessions.map((s) => ({ ...s, status: "locked" as const, pct: 0, lockReason: "המפגש נעול כרגע" }))
      : sessions;
  const completed = list.filter((s) => s.status === "complete").length;
  return (
    <PreviewShell>
      <DashboardView
        name="דנה"
        sessions={list}
        completedCount={completed}
        overallPct={Math.round((completed / list.length) * 100)}
        zoomUrl={state === "nozoom" ? null : "https://zoom.us/j/123"}
        zoomPassword="482913"
        nextMeeting={{ order: 4, title: "תרגיל קליני: ניתוח מקרה", dateText: "21 באוקטובר", day: "שלישי", time: "20:00" }}
        hasGroup
        leaderboard={leaderboard}
        userRank={3}
        userPoints={245}
      />
    </PreviewShell>
  );
}
