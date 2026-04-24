"use client";
import { Printer } from "lucide-react";

const sessions = [
  { num: 1,  title: "CBT נעים להכיר",               sub: "עקרונות הגישה ורכיבי הטיפול המרכזיים", note: false },
  { num: 2,  title: "המשולש הטיפולי",               sub: "הקשר בין מחשבה, רגש והתנהגות (עיבוד ראשוני מול שניוני)", note: false },
  { num: 3,  title: "הגישה ההתנהגותית",             sub: "התניה קלאסית ואופרנטית, למידה והתלות המשולשת", note: false },
  { num: 4,  title: "עקרונות הטיפול בחשיפה",        sub: "מדרג חשיפה, התנהגויות ביטחון", note: true },
  { num: 5,  title: "המודל הקוגניטיבי (א׳)",        sub: "התגבשות אמונות יסוד עמוקות וטכניקות קליניות לזיהוין", note: false },
  { num: 6,  title: "המודל הקוגניטיבי (ב׳)",        sub: "מחשבות אוטומטיות, איתורן ואתגרים בזיהוי הקליני", note: false },
  { num: 7,  title: "הבניה קוגניטיבית",             sub: "זיהוי עיוותי חשיבה, תשאול סוקרטי וטכניקות של הפרדה קוגניטיבית", note: false },
  { num: 8,  title: "טכניקות הרפיה וויסות",         sub: "הקשר גוף-מחשבה, אימון נשימתי, הרפיית שרירים ודמיון מודרך", note: false },
  { num: 9,  title: "המשגה קלינית (Formulation)",   sub: "חיבור כל חלקי המודל — תמונה קלינית מלאה ומטרות טיפול", note: false },
  { num: 10, title: "טיפול בדאגנות כרונית (GAD)",  sub: "יישום הפרוטוקול הקוגניטיבי-התנהגותי לדאגנות", note: false },
  { num: 11, title: "חרדה חברתית",                  sub: "ניתוח מקרה והדגמה מעשית של יישום המודל", note: false },
  { num: 12, title: "סיכום והצגת מקרה",             sub: "אינטגרציה של כל כלי הקורס — הדגמת מקרה קליני מסכם וסיום הקורס", note: false },
];

