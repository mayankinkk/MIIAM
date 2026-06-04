import { NextRequest, NextResponse } from "next/server";
import { notifyPrintEvent, type PrintJobEvent } from "@/lib/print-notify";

const VALID_EVENTS: ReadonlySet<PrintJobEvent> = new Set([
  "print_started",
  "print_ready",
  "out_for_delivery",
  "delivered",
  "print_failed",
]);

export async function POST(req: NextRequest) {
  try {
    const { user_id, event, order_id } = await req.json();
    if (!user_id || !event || !order_id) {
      return NextResponse.json({ error: "user_id, event and order_id are required" }, { status: 400 });
    }
    if (!VALID_EVENTS.has(event as PrintJobEvent)) {
      return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }
    await notifyPrintEvent(user_id, event as PrintJobEvent, order_id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[print-notify-api] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
