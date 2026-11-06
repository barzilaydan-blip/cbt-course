"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Users, Trash2, Save, CheckCircle, Upload, FileUp, Mail, Calendar, Video, Link as LinkIcon } from "lucide-react";
import type { Group, Profile } from "@/types";

interface Props {
  group: Group;
  /** Every student in the system, so membership toggles and "in another group" badges work. */
  allStudents: Profile[];
}

interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profession?: string;
}

const EMPTY_MANUAL: ImportRow = { firstName: "", lastName: "", email: "", phone: "", profession: "" };
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export default function AdminGroupSettings({ group, allStudents }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [isActive, setIsActive] = useState(group.is_active);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [sendingSingle, setSendingSingle] = useState<string | null>(null);
  const [singleInviteResult, setSingleInviteResult] = useState<Record<string, string>>({});

  const [savingDate, setSavingDate] = useState(false);
  const [localDate, setLocalDate] = useState(group.course_start_date ?? "");

  type ScheduleFields = { zoom_url: string; zoom_password: string; meeting_day_he: string; meeting_time: string; syllabus_url: string };
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savedSchedule, setSavedSchedule] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleFields>({
    zoom_url: group.zoom_url ?? "",
    zoom_password: group.zoom_password ?? "",
    meeting_day_he: group.meeting_day_he ?? "",
    meeting_time: group.meeting_time ?? "",
    syllabus_url: group.syllabus_url ?? "",
  });

  const [localAssignments, setLocalAssignments] = useState<Record<string, string | null>>(
    Object.fromEntries(allStudents.map((s) => [s.id, s.group_id]))
  );
  const [savingAssign, setSavingAssign] = useState(false);
  const [savedAssign, setSavedAssign] = useState(false);

  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [manualRow, setManualRow] = useState<ImportRow>(EMPTY_MANUAL);
  const [addingManual, setAddingManual] = useState(false);
  const [manualResult, setManualResult] = useState<string | null>(null);

  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState<Profile | null>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function parseCSV(text: string): ImportRow[] {
    const lines = text.trim().split(/\r?\n/);
    return lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      return {
        firstName: cols[0] ?? "",
        lastName: cols[1] ?? "",
        email: cols[2] ?? "",
        phone: cols[3] ?? "",
        profession: cols[4] ?? "",
      };
    }).filter(r => r.email.includes("@"));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportRows(parseCSV(text));
      setImportResult(null);
    };
    reader.readAsText(file, "utf-8");
  }

  async function sendSingleInvitation(userId: string) {
    setSendingSingle(userId);
    const res = await fetch("/api/admin/send-invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id, userId }),
    });
    const data = await res.json();
    setSingleInviteResult(prev => ({ ...prev, [userId]: data.error ? "שגיאה" : "✓" }));
    setSendingSingle(null);
  }

  async function sendInvitations() {
    setSendingInvites(true);
    const res = await fetch("/api/admin/send-invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id }),
    });
    const data = await res.json();
    setInviteResult(data.error ? `שגיאה: ${data.error}` : `✓ נשלחו ${data.sent} הזמנות`);
    setSendingInvites(false);
  }

  async function runImport() {
    if (importRows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    const res = await fetch("/api/admin/import-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: importRows, groupId: group.id }),
    });
    const data = await res.json();
    if (data.error) {
      setImportResult(`שגיאה: ${data.error}`);
    } else {
      setImportResult(`✓ נוצרו ${data.created} משתמשים חדשים, ${data.existing} קיימים עודכנו${data.errors.length ? `. שגיאות: ${data.errors.join(", ")}` : ""}`);
      router.refresh();
    }
    setImporting(false);
  }

  async function saveStartDate() {
    setSavingDate(true);
    const date = localDate || null;
    await supabase.from("groups").update({ course_start_date: date }).eq("id", group.id);
    setSavingDate(false);
    router.refresh();
  }

  async function saveSchedule() {
    setSavingSchedule(true);
    const payload = {
      zoom_url: schedule.zoom_url.trim() || null,
      zoom_password: schedule.zoom_password.trim() || null,
      meeting_day_he: schedule.meeting_day_he.trim() || null,
      meeting_time: schedule.meeting_time.trim() || null,
      syllabus_url: schedule.syllabus_url.trim() || null,
    };
    await supabase.from("groups").update(payload).eq("id", group.id);
    setSavingSchedule(false);
    setSavedSchedule(true);
    setTimeout(() => setSavedSchedule(false), 2000);
    router.refresh();
  }

  async function addManual() {
    if (!manualRow.email || !manualRow.firstName) return;
    setAddingManual(true);
    setManualResult(null);
    const res = await fetch("/api/admin/import-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: [manualRow], groupId: group.id }),
    });
    const data = await res.json();
    if (data.error) {
      setManualResult(`שגיאה: ${data.error}`);
    } else {
      setManualResult(`✓ המשתתף נוסף בהצלחה`);
      setManualRow(EMPTY_MANUAL);
      router.refresh();
    }
    setAddingManual(false);
  }

  async function toggleActive() {
    const next = !isActive;
    await supabase.from("groups").update({ is_active: next }).eq("id", group.id);
    setIsActive(next);
  }

  async function deleteGroup() {
    if (!confirm("האם אתה בטוח? הסטודנטים יאבדו שיוך לקבוצה.")) return;
    await supabase.from("groups").delete().eq("id", group.id);
    router.push("/admin/groups");
    router.refresh();
  }

  async function saveAssignments() {
    setSavingAssign(true);
    const members = Object.entries(localAssignments)
      .filter(([, gid]) => gid === group.id)
      .map(([uid]) => uid);
    const wasInGroup = allStudents.filter((s) => s.group_id === group.id).map((s) => s.id);
    const toRemove = wasInGroup.filter((id) => localAssignments[id] !== group.id);

    if (members.length) {
      await supabase.from("profiles").update({ group_id: group.id }).in("id", members);
    }
    if (toRemove.length) {
      await supabase.from("profiles").update({ group_id: null }).in("id", toRemove);
    }

    setSavingAssign(false);
    setSavedAssign(true);
    setTimeout(() => setSavedAssign(false), 2000);
    router.refresh();
  }

  async function handleDeleteStudent() {
    if (!confirmDeleteStudent) return;
    setDeletingStudent(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/users/${confirmDeleteStudent.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error ?? "שגיאה במחיקה"); return; }
      setConfirmDeleteStudent(null);
      router.refresh();
    } catch {
      setDeleteError("שגיאת רשת");
    } finally {
      setDeletingStudent(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Confirm delete student */}
      {confirmDeleteStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">מחיקת משתמש</h3>
            <p className="text-slate-600 text-sm mb-1">
              האם למחוק את <span className="font-bold">{confirmDeleteStudent.name}</span>?
            </p>
            <p className="text-slate-400 text-xs mb-5">
              פעולה זו תמחק את כל הנתונים שלו (התקדמות, תרגילים, ביקורים) ולא ניתן לשחזר.
            </p>
            {deleteError && <p className="text-red-500 text-sm mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteStudent}
                disabled={deletingStudent}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors"
              >
                {deletingStudent ? "מוחק..." : "כן, מחק"}
              </button>
              <button
                onClick={() => { setConfirmDeleteStudent(null); setDeleteError(null); }}
                disabled={deletingStudent}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group header */}
      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-brand-50 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 text-white rounded-lg p-2">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-brand-900">{group.name}</h2>
              <p className="text-xs text-slate-500">{allStudents.filter(s => localAssignments[s.id] === group.id).length} חברים</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {inviteResult && <span className="text-xs text-green-600 font-medium">{inviteResult}</span>}
            <button
              onClick={sendInvitations}
              disabled={sendingInvites}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
              title="שלח הזמנה לכל חברי הקבוצה"
            >
              <Mail className="w-3.5 h-3.5" />
              {sendingInvites ? "שולח..." : "שלח הזמנות"}
            </button>
            <button
              onClick={toggleActive}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                isActive
                  ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {isActive ? "פעיל" : "לא פעיל"}
            </button>
            <button
              onClick={deleteGroup}
              className="text-red-400 hover:text-red-600 transition-colors p-1.5"
              title="מחק קבוצה"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Course start date */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3 flex-wrap">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm font-medium text-slate-600">תאריך פתיחת קורס:</span>
            <input
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1 text-sm text-slate-700 focus:outline-none focus:border-brand-400"
            />
            <button
              onClick={saveStartDate}
              disabled={savingDate}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-500 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {savingDate ? "שומר..." : "שמור"}
            </button>
            {localDate && (
              <span className="text-xs text-slate-400">
                מפגש 1 ייפתח {new Date(new Date(localDate).setDate(new Date(localDate).getDate() - 7)).toLocaleDateString("he-IL")}
              </span>
            )}
          </div>
        </div>

        {/* Zoom + meeting day/time + syllabus */}
        <div className="px-5 py-4 border-b border-slate-100 space-y-3">
          <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Video className="w-4 h-4 text-slate-400 shrink-0" />
            Zoom, יום ושעת מפגשים לקבוצה זו
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">יום קבוע</label>
              <select
                value={schedule.meeting_day_he}
                onChange={(e) => setSchedule(prev => ({ ...prev, meeting_day_he: e.target.value }))}
                className="input-he"
              >
                <option value="">לא נקבע</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">שעה קבועה</label>
              <input
                type="time"
                value={schedule.meeting_time}
                onChange={(e) => setSchedule(prev => ({ ...prev, meeting_time: e.target.value }))}
                className="input-he"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">קישור Zoom</label>
              <input
                type="url"
                placeholder="https://zoom.us/j/..."
                value={schedule.zoom_url}
                onChange={(e) => setSchedule(prev => ({ ...prev, zoom_url: e.target.value }))}
                className="input-he"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">סיסמת Zoom</label>
              <input
                type="text"
                placeholder="123456"
                value={schedule.zoom_password}
                onChange={(e) => setSchedule(prev => ({ ...prev, zoom_password: e.target.value }))}
                className="input-he"
                dir="ltr"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                קישור לסילבוס
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={schedule.syllabus_url}
                onChange={(e) => setSchedule(prev => ({ ...prev, syllabus_url: e.target.value }))}
                className="input-he"
                dir="ltr"
              />
            </div>
          </div>
          <button
            onClick={saveSchedule}
            disabled={savingSchedule}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {savedSchedule ? (
              <><CheckCircle className="w-4 h-4" /> נשמר!</>
            ) : (
              <><Save className="w-4 h-4" /> {savingSchedule ? "שומר..." : "שמור לוח זמנים"}</>
            )}
          </button>
        </div>
      </div>

      {/* Import CSV */}
      <div className="surface p-5">
        <h3 className="font-bold text-brand-900 mb-1 flex items-center gap-2">
          <FileUp className="w-4 h-4" />
          ייבוא משתתפים מקובץ CSV
        </h3>
        <p className="text-xs text-slate-500 mb-4">עמודות נדרשות: שם פרטי, שם משפחה, כתובת מייל, טלפון, מקצוע — כל המיובאים ישויכו לקבוצה זו</p>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 border border-slate-300 hover:border-brand-400 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              בחר קובץ CSV
            </button>
          </div>

          {importRows.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
              נמצאו <strong>{importRows.length}</strong> משתתפים בקובץ
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {importRows.slice(0, 5).map((r, i) => (
                  <div key={i} className="text-xs text-slate-500">{r.firstName} {r.lastName} — {r.email}</div>
                ))}
                {importRows.length > 5 && <div className="text-xs text-slate-400">ועוד {importRows.length - 5}...</div>}
              </div>
            </div>
          )}

          {importResult && (
            <div className={`text-sm px-4 py-2 rounded-lg ${importResult.startsWith("שגיאה") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
              {importResult}
            </div>
          )}

          <button
            onClick={runImport}
            disabled={importRows.length === 0 || importing}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 self-start"
          >
            <Users className="w-4 h-4" />
            {importing ? "מייבא..." : `ייבא ${importRows.length} משתתפים`}
          </button>
        </div>
      </div>

      {/* Manual add */}
      <div className="surface p-5">
        <h3 className="font-bold text-brand-900 mb-1 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          הוספת משתתף ידנית
        </h3>
        <p className="text-xs text-slate-500 mb-4">הוסף משתתף בודד ישירות לקבוצה זו</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input type="text" placeholder="שם פרטי *" value={manualRow.firstName} onChange={(e) => setManualRow(r => ({ ...r, firstName: e.target.value }))} className="input-he" />
          <input type="text" placeholder="שם משפחה" value={manualRow.lastName} onChange={(e) => setManualRow(r => ({ ...r, lastName: e.target.value }))} className="input-he" />
          <input type="email" placeholder="אימייל *" value={manualRow.email} onChange={(e) => setManualRow(r => ({ ...r, email: e.target.value }))} className="input-he" dir="ltr" />
          <input type="tel" placeholder="טלפון" value={manualRow.phone} onChange={(e) => setManualRow(r => ({ ...r, phone: e.target.value }))} className="input-he" dir="ltr" />
          <input type="text" placeholder="מקצוע" value={manualRow.profession} onChange={(e) => setManualRow(r => ({ ...r, profession: e.target.value }))} className="input-he" />
        </div>
        {manualResult && (
          <div className={`text-sm px-4 py-2 rounded-lg mb-3 ${manualResult.startsWith("שגיאה") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
            {manualResult}
          </div>
        )}
        <button
          onClick={addManual}
          disabled={addingManual || !manualRow.email || !manualRow.firstName}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {addingManual ? "מוסיף..." : "הוסף משתתף"}
        </button>
      </div>

      {/* Student assignment */}
      <div className="surface p-5">
        <p className="text-sm font-semibold text-slate-600 mb-3">שייך סטודנטים לקבוצה:</p>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {allStudents.map((student) => {
            const isInThisGroup = localAssignments[student.id] === group.id;
            const isInOtherGroup = localAssignments[student.id] && localAssignments[student.id] !== group.id;

            return (
              <div
                key={student.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isInThisGroup ? "border-brand-300 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isInThisGroup}
                  onChange={(e) => {
                    setLocalAssignments((prev) => ({ ...prev, [student.id]: e.target.checked ? group.id : null }));
                  }}
                  className="accent-brand-500 w-4 h-4 shrink-0"
                  aria-label={`שייך את ${student.name || student.email} לקבוצה`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">{student.name || "—"}</p>
                  <p className="text-xs text-slate-400 truncate" dir="ltr">{student.email}</p>
                </div>
                {isInOtherGroup && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">קבוצה אחרת</span>
                )}
                {isInThisGroup && (
                  <button
                    type="button"
                    onClick={() => sendSingleInvitation(student.id)}
                    disabled={sendingSingle === student.id}
                    title="שלח הזמנה לסטודנט זה בלבד"
                    className="shrink-0 p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-40"
                  >
                    {singleInviteResult[student.id] === "✓"
                      ? <span className="text-green-600 text-xs font-bold">✓</span>
                      : sendingSingle === student.id
                      ? <span className="text-xs">...</span>
                      : <Mail className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteStudent(student)}
                  title="מחק משתמש"
                  className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {allStudents.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">אין סטודנטים במערכת</p>
          )}
        </div>

        <button
          onClick={saveAssignments}
          disabled={savingAssign}
          className="mt-4 flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {savedAssign ? (
            <><CheckCircle className="w-4 h-4" /> נשמר!</>
          ) : (
            <><Save className="w-4 h-4" /> {savingAssign ? "שומר..." : "שמור שיוכים"}</>
          )}
        </button>
      </div>
    </div>
  );
}
