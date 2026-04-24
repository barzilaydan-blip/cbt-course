"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

interface Props {
  moduleId: string;
  userId: string;
}

export default function MarkWatchedButton({ moduleId, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleMark() {
    setLoading(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, userId, field: "video_watched", value: true }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 hover:border-brand-400 disabled:opacity-50 px-3 py-1.5 rounded-xl transition-all duration-300"
    >
      <CheckCircle className="w-3.5 h-3.5" />
      {loading ? "שומר..." : "סמן כנצפה · +10 נק'"}
    </button>
  );
}
