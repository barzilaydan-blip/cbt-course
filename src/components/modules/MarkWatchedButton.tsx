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
      className="btn-secondary text-sm"
    >
      <CheckCircle className="w-4 h-4" aria-hidden="true" />
      {loading ? "שומר..." : "סמן כנצפה · +10 נק'"}
    </button>
  );
}
