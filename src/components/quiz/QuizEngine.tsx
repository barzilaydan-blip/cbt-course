"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ChevronLeft, Trophy } from "lucide-react";
import type { Module, Quiz, QuizQuestion } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  module: Module;
  quiz: Quiz | null;
  userId: string;
}

export default function QuizEngine({ module, quiz, userId }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <p className="text-slate-500 text-lg">שאלות החידון יתווספו בקרוב</p>
        <Link href={`/modules/${module.id}`} className="btn-secondary inline-flex items-center gap-2 mt-6">
          <ChevronLeft className="w-4 h-4 rotate-180" />
          חזור למפגש
        </Link>
      </div>
    );
  }

  const questions = quiz.questions as QuizQuestion[];
  const q = questions[current];
  const isLast = current === questions.length - 1;
  const isAnswered = selected !== null;

  function handleSelect(idx: number) {
    if (submitted) return;
    setSelected(idx);
  }

  function handleNext() {
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (isLast) {
      finishQuiz(newAnswers);
    } else {
      setCurrent(current + 1);
    }
  }

  async function finishQuiz(finalAnswers: (number | null)[]) {
    setSubmitted(true);
    const correct = finalAnswers.filter((a, i) => a === questions[i].correct_index).length;
    const score = Math.round((correct / questions.length) * 100);

    setSaving(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: module.id,
        userId,
        field: "quiz",
        quiz_score: score,
        quiz_completed: true,
      }),
    });
    setSaving(false);
    router.refresh();
  }

  // Results screen
  if (submitted) {
    const correct = answers.filter((a, i) => a === questions[i].correct_index).length;
    const score = Math.round((correct / questions.length) * 100);

    return (
      <div className="space-y-6">
        {/* Score header */}
        <div className={`rounded-2xl p-8 text-center ${score >= 70 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
          <Trophy className={`w-12 h-12 mx-auto mb-3 ${score >= 70 ? "text-green-500" : "text-amber-500"}`} />
          <h2 className="text-2xl font-bold text-slate-800">
            {score >= 70 ? "כל הכבוד!" : "כמעט שם!"}
          </h2>
          <p className="text-4xl font-black mt-2 text-brand-900">{score}%</p>
          <p className="text-slate-600 mt-1">{correct} נכון מתוך {questions.length} שאלות</p>
          {saving && <p className="text-sm text-slate-400 mt-2">שומר ציון...</p>}
        </div>

        {/* Review */}
        <div className="space-y-4">
          {questions.map((question, i) => {
            const userAns = answers[i];
            const isCorrect = userAns === question.correct_index;
            return (
              <div key={i} className={`bg-white rounded-xl border p-5 ${isCorrect ? "border-green-200" : "border-red-200"}`}>
                <div className="flex items-start gap-2 mb-3">
                  {isCorrect
                    ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                  <p className="font-semibold text-slate-800">{question.question_he}</p>
                </div>
                {!isCorrect && userAns !== null && (
                  <p className="text-sm text-red-600 mb-1">תשובתך: {question.options_he[userAns]}</p>
                )}
                <p className="text-sm text-green-700 font-medium">✓ תשובה נכונה: {question.options_he[question.correct_index]}</p>
                {question.explanation_he && (
                  <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg p-3">{question.explanation_he}</p>
                )}
              </div>
            );
          })}
        </div>

        <Link href={`/modules/${module.id}`} className="btn-primary inline-flex items-center gap-2">
          <ChevronLeft className="w-4 h-4 rotate-180" />
          חזור למפגש
        </Link>
      </div>
    );
  }

  // Quiz question screen
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/modules/${module.id}`} className="text-sm text-slate-500 hover:text-brand-500 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4 rotate-180" />
            חזור למפגש
          </Link>
          <h1 className="text-xl font-bold text-brand-900 mt-1">בחן את עצמך — מפגש {module.order_number}</h1>
        </div>
        <span className="text-sm font-semibold text-slate-500">
          {current + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-slate-100 rounded-full h-2">
        <div
          className="bg-brand-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((current) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-800 mb-6 leading-relaxed">{q.question_he}</p>

        <div className="space-y-3">
          {q.options_he.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={cn(
                "w-full text-right p-4 rounded-xl border-2 transition-all font-medium text-sm",
                selected === idx
                  ? "border-brand-500 bg-brand-50 text-brand-900"
                  : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
              )}
            >
              <span className="inline-flex items-center gap-3">
                <span className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                  selected === idx ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300 text-slate-400"
                )}>
                  {String.fromCharCode(1488 + idx)}
                </span>
                {opt}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-start">
          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="btn-primary disabled:opacity-40 flex items-center gap-2"
          >
            {isLast ? "סיים חידון" : "הבא"}
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
