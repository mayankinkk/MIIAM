import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { 
      service_id, 
      user_id, 
      provider_id, 
      scheduled_date, 
      scheduled_time, 
      address,
      notes,
      total_amount
    } = await request.json();

    if (!service_id || !user_id || !provider_id || !scheduled_date || !scheduled_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { rows: existingRows } = await query(
      "SELECT id FROM service_bookings WHERE provider_id = $1 AND scheduled_date = $2 AND scheduled_time = $3 AND status = $4",
      [provider_id, scheduled_date, scheduled_time, "confirmed"]
    );
    const existingBooking = existingRows[0];

    if (existingBooking) {
      return NextResponse.json({ error: "Time slot already booked" }, { status: 409 });
    }

    const { rows } = await query(
      "INSERT INTO service_bookings (service_id, user_id, provider_id, scheduled_date, scheduled_time, address, notes, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [service_id, user_id, provider_id, scheduled_date, scheduled_time, address || null, notes || null, total_amount || null, "confirmed"]
    );
    const booking = rows[0];

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider_id = searchParams.get("provider_id");
  const date = searchParams.get("date");
  const user_id = searchParams.get("user_id");

  if (provider_id && date) {
    const { rows: bookings } = await query(
      "SELECT * FROM service_bookings WHERE provider_id = $1 AND scheduled_date = $2 AND status = $3",
      [provider_id, date, "confirmed"]
    );

    return NextResponse.json({ booked_slots: bookings || [] });
  }

  if (user_id) {
    const { rows: bookings } = await query(
      "SELECT sb.*, json_build_object('name', s.name, 'category', s.category) AS service FROM service_bookings sb LEFT JOIN services s ON s.id = sb.service_id WHERE sb.user_id = $1 ORDER BY sb.scheduled_date DESC",
      [user_id]
    );

    return NextResponse.json({ bookings });
  }

  const { rows: allBookings } = await query(
    "SELECT * FROM service_bookings ORDER BY created_at DESC LIMIT 50"
  );

  return NextResponse.json({ bookings: allBookings || [] });
}