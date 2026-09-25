# שפת העיצוב — קורס CBT

סביבת למידה מקצועית לפסיכולוגיה: רגועה, חמה ומדויקת. ממשק **בהיר בלבד**, אחיד בכל המסכים (אין מצב כהה; אם יתווסף, יש להוסיף אותו בטוקנים ולא בכל מסך).

## טוקנים

כל הצבעים מוגדרים כמשתני CSS (ערוצי RGB) ב-`src/app/globals.css` ומחוברים ל-Tailwind ב-`tailwind.config.ts`. שינוי צבע = שינוי משתנה אחד.

| תפקיד | מחלקות | הערה |
|---|---|---|
| קנבס העמוד | `bg-slate-50` | בז' חם `#F7F5F0` |
| משטחי תוכן | `bg-white` + `border-slate-200` + `shadow-card` (`.surface`) | |
| טקסט | `text-slate-900` (גוף), `text-slate-600` (משני), `text-slate-500` (עזר) | כל הגוונים מ-400 ומעלה עומדים ב-4.5:1 על לבן |
| ראשי | `brand-*` (כחול-נפט, `brand-500` = `#2C6E9E`) | כפתורים, קישורים, פעיל, כותרות (`brand-900`) |
| משני | `teal-*` | הדגשות תומכות (למשל אתגר שבועי) |
| השלמה | `emerald-*` בלבד | רק להשלמה |
| תשומת לב | `amber-*` בלבד | רק למה שדורש פעולה |
| שגיאה | `red-*` | |

הערה: `slate-300` (`#A9B0B7`) משמש לגבולות שדות; ניגודיות הגבול נמוכה מ-3:1 והשדה מזוהה בעזרת תווית גלויה ומסגרת focus.

## טיפוגרפיה

Heebo (קיים). גוף 16px, שורה 1.65. הסקאלה הוגדלה גלובלית: `text-xs` = 13px, `text-sm` = 15px. אין להשתמש בגדלים שרירותיים מתחת ל-13px. לקריאה ממושכת: `.prose-he` (רוחב 68 תווים, שורה 2rem).

## רכיבים משותפים

`src/components/ui/`: `Button`, `Card`, `Badge`, `ProgressBar` (עם `role=progressbar`), `ProgressRing`, `StatusPill` (אייקון + טקסט, לעולם לא צבע בלבד), `PageHeader`, `EmptyState`.
מחלקות ב-`globals.css`: `.surface`, `.page-title`, `.page-lead`, `.section-title`, `.eyebrow`, `.label-he`, `.input-he`, `.btn-primary`, `.btn-secondary`, `.prose-he`.

## כללים

- **אייקונים:** `lucide-react` בלבד, `aria-hidden` כשיש טקסט לצידם. לא להשתמש באימוג'י כאייקון.
- **סטטוס:** מצב מפגש = אחד מ-`complete | in-progress | not-started | locked | attention` דרך `StatusPill`. התקדמות מוצגת פעם אחת (פס **או** אחוז לצד תווית, לא טבעת + פס + אחוז).
- **מגע:** יעדי לחיצה לפחות 44px (`min-h-[44px]` בכפתורים, `.input-he`).
- **מקלדת:** `:focus-visible` גלובלי (טבעת כחולה 2px). לא להסיר outline.
- **תנועה:** מעברים של 150–500ms בלבד; `prefers-reduced-motion` מבוטל גלובלית.
- **RTL:** להעדיף מאפיינים לוגיים (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`). מספרים, אימיילים וקיצורים באנגלית בתוך `<bdi>`.
- **רוחב תוכן:** לוח בקרה ופאנל ניהול `max-w-7xl`; רשימת מפגשים ומסך מפגש `max-w-4xl`; משאבים `max-w-6xl`; צ'אט `max-w-4xl`; המשגה `max-w-5xl`.

## בדיקה חזותית מקומית

`npm run dev` ואז `/design-preview/<מסך>` (מסכים: `dashboard`, `modules`, `lesson`, `resources`, `admin`, `chat`, `chat-empty`, `chat-nogroup`, `formulation`, `matching`, `sorting`, `quiz`, `login`). הנתיב מרנדר את הרכיבים האמיתיים עם נתוני דמה, לא דורש התחברות, וב-production מחזיר 404. מצבי לוח בקרה: `?state=alldone`, `?state=none-open`, `?state=nozoom`.
