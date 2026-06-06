import { createClient } from "@/lib/supabase/server";

export type PrintJobEvent =
  | "print_started"
  | "print_ready"
  | "out_for_delivery"
  | "delivered"
  | "print_failed";

const EVENT_COPY: Record<PrintJobEvent, { title: string; body: string }> = {
  print_started: {
    title: "Printing started",
    body: "Your documents are now being printed.",
  },
  print_ready: {
    title: "Print ready",
    body: "Your documents are printed and waiting for the rider.",
  },
  out_for_delivery: {
    title: "Out for delivery",
    body: "Your prints are on the way. Track in the app.",
  },
  delivered: {
    title: "Delivered",
    body: "Your prints are delivered. Re-order any time from your order page.",
  },
  print_failed: {
    title: "Print issue",
    body: "We hit a snag printing your files. Support will reach out shortly.",
  },
};

export async function notifyPrintEvent(
  userId: string,
  event: PrintJobEvent,
  orderId: string
): Promise<void> {
  const supabase = await createClient();
  const copy = EVENT_COPY[event];
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title: copy.title,
    body: copy.body,
    type: `print_${event}`,
    action_url: `/app/orders/${orderId}`,
    read: false,
  });
  if (error) {
    console.error("[print-notify] insert error:", error);
    throw new Error(`Failed to create notification: ${error.message}`);
  }
}

export function getEventCopy(event: PrintJobEvent) {
  return EVENT_COPY[event];
}
