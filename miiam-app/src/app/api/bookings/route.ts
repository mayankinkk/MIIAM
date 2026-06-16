import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  try {
    const {
      service_type,
      sub_service,
      user_name,
      user_phone,
      address,
      scheduled_date,
      scheduled_time,
      amount,
      notes,
      provider_id,
    } = await request.json();

    if (!service_type || !scheduled_date || !scheduled_time || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Always use authenticated user.id — never trust request body for user_id
    const user_id = user.id;

    // Check for conflicting bookings (same provider, date, time)
    if (provider_id) {
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
    }

    const { data: booking, error } = await supabase
      .from("service_bookings")
      .insert({
        service_type,
        sub_service: sub_service || null,
        user_id,
        user_name: user_name || "Customer",
        user_phone: user_phone || "",
        address,
        scheduled_date,
        scheduled_time,
        amount: amount || 0,
        provider_id: provider_id || null,
        notes: notes || null,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      console.error("Booking insert failed:", JSON.stringify({ code: error.code, message: error.message, details: error.details, hint: error.hint }));
      if (error.code === "23503") {
        return NextResponse.json({ error: "Your account profile is incomplete. Please contact support." }, { status: 400 });
      }
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ error: "Service bookings not available yet. Please try again later." }, { status: 503 });
      }
      return NextResponse.json({ error: error.message || "Booking failed" }, { status: 500 });
    }

    // Send booking confirmation email (best-effort)
    try {
      const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", user_id).single();
      if (profile?.email) {
        const { sendBookingConfirmationEmail } = await import("@/lib/email");
        await sendBookingConfirmationEmail({
          customerName: profile.full_name || user_name || "there",
          customerEmail: profile.email,
          serviceName: sub_service || service_type,
          date: scheduled_date,
          time: scheduled_time,
          address,
          total: amount || 0,
          bookingId: booking.id,
        });
      }
    } catch (emailErr) {
      console.warn("Failed to send booking confirmation email:", emailErr);
    }

    // Send in-app notification (best-effort)
    try {
      await supabase.from("notifications").insert({
        user_id,
        title: "Booking Confirmed ✓",
        message: `Your ${sub_service || service_type} booking is confirmed for ${scheduled_date} at ${scheduled_time}.`,
        type: "booking",
        read: false,
        created_at: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn("Failed to send booking notification:", notifErr);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking route error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ bookings: [] });
    }

    return NextResponse.json({ bookings });
  }

  // Only admins can list all bookings without a filter
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: allBookings } = await supabase
    .from("service_bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ bookings: allBookings || [] });
}
