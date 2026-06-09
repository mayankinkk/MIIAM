import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

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

    const { data: existing } = await supabase
      .from("service_bookings")
      .select("id")
      .eq("provider_id", provider_id)
      .eq("scheduled_date", scheduled_date)
      .eq("scheduled_time", scheduled_time)
      .eq("status", "confirmed")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Time slot already booked" }, { status: 409 });
    }

    const { data: booking, error } = await supabase
      .from("service_bookings")
      .insert({
        service_id,
        user_id,
        provider_id,
        scheduled_date,
        scheduled_time,
        address: address || null,
        notes: notes || null,
        total_amount: total_amount || null,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) throw error;

    // Send booking confirmation email
    try {
      const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", user_id).single();
      const { data: service } = await supabase.from("services").select("name").eq("id", service_id).single();
      if (profile?.email) {
        const { sendBookingConfirmationEmail } = await import("@/lib/email");
        await sendBookingConfirmationEmail({
          customerName: profile.full_name || "there",
          customerEmail: profile.email,
          serviceName: service?.name || "Service",
          date: scheduled_date,
          time: scheduled_time,
          address: address || "",
          total: total_amount || 0,
          bookingId: booking.id,
        });
      }
    } catch (emailErr) {
      console.warn("Failed to send booking confirmation email:", emailErr);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const provider_id = searchParams.get("provider_id");
  const date = searchParams.get("date");
  const user_id = searchParams.get("user_id");

  if (provider_id && date) {
    const { data: bookings } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("provider_id", provider_id)
      .eq("scheduled_date", date)
      .eq("status", "confirmed");

    return NextResponse.json({ booked_slots: bookings || [] });
  }

  if (user_id) {
    if (user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { data: bookings, error } = await supabase
      .from("service_bookings")
      .select("*, service:services(name, category)")
      .eq("user_id", user_id)
      .order("scheduled_date", { ascending: false });

    if (error) {
      return NextResponse.json({ bookings: [] });
    }

    return NextResponse.json({ bookings });
  }

  const { data: allBookings } = await supabase
    .from("service_bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ bookings: allBookings || [] });
}
