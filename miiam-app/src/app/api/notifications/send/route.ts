import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, body: message, icon, actionUrl, type } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get user's push token from database
    const { data: userToken } = await supabase
      .from("user_push_tokens")
      .select("token")
      .eq("user_id", userId)
      .single();

    if (!userToken) {
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

    // For now, we'll use Firebase Admin SDK simulation
    // In production, you'd use firebase-admin to send push
    console.log(`[Push Notification] Sending to user ${userId}:`, { title, message });

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
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "User ID required" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // Get notification history
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ notifications: notifications || [] });
}