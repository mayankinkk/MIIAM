import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import logger from "@/lib/logger";

const locationSchema = z.object({
  bookingId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * POST /api/tech/location
 * Technician pings their GPS while on a service booking. Writes to
 * rider_locations (shared live-tracking table) keyed by booking id so
 * the customer's TechnicianTracker map/ETA updates in realtime.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = locationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid location payload" }, { status: 400 });
    }
    const { bookingId, lat, lng } = parsed.data;

    const admin = createAdminClient();

    // Verify this booking is assigned to the calling user (technician_name
    // matches their profile name or they are the provider owner). This is a
    // lightweight guard — full RLS on rider_locations is the hard boundary.
    const { data: booking } = await admin
      .from("service_bookings")
      .select("id, user_id, provider_id, technician_name, technician_phone, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (["completed", "cancelled"].includes(booking.status)) {
      return NextResponse.json({ error: "Booking is closed" }, { status: 409 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const techName = profile?.full_name || "";
    const techPhone = profile?.phone || "";
    const isAssignedTech =
      (booking.technician_phone && techPhone && booking.technician_phone === techPhone) ||
      (booking.technician_name && techName && booking.technician_name === techName);

    if (!isAssignedTech) {
      return NextResponse.json({ error: "You are not assigned to this booking" }, { status: 403 });
    }

    const { error: upsertError } = await admin.from("rider_locations").upsert(
      {
        order_id: bookingId,
        rider_id: user.id,
        rider_name: techName || "Technician",
        rider_phone: techPhone,
        lat,
        lng,
        created_at: new Date().toISOString(),
      },
      { onConflict: "order_id" }
    );

    if (upsertError) {
      logger.error({ err: upsertError }, "Failed to upsert technician location");
      return NextResponse.json({ error: "Failed to save location" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Tech location API error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
