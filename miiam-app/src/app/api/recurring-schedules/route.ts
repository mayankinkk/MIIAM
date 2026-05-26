import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("recurring_schedules")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { vendor_id, frequency, day_of_week, day_of_month, delivery_time, delivery_address, payment_method, items, start_date, end_date } = body;

  if (!vendor_id || !frequency || !items || items.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const nextDate = calculateNextDeliveryDate(frequency, day_of_week, day_of_month, start_date ? new Date(start_date) : new Date());

  const { data, error } = await supabase
    .from("recurring_schedules")
    .insert({
      user_id: user.id,
      vendor_id,
      status: "active",
      frequency,
      day_of_week,
      day_of_month,
      delivery_time,
      delivery_address,
      payment_method,
      items,
      next_delivery_date: nextDate.toISOString(),
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

function calculateNextDeliveryDate(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  from: Date = new Date()
): Date {
  const next = new Date(from);
  next.setHours(0, 0, 0, 0);

  if (frequency === "daily") {
    return next;
  }

  if (frequency === "weekly" && dayOfWeek !== undefined) {
    const diff = (dayOfWeek - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + diff);
    if (diff === 0) next.setDate(next.getDate() + 7);
    return next;
  }

  if (frequency === "biweekly" && dayOfWeek !== undefined) {
    const diff = (dayOfWeek - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + diff + 7);
    return next;
  }

  if (frequency === "monthly" && dayOfMonth !== undefined) {
    const targetDay = Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate());
    next.setDate(targetDay);
    if (next <= from) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    }
    return next;
  }

  return next;
}
