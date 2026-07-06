import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireCronAuth } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";

async function activateScheduledOrders() {
  const logger = createRouteLogger("orders/activate-scheduled");
  const supabase = createAdminClient();

  const now = new Date().toISOString();

  const { data: scheduledOrders, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "scheduled")
    .lt("scheduled_delivery", now);

  if (fetchError) {
    logger.error({ err: fetchError }, "Failed to fetch scheduled orders");
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!scheduledOrders || scheduledOrders.length === 0) {
    return NextResponse.json({ message: "No scheduled orders to activate", activated: 0 });
  }

  let activatedCount = 0;
  const activatedOrderIds: string[] = [];

  for (const order of scheduledOrders) {
    const scheduledTime = new Date(order.scheduled_delivery).getTime();
    const activateTime = scheduledTime - 60 * 60 * 1000;

    if (activateTime <= Date.now()) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "pending" })
        .eq("id", order.id);

      if (!updateError) {
        activatedCount++;
        activatedOrderIds.push(order.id);
        logger.info("Activated order " + order.id);
      }
    }
  }

  if (activatedOrderIds.length > 0) {
    const notificationsToInsert = activatedOrderIds.map(orderId => {
      const order = scheduledOrders.find(o => o.id === orderId);
      return {
        user_id: order?.user_id,
        title: "Order Being Activated!",
        body: "Your scheduled order is now visible to riders.",
        type: "order_activated",
      };
    });
    await supabase.from("notifications").insert(notificationsToInsert);
  }

  return NextResponse.json({
    message: `Activated ${activatedCount} scheduled orders`,
    activated: activatedCount,
  });
}

export async function POST(request: NextRequest) {
  const logger = createRouteLogger("orders/activate-scheduled");
  if (!(await requireCronAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return await activateScheduledOrders();
  } catch (error: unknown) {
    logger.error({ err: error }, "Error activating scheduled orders");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const logger = createRouteLogger("orders/activate-scheduled");
  if (!(await requireCronAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return await activateScheduledOrders();
  } catch (error: unknown) {
    logger.error({ err: error }, "Error activating scheduled orders");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
