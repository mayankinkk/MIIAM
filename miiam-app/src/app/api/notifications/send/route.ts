import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@miiam.in",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

async function sendWebPush(subscription: webpush.PushSubscription, payload: string) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  try {
    await webpush.sendNotification(subscription, payload);
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      // Subscription expired or unsubscribed — will be cleaned up by caller
      throw err;
    }
    console.error("Push send error:", err);
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can send notifications to other users
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, title, body: message, icon, actionUrl, type } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user's push subscriptions from database
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) {
      // Store notification for later delivery
      await supabase.from("pending_notifications").insert({
        user_id: userId,
        title,
        message,
        icon,
        action_url: actionUrl,
        type,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Notification queued for later delivery",
      });
    }

    // Send real push notification to all subscriptions
    const pushPayload = JSON.stringify({
      title,
      body: message,
      icon: icon || "/icons/icon-192.svg",
      url: actionUrl || "/",
      actions: [{ action: actionUrl || "/", title: "View" }],
    });

    for (const sub of subscriptions) {
      try {
        await sendWebPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          pushPayload
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // Remove expired subscription
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    // Store notification in database for history
    await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      icon,
      action_url: actionUrl,
      type,
      read: false,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = await createClient();
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId || userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get notification history
  const { data: notifications } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ notifications: notifications || [] });
}