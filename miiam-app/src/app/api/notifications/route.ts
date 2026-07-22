import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-utils";
import { createRouteLogger } from "@/lib/logger";
import { z } from "zod";

const logger = createRouteLogger("notifications");

const createNotificationSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  body: z.string().min(1, "Message body is required").max(1000, "Message must be at most 1000 characters"),
  data: z.record(z.string(), z.string()).optional(),
  type: z.enum(["general", "order", "promotion", "system"]).default("general"),
});

export const POST = withRateLimit(async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { user_id, title, body: message, data, type } = parsed.data;

    // Only allow creating notifications for self or admin
    if (user_id !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        title,
        body: message,
        type,
        data: data ? JSON.stringify(data) : null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logger.error({ err: error }, "Failed to create notification");
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    logger.error({ err: error }, "Notification API error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const GET = withRateLimit(async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    // Users can only read their own notifications; admins can read any
    if (userId && userId !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const targetUserId = userId || user.id;

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error({ err: error }, "Failed to fetch notifications");
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    logger.error({ err: error }, "Notification fetch error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
