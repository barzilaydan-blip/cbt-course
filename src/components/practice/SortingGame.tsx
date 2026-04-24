"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// ─── Game Data ───────────────────────────────────────────────────────────────

type Category = "thought" | "emotion" | "sensation" | "impulse";

interface Item {
  id: string;
  label: string;
  correct: Category;
}

const CATEGORIES: { id: Category; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { id: "thought",   label: "מחשבה",         emoji: "🧠", color: "text-brand-700",  bg: "bg-brand-50",  border: "border-brand-300" },
  { id: "emotion",   label: "רגש",            emoji: "💛", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-300" },
  { id: "sensation", label: "תחושה גופנית",   emoji: "🫀", color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-300"  },
  { id: "impulse",   label: "דחף",            emoji: "⚡", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-300" },
];

const ITEMS: Item[] = [
  { id: "t1", label: "אני לא מסוגל להתמודד",          correct: "thought"   },
  { id: "t2", label: "הכל הולך להיות נורא",            correct: "thought"   },
  { id: "t3", label: "אף אחד לא מבין אותי",            correct: "thought"   },
  { id: "t4", label: "זה אסון",                        correct: "thought"   },
  { id: "t5", label: "אני כישלון",                     correct: "thought"   },
  { id: "e1", label: "חרדה",                           correct: "emotion"   },
  { id: "e2", label: "עצבות",                          correct: "emotion"   },
  { id: "e3", label: "כעס",                            correct: "emotion"   },
  { id: "e4", label: "בושה",                           correct: "emotion"   },
  { id: "e5", label: "אשמה",                           correct: "emotion"   },
  { id: "s1", label: "דופק מהיר",                      correct: "sensation" },
  { id: "s2", label: "כבדות בחזה",                     correct: "sensation" },
  { id: "s3", label: "מתח בשכמות",                     correct: "sensation" },
  { id: "s4", label: "בחילה",                          correct: "sensation" },
  { id: "s5", label: "נשימה מהירה",                    correct: "sensation" },
  { id: "i1", label: "לברוח מהמצב",                   correct: "impulse"   },
  { id: "i2", label: "להתבודד",                        correct: "impulse"   },
  { id: "i3", label: "לצעוק",                          correct: "impulse"   },
  { id: "i4", label: "להימנע ממגע עם אנשים",           correct: "impulse"   },
  { id: "i5", label: "לאכול יתר על המידה",             correct: "impulse"   },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── Draggable Item Chip ──────────────────────────────────────────────────────

function DraggableChip({ item, small = false }: { item: Item; small?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.3 : 1 };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing select-none rounded-xl border-2 border-slate-200 bg-white shadow-sm font-medium text-slate-700 transition-shadow hover:shadow-md hover:border-brand-300 touch-none ${
        small ? "px-2.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
      }`}
    >
      {item.label}
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({
  cat,
  placed,
  checked,
}: {
  cat: typeof CATEGORIES[0];
  placed: Item[];
  checked: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cat.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border-2 transition-all min-h-[160px] ${
        isOver ? `${cat.border} ${cat.bg} scale-[1.01]` : "border-slate-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-t-xl ${cat.bg} border-b border-slate-100`}>
        <span className="text-xl">{cat.emoji}</span>
        <span className={`font-bold text-sm ${cat.color}`}>{cat.label}</span>
        <span className="mr-auto text-xs text-slate-400">{placed.length}</span>
      </div>
      {/* Placed items */}
      <div className="flex flex-wrap gap-2 p-3 flex-1">
        {placed.map(item => {
          const isCorrect = item.correct === cat.id;
          return (
            <span
              key={item.id}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                !checked
                  ? "bg-slate-50 border-slate-200 text-slate-700"
                  : isCorrect
                  ? "bg-green-100 border-green-300 text-green-800"
                  : "bg-red-100 border-red-300 text-red-700 line-through"
              }`}
            >
              {item.label}
            </span>
          );
        })}
        {placed.length === 0 && (
          <p className="text-xs text-slate-300 italic self-center w-full text-center pt-2">
            גרור לכאן...
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function Results({
  score,
  correct,
  total,
  onSave,
  saving,
  saved,
  backHref,
}: {
  score: number;
  correct: number;
  total: number;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  backHref: string;
}) {
  const isChampion = score >= 90;
  return (
    <div className="flex flex-col items-center text-center py-10 gap-4">
      {isChampion ? (
        <>
          <div className="text-6xl">🏆</div>
          <h2 className="text-3xl font-extrabold text-brand-900">אלופ/ה!</h2>
        </>
      ) : (
        <div className="text-5xl">✅</div>
      )}
      <p className="text-slate-600 text-lg">
        ענית נכון על <span className="font-bold text-brand-700">{correct}</span> מתוך{" "}
        <span className="font-bold">{total}</span> פריטים
      </p>
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={isChampion ? "#22c55e" : "#2c6e9e"}
            strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold ${isChampion ? "text-green-600" : "text-brand-700"}`}>
            {score}%
          </span>
          <span className="text-xs text-slate-400">ניקוד</span>
        </div>
      </div>
      <div className="flex gap-3">
        {!saved ? (
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-brand-500 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm"
          >
            {saving ? "שומר..." : "שמור ניקוד"}
          </button>
        ) : (
          <p className="text-green-600 font-semibold text-sm self-center">✓ הניקוד נשמר!</p>
        )}
        <a
          href={backHref}
          className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          חזור למפגש
        </a>
      </div>
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────

interface Props {
  moduleId: string;
  userId: string;
  backHref: string;
  alreadyCompleted?: boolean;
}

export default function SortingGame({ moduleId, userId, backHref, alreadyCompleted = false }: Props) {
  const router = useRouter();
  const [items] = useState<Item[]>(() => shuffle(ITEMS));
  const [placements, setPlacements] = useState<Record<string, Category | null>>(() =>
    Object.fromEntries(ITEMS.map(i => [i.id, null]))
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(alreadyCompleted);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const unplaced = items.filter(i => placements[i.id] === null);
  const allPlaced = unplaced.length === 0;

  function getPlacedInCategory(catId: Category) {
    return items.filter(i => placements[i.id] === catId);
  }

  const correctCount = checked
    ? items.filter(i => placements[i.id] === i.correct).length
    : 0;
  const score = checked ? Math.round((correctCount / ITEMS.length) * 100) : 0;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const catId = over.id as Category;
    if (!CATEGORIES.find(c => c.id === catId)) return;
    setPlacements(prev => ({ ...prev, [active.id as string]: catId }));
  }, []);

  async function saveScore() {
    setSaving(true);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          moduleId,
          field: "practice_completed",
          value: true,
        }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const activeItem = activeId ? items.find(i => i.id === activeId) : null;

  if (checked) {
    return (
      <Results
        score={score}
        correct={correctCount}
        total={ITEMS.length}
        onSave={saveScore}
        saving={saving}
        saved={saved}
        backHref={backHref}
      />
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Instructions + exit */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-brand-800 font-semibold text-sm">
              גרור כל פריט לקטגוריה הנכונה שלו
            </p>
            <p className="text-brand-600 text-xs mt-0.5">
              {unplaced.length > 0
                ? `נותרו ${unplaced.length} פריטים להתאמה`
                : "כל הפריטים הוצבו — אפשר לבדוק!"}
            </p>
          </div>
          <a
            href={backHref}
            className="shrink-0 text-xs text-slate-500 hover:text-brand-600 border border-slate-200 hover:border-brand-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            ← יציאה
          </a>
        </div>

        {/* Unplaced items pool */}
        {unplaced.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">פריטים להתאמה</p>
            <div className="flex flex-wrap gap-2">
              {unplaced.map(item => (
                <DraggableChip key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Category drop zones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORIES.map(cat => (
            <DropZone
              key={cat.id}
              cat={cat}
              placed={getPlacedInCategory(cat.id)}
              checked={checked}
            />
          ))}
        </div>

        {/* Check button */}
        <button
          onClick={() => setChecked(true)}
          disabled={!allPlaced}
          className="w-full bg-brand-500 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-base"
        >
          {allPlaced ? "בדוק תשובות" : `הצב את כל הפריטים (${unplaced.length} נותרו)`}
        </button>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem && (
          <div className="px-4 py-2.5 rounded-xl border-2 border-brand-400 bg-white shadow-xl text-sm font-medium text-slate-700 cursor-grabbing">
            {activeItem.label}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
