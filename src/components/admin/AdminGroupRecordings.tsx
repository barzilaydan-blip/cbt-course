"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, CheckCircle, Video, Eye, EyeOff } from "lucide-react";

interface ModuleRow {
  id: string;
  order_number: number;
  title_he: string;
}

interface Props {
  groupId: string;
  modules: ModuleRow[];
  /** module_id -> current video_url for this group */
  existing: Record<string, string>;
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}

export default function AdminGroupRecordings({ groupId, modules, existing }: Props) {
  const supabase = createClient();
  const [values, setValues] = useState<Record<string, string>>(existing);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  async function save(moduleId: string) {
    setSaving(moduleId);
    const url = toEmbedUrl((values[moduleId] ?? "").trim());
    if (url) {
      await supabase.from("group_module_videos").upsert(
        { group_id: groupId, module_id: moduleId, video_url: url },
        { onConflict: "group_id,module_id" }
      );
    } else {
      await supabase.from("group_module_videos").delete().eq("group_id", groupId).eq("module_id", moduleId);
    }
    setSaving(null);
    setSaved(moduleId);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 flex items-center gap-2">
        <Video className="w-4 h-4 shrink-0" aria-hidden="true" />
        הקלטת המפגש החי של הקבוצה הזו, לכל מפגש בנפרד — מעלים אחרי שהמפגש מתקיים. אפשר להדביק URL רגיל או קוד הטמעה מלא (למשל מ-Vimeo).
      </p>

      <div className="surface divide-y divide-slate-100 overflow-hidden">
        {modules.map((mod) => (
          <div key={mod.id} className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                {mod.order_number}
              </span>
              <span className="font-semibold text-slate-900 text-sm">{mod.title_he}</span>
            </div>
            <div className="flex gap-2 items-start">
              <textarea
                rows={2}
                value={values[mod.id] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [mod.id]: e.target.value }))}
                placeholder="https://... או קוד הטמעה מלא"
                className="input-he flex-1 resize-none font-mono text-xs"
                dir="ltr"
              />
              <button
                onClick={() => setPreviewing((prev) => (prev === mod.id ? null : mod.id))}
                disabled={!(values[mod.id] ?? "").trim()}
                title="צפה בסרטון — כך תראה מנהל/ת את מה שהסטודנטים רואים"
                className="shrink-0 flex items-center gap-1.5 border border-slate-300 hover:border-brand-400 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {previewing === mod.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {previewing === mod.id ? "הסתר" : "תצוגה מקדימה"}
              </button>
              <button
                onClick={() => save(mod.id)}
                disabled={saving === mod.id}
                className="shrink-0 flex items-center gap-1.5 bg-brand-500 hover:bg-brand-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saved === mod.id ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving === mod.id ? "שומר..." : saved === mod.id ? "נשמר" : "שמור"}
              </button>
            </div>

            {previewing === mod.id && (() => {
              const embed = toEmbedUrl((values[mod.id] ?? "").trim());
              if (!embed) return null;
              return (
                <div className="bg-slate-900 rounded-lg overflow-hidden">
                  {embed.trimStart().startsWith("<") ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: embed }}
                      className="w-full [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:h-auto"
                    />
                  ) : (
                    <div className="aspect-video">
                      <iframe
                        src={embed}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
        {modules.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">אין מפגשים עדיין</p>
        )}
      </div>
    </div>
  );
}
