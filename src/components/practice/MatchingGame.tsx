"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Trophy, RotateCcw, ChevronRight, GripVertical } from "lucide-react";
import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CASE_STUDY =
  "רונן עבר תאונת דרכים קלה בצומת מרכזי, שלוותה ברעש חזק של התנגשות ובהלה עצומה. מאז, בכל פעם שהוא רק רואה את הצומת הזה (או צומת דומה), הלב שלו מתחיל לדפוק בחוזקה. כדי לא להרגיש את הפחד, הוא התחיל לנסוע לעבודה בדרכים עוקפות. כשהוא כבר חייב לנהוג, הוא תמיד נוסע עם חלונות פתוחים ומדבר עם אשתו בטלפון, מה שמפחית את החרדה שלו באותו רגע. כשאשתו משבחת אותו על המאמץ לאחר מכן, הוא מרגיש גאווה.";

// id must equal the index of its matching detail — correctness = (conceptId === detailId)
const PAIRS = [
  { id: 0, concept: "חיזוק שלילי",       detail: "נסיעה בדרכים עוקפות"          },
  { id: 1, concept: "גירוי בלתי מותנה",  detail: "רעש חזק של התנגשות"            },
  { id: 2, concept: "התנהגות ביטחון",    detail: "חלונות פתוחים ושיחה בטלפון"   },
  { id: 3, concept: "חיזוק חיובי",       detail: "אשתו משבחת אותו על המאמץ"     },
  { id: 4, concept: "תגובה מותנית",      detail: "דפיקות לב כשרואים צומת"       },
  { id: 5, concept: "גירוי מותנה",       detail: "ראיית הצומת המרכזי"            },
] as const;

// ─── Audio ────────────────────────────────────────────────────────────────────

function playSuccess() {
  try {
    const ctx = new AudioContext();
    // Two-note ascending chime: C5 → E5
    const notes = [523.25, 659.25];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  } catch { /* AudioContext blocked (e.g. SSR) */ }
}

function playError() {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
  } catch { /* AudioContext blocked */ }
}

