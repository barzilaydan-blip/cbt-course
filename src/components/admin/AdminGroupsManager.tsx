"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Users, Trash2, Save, CheckCircle, Upload, FileUp, Mail } from "lucide-react";
import type { Group, Profile } from "@/types";

interface Props {
  initialGroups: Group[];
  students: Profile[];
}

interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profession?: string;
}

export default function AdminGroupsManager({ initialGroups, students }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingAssign, setSavingAssign] = useState<string | null>(null);
  const [savedAssign, setSavedAssign] = useState<string | null>(null);
  const [localAssignments, setLocalAssignments] = useState<Record<string, string | null>>(
    Object.fromEntries(students.map((s) => [s.id, s.group_id]))
  );
  const [sendingInvites, setSendingInvites] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<Record<string, string>>({});
  const [importGroupId, setImportGroupId] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function sendInvitations(groupId: string) {
    setSendingInvites(groupId);
    const res = await fetch("/api/admin/send-invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    const data = await res.json();
    if (data.error) {
      setInviteResult(prev => ({ ...prev, [groupId]: `שגיאה: ${data.error}` }));
    } else {
      setInviteResult(prev => ({ ...prev, [groupId]: `✓ נשלחו ${data.sent} הזמנות` }));
    }
    setSendingInvites(null);
  }

  async function runImport() {
    if (!importGroupId || importRows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    const res = await fetch("/api/admin/import-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: importRows, groupId: importGroupId }),
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

  async function createGroup() {
    if (!newGroupName.trim()) return;
    setCreating(true);
    const { data } = await supabase
      .from("groups")
      .insert({ name: newGroupName.trim(), is_active: true })
      .select()
      .single();
    if (data) setGroups([...groups, data as Group]);
    setNewGroupName("");
    setCreating(false);
    router.refresh();
  }

  async function toggleActive(group: Group) {
    await supabase.from("groups").update({ is_active: !group.is_active }).eq("id", group.id);
    setGroups(groups.map((g) => g.id === group.id ? { ...g, is_active: !g.is_active } : g));
  }

  async function deleteGroup(id: string) {
    if (!confirm("האם אתה בטוח? הסטודנטים יאבדו שיוך לקבוצה.")) return;
    await supabase.from("groups").delete().eq("id", id);
    setGroups(groups.filter((g) => g.id !== id));
    router.refresh();
  }

  async function saveAssignments(groupId: string) {
    setSavingAssign(groupId);
    const members = Object.entries(localAssignments)
      .filter(([, gid]) => gid === groupId)
      .map(([uid]) => uid);
    const nonMembers = Object.entries(localAssignments)
      .filter(([, gid]) => gid !== groupId)
      .map(([uid]) => uid);

    // Assign members
    if (members.length) {
      await supabase.from("profiles").update({ group_id: groupId }).in("id", members);
    }
    // Remove from this group (only those originally in this group)
    const wasInGroup = students.filter((s) => s.group_id === groupId).map((s) => s.id);
    const toRemove = wasInGroup.filter((id) => nonMembers.includes(id));
    if (toRemove.length) {
      await supabase.from("profiles").update({ group_id: null }).in("id", toRemove);
    }

    setSavingAssign(null);
    setSavedAssign(groupId);
    setTimeout(() => setSavedAssign(null), 2000);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Create group */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-brand-900 mb-4">יצירת קבוצה חדשה</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createGroup()}
            placeholder="למשל: מחזור א׳ 2026"
            className="input-he flex-1"
          />
          <button
            onClick={createGroup}
            disabled={creating || !newGroupName.trim()}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {creating ? "יוצר..." : "צור קבוצה"}
          </button>
        </div>
      </div>

      {/* Import CSV */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-brand-900 mb-1 flex items-center gap-2">
          <FileUp className="w-4 h-4" />
          ייבוא משתתפים מקובץ CSV
        </h2>
        <p className="text-xs text-slate-500 mb-4">עמודות נדרשות: שם פרטי, שם משפחה, כתובת מייל, טלפון, מקצוע</p>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <select
              value={importGroupId ?? ""}
              onChange={(e) => setImportGroupId(e.target.value || null)}
              className="input-he flex-1"
            >
              <option value="">בחר קבוצה לשיוך...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
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
            disabled={!importGroupId || importRows.length === 0 || importing}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 self-start"
          >
            <Users className="w-4 h-4" />
            {importing ? "מייבא..." : `ייבא ${importRows.length} משתתפים`}
          </button>
        </div>
      </div>

      {/* Groups list */}
      {groups.length === 0 && (
        <div className="text-center text-slate-400 py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          אין קבוצות עדיין — צור את הראשונה
        </div>
      )}

      {groups.map((group) => {
        const members = students.filter((s) => localAssignments[s.id] === group.id);

        return (
          <div key={group.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Group header */}
            <div className="flex items-center justify-between px-5 py-4 bg-brand-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-brand-500 text-white rounded-lg p-2">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-900">{group.name}</h3>
                  <p className="text-xs text-slate-500">{members.length} חברים</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {inviteResult[group.id] && (
                  <span className="text-xs text-green-600 font-medium">{inviteResult[group.id]}</span>
                )}
                <button
                  onClick={() => sendInvitations(group.id)}
                  disabled={sendingInvites === group.id}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  title="שלח הזמנה לכל חברי הקבוצה"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {sendingInvites === group.id ? "שולח..." : "שלח הזמנות"}
                </button>
                <button
                  onClick={() => toggleActive(group)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    group.is_active
                      ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                      : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {group.is_active ? "פעיל" : "לא פעיל"}
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1.5"
                  title="מחק קבוצה"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Student assignment */}
            <div className="p-5">
              <p className="text-sm font-semibold text-slate-600 mb-3">שייך סטודנטים לקבוצה:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.map((student) => {
                  const isInThisGroup = localAssignments[student.id] === group.id;
                  const isInOtherGroup =
                    localAssignments[student.id] && localAssignments[student.id] !== group.id;

                  return (
                    <label
                      key={student.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isInThisGroup
                          ? "border-brand-300 bg-brand-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isInThisGroup}
                        onChange={(e) => {
                          setLocalAssignments((prev) => ({
                            ...prev,
                            [student.id]: e.target.checked ? group.id : null,
                          }));
                        }}
                        className="accent-brand-500 w-4 h-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">
                          {student.name || "—"}
                        </p>
                        <p className="text-xs text-slate-400 truncate" dir="ltr">{student.email}</p>
                      </div>
                      {isInOtherGroup && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                          קבוצה אחרת
                        </span>
                      )}
                    </label>
                  );
                })}
                {students.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">אין סטודנטים במערכת</p>
                )}
              </div>

              <button
                onClick={() => saveAssignments(group.id)}
                disabled={savingAssign === group.id}
                className="mt-4 flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {savedAssign === group.id ? (
                  <><CheckCircle className="w-4 h-4" /> נשמר!</>
                ) : (
                  <><Save className="w-4 h-4" /> {savingAssign === group.id ? "שומר..." : "שמור שיוכים"}</>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