export default function SyllabusPage() {
  return (
    <div dir="rtl" className="font-sans text-[#0f172a]">

      {/* ── Screen: print button ── */}
      <div className="print:hidden flex justify-end mb-6">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-300 hover:border-slate-500 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          שמור כ-PDF
        </button>
      </div>

      {/* ── Document ── */}
      <div className="syllabus-doc bg-white max-w-3xl mx-auto px-12 py-10 print:px-0 print:py-0 print:max-w-none">

        {/* Running header (appears on every print page) */}
        <div className="running-header hidden print:flex justify-between items-center pb-2 mb-6"
             style={{ borderBottom: "2px solid #1e3a5f" }}>
          <span className="text-[8pt] text-slate-400 tracking-widest uppercase">מרכז קשב רב | מאי 2026</span>
          <span className="text-[8pt] text-slate-400 tracking-widest uppercase">תכנית הלימודים</span>
        </div>

        {/* Screen header */}
        <div className="print:hidden border-b-2 border-[#1e3a5f] pb-3 mb-8 flex justify-between items-center">
          <span className="text-xs text-slate-400 tracking-widest uppercase">מרכז קשב רב | מאי 2026</span>
          <span className="text-xs text-slate-400 tracking-widest uppercase">תכנית הלימודים</span>
        </div>

        {/* ── Hero ── */}
        <div className="mb-8 print:mb-5">
          <h1 className="text-4xl print:text-[22pt] font-black text-[#0f172a] leading-tight">
            CBT הלכה למעשה
          </h1>
          <p className="text-2xl print:text-[15pt] font-light text-slate-500 mt-1">מודלים קליניים וכלים יישומיים</p>

          <div className="flex items-center gap-4 mt-4 print:mt-2 text-sm print:text-[8.5pt] text-slate-500">
            <span>36 שעות אקדמיות</span>
            <span className="text-slate-300">|</span>
            <span>12 מפגשים</span>
          </div>

          {/* Instructor */}
          <div className="mt-6 print:mt-4 border-r-[3px] border-[#1e3a5f] pr-4">
            <p className="text-[10px] print:text-[7pt] text-slate-400 uppercase tracking-widest mb-1">מנחה הקורס</p>
            <p className="text-xl print:text-[13pt] font-bold text-[#0f172a]">דן ברזילי</p>
            <p className="text-sm print:text-[8.5pt] text-slate-500 mt-0.5 leading-relaxed">
              פסיכולוג חינוכי, מדריך ומרצה ותיק בטיפול קוגניטיבי התנהגותי, מנהל מרכז ״קשב רב״
            </p>
          </div>
        </div>

        <Divider />

        {/* ── 1. Ethical note ── */}
        <Section title="הבהרה מקצועית ואתית חשובה" num={1}>
          <p className="text-sm print:text-[8.5pt] text-slate-600 leading-relaxed">
            קורס זה נועד להקנות ידע מעמיק וכלים יישומיים מבוססי-מחקרית בגישת ה-CBT. עם זאת, הקורס אינו מהווה תוכנית הסמכה למטפלים. הכלים הנלמדים מיועדים להעשרת ארגז הכלים המקצועי של המשתתפים (מטפלים בהבעה ויצירה, פסיכולוגים, עובדים סוציאליים, יועצים חינוכיים, מאמנים אישיים, בעלי מקצועות הוראה ועוד). השימוש בכלים אלו ייעשה תמיד בכפוף לגבולות ההכשרה, ההסמכה המקורית והרישוי המקצועי של כל משתתף.{" "}
            <strong>אין לראות בתעודת סיום הקורס אישור או רישיון לעסוק בטיפול פסיכולוגי עבור מי שאינו מוסמך לכך כחוק.</strong>
          </p>
        </Section>

        <Divider />

        {/* ── 2. Goals ── */}
        <Section title="אודות הקורס ומטרותיו" num={2}>
          <p className="text-sm print:text-[8.5pt] text-slate-600 leading-relaxed mb-4 print:mb-2">
            הקורס משלב ידע תאורטי עדכני עם דגש רב על יישום קליני ומעשי. מטרות הלמידה המרכזיות הן:
          </p>
          <ol className="space-y-2 print:space-y-1">
            {[
              "הבנת המודל הקוגניטיבי-התנהגותי על בוריו.",
              "רכישת כלים מעשיים לזיהוי עיוותי חשיבה, אמונות יסוד ודפוסי התנהגות.",
              "מיומנות בבניית פרוטוקול חשיפות מותאם אישית.",
              "יכולת ניסוח ״המשגה דינמית״ (Dynamic Formulation) קלינית מלאה וקביעת מטרות טיפוליות.",
              "רכישת כלים להתמודדות עם הפרעות חרדה שונות.",
            ].map((g, i) => (
              <li key={i} className="flex items-start gap-3 print:gap-2">
                <span className="text-[#1e3a5f] font-bold text-sm print:text-[8.5pt] shrink-0 mt-0.5 w-5 text-left">{i + 1}.</span>
                <span className="text-sm print:text-[8.5pt] text-slate-600 leading-relaxed">{g}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Divider />

        {/* ── 3. Meeting structure ── */}
        <Section title="מבנה מפגשי הלמידה" num={3}>
          <p className="text-sm print:text-[8.5pt] text-slate-600 leading-relaxed mb-4 print:mb-3">
            הקורס מתקיים במרחב למידה היברידי וחדשני. כל מפגש (3 שעות אקדמיות) בנוי במתכונת הבאה:
          </p>

          {/* Timeline bar */}
          <div className="my-5 print:my-3">
            <p className="text-[10px] print:text-[7pt] text-slate-400 uppercase tracking-widest mb-3 print:mb-2">
              סדר יום לדוגמה
            </p>
            <div className="relative">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div className="bg-[#1e3a5f]" style={{ width: "66.6%" }} />
                <div className="bg-slate-300" style={{ width: "33.3%" }} />
              </div>
              <div className="flex mt-2 print:mt-1 text-[10px] print:text-[7.5pt]">
                <div style={{ width: "66.6%" }}>
                  <span className="font-semibold text-[#1e3a5f]">שעתיים</span>
                  <span className="text-slate-400 mr-1">— הקניית ידע תיאורטי</span>
                </div>
                <div style={{ width: "33.3%" }}>
                  <span className="font-semibold text-slate-500">שעה</span>
                  <span className="text-slate-400 mr-1">— תרגול מעשי</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 print:space-y-2">
            <StructureItem label="הקניית ידע תיאורטי" duration="שעתיים אקדמיות">
              הרצאה פרונטלית המעמיקה במודלים הקליניים, הפרוטוקולים והתיאוריה של אותו שבוע.
            </StructureItem>
            <StructureItem label="תרגול מעשי" duration="שעה אקדמית">
              עבודה מודרכת בקבוצה או בחדרים קטנים (Breakout rooms) לתרגול מיומנויות טיפוליות, ניתוח מקרים וסימולציות.
            </StructureItem>
          </div>
        </Section>

        <Divider />

        {/* ── 4. Async materials ── */}
        <Section title="חומרי למידה והעשרה (א-סינכרוניים)" num={4}>
          <p className="text-sm print:text-[8.5pt] text-slate-600 leading-relaxed mb-4 print:mb-3">
            מערכת הקורס מספקת סביבת למידה עשירה בין המפגשים:
          </p>
          <div className="space-y-4 print:space-y-2">

            <AsyncItem title="הרצאות העשרה מוקלטות (בונוס)">
              בנוסף למפגשים החיים, תינתן גישה לשתי הרצאות העשרה מלאות:
              <ul className="mt-1.5 print:mt-1 space-y-1 pr-4">
                <li className="flex items-start gap-2"><span className="text-[#1e3a5f] mt-0.5">—</span><span>פרוטוקול לטיפול בפוביה ספציפית.</span></li>
                <li className="flex items-start gap-2"><span className="text-[#1e3a5f] mt-0.5">—</span><span>פרוטוקול טיפול בחרדת בחינות.</span></li>
              </ul>
            </AsyncItem>

            <AsyncItem title="חומרי קריאה והאזנה">
              מאמרים מקצועיים ופרקי פודקאסט להרחבת הידע (רשות).
            </AsyncItem>

            <AsyncItem title="מערכת למידה ממושחקת (Gamification)">
              ביצוע פעולות במרחב הלמידה יעניק נקודות להגברת המעורבות וההנאה מתהליך הלמידה.
            </AsyncItem>
          </div>
        </Section>

        <Divider />

        {/* ── 5. Requirements ── */}
        <Section title="דרישות הקורס ותנאים לקבלת תעודה" num={5}>
          <p className="text-sm print:text-[8.5pt] text-slate-600 leading-relaxed mb-4 print:mb-3">
            זכאות לתעודת סיום מותנית בעמידה בדרישות הבאות (ניתן לעקוב אחר ההתקדמות בזמן אמת בדאשבורד האישי):
          </p>
          <div className="space-y-3 print:space-y-2">
            <RequirementRow label="נוכחות חובה">
              השתתפות פעילה בלפחות <strong>80%</strong> ממפגשי ה-Zoom החיים — מינימום <strong>10 מתוך 12 מפגשים</strong>.
            </RequirementRow>
            <RequirementRow label="הגשת מטלות">
              מענה והגשה של לפחות <strong>50%</strong> מהמטלות ובחני הידע (Quizzes) לאורך הקורס.
            </RequirementRow>
          </div>
        </Section>

        <Divider />

        {/* ── 6. Curriculum ── */}
        <Section title="תוכנית הלימודים (פירוט מפגשים)" num={6}>
          <table className="w-full text-sm print:text-[8pt] border-collapse mt-3 print:mt-2">
            <thead>
              <tr className="border-b-2 border-[#1e3a5f]">
                <th className="text-right font-semibold text-[#1e3a5f] py-2 print:py-1.5 w-16 print:w-12">מפגש</th>
                <th className="text-right font-semibold text-[#1e3a5f] py-2 print:py-1.5 w-40 print:w-32">נושא</th>
                <th className="text-right font-semibold text-[#1e3a5f] py-2 print:py-1.5">תיאור</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.num}
                    className={`border-b border-slate-100 ${i % 2 === 1 ? "bg-slate-50/60" : ""} ${s.note ? "print:bg-slate-50" : ""}`}
                    style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                  <td className="py-2.5 print:py-1.5 font-bold text-[#1e3a5f] align-top">{s.num}</td>
                  <td className="py-2.5 print:py-1.5 font-semibold text-[#0f172a] leading-snug align-top pr-3">{s.title}</td>
                  <td className="py-2.5 print:py-1.5 text-slate-500 leading-relaxed align-top">
                    {s.sub}
                    {s.note && (
                      <span className="block mt-1 print:mt-0.5 text-[11px] print:text-[7pt] text-slate-400 border-r-2 border-[#1e3a5f]/30 pr-2">
                        שימו לב: מפגש זה כולל עבודת חובה מול סימולטור AI והגשת תרגיל קליני למרצה.
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Divider />

        {/* ── Footer ── */}
        <footer className="mt-6 print:mt-4 flex items-center justify-between gap-6 border-t border-slate-200 pt-4 print:pt-3">
          <p className="text-xs print:text-[8pt] text-slate-400">© מרכז קשב רב — כל הזכויות שמורות</p>
          <p className="text-xs print:text-[8pt] text-slate-400">CBT מקיף · דן ברזילי · מאי 2026</p>
        </footer>

      </div>

      {/* ── Print CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;900&display=swap');

        @media print {
          @page {
            size: A4 portrait;
            margin: 1.8cm 2cm;
            @bottom-center {
              content: "דף " counter(page) " מתוך " counter(pages);
              font-size: 8pt;
              color: #94a3b8;
              font-family: 'Heebo', sans-serif;
            }
          }

          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            font-family: 'Heebo', sans-serif;
            font-size: 9pt;
            color: #0f172a;
            background: #fff;
          }

          .syllabus-doc {
            padding: 0 !important;
            max-width: 100% !important;
          }

          /* Prevent orphaned sections */
          section, tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Section spacing */
          section { margin-bottom: 0 !important; padding-bottom: 6pt !important; padding-top: 8pt !important; }

          /* Table rows */
          tr { break-inside: avoid; page-break-inside: avoid; }

          /* Timeline bar */
          .timeline-fill-primary { background: #1e3a5f !important; }
          .timeline-fill-secondary { background: #cbd5e1 !important; }

          /* Dividers */
          hr { border-color: #e2e8f0 !important; margin: 0 !important; }

          /* Zebra on session table */
          .session-odd { background: #f8fafc !important; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Divider() {
  return <hr className="border-slate-200 my-6 print:my-0" />;
}

function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <section className="py-6 print:py-2">
      <div className="flex items-center gap-3 mb-4 print:mb-2">
        <span className="text-[#1e3a5f] font-black text-2xl print:text-[14pt] leading-none w-6 text-left shrink-0">
          {num}.
        </span>
        <h2 className="text-xl print:text-[13pt] font-bold text-[#0f172a] leading-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StructureItem({ label, duration, children }: { label: string; duration: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 print:gap-3">
      <span className="text-[#1e3a5f] font-bold text-sm print:text-[8pt] shrink-0 mt-0.5">—</span>
      <div>
        <span className="font-semibold text-[#0f172a] text-sm print:text-[8.5pt]">{label}</span>
        <span className="text-slate-400 text-xs print:text-[7.5pt] mr-2">({duration})</span>
        <p className="text-sm print:text-[8pt] text-slate-500 leading-relaxed mt-0.5">{children}</p>
      </div>
    </div>
  );
}

function AsyncItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 print:gap-3 border-b border-slate-100 pb-3 print:pb-2 last:border-0">
      <span className="text-[#1e3a5f] font-bold text-sm print:text-[8pt] shrink-0 mt-0.5">—</span>
      <div className="text-sm print:text-[8.5pt] text-slate-500 leading-relaxed">
        <span className="font-semibold text-[#0f172a]">{title}. </span>
        {children}
      </div>
    </div>
  );
}

function RequirementRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 print:gap-3">
      <span className="text-[#1e3a5f] font-bold text-sm print:text-[8pt] shrink-0 mt-0.5">—</span>
      <p className="text-sm print:text-[8.5pt] text-slate-600 leading-relaxed">
        <span className="font-semibold text-[#0f172a]">{label}: </span>
        {children}
      </p>
    </div>
  );
}

