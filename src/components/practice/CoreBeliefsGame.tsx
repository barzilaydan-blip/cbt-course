"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft, RotateCcw, Eye } from "lucide-react";

// ── Audio ──────────────────────────────────────────────────────────────────
function playTone(freq: number, type: OscillatorType, dur: number, gain = 0.3) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch {}
}
const playSelect   = () => playTone(440, "sine", 0.12);
const playDeselect = () => playTone(300, "sine", 0.1, 0.2);
const playError    = () => { playTone(220, "sawtooth", 0.15); setTimeout(() => playTone(180, "sawtooth", 0.2), 100); };
const playSuccess  = () => { playTone(523, "sine", 0.15); setTimeout(() => playTone(659, "sine", 0.15), 130); setTimeout(() => playTone(784, "sine", 0.25), 260); };
const playWin      = () => [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f,"sine",0.2),i*120));

// ── Data ───────────────────────────────────────────────────────────────────
type LensId = "failure" | "danger" | "rejection";

interface Lens {
  id: LensId;
  label: string;
  icon: string;
  coreBelief: string;
  colors: { bg: string; border: string; text: string; badge: string; ring: string; button: string };
}

const LENSES: Lens[] = [
  {
    id: "failure",
    label: "עדשת הכישלון",
    icon: "💔",
    coreBelief: "אני כישלון — אני לא מספיק טוב",
    colors: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700 border-red-300",
      ring: "ring-red-400",
      button: "bg-red-500 hover:bg-red-600",
    },
  },
  {
    id: "danger",
    label: "עדשת הסכנה",
    icon: "⚠️",
    coreBelief: "העולם מסוכן — משהו רע עומד לקרות",
    colors: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-700 border-amber-300",
      ring: "ring-amber-400",
      button: "bg-amber-500 hover:bg-amber-600",
    },
  },
  {
    id: "rejection",
    label: "עדשת הדחייה",
    icon: "🌑",
    coreBelief: "אני לא ראוי לאהבה — אנשים תמיד עוזבים",
    colors: {
      bg: "bg-purple-50",
      border: "border-purple-300",
      text: "text-purple-700",
      badge: "bg-purple-100 text-purple-700 border-purple-300",
      ring: "ring-purple-400",
      button: "bg-purple-500 hover:bg-purple-600",
    },
  },
];

interface Thought {
  id: number;
  text: string;
  lens: LensId | null;
}

