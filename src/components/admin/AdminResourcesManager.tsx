"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, Trash2, Eye, EyeOff, Plus, Link, ExternalLink } from "lucide-react";
import type { Resource, Module, ResourceCategory } from "@/types";
import { RESOURCE_CATEGORIES } from "@/types";

interface Props {
  initialResources: Resource[];
  modules: Pick<Module, "id" | "order_number" | "title_he">[];
}

export default function AdminResourcesManager({ initialResources, modules }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Form state
  const [inputMode, setInputMode] = useState<"file" | "link">("link");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("שאלונים");
  const [moduleId, setModuleId] = useState("");
  const [showForm, setShowForm] = useState(false);

  function resetForm() {
    setFile(null);
    setLinkUrl("");
    setTitle("");
    setDescription("");
    setCategory("שאלונים");
    setModuleId("");
    setInputMode("link");
    setShowForm(false);
    setUploadError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (inputMode === "link" && !linkUrl.trim()) return;
    if (inputMode === "file" && !file) return;

    setUploading(true);
    setUploadError("");

    try {
      let fileUrl: string;
      let fileName: string | null = null;
      let fileType: string | null = null;

      if (inputMode === "link") {
        fileUrl = linkUrl.trim();
        fileType = "link";
      } else {
        const ext = file!.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `${Date.now()}_${file!.name.replace(/\s+/g, "_")}`;

        const { error: uploadErr } = await supabase.storage
          .from("resources")
          .upload(path, file!, { cacheControl: "3600", upsert: false });

        if (uploadErr) throw new Error(uploadErr.message);

        const { data: urlData } = supabase.storage.from("resources").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file!.name;
        fileType = ext;
      }

      const { data: newResource, error: insertErr } = await supabase
        .from("resources")
        .insert({
          title_he: title.trim(),
          description_he: description.trim() || null,
          category,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          module_id: moduleId || null,
          is_published: true,
        })
        .select()
        .single();

      if (insertErr) throw new Error(insertErr.message);

      setResources([newResource as Resource, ...resources]);
      resetForm();
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "שגיאה בהוספה");
    } finally {
      setUploading(false);
    }
  }

  async function togglePublish(res: Resource) {
    await supabase.from("resources").update({ is_published: !res.is_published }).eq("id", res.id);
    setResources(resources.map((r) => r.id === res.id ? { ...r, is_published: !r.is_published } : r));
  }

  async function deleteResource(res: Resource) {
    if (!confirm(`מחק "${res.title_he}"?`)) return;
    // Only delete from storage if it's an uploaded file (not a link)
    if (res.file_type !== "link" && res.file_url) {
      const path = res.file_url.split("/resources/").pop();
      if (path) await supabase.storage.from("resources").remove([path]);
    }
    await supabase.from("resources").delete().eq("id", res.id);
    setResources(resources.filter((r) => r.id !== res.id));
  }

  const moduleMap = new Map(modules.map((m) => [m.id, m]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{resources.length} משאבים במאגר</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          הוסף משאב חדש
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-brand-900 mb-5">הוספת משאב חדש</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Category + Title */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">קטגוריה</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                  className="input-he"
                >
                  {RESOURCE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">כותרת (עברית)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="שם המשאב"
                  required
                  className="input-he"
                />
              </div>
            </div>

            {/* Input mode toggle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">סוג הוספה</label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden w-fit">
                <button
                  type="button"
                  onClick={() => { setInputMode("link"); setFile(null); }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    inputMode === "link"
                      ? "bg-brand-500 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Link className="w-4 h-4" />
                  קישור (Drive / YouTube)
                </button>
                <button
                  type="button"
                  onClick={() => { setInputMode("file"); setLinkUrl(""); }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors border-r border-slate-200 ${
                    inputMode === "file"
                      ? "bg-brand-500 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  העלאת קובץ
                </button>
              </div>
            </div>

            {/* URL or File input */}
            {inputMode === "link" ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  קישור (Google Drive, YouTube, Dropbox...)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  required
                  dir="ltr"
                  className="input-he"
                />
                <p className="text-xs text-slate-400 mt-1">הקובץ נשאר בדרייב — לא מועלה לשרת</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">קובץ (PDF / Word / PPT / EPUB)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.epub,.mp3,.wav"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                  className="block w-full text-sm text-slate-600 file:me-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold hover:file:bg-brand-100 cursor-pointer"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">תיאור (אופציונלי)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="תיאור קצר..."
                className="input-he resize-none"
              />
            </div>

            {/* Module */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">שייך למפגש (אופציונלי)</label>
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="input-he">
                <option value="">— כללי, לא משויך למפגש —</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>מפגש {m.order_number}: {m.title_he}</option>
                ))}
              </select>
            </div>

            {uploadError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{uploadError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={uploading || !title.trim() || (inputMode === "link" ? !linkUrl.trim() : !file)}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                {inputMode === "link" ? <Link className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {uploading ? "שומר..." : "שמור"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resources list */}
      {resources.length === 0 && (
        <div className="text-center text-slate-400 py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          אין משאבים עדיין — הוסף את הראשון
        </div>
      )}

      <div className="grid gap-3">
        {resources.map((res) => {
          const isLink = res.file_type === "link";
          return (
            <div
              key={res.id}
              className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={`rounded-lg p-2 shrink-0 text-center min-w-[52px] ${isLink ? "bg-brand-50" : "bg-slate-100"}`}>
                {isLink
                  ? <ExternalLink className="w-4 h-4 text-brand-500 mx-auto" />
                  : <p className="text-xs font-bold text-slate-600 uppercase">{res.file_type ?? "??"}</p>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{res.title_he}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-400">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full">{res.category}</span>
                  {isLink && <span className="bg-brand-50 text-brand-500 px-2 py-0.5 rounded-full">קישור</span>}
                  {res.module_id && moduleMap.get(res.module_id) && (
                    <span className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                      מפגש {moduleMap.get(res.module_id)!.order_number}
                    </span>
                  )}
                  {!isLink && res.file_name && <span className="truncate">{res.file_name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublish(res)}
                  title={res.is_published ? "הסתר מסטודנטים" : "פרסם לסטודנטים"}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    res.is_published
                      ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                      : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {res.is_published ? <><Eye className="w-3.5 h-3.5" /> פורסם</> : <><EyeOff className="w-3.5 h-3.5" /> טיוטה</>}
                </button>
                <button
                  onClick={() => deleteResource(res)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1.5"
                  title="מחק"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
