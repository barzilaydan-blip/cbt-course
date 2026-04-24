import { createServiceClient } from "@/lib/supabase/service";
import AdminCourseSettings from "@/components/admin/AdminCourseSettings";
import type { CourseSettings } from "@/types";

export default async function AdminSettingsPage() {
  const service = createServiceClient();
  const { data: settings } = await service.from("course_settings").select("*").eq("id", 1).maybeSingle();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-900">הגדרות קורס</h1>
        <p className="text-slate-500 mt-1 text-sm">קישורי Zoom, סילבוס ולוח זמנים קבוע</p>
      </div>
      <AdminCourseSettings settings={settings as CourseSettings | null} />
    </div>
  );
}
