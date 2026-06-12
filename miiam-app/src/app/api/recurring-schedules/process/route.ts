import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireCronAuth } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!(await requireCronAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const { data: schedules, error } = await supabase
    .from("recurring_schedules")
    .select("*")
    .eq("status", "active")
    .gte("next_delivery_date", startOfToday.toISOString())
    .lt("next_delivery_date", endOfToday.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      const items = schedule.items as Array<{
        menu_item_id: string;
        name: string;
        price: number;
        quantity: number;
        image_url?: string;
      }>;

      const vendorTotal = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0);

      const deliveryFee = 0;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: schedule.user_id,
          vendor_id: schedule.vendor_id,
          status: "scheduled",
          total_amount: vendorTotal,
          delivery_fee: deliveryFee,
          discount_amount: 0,
          payment_method: schedule.payment_method || "card",
          delivery_address: schedule.delivery_address,
          scheduled_delivery: schedule.delivery_time
            ? new Date(`${schedule.next_delivery_date.split("T")[0]}T${schedule.delivery_time.split(" - ")[0].trim()}`).toISOString()
            : schedule.next_delivery_date,
          placed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        errors.push(`Order creation failed for schedule ${schedule.id}: ${orderError.message}`);
        continue;
      }

      if (order) {
        const { error: itemsError } = await supabase.from("order_items").insert(
          items.map((i) => ({
            order_id: order.id,
            menu_item_id: i.menu_item_id,
            name: i.name,
            quantity: i.quantity,
            unit_price: i.price,
            price: i.price * i.quantity,
          }))
        );

        if (itemsError) {
          await supabase.from("orders").delete().eq("id", order.id);
          errors.push(`Order items failed for schedule ${schedule.id}: ${itemsError.message}`);
          continue;
        }

        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
          await fetch(`${appUrl}/api/emails/order-confirmation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id }),
          });
        } catch {
          // email failure is non-fatal
        }
      }

      const nextDate = calculateNextDeliveryDate(
        schedule.frequency,
        schedule.day_of_week,
        schedule.day_of_month,
        new Date(schedule.next_delivery_date)
      );

      const hasEndDate = schedule.end_date && nextDate > new Date(schedule.end_date);
      const newStatus = hasEndDate ? "completed" : "active";

      await supabase
        .from("recurring_schedules")
        .update({
          last_order_created_at: new Date().toISOString(),
          next_delivery_date: hasEndDate ? null : nextDate.toISOString(),
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", schedule.id);

      processed++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      errors.push(`Error processing schedule ${schedule.id}: ${msg}`);
    }
  }

  return NextResponse.json({ processed, errors: errors.length > 0 ? errors : undefined });
}

function calculateNextDeliveryDate(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  from?: Date
): Date {
  const next = from ? new Date(from) : new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);

  if (frequency === "daily") {
    return next;
  }

  if (frequency === "weekly" && dayOfWeek !== undefined) {
    const diff = (dayOfWeek - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + diff);
    return next;
  }

  if (frequency === "biweekly" && dayOfWeek !== undefined) {
    const diff = (dayOfWeek - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + diff + 14);
    return next;
  }

  if (frequency === "monthly" && dayOfMonth !== undefined) {
    next.setDate(1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(dayOfMonth, lastDay));
    if (next <= (from || new Date())) {
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const lastDayNext = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(dayOfMonth, lastDayNext));
    }
    return next;
  }

  return next;
}
