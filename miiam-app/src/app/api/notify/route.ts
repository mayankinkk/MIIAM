import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/security";
import { withRateLimit } from "@/lib/api-utils";
import { createRouteLogger } from "@/lib/logger";

const logger = createRouteLogger("notify");

async function sendFCMPush(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  const serverKey = process.env.FIREBASE_SERVER_KEY;
  if (!serverKey || tokens.length === 0) return;

  try {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${serverKey}`,
      },
      body: JSON.stringify({
        registration_ids: tokens,
        notification: { title, body, icon: "/icons/icon-192x192.png" },
        data: data || {},
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, body: text }, "FCM send failed");
    }
  } catch (err) {
    logger.error({ err }, "FCM push error");
  }
}

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

    // Send FCM push if tokens exist
    try {
      const { data: tokens } = await supabaseAdmin
        .from("push_tokens")
        .select("token")
        .eq("user_id", user_id)
        .eq("is_active", true);

      if (tokens && tokens.length > 0) {
        await sendFCMPush(
          tokens.map((t: { token: string }) => t.token),
          title,
          body || "",
          action_url ? { action_url } : undefined
        );
      }
    } catch {
      // push_tokens table may not exist yet — non-critical
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logger.error({ err: err }, "Notify API error");
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Internal error") }, { status: 500 });
  }
});