interface Scenario {
  id: number;
  situation: string;
  thoughts: Thought[];
  consequences: Record<LensId, { emotion: string; behavior: string }>;
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    situation: "חבר לא החזיר שיחת טלפון כבר יומיים",
    thoughts: [
      { id: 1, text: "בטח עשיתי משהו שפגע בו ועכשיו הוא כועס עליי", lens: "rejection" },
      { id: 2, text: "אולי קרה לו משהו נורא — תאונה, מחלה", lens: "danger" },
      { id: 3, text: "כרגיל — לא מצליח לשמור על חברויות כמו שצריך", lens: "failure" },
      { id: 4, text: "הוא כנראה סתם עסוק בעבודה", lens: null },
      { id: 5, text: "אנשים תמיד מתרחקים ממני בסוף — זה רק עניין של זמן", lens: "rejection" },
      { id: 6, text: "אם לא אחזור אליו עכשיו, יקרה אסון", lens: "danger" },
    ],
    consequences: {
      failure:   { emotion: "עצב, בושה, אשמה", behavior: "נסיגה חברתית, הימנעות מיוזמת קשר" },
      danger:    { emotion: "חרדה, דריכות, פחד", behavior: "בדיקות כפייתיות, חיפוש הרגעה" },
      rejection: { emotion: "כאב, בדידות, עצב", behavior: "הסתגרות, קושי לפנות לאחרים" },
    },
  },
  {
    id: 2,
    situation: "הגשת דוח בעבודה והמנהל עדיין לא הגיב",
    thoughts: [
      { id: 1, text: "הדוח היה גרוע — בטח מאוכזב ממני", lens: "failure" },
      { id: 2, text: "אולי יש בדוח שגיאה חמורה שתגרום לתוצאות קשות", lens: "danger" },
      { id: 3, text: "הוא מתכנן לפטר אותי ולא רוצה להגיד לי ישירות", lens: "rejection" },
      { id: 4, text: "הוא עסוק — יגיב כשיהיה לו זמן", lens: null },
      { id: 5, text: "אני מבין שאני פשוט לא מוכשר מספיק לתפקיד הזה", lens: "failure" },
      { id: 6, text: "ואם הדוח יגרום לנזק לחברה — אני לא אסלח לעצמי", lens: "danger" },
    ],
    consequences: {
      failure:   { emotion: "חוסר ערך, בושה", behavior: "ביצוע יתר, הימנעות מלבקש עזרה" },
      danger:    { emotion: "חרדה גבוהה, מתח", behavior: "בדיקת הדוח שוב ושוב, שאילת עמיתים להרגעה" },
      rejection: { emotion: "פחד נטישה, עצב", behavior: "ניסיון לרצות את המנהל, הימנעות מעימות" },
    },
  },
  {
    id: 3,
    situation: "בפגישה חברתית, מישהו לא שמע את מה שאמרת",
    thoughts: [
      { id: 1, text: "הוא לא התעניין — כנראה אנשים מוצאים אותי משעמם", lens: "rejection" },
      { id: 2, text: "כרגיל אני אומר דברים לא מעניינים ולא מצחיקים", lens: "failure" },
      { id: 3, text: "הוא כנראה לא שמע ועסוק במשהו משלו", lens: null },
      { id: 4, text: "סוף הפגישה עלול להיות מביך ולהסתיים רע", lens: "danger" },
      { id: 5, text: "אני פשוט לא מספיק כריזמטי ומעניין", lens: "failure" },
      { id: 6, text: "אם ימשיך להתעלם ממני — לא אוכל להתמודד עם זה", lens: "rejection" },
    ],
    consequences: {
      failure:   { emotion: "מבוכה, תחושת נחיתות", behavior: "שתיקה, הימנעות מהבעת דעה" },
      danger:    { emotion: "חרדה חברתית, מתח", behavior: "מעקב אחר תגובות אחרים, נסיגה מוקדמת" },
      rejection: { emotion: "עצב, בדידות", behavior: "הימנעות ממפגשים חברתיים עתידיים" },
    },
  },
  {
    id: 4,
    situation: "נפלת ועשית טעות בפרויקט חשוב",
    thoughts: [
      { id: 1, text: "זה הוכחה שאני לא מתאים לתפקיד הזה", lens: "failure" },
      { id: 2, text: "הטעות הזאת עלולה לגרום לנזקים בלתי הפיכים", lens: "danger" },
      { id: 3, text: "עכשיו כולם יפסיקו לסמוך עליי", lens: "rejection" },
      { id: 4, text: "טעויות קורות — אלמד מזה ואתקדם", lens: null },
      { id: 5, text: "כל מה שאני בונה — בסוף אני הורס", lens: "failure" },
      { id: 6, text: "מי שראה את הטעות בטח כבר לא רוצה לעבוד איתי", lens: "rejection" },
    ],
    consequences: {
      failure:   { emotion: "יאוש, ביקורת עצמית קשה", behavior: "שיתוק, קושי להתחיל משימות חדשות" },
      danger:    { emotion: "פאניקה, דאגה כרונית", behavior: "בדיקות כפייתיות, שאילת אישורים" },
      rejection: { emotion: "בושה, פחד חשיפה", behavior: "הסתרת טעויות, הימנעות מבקשת עזרה" },
    },
  },
];

// ── Component ──────────────────────────────────────────────────────────────
interface Props {
  moduleId: string;
  userId: string;
  backHref: string;
  alreadyCompleted: boolean;
}

