"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

interface Props {
  moduleId: string;
  userId: string;
}

export default function MarkReadButton({ moduleId, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleMark() {
    setLoading(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, userId, field: "article_read", value: true }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      className="flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-700 disabled:opacity-50 transition-colors"
    >
      <CheckCircle className="w-4 h-4" />
      {loading ? "שומר..." : "סמן כנקרא/הושלם (+10 נקודות)"}
    </button>
  );
}
