"use client";
import { useState, useRef } from "react";
import { Upload, ShieldCheck, Plus, Ban } from "lucide-react";

interface ApprovedEmailRow {
  id: string;
  email: string;
  status: string;
  source: string;
  approved_at: string;
  used_at: string | null;
}

interface Props {
  initialEmails: ApprovedEmailRow[];
}

export default function AdminApprovedEmails({ initialEmails }: Props) {
  const [emails, setEmails] = useState<ApprovedEmailRow[]>(initialEmails);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [addingEmail, setAddingEmail] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/import-approved", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.error) {
      setImportResult(`שגיאה: ${data.error}`);
    } else {
      setImportResult(`✓ נוספו ${data.imported} מיילים לרשימת המאושרים`);
      // Refresh list
      const listRes = await fetch("/api/admin/approved-emails");
      const listData = await listRes.json();
      if (listData.data) setEmails(listData.data);
    }

    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function addSingleEmail() {
    if (!newEmail.trim()) return;
    setAddingEmail(true);
    const res = await fetch("/api/admin/approved-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setNewEmail("");
      const listRes = await fetch("/api/admin/approved-emails");
      const listData = await listRes.json();
      if (listData.data) setEmails(listData.data);
    }
    setAddingEmail(false);
  }

  async function revokeEmail(id: string) {
    if (!confirm("לבטל גישה לאימייל זה?")) return;
    await fetch("/api/admin/approved-emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "revoked" }),
    });
    setEmails(emails.map(e => e.id === id ? { ...e, status: "revoked" } : e));
  }

  async function restoreEmail(id: string) {
    await fetch("/api/admin/approved-emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "active" }),
    });
    setEmails(emails.map(e => e.id === id ? { ...e, status: "active" } : e));
  }

  const statusLabel: Record<string, string> = {
    active: "ממתין",
    used: "פעיל",
    revoked: "בוטל",
    pending_link: "ממתין לאימות",
  };
  const statusColor: Record<string, string> = {
    active: "bg-blue-100 text-blue-700",
    used: "bg-green-100 text-green-700",
    revoked: "bg-red-100 text-red-600",
    pending_link: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-5">
      {/* CSV Import */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-brand-900 mb-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          ייבוא מיילים מאושרים מ-Smoove
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          ייצא קובץ CSV מ-Smoove עם עמודת Email והעלה אותו כאן. מיילים קיימים יישמרו ללא שינוי.
        </p>

        <div className="flex gap-3 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 border border-slate-300 hover:border-brand-400 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {importing ? "מייבא..." : "בחר קובץ CSV"}
          </button>
        </div>

        {importResult && (
          <div className={`mt-3 text-sm px-4 py-2 rounded-lg ${importResult.startsWith("שגיאה") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
            {importResult}
          </div>
        )}
      </div>

      {/* Add single email */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-brand-900 mb-3">הוספת מייל ידנית</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSingleEmail()}
            placeholder="email@example.com"
            className="input-he flex-1"
            dir="ltr"
          />
          <button
            onClick={addSingleEmail}
            disabled={addingEmail || !newEmail.trim()}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            הוסף
          </button>
        </div>
      </div>

      {/* Email list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-brand-900">רשימת מאושרים ({emails.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-900 text-white">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">אימייל</th>
                <th className="px-4 py-3 text-right font-semibold">סטטוס</th>
                <th className="px-4 py-3 text-right font-semibold">מקור</th>
                <th className="px-4 py-3 text-right font-semibold">אושר</th>
                <th className="px-4 py-3 text-right font-semibold">כניסה ראשונה</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {emails.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    אין מיילים מאושרים עדיין
                  </td>
                </tr>
              )}
              {emails.map((e, i) => (
                <tr key={e.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-4 py-3 text-slate-800 font-medium" dir="ltr">{e.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[e.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {statusLabel[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{e.source}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(e.approved_at).toLocaleDateString("he-IL")}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {e.used_at ? new Date(e.used_at).toLocaleDateString("he-IL") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {e.status === "revoked" ? (
                      <button
                        onClick={() => restoreEmail(e.id)}
                        className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                      >
                        שחזר
                      </button>
                    ) : e.status !== "used" && (
                      <button
                        onClick={() => revokeEmail(e.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="בטל גישה"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
