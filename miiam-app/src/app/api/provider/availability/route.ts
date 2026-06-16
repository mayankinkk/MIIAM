import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/api-utils";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

function generateTimeSlots(startHour: number = 8, endHour: number = 20, intervalMinutes: number = 60): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`;
    slots.push(time);
  }
  return slots;
}

export const GET = withRateLimit(async function GET(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const provider_id = searchParams.get("provider_id");
  const date = searchParams.get("date");
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  if (!provider_id) {
    return NextResponse.json({ error: "provider_id required" }, { status: 400 });
  }

  if (date) {
    const { data: availability } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", provider_id)
      .eq("date", date)
      .maybeSingle();

    const { data: bookings } = await supabase
      .from("service_bookings")
      .select("scheduled_time")
      .eq("provider_id", provider_id)
      .eq("scheduled_date", date)
      .eq("status", "confirmed");

    const bookedTimes = (bookings || []).map(b => b.scheduled_time);
    const allSlots = generateTimeSlots();

    const availableSlots = allSlots.map(time => ({
      time,
      available: !bookedTimes.includes(time),
      reason: bookedTimes.includes(time) ? "booked" : null
    }));

    if (availability?.is_unavailable) {
      return NextResponse.json({
        available: false,
        reason: availability.reason || "Not available",
        slots: []
      });
    }

    return NextResponse.json({
      available: true,
      date,
      slots: availableSlots
    });
  }

  if (start_date && end_date) {
    const { data: availabilities } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", provider_id)
      .gte("date", start_date)
      .lte("date", end_date)
      .order("date");

    const days: Record<string, any> = {};
    const currentDate = new Date(start_date);
    const end = new Date(end_date);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayAvail = (availabilities || []).find((a: any) => a.date === dateStr);
      
      days[dateStr] = {
        available: !dayAvail?.is_unavailable,
        reason: dayAvail?.reason || null,
        slots: dayAvail?.is_unavailable ? [] : generateTimeSlots()
      };
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({ availability: days });
  }

  return NextResponse.json({ error: "date or start_date/end_date required" }, { status: 400 });
});

export const POST = withRateLimit(async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { provider_id, date, is_unavailable, available_hours, reason } = body;

    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("id", provider_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!provider) {
      return NextResponse.json({ error: "Provider not found or unauthorized" }, { status: 403 });
    }

    if (!provider_id || !date) {
      return NextResponse.json({ error: "provider_id and date required" }, { status: 400 });
    }

    let formattedHours: string | undefined;
    if (available_hours && typeof available_hours === "object") {
      formattedHours = JSON.stringify(available_hours);
    }

    const { data: existing } = await supabase
      .from("provider_availability")
      .select("id")
      .eq("provider_id", provider_id)
      .eq("date", date)
      .maybeSingle();

    let result;
    if (existing) {
      const { data } = await supabase
        .from("provider_availability")
        .update({
          is_unavailable,
          available_hours,
          reason,
        })
        .eq("id", existing.id)
        .select()
        .single();
      result = data;
    } else {
      const { data } = await supabase
        .from("provider_availability")
        .insert({
          provider_id,
          date,
          is_unavailable,
          available_hours,
          reason,
        })
        .select()
        .single();
      result = data;
    }

    return NextResponse.json({ success: true, availability: result });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