function playWin() {
  try {
    const ctx   = new AudioContext();
    // C5 E5 G5 C6 — triumphant arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  } catch { /* AudioContext blocked */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  moduleId: string;
  userId: string;
  backHref: string;
  alreadyCompleted: boolean;
}

export default function MatchingGame({ moduleId, userId, backHref, alreadyCompleted }: Props) {
  const router   = useRouter();
  const savedRef = useRef(false);

  // Stable shuffle per mount
  const conceptOrder = useMemo(() => shuffle(PAIRS.map(p => p.id)), []);
  const detailOrder  = useMemo(() => shuffle(PAIRS.map(p => p.id)), []);

  // matched: Map<detailId → conceptId>
  const [matched,    setMatched]    = useState<Map<number, number>>(() =>
    alreadyCompleted ? new Map(PAIRS.map(p => [p.id, p.id])) : new Map()
  );
  const [dragging,   setDragging]   = useState<number | null>(null); // conceptId being dragged
  const [dragOver,   setDragOver]   = useState<number | null>(null); // detailId hovered
  const [errorIds,   setErrorIds]   = useState<Set<number>>(new Set()); // concepts flashing error
  const [successIds, setSuccessIds] = useState<Set<number>>(new Set()); // details popping success

  const matchedConceptIds = new Set(matched.values());
  const allDone = matched.size === PAIRS.length;

  // ── Save progress on completion ──
  useEffect(() => {
    if (allDone && !alreadyCompleted && !savedRef.current) {
      savedRef.current = true;
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, moduleId, field: "practice_completed", value: true }),
      })
        .then(() => router.refresh())
        .catch(() => {});
    }
  }, [allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag handlers ──
  function onDragStart(e: React.DragEvent, conceptId: number) {
    setDragging(conceptId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(conceptId)); // Firefox compat
  }

  function onDragEnd() {
    setDragging(null);
    setDragOver(null);
  }

  function onDragOver(e: React.DragEvent, detailId: number) {
    if (matched.has(detailId)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(detailId);
  }

  function onDragLeave(e: React.DragEvent) {
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) setDragOver(null);
  }

  function onDrop(e: React.DragEvent, detailId: number) {
    e.preventDefault();
    setDragOver(null);
    // Resolve conceptId from state (primary) or dataTransfer (fallback for some browsers)
    const raw = e.dataTransfer.getData("text/plain");
    const conceptId = dragging ?? (raw !== "" ? parseInt(raw, 10) : null);
    setDragging(null);
    if (conceptId === null || isNaN(conceptId) || matched.has(detailId)) return;

    if (conceptId === detailId) {
      // ✓ Correct — merge cards
      const next = new Map(matched).set(detailId, conceptId);
      setMatched(next);
      setSuccessIds(s => new Set(s).add(detailId));
      setTimeout(() => setSuccessIds(s => { const n = new Set(s); n.delete(detailId); return n; }), 750);
      if (next.size === PAIRS.length) {
        playWin();
      } else {
        playSuccess();
      }
    } else {
      // ✗ Incorrect — flash error, snap back
      setErrorIds(s => new Set(s).add(conceptId));
      setTimeout(() => setErrorIds(s => { const n = new Set(s); n.delete(conceptId); return n; }), 650);
      playError();
    }
  }

  function handleReset() {
    setMatched(new Map());
    setDragging(null);
    setDragOver(null);
    setErrorIds(new Set());
    setSuccessIds(new Set());
  }

  const unmatchedInOrder = conceptOrder.filter(id => !matchedConceptIds.has(id));

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="space-y-5">

      {/* Case study */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">מקרה קליני — רונן</p>
        <p className="text-sm text-slate-200 leading-relaxed">{CASE_STUDY}</p>
      </div>

      {/* Instructions */}
      {!allDone && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-blue-400 mt-0.5 shrink-0">💡</span>
          <p className="text-sm text-blue-300 leading-relaxed">
            <span className="font-semibold">הוראות:</span> גרור כל מושג מהטור הימני ושחרר אותו על הפרט המתאים בטור השמאלי. התיאבון לא יורד כשמנסים שוב! 🙂
          </p>
        </div>
      )}

      {/* ── Game board ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* ── Right column: Concepts (draggable source) ── */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
            מושגים — גרור ←
          </p>
          <div className="space-y-2 min-h-[40px]">
            {unmatchedInOrder.map(id => {
              const hasError   = errorIds.has(id);
              const isDragging = dragging === id;

              return (
                <div
                  key={id}
                  draggable
                  onDragStart={e => onDragStart(e, id)}
                  onDragEnd={onDragEnd}
                  className={[
                    "rounded-xl border px-3 py-3 text-sm font-semibold select-none",
                    "flex items-center gap-2 transition-all duration-300",
                    hasError
                      ? "bg-rose-900/50 border-rose-500 text-rose-100 ring-2 ring-rose-500/30 scale-[0.97]"
                      : isDragging
                        ? "bg-slate-600/40 border-blue-400/50 text-slate-400 opacity-40 scale-95"
                        : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-blue-400/50 hover:scale-[1.02] cursor-grab active:cursor-grabbing",
                  ].join(" ")}
                >
                  <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{PAIRS[id].concept}</span>
                </div>
              );
            })}

            {/* Empty state — all dragged away */}
            {unmatchedInOrder.length === 0 && !allDone && (
              <div className="rounded-xl border border-dashed border-slate-700 py-6 text-center text-slate-600 text-xs">
                כל המושגים הוזזו
              </div>
            )}
          </div>
        </div>

        {/* ── Left column: Details (drop targets) ── */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
            פרטים מהמקרה
          </p>
          <div className="space-y-2">
            {detailOrder.map(id => {
              const matchedConceptId = matched.get(id);
              const isMatched  = matchedConceptId !== undefined;
              const isHovered  = dragOver === id && !isMatched;
              const isSuccess  = successIds.has(id);

              return (
                <div
                  key={id}
                  onDragOver={e => onDragOver(e, id)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDrop(e, id)}
                  className={[
                    "rounded-xl border px-3 py-3 text-sm font-medium min-h-[48px]",
                    "transition-all duration-300",
                    isMatched
                      ? [
                          "bg-emerald-500/10 border-emerald-500/40 text-emerald-100",
                          isSuccess ? "scale-[1.03] ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-900/20" : "",
                        ].join(" ")
                      : isHovered
                        ? "bg-blue-500/15 border-blue-400 text-blue-100 ring-1 ring-blue-400/30 scale-[1.02] shadow-lg shadow-blue-900/20"
                        : "bg-amber-900/40 border-dashed border-amber-700/60 text-amber-100 hover:border-amber-500",
                  ].join(" ")}
                >
                  {isMatched ? (
                    /* ── Merged matched unit ── */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold text-xs text-emerald-200 tracking-wide">
                          {PAIRS[matchedConceptId].concept}
                        </span>
                      </div>
                      <div className="border-t border-emerald-500/25 pt-1.5">
                        <span className="text-sm text-emerald-100/90 leading-snug">{PAIRS[id].detail}</span>
                      </div>
                    </div>
                  ) : (
                    /* ── Unmatched drop zone ── */
                    <div className="flex items-center gap-2">
                      {isHovered && (
                        <span className="shrink-0 w-4 h-4 rounded-full border-2 border-blue-400 border-dashed animate-spin"
                          style={{ animationDuration: "1.4s" }}
                        />
                      )}
                      <span className={isHovered ? "text-blue-200 font-semibold" : ""}>{PAIRS[id].detail}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress dots */}
      {!allDone && (
        <div className="flex items-center justify-center gap-2 pt-1">
          {PAIRS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < matched.size
                  ? "w-3 h-3 bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  : "w-2 h-2 bg-slate-700"
              }`}
            />
          ))}
          <span className="text-xs text-slate-500 mr-2">{matched.size} / {PAIRS.length} הותאמו</span>
        </div>
      )}

      {/* ── Success banner ── */}
      {allDone && (
        <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl px-6 py-5 flex items-center gap-4">
          <Trophy className="w-9 h-9 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-emerald-300 text-lg">כל הכבוד! 🎉</p>
            <p className="text-emerald-400/80 text-sm mt-0.5">
              זיהית בהצלחה את המרכיבים ההתנהגותיים במקרה של רונן.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {allDone && (
          <Link
            href={backHref}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            חזור למפגש
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm px-4 py-3 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          אתחול
        </button>
      </div>
    </div>
  );
}
