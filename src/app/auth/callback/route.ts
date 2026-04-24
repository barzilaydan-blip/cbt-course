import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=oauth_failed`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Step 1: Exchange OAuth code for session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/?error=oauth_failed`);
  }

  // Step 2: Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?error=oauth_failed`);
  }

  const normalizedEmail = user.email.toLowerCase();
  const service = createServiceClient();

  // Step 3: Check whitelist
  const { data: entry } = await service
    .from("approved_emails")
    .select("id, status, linked_user_id")
    .eq("email", normalizedEmail)
    .in("status", ["active", "used"])
    .maybeSingle();

  // Not on whitelist → deny
  if (!entry) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?error=not_approved`);
  }

  // Email already linked to a DIFFERENT Google account → deny
  if (
    entry.status === "used" &&
    entry.linked_user_id !== null &&
    entry.linked_user_id !== user.id
  ) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?error=account_mismatch`);
  }

  // First login — mark as used and ensure profile exists
  if (entry.status === "active") {
    await service.rpc("mark_approved_email_used", {
      p_email: normalizedEmail,
      p_user_id: user.id,
    });
    await service.from("profiles").upsert(
      {
        id: user.id,
        email: normalizedEmail,
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        role: "student",
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  // Returning user or first login — allow
  return NextResponse.redirect(`${origin}/dashboard`);
}
