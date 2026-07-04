"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, RotateCcw, CheckCircle } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────
const EXAMPLES = [
  "שלא אספיק את כל המשימות בזמן.",
  "שמשהו רע יקרה לילד שלי.",
  "שלא אצליח לעזור למטופל שלי.",
  "שהודעה ששלחתי תתפרש לא נכון.",
  "שאקבל החלטה לא נכונה.",
  "שאם לא אחשוב על זה מספיק, אפספס משהו חשוב.",
];

const SAFETY_BEHAVIORS = [
  "לבדוק שוב", "לשאול מישהו", "לחפש מידע",
  "לקרוא שוב הודעה או מסמך", "לתקן או לנסח מחדש",
  "להתייעץ כדי לקבל הרגעה", "להמשיך לחשוב עד שאהיה בטוח", "אחר",
];

const MECHANISMS = [
  "חיפוש ודאות", "קושי לשאת אי-ודאות", "אמונה שדאגה מגינה עליי",
  "פחד שהדאגה תצא משליטה", "הימנעות מפעולה", "הימנעות מרגש",
  "פרפקציוניזם", "צורך בהרגעה", "בדיקה חוזרת", "דחיינות",
  "בלבול בין דאגה לפתרון בעיות", "קושי בקבלת החלטות",
  "עיסוק יתר בתרחישים עתידיים",
];

const INTERVENTIONS = [
  "פתרון בעיות", "דחיית דאגה", "חשיפה לאי-ודאות",
  "הפחתת התנהגות ביטחון", "בדיקת אמונה על דאגה",
  "שינוי חשיבה", "חזרה לפעולה תפקודית",
  "ויסות גופני כתמיכה ולא כהימנעות",
];

const META_BELIEFS = [
  "אם אדאג, אהיה מוכן יותר.",
  "אם לא אדאג, אהיה חסר אחריות.",
  "הדאגה מגינה עליי.",
  "אם אתחיל לדאוג, לא אצליח לעצור.",
  "הדאגה שלי מסוכנת.",
  "המחשבות שלי אומרות שמשהו לא בסדר בי.",
];

type FlowPath = "action" | "uncertainty" | "postpone" | "meta" | "unclear";

const PATH_NAMES: Record<FlowPath, string> = {
  action: "מסלול פעולה",
  uncertainty: "מסלול חשיפה לאי-ודאות",
  postpone: "מסלול דחיית דאגה",
  meta: "מסלול אמונות על דאגה",
  unclear: "עיבוד קליני פתוח",
};

const PATH_LEARNING: Record<FlowPath, string> = {
  action: "למדתי שכאשר יש בעיה פתירה, הדאגה אינה צריכה להמשיך להסתובב בראש. אפשר להגדיר את הבעיה, לבחור צעד קטן, לקבוע מתי לבצע אותו ולהגדיר מה מספיק לעכשיו.",
  uncertainty: "למדתי שכאשר הדאגה מנסה להשיג ודאות, המטרה אינה להרגיע שוב ושוב, אלא לתרגל השהיית בדיקה, הפחתת התנהגויות ביטחון ונשיאת אי-ודאות.",
  postpone: "למדתי שלא כל מחשבה דורשת עיסוק מיידי. אפשר לרשום דאגה, לדחות אותה לזמן מוגדר ולחזור לפעולה הנוכחית.",
  meta: "למדתי שלפעמים מוקד הטיפול אינו רק תוכן הדאגה, אלא האמונה ביחס לדאגה עצמה: האם היא נתפסת כמגינה, מסוכנת, בלתי נשלטת או הכרחית.",
  unclear: "למדתי שלא כל דאגה מתאימה למסלול אחד. המטרה היא לזהות את המנגנון הפעיל ולבחור התערבות בהתאם.",
};

type Screen =
  | "intro" | "enter_worry" | "rating" | "flowchart"
  | "action" | "action_summary"
  | "uncertainty" | "experiment" | "debrief" | "uncertainty_summary"
  | "postpone" | "postpone_summary"
  | "meta" | "meta_summary"
  | "unclear" | "processing" | "final";

// ── Small UI helpers ───────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
        <div className="h-1.5 bg-brand-400 rounded-full transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>
      <span className="shrink-0">שלב {step} מתוך {total}</span>
    </div>
  );
}

function Slider({ label, sub, value, onChange }: { label: string; sub?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-brand-900">{label}</label>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 shrink-0">0</span>
        <input type="range" min={0} max={10} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 accent-brand-500" />
        <span className="text-xs text-slate-400 shrink-0">10</span>
        <span className="w-6 text-center text-sm font-bold text-brand-700 shrink-0">{value}</span>
      </div>
    </div>
  );
}

