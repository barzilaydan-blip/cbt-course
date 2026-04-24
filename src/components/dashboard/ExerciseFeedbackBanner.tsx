"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, ChevronLeft } from "lucide-react";

const SEEN_KEY = "exercise_feedback_seen";

export default function ExerciseFeedbackBanner({ href, submissionId }: { href: string; submissionId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen !== submissionId) setVisible(true);
  }, [submissionId]);

  function handleClick() {
    localStorage.setItem(SEEN_KEY, submissionId);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 hover:border-green-300 transition-colors"
    >
      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-green-800">קיבלת משוב על התרגיל הקליני!</p>
        <p className="text-green-700 text-sm mt-0.5">המרצה בדק את התרגיל שלך — לחץ לצפייה במשוב</p>
      </div>
      <ChevronLeft className="w-4 h-4 text-green-500 shrink-0" />
    </Link>
  );
}
