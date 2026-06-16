import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyPrintEvent, type PrintJobEvent } from "@/lib/print-notify";
import { withRateLimit } from "@/lib/api-utils";

const VALID_EVENTS: ReadonlySet<PrintJobEvent> = new Set([
  "print_started",
  "print_ready",
  "out_for_delivery",
  "delivered",
  "print_failed",
]);

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_id, event, order_id } = await req.json();
    if (!user_id || !event || !order_id) {
      return NextResponse.json({ error: "user_id, event and order_id are required" }, { status: 400 });
    }
    if (!VALID_EVENTS.has(event as PrintJobEvent)) {
      return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }

    // Only allow sending notifications to the authenticated user
    // (In production, admin/vendor roles should bypass this check)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    if (!isAdmin && user.id !== user_id) {
      return NextResponse.json({ error: "Cannot send notifications to other users" }, { status: 403 });
    }

    await notifyPrintEvent(user_id, event as PrintJobEvent, order_id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[print-notify-api] error:", err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Server error") }, { status: 500 });
  }
});