function Tags({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (o: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const a = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => onToggle(o)}
            className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-all ${a ? "bg-brand-500 text-white border-brand-500" : "bg-white text-slate-600 border-slate-300 hover:border-brand-400"}`}>
            {a ? "✓ " : ""}{o}
          </button>
        );
      })}
    </div>
  );
}

function TA({ label, value, onChange, placeholder, rows = 3, prefix }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; prefix?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold text-brand-900 mb-1.5">{label}</label>}
      {prefix ? (
        <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
          <div className="bg-slate-50 px-3 py-2 text-sm text-slate-600 border-b border-slate-200">{prefix}</div>
          <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full px-3 py-2 text-sm resize-none focus:outline-none text-right leading-relaxed" />
        </div>
      ) : (
        <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-right leading-relaxed" />
      )}
    </div>
  );
}

function RadioRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`px-3 py-2 rounded-xl text-sm border font-medium transition-all ${value === o ? "bg-brand-500 text-white border-brand-500" : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function FlowChart({ flowStep, flowAnswers, path }: { flowStep: number; flowAnswers: (boolean | null)[]; path: FlowPath | null }) {
  const qCls = (step: number) => {
    const cur = step === flowStep;
    const done = flowAnswers[step] !== null;
    return `border-2 rounded-xl px-3 py-2 text-xs text-center transition-all ${cur ? "border-brand-500 bg-brand-50 text-brand-800 font-semibold shadow-sm" : done ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-400"}`;
  };
  const pCls = (p: FlowPath) => {
    const colors: Record<FlowPath, string> = {
      action: "bg-green-100 text-green-800 border-green-300",
      uncertainty: "bg-blue-100 text-blue-800 border-blue-300",
      postpone: "bg-purple-100 text-purple-800 border-purple-300",
      meta: "bg-orange-100 text-orange-800 border-orange-300",
      unclear: "bg-slate-100 text-slate-700 border-slate-300",
    };
    return path === p ? `border-2 rounded-lg px-2 py-1 text-xs font-semibold ${colors[p]}` : "border border-dashed border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-300";
  };
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs" dir="rtl">
      <div className="flex justify-center"><div className="bg-brand-900 text-white rounded-xl px-4 py-1.5 text-xs font-bold">דאגה הופיעה</div></div>
      <div className="flex justify-center"><div className="w-px h-3 bg-slate-300"/></div>
      <div className={qCls(0)}>האם יש בעיה ממשית שניתן לפעול לגביה עכשיו?</div>
      <div className="flex gap-2"><div className={pCls("action")}>כן ← מסלול פעולה</div><div className="flex-1 text-center text-slate-300 flex items-center justify-center">לא ↓</div></div>
      <div className={qCls(1)}>האם אני מנסה להשיג ודאות דרך בדיקה, הרגעה או מחשבה חוזרת?</div>
      <div className="flex gap-2"><div className={pCls("uncertainty")}>כן ← חשיפה לאי-ודאות</div><div className="flex-1 text-center text-slate-300 flex items-center justify-center">לא ↓</div></div>
      <div className={qCls(2)}>האם זו שרשרת של תרחישים עתידיים שלא ניתן לפתור כרגע?</div>
      <div className="flex gap-2"><div className={pCls("postpone")}>כן ← דחיית דאגה</div><div className="flex-1 text-center text-slate-300 flex items-center justify-center">לא ↓</div></div>
      <div className={qCls(3)}>האם הדאגה עצמה מפחידה אותי?</div>
      <div className="flex gap-2"><div className={pCls("meta")}>כן ← אמונות על דאגה</div><div className={pCls("unclear")}>לא בטוח ← עיבוד פתוח</div></div>
    </div>
  );
}

function SummaryCard({ items }: { items: [string, string | undefined][] }) {
  return (
    <div className="space-y-2">
      {items.map(([l, v]) => v ? (
        <div key={l} className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-500 mb-0.5">{l}</p>
          <p className="text-sm text-slate-800">{v}</p>
        </div>
      ) : null)}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
interface Props { moduleId: string; userId: string; alreadyCompleted: boolean; backHref: string; }

export default function WorryNavigatorExercise({ moduleId, userId, alreadyCompleted, backHref }: Props) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("intro");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Core
  const [worry, setWorry] = useState("");
  const [worryEx, setWorryEx] = useState("");
  const [ratings, setRatings] = useState({ strength: 5, urge: 5, belief: 5 });

  // Flowchart
  const [flowStep, setFlowStep] = useState(0);
  const [flowAnswers, setFlowAnswers] = useState<(boolean | null)[]>([null, null, null, null]);
  const [path, setPath] = useState<FlowPath | null>(null);

  // Action
  const [aProblem, setAProblem] = useState("");
  const [aStep, setAStep] = useState("");
  const [aWhen, setAWhen] = useState("");
  const [aWhenCustom, setAWhenCustom] = useState("");
  const [aEnough, setAEnough] = useState("");

  // Uncertainty
  const [safetyBx, setSafetyBx] = useState<string[]>([]);
  const [safetyOther, setSafetyOther] = useState("");
  const [uFear, setUFear] = useState("");
  const [willSkip, setWillSkip] = useState("");
  const [delay, setDelay] = useState("");
  const [prediction, setPrediction] = useState("");
  const [postStrength, setPostStrength] = useState(5);
  const [urgeChange, setUrgeChange] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [uLearning, setULearning] = useState("");

  // Postpone
  const [pText, setPText] = useState("");
  const [pTime, setPTime] = useState("");
  const [pTimeCustom, setPTimeCustom] = useState("");
  const [pReturn, setPReturn] = useState("");

  // Meta
  const [mBelief, setMBelief] = useState("");
  const [mCost, setMCost] = useState("");
  const [mExps, setMExps] = useState<string[]>([]);

  // Processing
  const [mechanisms, setMechanisms] = useState<string[]>([]);
  const [intervention, setIntervention] = useState("");

  const fullWorry = `אני דואג/ת ${worry.trim() || worryEx}`;
  const btn = "flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm";
  const back = "text-sm text-slate-500 hover:text-slate-700 transition-colors";

  function goBack(to: Screen) { setErr(""); setScreen(to); }

  function handleFlow(yes: boolean) {
    const ans = [...flowAnswers]; ans[flowStep] = yes; setFlowAnswers(ans);
    if (yes) {
      const paths: FlowPath[] = ["action", "uncertainty", "postpone", "meta"];
      const screens: Screen[] = ["action", "uncertainty", "postpone", "meta"];
      const p = paths[flowStep];
      setPath(p);
      if (p === "postpone") setPText(worry.trim() || worryEx);
      setScreen(screens[flowStep]);
    } else {
      if (flowStep < 3) setFlowStep(flowStep + 1);
    }
  }

  function handleFlowUnclear() {
    setPath("unclear"); setScreen("unclear");
  }

  async function markComplete() {
    setSaving(true);
    try {
      await fetch("/api/progress", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, userId, field: "practice_completed", value: true }),
      });
      router.refresh();
    } catch { /* silent */ } finally { setSaving(false); }
  }

  function reset() {
    setScreen("intro"); setWorry(""); setWorryEx("");
    setRatings({ strength: 5, urge: 5, belief: 5 });
    setFlowStep(0); setFlowAnswers([null, null, null, null]); setPath(null);
    setAProblem(""); setAStep(""); setAWhen(""); setAWhenCustom(""); setAEnough("");
    setSafetyBx([]); setSafetyOther(""); setUFear(""); setWillSkip(""); setDelay(""); setPrediction("");
    setPostStrength(5); setUrgeChange(""); setActualResult(""); setULearning("");
    setPText(""); setPTime(""); setPTimeCustom(""); setPReturn("");
    setMBelief(""); setMCost(""); setMExps([]);
    setMechanisms([]); setIntervention(""); setErr("");
  }

  function copyCard() {
    const text = [
      "כרטיס הלמידה שלי — נווט הדאגה",
      `\nהדאגה שבחרתי:\n${fullWorry}`,
      `\nהמסלול: ${path ? PATH_NAMES[path] : "—"}`,
      `\nהמנגנונים המרכזיים:\n${mechanisms.join(", ")}`,
      `\nההתערבות המתאימה:\n${intervention}`,
      `\nמה למדתי:\n${path ? PATH_LEARNING[path] : ""}`,
      "\nשלוש שאלות מטפל:\n• האם זו בעיה פתירה או אי-ודאות?\n• האם האדם פועל, או רק דואג?\n• איזו התנהגות ביטחון משמרת את המעגל?",
      "\nכאשר יש בעיה — עוברים לפעולה.\nכאשר יש אי-ודאות — מתרגלים נשיאה.\nכאשר יש דאגה על הדאגה — עובדים על היחס למחשבה.",
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  // ── SCREENS ────────────────────────────────────────────────────
  if (screen === "intro") return (
    <div className="space-y-5 max-w-2xl mx-auto" dir="rtl">
      {alreadyCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />השלמת תרגול זה בעבר. אפשר לחזור ולתרגל שוב.
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="text-4xl">🧭</div>
        <h1 className="text-2xl font-bold text-brand-900">נווט הדאגה</h1>
        <p className="text-slate-500 text-sm">תרגול חד-פעמי להבנת הטיפול בדאגנות יתר</p>
        <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto">בתרגול זה תכניס דאגה אחת אל תוך תרשים החלטה טיפולי. המטרה אינה להעלים את הדאגה, אלא להבין מה היא מבקשת ממך לעשות: לפעול, לדחות את העיסוק בה, או לתרגל נשיאה של אי-ודאות.</p>
        <p className="text-xs text-slate-400 max-w-md mx-auto">התרגול מיועד ללמידה מקצועית במסגרת הקורס ואינו מחליף טיפול או הדרכה קלינית.</p>
        <button onClick={() => setScreen("enter_worry")} className={btn + " mx-auto"}>התחל תרגול</button>
      </div>
      <p className="text-xs text-slate-400 text-center">אם במהלך התרגול עולה מצוקה חריפה, מחשבות על פגיעה עצמית, או תחושה שאינך מסוגל לשמור על עצמך — פנה לאיש מקצוע או לגורם חירום מתאים.</p>
    </div>
  );

  if (screen === "enter_worry") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={1} total={5} />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-brand-900">שלב ראשון: הכנס דאגה למעבדה</h2>
        <p className="text-sm text-slate-600">בחר דאגה אחת שאתה מכיר מעצמך, ממטופל דמיוני או ממקרה לימודי:</p>
        <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
          <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 border-b border-slate-200">אני דואג/ת ש...</div>
          <textarea rows={2} value={worry} onChange={e => { setWorry(e.target.value); setWorryEx(""); }}
            placeholder="כתוב כאן את הדאגה שלך..."
            className="w-full px-4 py-3 text-sm resize-none focus:outline-none text-right leading-relaxed" />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-2">או בחר דוגמה:</p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map(ex => (
              <button key={ex} type="button" onClick={() => { setWorryEx(ex); setWorry(""); }}
                className={`text-right text-sm px-3 py-2 rounded-lg border transition-all ${worryEx === ex ? "bg-brand-50 border-brand-400 text-brand-800" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                אני דואג/ת {ex}
              </button>
            ))}
          </div>
        </div>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("intro")} className={back}>חזור</button>
          <button className={btn} onClick={() => {
            if (!worry.trim() && !worryEx) { setErr("כדי להמשיך, כתוב דאגה אחת או בחר דוגמה."); return; }
            setErr(""); setScreen("rating");
          }}>המשך</button>
        </div>
      </div>
    </div>
  );

  if (screen === "rating") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={2} total={5} />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-lg font-bold text-brand-900">שלב שני: מדידת נקודת פתיחה</h2>
        <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 italic">"{fullWorry}"</div>
        <Slider label="כמה הדאגה חזקה כרגע?" sub="0 = כלל לא חזקה  |  10 = חזקה מאוד"
          value={ratings.strength} onChange={v => setRatings(r => ({ ...r, strength: v }))} />
        <Slider label="כמה חזק הדחף לבדוק, לשאול, לחפש מידע, לתקן או להרגיע את עצמך?" sub="0 = אין דחף  |  10 = דחף חזק מאוד"
          value={ratings.urge} onChange={v => setRatings(r => ({ ...r, urge: v }))} />
        <Slider label="כמה אתה מאמין שהדאגה עוזרת לך להיות מוכן יותר או אחראי יותר?" sub="0 = כלל לא מאמין  |  10 = מאמין מאוד"
          value={ratings.belief} onChange={v => setRatings(r => ({ ...r, belief: v }))} />
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("enter_worry")} className={back}>חזור</button>
          <button className={btn} onClick={() => setScreen("flowchart")}>המשך לתרשים</button>
        </div>
      </div>
    </div>
  );

  if (screen === "flowchart") {
    const qs = [
      { text: "האם יש כאן בעיה ממשית שניתן לפעול לגביה עכשיו?", tip: "כאשר יש בעיה ממשית שניתן להשפיע עליה עכשיו, הדגש הוא על מעבר מדאגה לפעולה.", yes: "כן, יש פעולה מעשית", no: "לא, אין פעולה ברורה עכשיו" },
      { text: "האם אתה מנסה להשיג ודאות דרך בדיקה, הרגעה, חיפוש מידע או מחשבה חוזרת?", tip: "חיפוש ודאות מפחית מצוקה לזמן קצר, אך עלול לחזק את הדאגה לאורך זמן.", yes: "כן, אני מנסה להשיג ודאות", no: "לא, זה לא העיקר" },
      { text: "האם זו שרשרת של תרחישים עתידיים שלא ניתן לפתור כרגע?", tip: "כאשר הדאגה עוברת מתרחיש לתרחיש, היא נוטה להרגיש כמו הכנה — אך בפועל שומרת את האדם בתוך העיסוק המאיים.", yes: "כן, זו שרשרת תרחישים", no: "לא, זה משהו אחר" },
      { text: "האם הדאגה עצמה מפחידה אותך? (לדוגמה: \"אם אתחיל לדאוג, לא אצליח להפסיק\")", tip: "כאשר האדם מפחד מעצם הדאגה, חשוב לבדוק את האמונה שלו לגבי מחשבות, שליטה וסכנה.", yes: "כן, אני דואג מהדאגה עצמה", no: null },
    ];
    const q = qs[flowStep];
    return (
      <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
        <ProgressBar step={3} total={5} />
        <h2 className="text-lg font-bold text-brand-900">שלב שלישי: תרשים ההחלטה</h2>
        <FlowChart flowStep={flowStep} flowAnswers={flowAnswers} path={path} />
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 italic">"{fullWorry}"</div>
          <p className="font-semibold text-brand-900 text-sm">{q.text}</p>
          <p className="text-xs text-slate-500 italic">{q.tip}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => handleFlow(true)} className={btn + " flex-1"}>{q.yes}</button>
            {flowStep < 3 ? (
              <button onClick={() => handleFlow(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-colors text-sm">{q.no}</button>
            ) : (
              <button onClick={handleFlowUnclear} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-colors text-sm">לא בטוח</button>
            )}
          </div>
        </div>
        <button onClick={() => { if (flowStep > 0) { const a = [...flowAnswers]; a[flowStep] = null; setFlowAnswers(a); setFlowStep(flowStep - 1); } else goBack("rating"); }} className={back}>חזור</button>
      </div>
    );
  }

  // ── ACTION ──────────────────────────────────────────────────
  if (screen === "action") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={3} total={5} />
      <div className="bg-white rounded-2xl border border-green-200 p-6 space-y-5">
        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">מסלול פעולה</span>
        <h2 className="text-lg font-bold text-brand-900">זו כנראה בעיה פתירה</h2>
        <p className="text-sm text-slate-600">כאשר יש בעיה ממשית שניתן להשפיע עליה עכשיו, המטרה היא לעבור לפעולה קטנה, ברורה ומוגבלת.</p>
        <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-slate-700 italic">"{fullWorry}"</div>
        <TA label="מה הבעיה המדויקת?" value={aProblem} onChange={setAProblem} placeholder="תאר את הבעיה בצורה ממוקדת..." />
        <TA label="מה צעד אחד קטן שאפשר לעשות בעשר הדקות הקרובות?" value={aStep} onChange={setAStep} placeholder="צעד קטן ומוגדר..." />
        <div>
          <label className="block text-sm font-semibold text-brand-900 mb-2">מתי תעשה את הצעד הזה?</label>
          <RadioRow options={["עכשיו", "היום", "מחר", "בזמן אחר שאקבע"]} value={aWhen} onChange={setAWhen} />
          {aWhen === "בזמן אחר שאקבע" && <textarea rows={1} value={aWhenCustom} onChange={e => setAWhenCustom(e.target.value)} placeholder="כתוב מתי..." className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" />}
        </div>
        <TA label='מה ייחשב "מספיק לעכשיו"?' value={aEnough} onChange={setAEnough} placeholder="הגדר גבול ברור..." />
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("flowchart")} className={back}>חזור</button>
          <button className={btn} onClick={() => { if (!aProblem || !aStep) { setErr("מלא את שדות הבעיה והצעד כדי להמשיך."); return; } setErr(""); setScreen("action_summary"); }}>צור כרטיס סיכום</button>
        </div>
      </div>
    </div>
  );

  if (screen === "action_summary") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={4} total={5} />
      <div className="bg-white rounded-2xl border border-green-200 p-6 space-y-4">
        <h2 className="font-bold text-brand-900">✅ כרטיס סיכום: פעולה במקום דאגה</h2>
        <p className="text-sm text-slate-600">הדאגה שבחרת מצביעה על בעיה שיש לה מרכיב מעשי. ההתערבות: פתרון בעיות ממוקד — הגדרת הבעיה, צעד קטן, זמן ביצוע, "מספיק לעכשיו".</p>
        <SummaryCard items={[["הדאגה שלך", fullWorry], ["הבעיה המדויקת", aProblem], ["הצעד הקרוב", aStep], ["מתי", aWhen === "בזמן אחר שאקבע" ? aWhenCustom : aWhen], ['מה "מספיק לעכשיו"', aEnough]]} />
        <div className="bg-green-50 border border-green-200 rounded-xl p-3"><p className="text-xs font-semibold text-green-700 mb-1">שאלת מטפל</p><p className="text-sm text-green-900">האם המטופל באמת פועל, או רק ממשיך לחשוב על הבעיה?</p></div>
        <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs font-semibold text-slate-500 mb-1">מסר למידה</p><p className="text-sm text-slate-700">כאשר יש בעיה פתירה — עוברים מחשיבה חוזרת לפעולה מוגבלת.</p></div>
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("action")} className={back}>חזור</button>
          <button className={btn} onClick={() => setScreen("processing")}>המשך לעיבוד קליני</button>
        </div>
      </div>
    </div>
  );

  // ── UNCERTAINTY ──────────────────────────────────────────────
  if (screen === "uncertainty") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={3} total={5} />
      <div className="bg-white rounded-2xl border border-blue-200 p-6 space-y-5">
        <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">מסלול חשיפה לאי-ודאות</span>
        <h2 className="text-lg font-bold text-brand-900">זו כנראה דאגה שמוזנת מחיפוש ודאות</h2>
        <p className="text-sm text-slate-600">כאשר אין פעולה ברורה, אך יש דחף לבדוק, לשאול, לחפש מידע או להרגיע את עצמנו — הדאגה מנסה לסגור אי-ודאות. ההתערבות: חשיפה מדורגת לאי-ודאות והפחתת התנהגויות ביטחון.</p>
        <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-slate-700 italic">"{fullWorry}"</div>
        <div>
          <label className="block text-sm font-semibold text-brand-900 mb-2">מה אתה רוצה לעשות עכשיו כדי להרגיש בטוח יותר?</label>
          <Tags options={SAFETY_BEHAVIORS} selected={safetyBx} onToggle={o => setSafetyBx(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o])} />
          {safetyBx.includes("אחר") && <textarea rows={1} value={safetyOther} onChange={e => setSafetyOther(e.target.value)} placeholder="תאר..." className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" />}
        </div>
        <TA label="מה יקרה לדעתך אם לא תעשה את פעולת הביטחון הזאת עכשיו?" value={uFear} onChange={setUFear} placeholder="מה אתה מצפה שיקרה..." />
        <TA label="איזו פעולת ביטחון אחת אתה מוכן לא לבצע כרגע?" value={willSkip} onChange={setWillSkip} placeholder="בחר פעולה אחת לדחות..." />
        <div>
          <label className="block text-sm font-semibold text-brand-900 mb-2">לכמה זמן תדחה את פעולת הביטחון?</label>
          <RadioRow options={["10 דקות", "20 דקות", "30 דקות", "שעה", "עד סוף היום"]} value={delay} onChange={setDelay} />
        </div>
        <TA label="מה התחזית שלך?" prefix="אם לא אבדוק או לא ארגיע את עצמי, אני מנבא ש..." value={prediction} onChange={setPrediction} />
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("flowchart")} className={back}>חזור</button>
          <button className={btn} onClick={() => { if (!willSkip || !delay) { setErr("בחר פעולת ביטחון ומשך דחייה."); return; } setErr(""); setScreen("experiment"); }}>צור ניסוי</button>
        </div>
      </div>
    </div>
  );

  if (screen === "experiment") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={3} total={5} />
      <div className="bg-white rounded-2xl border border-blue-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-brand-900">ניסוי חשיפה לאי-ודאות</h2>
        <SummaryCard items={[["הדאגה", fullWorry], ["פעולת הביטחון שאדחה", willSkip], ["משך הדחייה", delay], ["התחזית", prediction ? `אם לא אבדוק... ${prediction}` : ""]]} />
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 leading-relaxed">במהלך הזמן שבחרת, אל תנסה להעלים את הדאגה. המטרה היא לא להירגע מיד, אלא לבדוק האם אפשר להמשיך לתפקד בלי ודאות מלאה.</div>
        <div className="flex items-center justify-between">
          <button onClick={() => goBack("uncertainty")} className={back}>חזור</button>
          <button className={btn} onClick={() => setScreen("debrief")}>סיימתי את הניסוי</button>
        </div>
      </div>
    </div>
  );

  if (screen === "debrief") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={3} total={5} />
      <div className="bg-white rounded-2xl border border-blue-200 p-6 space-y-5">
        <h2 className="text-lg font-bold text-brand-900">מה קרה בפועל?</h2>
        <Slider label="כמה הדאגה חזקה עכשיו?" sub="0 = כלל לא  |  10 = מאוד" value={postStrength} onChange={setPostStrength} />
        <div>
          <label className="block text-sm font-semibold text-brand-900 mb-2">האם הדחף לבדוק עלה, ירד או נשאר דומה?</label>
          <RadioRow options={["עלה", "ירד", "נשאר דומה", "השתנה בגלים"]} value={urgeChange} onChange={setUrgeChange} />
        </div>
        <TA label="מה קרה בפועל ביחס לתחזית שלך?" value={actualResult} onChange={setActualResult} placeholder="תאר מה קרה..." />
        <TA label="מה למדת על היכולת לשאת אי-ודאות?" value={uLearning} onChange={setULearning} placeholder="רשום מה למדת..." />
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("experiment")} className={back}>חזור</button>
          <button className={btn} onClick={() => setScreen("uncertainty_summary")}>צור כרטיס סיכום</button>
        </div>
      </div>
    </div>
  );

  if (screen === "uncertainty_summary") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={4} total={5} />
      <div className="bg-white rounded-2xl border border-blue-200 p-6 space-y-4">
        <h2 className="font-bold text-brand-900">🌊 כרטיס סיכום: נשיאת אי-ודאות</h2>
        <p className="text-sm text-slate-600">הדאגה שבחרת התאפיינה בניסיון להשיג ודאות. ההתערבות: תרגול השהיית תגובה, הפחתת התנהגות ביטחון ולמידה שאפשר לתפקד גם בלי ודאות מלאה.</p>
        <SummaryCard items={[["הדאגה", fullWorry], ["פעולת הביטחון שנדחתה", willSkip], ["משך הדחייה", delay], ["מה קרה בפועל", actualResult], ["מה למדתי", uLearning]]} />
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3"><p className="text-xs font-semibold text-blue-700 mb-1">שאלת מטפל</p><p className="text-sm text-blue-900">איזו התנהגות ביטחון מחזיקה את הדאגה?</p></div>
        <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs font-semibold text-slate-500 mb-1">מסר למידה</p><p className="text-sm text-slate-700">כאשר אין בעיה פתירה, אך יש חיפוש ודאות — מתרגלים חשיפה לאי-ודאות.</p></div>
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("debrief")} className={back}>חזור</button>
          <button className={btn} onClick={() => setScreen("processing")}>המשך לעיבוד קליני</button>
        </div>
      </div>
    </div>
  );

  // ── POSTPONE ─────────────────────────────────────────────────
  if (screen === "postpone") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={3} total={5} />
      <div className="bg-white rounded-2xl border border-purple-200 p-6 space-y-5">
        <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">מסלול דחיית דאגה</span>
        <h2 className="text-lg font-bold text-brand-900">זו כנראה דאגה חוזרת ולא משימה מיידית</h2>
        <p className="text-sm text-slate-600">כאשר הדאגה נעה מתרחיש לתרחיש ואינה מובילה לפעולה — מזהים, רושמים, דוחים לזמן מוגדר וחוזרים לפעולה הנוכחית.</p>
        <div className="bg-purple-50 rounded-xl px-4 py-3 text-sm text-slate-700 italic">"{fullWorry}"</div>
        <TA label="כתוב את הדאגה במשפט קצר אחד:" value={pText} onChange={setPText} rows={2} />
        <div>
          <label className="block text-sm font-semibold text-brand-900 mb-2">מתי יהיה "זמן דאגה" מוגדר שבו תוכל לחזור אליה?</label>
          <RadioRow options={["בערב", "מחר בבוקר", "בעוד שעה", "בזמן אחר שאקבע"]} value={pTime} onChange={setPTime} />
          {pTime === "בזמן אחר שאקבע" && <textarea rows={1} value={pTimeCustom} onChange={e => setPTimeCustom(e.target.value)} placeholder="כתוב מתי..." className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" />}
        </div>
        <TA label="לאיזו פעולה נוכחית אתה רוצה לחזור עכשיו?" value={pReturn} onChange={setPReturn} placeholder="תאר מה תעשה..." />
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("flowchart")} className={back}>חזור</button>
          <button className={btn} onClick={() => { if (!pTime) { setErr("בחר זמן דאגה כדי להמשיך."); return; } setErr(""); setScreen("postpone_summary"); }}>צור כרטיס דחיית דאגה</button>
        </div>
      </div>
    </div>
  );

  if (screen === "postpone_summary") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={4} total={5} />
      <div className="bg-white rounded-2xl border border-purple-200 p-6 space-y-4">
        <h2 className="font-bold text-brand-900">⏱ כרטיס סיכום: לא כל מחשבה דורשת טיפול מיידי</h2>
        <p className="text-sm text-slate-600">הדאגה שבחרת נראית כשרשרת תרחישים עתידיים שאינה דורשת פעולה מיידית. המטרה: לזהות, לרשום, לדחות לזמן מוגדר ולחזור לפעולה.</p>
        <SummaryCard items={[["הדאגה שאדחה", pText], ["זמן הדאגה שנקבע", pTime === "בזמן אחר שאקבע" ? pTimeCustom : pTime], ["הפעולה שאליה אחזור", pReturn]]} />
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3"><p className="text-xs font-semibold text-purple-700 mb-1">שאלת מטפל</p><p className="text-sm text-purple-900">האם המטופל מתייחס לכל מחשבה כאילו היא משימה דחופה?</p></div>
        <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs font-semibold text-slate-500 mb-1">מסר למידה</p><p className="text-sm text-slate-700">כאשר הדאגה היא שרשרת עתידית לא פתירה — דוחים את העיסוק וחוזרים לפעולה.</p></div>
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("postpone")} className={back}>חזור</button>
          <button className={btn} onClick={() => setScreen("processing")}>המשך לעיבוד קליני</button>
        </div>
      </div>
    </div>
  );

  // ── META ─────────────────────────────────────────────────────
  if (screen === "meta") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={3} total={5} />
      <div className="bg-white rounded-2xl border border-orange-200 p-6 space-y-5">
        <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">מסלול אמונות על דאגה</span>
        <h2 className="text-lg font-bold text-brand-900">ייתכן שהמוקד הוא דאגה על הדאגה</h2>
        <p className="text-sm text-slate-600">לפעמים הבעיה אינה רק תוכן הדאגה, אלא האמונה ביחס לדאגה עצמה — האם היא נתפסת כמגינה, כמסוכנת, או כבלתי נשלטת.</p>
        <div className="bg-orange-50 rounded-xl px-4 py-3 text-sm text-slate-700 italic">"{fullWorry}"</div>
        <div>
          <label className="block text-sm font-semibold text-brand-900 mb-2">איזו אמונה הכי מתאימה למה שקורה כאן?</label>
          <div className="flex flex-col gap-1.5">
            {META_BELIEFS.map(b => (
              <button key={b} type="button" onClick={() => setMBelief(b)}
                className={`text-right text-sm px-4 py-2.5 rounded-xl border transition-all ${mBelief === b ? "bg-orange-50 border-orange-400 text-orange-800 font-medium" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>
        <TA label="מה המחיר של האמונה הזאת?" value={mCost} onChange={setMCost} placeholder="תאר את ההשפעה..." />
        <div>
          <label className="block text-sm font-semibold text-brand-900 mb-2">איזה ניסוי קטן יכול לבדוק אם חייבים להתייחס לדאגה מיד?</label>
          <Tags options={["לדחות את הדאגה ל-20 דקות.", "לתת למחשבה להיות בלי להילחם בה.", "לכתוב את הדאגה ולחזור למשימה.", "לא לבדוק אם הדאגה נעלמה."]} selected={mExps} onToggle={o => setMExps(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o])} />
        </div>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("flowchart")} className={back}>חזור</button>
          <button className={btn} onClick={() => { if (!mBelief) { setErr("בחר אמונה כדי להמשיך."); return; } setErr(""); setScreen("meta_summary"); }}>צור כרטיס סיכום</button>
        </div>
      </div>
    </div>
  );

  if (screen === "meta_summary") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={4} total={5} />
      <div className="bg-white rounded-2xl border border-orange-200 p-6 space-y-4">
        <h2 className="font-bold text-brand-900">🪞 כרטיס סיכום: עבודה על היחס לדאגה</h2>
        <p className="text-sm text-slate-600">במקרה הזה ייתכן שהמוקד אינו רק "מה יקרה?", אלא "מה אני מאמין על עצם הדאגה?". יש לעבוד לא רק עם תוכן המחשבה אלא גם עם האמונה ביחס לתהליך הדאגה.</p>
        <SummaryCard items={[["הדאגה", fullWorry], ["האמונה שזוהתה", mBelief], ["המחיר", mCost], ["ניסויים מוצעים", mExps.join(", ")]]} />
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3"><p className="text-xs font-semibold text-orange-700 mb-1">שאלת מטפל</p><p className="text-sm text-orange-900">מה המטופל מאמין שיקרה אם לא יתייחס לדאגה מיד?</p></div>
        <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs font-semibold text-slate-500 mb-1">מסר למידה</p><p className="text-sm text-slate-700">כאשר יש דאגה על הדאגה — עובדים על האמונה ביחס למחשבה, לא רק על תוכן המחשבה.</p></div>
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("meta")} className={back}>חזור</button>
          <button className={btn} onClick={() => setScreen("processing")}>המשך לעיבוד קליני</button>
        </div>
      </div>
    </div>
  );

  if (screen === "unclear") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={3} total={5} />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-brand-900">לא כל דאגה דורשת סיווג מיידי</h2>
        <p className="text-sm text-slate-600">לפעמים הדאגה אינה מתאימה באופן נקי למסלול אחד. במקרה כזה אפשר להתחיל מהשאלה הפשוטה ביותר: האם יש פעולה קטנה ומועילה לעשות עכשיו? אם לא, כדאי לתרגל השהייה קצרה של העיסוק בדאגה ולבדוק מה קורה.</p>
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => goBack("flowchart")} className={back}>חזור</button>
          <button className={btn} onClick={() => setScreen("processing")}>עבור לעיבוד קליני</button>
        </div>
      </div>
    </div>
  );

  // ── PROCESSING ───────────────────────────────────────────────
  if (screen === "processing") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={4} total={5} />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-lg font-bold text-brand-900">עיבוד קליני</h2>
        <p className="text-sm text-slate-600">בחר את המנגנונים המרכזיים שפעלו בדאגה שבחרת:</p>
        <Tags options={MECHANISMS} selected={mechanisms} onToggle={o => setMechanisms(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o])} />
        <div>
          <label className="block text-sm font-semibold text-brand-900 mb-2">מה הייתה ההתערבות המתאימה ביותר?</label>
          <div className="flex flex-col gap-1.5">
            {INTERVENTIONS.map(i => (
              <button key={i} type="button" onClick={() => setIntervention(i)}
                className={`text-right text-sm px-4 py-2.5 rounded-xl border transition-all ${intervention === i ? "bg-brand-50 border-brand-400 text-brand-800 font-medium" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                {i}
              </button>
            ))}
          </div>
        </div>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => {
            const prev: Record<FlowPath, Screen> = { action: "action_summary", uncertainty: "uncertainty_summary", postpone: "postpone_summary", meta: "meta_summary", unclear: "unclear" };
            goBack(path ? prev[path] : "flowchart");
          }} className={back}>חזור</button>
          <button className={btn} disabled={saving} onClick={async () => {
            if (mechanisms.length === 0 || !intervention) { setErr("בחר מנגנון אחד לפחות ואת ההתערבות המתאימה."); return; }
            setErr(""); await markComplete(); setScreen("final");
          }}>{saving ? "שומר..." : "צור כרטיס למידה אישי"}</button>
        </div>
      </div>
    </div>
  );

  // ── FINAL ─────────────────────────────────────────────────────
  if (screen === "final") return (
    <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      <ProgressBar step={5} total={5} />
      <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-brand-100">
          <h2 className="font-bold text-brand-900 text-lg">כרטיס הלמידה שלי</h2>
          <button onClick={copyCard}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-all ${copied ? "bg-green-50 text-green-700 border-green-300" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"}`}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "הועתק!" : "העתק סיכום"}
          </button>
        </div>
        <SummaryCard items={[
          ["הדאגה שבחרתי", fullWorry],
          ["המסלול שבו עברתי", path ? PATH_NAMES[path] : "—"],
          ["המנגנונים המרכזיים", mechanisms.join(", ")],
          ["ההתערבות המתאימה", intervention],
        ]} />
        <div className="bg-brand-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-brand-700 mb-2">מה למדתי</p>
          <p className="text-sm text-brand-900 leading-relaxed">{path ? PATH_LEARNING[path] : ""}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-600 mb-1">שלוש שאלות מטפל:</p>
          <p className="text-sm text-slate-700">• האם זו בעיה פתירה או אי-ודאות?</p>
          <p className="text-sm text-slate-700">• האם האדם פועל, או רק דואג?</p>
          <p className="text-sm text-slate-700">• איזו התנהגות ביטחון משמרת את המעגל?</p>
        </div>
        <div className="border-t border-slate-100 pt-3 space-y-1">
          <p className="text-xs text-slate-500">כאשר יש בעיה — עוברים לפעולה.</p>
          <p className="text-xs text-slate-500">כאשר יש אי-ודאות — מתרגלים נשיאה.</p>
          <p className="text-xs text-slate-500">כאשר יש דאגה על הדאגה — עובדים על היחס למחשבה.</p>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={reset} className="flex items-center gap-2 flex-1 justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-3 rounded-xl transition-colors text-sm">
            <RotateCcw className="w-4 h-4" />איפוס התרגול
          </button>
          <a href={backHref} className="flex-1 text-center flex items-center justify-center text-sm text-brand-600 hover:text-brand-800 font-medium">חזור למפגש</a>
        </div>
      </div>
    </div>
  );

  return null;
}