export default function CoreBeliefsGame({ moduleId, userId, backHref, alreadyCompleted }: Props) {
  const router = useRouter();
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedLens, setSelectedLens] = useState<LensId | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [wrongIds, setWrongIds] = useState<Set<number>>(new Set());
  const [showConsequences, setShowConsequences] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(alreadyCompleted);
  const [saving, setSaving] = useState(false);

  const scenario = SCENARIOS[scenarioIdx];
  const lens = LENSES.find(l => l.id === selectedLens);

  const correctIds = selectedLens
    ? new Set(scenario.thoughts.filter(t => t.lens === selectedLens).map(t => t.id))
    : new Set<number>();

  const allCorrectSelected =
    selectedLens &&
    correctIds.size > 0 &&
    [...correctIds].every(id => selectedIds.has(id)) &&
    [...selectedIds].every(id => correctIds.has(id));

  function handleLensSelect(id: LensId) {
    setSelectedLens(id);
    setSelectedIds(new Set());
    setSubmitted(false);
    setWrongIds(new Set());
    setShowConsequences(false);
    playSelect();
  }

  function handleThoughtClick(thought: Thought) {
    if (!selectedLens || submitted) return;
    const next = new Set(selectedIds);
    if (next.has(thought.id)) {
      next.delete(thought.id);
      playDeselect();
    } else {
      next.add(thought.id);
      playSelect();
    }
    setSelectedIds(next);
  }

  function handleSubmit() {
    if (!selectedLens || selectedIds.size === 0) return;
    setSubmitted(true);

    const wrong = new Set<number>();
    selectedIds.forEach(id => { if (!correctIds.has(id)) wrong.add(id); });
    const missed = new Set<number>();
    correctIds.forEach(id => { if (!selectedIds.has(id)) missed.add(id); });

    if (wrong.size > 0 || missed.size > 0) {
      setWrongIds(wrong);
      playError();
    } else {
      playSuccess();
      setShowConsequences(true);
      setCompletedScenarios(prev => new Set([...prev, scenarioIdx]));
    }
  }

  function handleRetry() {
    setSelectedIds(new Set());
    setSubmitted(false);
    setWrongIds(new Set());
    setShowConsequences(false);
  }

  async function handleNext() {
    if (scenarioIdx < SCENARIOS.length - 1) {
      setScenarioIdx(scenarioIdx + 1);
      setSelectedLens(null);
      setSelectedIds(new Set());
      setSubmitted(false);
      setWrongIds(new Set());
      setShowConsequences(false);
    } else {
      // All done
      setSaving(true);
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, moduleId, practice_completed: true }),
      });
      setSaving(false);
      playWin();
      setFinished(true);
      router.refresh();
    }
  }

  if (finished) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-brand-900 mb-2">כל הכבוד!</h2>
        <p className="text-slate-500 mb-6">השלמת את תרגיל זיהוי אמונות היסוד בהצלחה</p>
        <a href={backHref} className="btn-primary px-6 py-2.5">חזרה למפגש</a>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
      lens ? `${lens.colors.bg} ${lens.colors.border}` : "bg-white border-slate-200"
    }`}>
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200">
        <div
          className={`h-1.5 transition-all duration-700 ${lens ? lens.colors.button.split(" ")[0] : "bg-brand-500"}`}
          style={{ width: `${(completedScenarios.size / SCENARIOS.length) * 100}%` }}
        />
      </div>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SCENARIOS.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
                completedScenarios.has(i) ? "bg-green-500" :
                i === scenarioIdx ? (lens ? lens.colors.button.split(" ")[0] : "bg-brand-500") :
                "bg-slate-200"
              }`} />
            ))}
          </div>
          <span className="text-xs text-slate-400">תרחיש {scenarioIdx + 1} מתוך {SCENARIOS.length}</span>
        </div>

        {/* Scenario card */}
        <div className={`rounded-xl border p-4 text-center transition-all duration-500 ${
          lens ? `${lens.colors.bg} ${lens.colors.border}` : "bg-slate-50 border-slate-200"
        }`}>
          <p className="text-xs font-semibold text-slate-400 mb-1">התרחיש</p>
          <p className={`text-lg font-bold ${lens ? lens.colors.text : "text-slate-800"}`}>
            {scenario.situation}
          </p>
        </div>

        {/* Lens selector */}
        <div>
          <p className="text-sm font-semibold text-slate-600 mb-3 text-center">בחר עדשה לצפייה בתרחיש:</p>
          <div className="grid grid-cols-3 gap-3">
            {LENSES.map(l => (
              <button
                key={l.id}
                onClick={() => handleLensSelect(l.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-300 text-center ${
                  selectedLens === l.id
                    ? `${l.colors.bg} ${l.colors.border} ${l.colors.text} scale-105 shadow-md`
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <span className="text-2xl">{l.icon}</span>
                <span className="text-xs font-bold leading-tight">{l.label}</span>
              </button>
            ))}
          </div>
          {lens && (
            <div className={`mt-3 rounded-lg px-4 py-2.5 border text-center ${lens.colors.badge}`}>
              <p className="text-xs font-semibold">אמונת יסוד:</p>
              <p className="text-sm font-bold mt-0.5">"{lens.coreBelief}"</p>
            </div>
          )}
        </div>

        {/* Thought bubbles */}
        {selectedLens && (
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-3 text-center">
              סמן את המחשבות האוטומטיות שמתאימות לעדשה זו:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scenario.thoughts.map(thought => {
                const isSelected = selectedIds.has(thought.id);
                const isWrong = wrongIds.has(thought.id);
                const isCorrect = submitted && correctIds.has(thought.id) && isSelected;
                const isMissed = submitted && correctIds.has(thought.id) && !isSelected;

                return (
                  <button
                    key={thought.id}
                    onClick={() => handleThoughtClick(thought)}
                    disabled={submitted && !wrongIds.size}
                    className={`relative text-right p-4 rounded-xl border-2 transition-all duration-300 text-sm font-medium leading-relaxed ${
                      isCorrect
                        ? "bg-green-50 border-green-400 text-green-800"
                        : isWrong
                        ? "bg-red-50 border-red-400 text-red-800 animate-pulse"
                        : isMissed
                        ? "bg-yellow-50 border-yellow-400 text-yellow-800"
                        : isSelected
                        ? `${lens!.colors.bg} ${lens!.colors.border} ${lens!.colors.text} shadow-md scale-[1.02]`
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {isSelected && !submitted && (
                      <span className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${lens!.colors.button.split(" ")[0]}`}>
                        ✓
                      </span>
                    )}
                    {isCorrect && <span className="absolute top-2 left-2 text-green-500">✓</span>}
                    {isWrong && <span className="absolute top-2 left-2 text-red-500">✗</span>}
                    {isMissed && <span className="absolute top-2 left-2 text-yellow-500">!</span>}
                    {thought.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error feedback */}
        {submitted && wrongIds.size > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 font-semibold text-sm">לא בדיוק — בדוק שוב את הסימון</p>
            <p className="text-red-500 text-xs mt-1">מחשבות עם ! הן שנשמטו, מחשבות עם ✗ אינן מתאימות לעדשה</p>
            <button onClick={handleRetry} className="mt-3 flex items-center gap-2 mx-auto text-sm font-semibold text-red-600 hover:text-red-800">
              <RotateCcw className="w-4 h-4" /> נסה שוב
            </button>
          </div>
        )}

        {/* Consequences panel */}
        {showConsequences && lens && selectedLens && (
          <div className={`rounded-xl border-2 p-5 transition-all duration-500 ${lens.colors.bg} ${lens.colors.border}`}>
            <div className="flex items-center gap-2 mb-4">
              <Eye className={`w-5 h-5 ${lens.colors.text}`} />
              <h3 className={`font-bold ${lens.colors.text}`}>השלכות העדשה</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-xs font-bold text-slate-500 mb-1">😔 רגש</p>
                <p className={`text-sm font-semibold ${lens.colors.text}`}>
                  {scenario.consequences[selectedLens].emotion}
                </p>
              </div>
              <div className="bg-white/70 rounded-lg p-3">
                <p className="text-xs font-bold text-slate-500 mb-1">🔄 התנהגות</p>
                <p className={`text-sm font-semibold ${lens.colors.text}`}>
                  {scenario.consequences[selectedLens].behavior}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {selectedLens && !submitted && (
          <button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0}
            className={`w-full py-3 rounded-xl text-white font-bold transition-all disabled:opacity-40 ${
              lens ? lens.colors.button : "bg-brand-500 hover:bg-brand-700"
            }`}
          >
            בדוק את הבחירה שלי
          </button>
        )}

        {showConsequences && (
          <button
            onClick={handleNext}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving ? "שומר..." : scenarioIdx < SCENARIOS.length - 1 ? (
              <><ArrowLeft className="w-4 h-4" />לתרחיש הבא</>
            ) : (
              <><CheckCircle className="w-4 h-4" />סיים תרגיל</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
