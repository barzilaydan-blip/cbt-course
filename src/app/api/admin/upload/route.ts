import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string | null;
    const moduleId = formData.get("module_id") as string | null;

    if (!file || !title || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: storageErr } = await supabase.storage
      .from("resources")
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (storageErr) {
      return NextResponse.json({ error: storageErr.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("resources").getPublicUrl(path);

    const { data: resource, error: dbErr } = await supabase
      .from("resources")
      .insert({
        title_he: title,
        description_he: description || null,
        category,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: ext,
        module_id: moduleId || null,
        is_published: false,
      })
      .select()
      .single();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ resource });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
