import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function generateTimeSlots(startHour: number = 8, endHour: number = 20, intervalMinutes: number = 60): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`;
    slots.push(time);
  }
  return slots;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider_id = searchParams.get("provider_id");
  const date = searchParams.get("date");
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  if (!provider_id) {
    return NextResponse.json({ error: "provider_id required" }, { status: 400 });
  }

  if (date) {
    const { rows: availabilityRows } = await query(
      "SELECT * FROM provider_availability WHERE provider_id = $1 AND date = $2",
      [provider_id, date]
    );
    const availability = availabilityRows[0];

    const { rows: bookings } = await query(
      "SELECT scheduled_time FROM service_bookings WHERE provider_id = $1 AND scheduled_date = $2 AND status = $3",
      [provider_id, date, "confirmed"]
    );

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

    if (availability?.available_hours) {
      const availableHours = JSON.parse(availability.available_hours);
      return NextResponse.json({
        available: true,
        date,
        slots: availableSlots.map((time: string) => ({
          time,
          available: !bookedTimes.includes(time),
          reason: bookedTimes.includes(time) ? "booked" : null
        }))
      });
    }

    return NextResponse.json({
      available: true,
      date,
      slots: availableSlots
    });
  }

  if (start_date && end_date) {
    const { rows: availabilities } = await query(
      "SELECT * FROM provider_availability WHERE provider_id = $1 AND date >= $2 AND date <= $3 ORDER BY date",
      [provider_id, start_date, end_date]
    );

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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider_id, date, is_unavailable, available_hours, reason } = body;

    if (!provider_id || !date) {
      return NextResponse.json({ error: "provider_id and date required" }, { status: 400 });
    }

    let formattedHours: string | undefined;
    if (available_hours && typeof available_hours === "object") {
      formattedHours = JSON.stringify(available_hours);
    }

    const { rows: existingRows } = await query(
      "SELECT id FROM provider_availability WHERE provider_id = $1 AND date = $2",
      [provider_id, date]
    );
    const existing = existingRows[0];

    let result;
    if (existing) {
      const { rows } = await query(
        "UPDATE provider_availability SET is_unavailable = $1, available_hours = $2, reason = $3 WHERE id = $4 RETURNING *",
        [is_unavailable, available_hours, reason, existing.id]
      );
      result = rows[0];
    } else {
      const { rows } = await query(
        "INSERT INTO provider_availability (provider_id, date, is_unavailable, available_hours, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [provider_id, date, is_unavailable, available_hours, reason]
      );
      result = rows[0];
    }

    return NextResponse.json({ success: true, availability: result });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}