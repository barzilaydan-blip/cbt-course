// Demo data for local visual checks only. Not used by any production route.
import type { SessionVM } from "@/components/dashboard/DashboardView";
import type { ModuleListItemProps } from "@/components/modules/ModuleListItem";
import type { Module, Profile, Resource } from "@/types";

export const studentProfile: Profile = {
  id: "s1", name: "דנה כהן", email: "dana@example.com", role: "student",
  total_points: 245, group_id: "g1", phone: null, profession: "פסיכולוגית קלינית", created_at: "2026-01-01",
};

export const adminProfile: Profile = { ...studentProfile, id: "a1", name: "מנהל הקורס", role: "admin" };

const steps = (v: boolean, a: boolean, q: boolean, p: boolean, ex = false) => [
  { key: "video", label: "סרטון", done: v },
  { key: "article", label: "מאמר", done: a },
  { key: "quiz", label: "חידון", done: q },
  { key: "practice", label: ex ? "תרגיל" : "תרגול", done: p },
];

export const sessions: SessionVM[] = [
  { id: "m1", order: 1, title: "היכרות והמודל הקוגניטיבי", description: "עקרונות היסוד של CBT, מודל ה-ABC והקשר בין מחשבות, רגשות והתנהגות.", pct: 100, status: "complete", isAsync: false, href: "#", lockReason: null, steps: steps(true, true, true, true, true) },
  { id: "m2", order: 2, title: "זיהוי מחשבות אוטומטיות", description: "כיצד מלמדים מטופלים לזהות ולתעד מחשבות אוטומטיות בזמן אמת.", pct: 100, status: "complete", isAsync: false, href: "#", lockReason: null, steps: steps(true, true, true, true) },
  { id: "m3", order: 3, title: "אתגור מחשבות ועבודה עם עיוותי חשיבה", description: "טכניקות לאתגור קוגניטיבי, שאלות סוקרטיות והצגת חלופות מאוזנות למחשבה.", pct: 50, status: "in-progress", isAsync: false, href: "#", lockReason: null, steps: steps(true, true, false, false) },
  { id: "m4", order: 4, title: "תרגיל קליני: ניתוח מקרה", description: null, pct: 0, status: "not-started", isAsync: false, href: "#", lockReason: null, steps: steps(false, false, false, false, true) },
  { id: "m5", order: 5, title: "ניסויים התנהגותיים וחשיפה הדרגתית", description: "תכנון ניסוי התנהגותי, היררכיית חשיפה ועבודה עם התנהגויות ביטחון.", pct: 0, status: "locked", isAsync: false, href: "#", lockReason: "ייפתח ב-14 באוקטובר, או עם השלמת המפגש הקודם", steps: steps(false, false, false, false) },
  { id: "m6", order: 6, title: "מיינדפולנס בתוך המסגרת הקוגניטיבית-התנהגותית", description: null, pct: 0, status: "locked", isAsync: false, href: "#", lockReason: "המפגש נעול כרגע", steps: steps(false, false, false, false) },
  { id: "m10", order: 10, title: "טיפול בפוביות — הקלטה ממחזור קודם", description: null, pct: 0, status: "not-started", isAsync: true, href: "#", lockReason: null, steps: steps(false, false, false, false) },
];

export const leaderboard = [
  { id: "l1", name: "מיכל לוי", points: 420 },
  { id: "l2", name: "אורי שמעוני", points: 380 },
  { id: "l3", name: "דנה כהן", points: 245 },
];

const modItem = (o: Partial<ModuleListItemProps> & Pick<ModuleListItemProps, "id" | "order" | "title">): ModuleListItemProps => ({
  description: null, isAsync: false, accessible: true, pct: 0, lockNote: null, exercisePending: false,
  hasExercise: false, steps: { video: false, article: false, quiz: false, practice: false }, ...o,
});

export const moduleItems: ModuleListItemProps[] = [
  modItem({ id: "m1", order: 1, title: "היכרות והמודל הקוגניטיבי", description: "עקרונות היסוד של CBT, מודל ה-ABC והקשר בין מחשבות, רגשות והתנהגות.", pct: 100, hasExercise: true, steps: { video: true, article: true, quiz: true, practice: true } }),
  modItem({ id: "m3", order: 3, title: "אתגור מחשבות ועבודה עם עיוותי חשיבה — כותרת ארוכה במיוחד כדי לבדוק שבירת שורה טבעית בלי חיתוך", description: "טכניקות לאתגור קוגניטיבי, שאלות סוקרטיות והצגת חלופות מאוזנות למחשבה.", pct: 50, steps: { video: true, article: true, quiz: false, practice: false } }),
  modItem({ id: "m4", order: 4, title: "תרגיל קליני: ניתוח מקרה", pct: 25, hasExercise: true, exercisePending: true, steps: { video: true, article: false, quiz: false, practice: false } }),
  modItem({ id: "m5", order: 5, title: "ניסויים התנהגותיים וחשיפה הדרגתית", description: "תכנון ניסוי התנהגותי והיררכיית חשיפה.", accessible: false, lockNote: "ייפתח ב-14 באוקטובר 2026, או עם השלמת המפגש הקודם" }),
  modItem({ id: "m10", order: 10, title: "טיפול בפוביות", description: "הקלטה ממחזור קודם.", isAsync: true, pct: 0 }),
];

export const fakeModule: Module = {
  id: "m3", order_number: 3, title_he: "אתגור מחשבות ועבודה עם עיוותי חשיבה", description_he: null,
  video_url: null, article_url: "https://example.com/article", podcast_url: "https://example.com/podcast",
  weekly_challenge: "במהלך השבוע, תעד שלוש מחשבות אוטומטיות בשלוש סיטואציות שונות, ונסח לכל אחת חלופה מאוזנת.\nשים לב אילו עיוותי חשיבה חוזרים על עצמם.",
  weekly_challenge_url: null, meeting_date: null, access_mode: "auto", is_published: true, is_async: false, created_at: "2026-01-01",
};

const res = (i: number, o: Partial<Resource>): Resource => ({
  id: `r${i}`, title_he: "משאב", description_he: null, category: "שאלונים", file_url: "#", file_name: null,
  file_type: "pdf", module_id: null, is_published: true, created_at: "2026-01-01", ...o,
});

export const resources: Resource[] = [
  res(1, { title_he: "שאלון בק לדיכאון (BDI-II)", description_he: "שאלון דיווח עצמי בן 21 פריטים להערכת חומרת סימפטומים דיכאוניים.", category: "שאלונים", file_type: "pdf" }),
  res(2, { title_he: "שאלון GAD-7 לחרדה", category: "שאלונים", file_type: "docx" }),
  res(3, { title_he: "מצגת: המודל הקוגניטיבי", description_he: "מצגת המפגש הראשון — כולל דוגמאות למקרים, תרשימי המשגה ותרגילים לעבודה בזוגות. מומלץ לעבור עליה לפני המפגש ולהגיע עם שאלות לדיון בקבוצה.", category: "מצגות", file_type: "pptx" }),
  res(4, { title_he: "רשומת מחשבות (Thought Record)", description_he: "טופס עבודה לתיעוד מחשבות אוטומטיות.", category: "טפסי עבודה", file_type: "pdf" }),
  res(5, { title_he: "הרצאה: חשיפה הדרגתית בחרדה חברתית", category: "קישורים לסרטונים", file_type: "link" }),
  res(6, { title_he: "Cognitive Therapy Techniques", description_he: "ספר עזר מומלץ לטכניקות קוגניטיביות.", category: "ספרים", file_type: "link" }),
];
