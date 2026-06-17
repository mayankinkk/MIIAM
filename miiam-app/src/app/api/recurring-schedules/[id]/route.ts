import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit, type RouteContext } from "@/lib/api-utils";

export const PATCH = withRateLimit(async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params!;
  const body = await request.json();
  const { status, end_date, next_delivery_date, delivery_time, delivery_address, payment_method } = body;

  const updateData: Record<string, string | null> = {};
  if (status) updateData.status = status;
  if (end_date !== undefined) updateData.end_date = end_date;
  if (next_delivery_date !== undefined) updateData.next_delivery_date = next_delivery_date;
  if (delivery_time !== undefined) updateData.delivery_time = delivery_time;
  if (delivery_address !== undefined) updateData.delivery_address = delivery_address;
  if (payment_method !== undefined) updateData.payment_method = payment_method;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("recurring_schedules")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
});

export const DELETE = withRateLimit(async function DELETE(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params!;

  const { error } = await supabase
    .from("recurring_schedules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
