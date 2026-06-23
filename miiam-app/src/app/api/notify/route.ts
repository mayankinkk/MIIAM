import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/security";
import { withRateLimit } from "@/lib/api-utils";

export const POST = withRateLimit(async function POST(req: NextRequest) {
  if (!checkCsrf(req)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can create notifications for other users
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = createAdminClient();

  try {
    const { user_id, title, body, type, action_url } = await req.json();

    if (!user_id || !title) {
      return NextResponse.json({ error: "user_id and title are required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id,
        title,
        body,
        type: type || "system",
        action_url: action_url || null,
        is_read: false,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Notify API error:", err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Internal error") }, { status: 500 });
  }
});
