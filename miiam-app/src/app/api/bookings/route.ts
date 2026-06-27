import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit, checkCsrf } from "@/lib/security";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

// Auto-creates the service_bookings table via Supabase Management API
// Called when the insert returns a 42P01 "table does not exist" error
async function createServiceBookingsTable(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabasePAT = process.env.SUPABASE_PERSONAL_ACCESS_TOKEN ?? "";
    // Extract project ref: https://PROJECTREF.supabase.co
    const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

    if (!projectRef || !supabasePAT) {
      console.error("[bookings] Cannot auto-create table: missing env vars (need SUPABASE_PERSONAL_ACCESS_TOKEN)");
      return false;
    }

    const DDL = `
      CREATE TABLE IF NOT EXISTS service_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        service_type VARCHAR(50) NOT NULL,
        sub_service VARCHAR(100),
        user_name VARCHAR(100) NOT NULL,
        user_phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        scheduled_date DATE NOT NULL,
        scheduled_time VARCHAR(20) NOT NULL,
        status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
        amount DECIMAL(10, 2) NOT NULL,
        provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        provider_name VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
      ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Service bookings user access" ON service_bookings;
      CREATE POLICY "Service bookings user access" ON service_bookings FOR ALL USING (auth.uid() = user_id OR auth.uid() = provider_id);
      NOTIFY pgrst, 'reload schema';
    `;

    // Supabase Management API requires a Personal Access Token (PAT), not the service role key
    const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabasePAT}`,
      },
      body: JSON.stringify({ query: DDL }),
    });

    if (mgmtRes.ok) {
      console.log("[bookings] Table created via Management API");
      return true;
    }

    // Fall back: try the pg REST endpoint (only works on some Supabase configs)
    console.warn("[bookings] Management API returned", mgmtRes.status, "- table auto-create failed");
    return false;
  } catch (err) {
    console.error("[bookings] Auto-create table error:", err);
    return false;
  }
}

async function insertBooking(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown>) {
  return supabase.from("service_bookings").insert(payload).select().single();
}

export async function POST(request: NextRequest) {
  try {
    if (!checkCsrf(request)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const ip = getClientIp(request);
    if (!await checkIpRateLimit(ip, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();

    const body = await request.json();
    const { service_type, sub_service, user_name, user_phone, address, scheduled_date, scheduled_time, amount, notes, provider_id } = body;

    if (!service_type || !scheduled_date || !scheduled_time || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user_id = user.id;
    const payload = {
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
    };

    // Check for conflicting bookings
    if (provider_id && provider_id !== "null") {
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

    let { data: booking, error } = await insertBooking(supabase, payload);

    // If table is missing, auto-create it and retry once
    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      console.warn("[bookings] service_bookings table missing — attempting auto-create...");
      const created = await createServiceBookingsTable();
      if (created) {
        // Retry the insert after table creation
        const retry = await insertBooking(supabase, payload);
        booking = retry.data;
        error = retry.error;
      } else {
        return NextResponse.json(
          { error: "Service bookings are being set up. Please try again in 30 seconds." },
          { status: 503 }
        );
      }
    }

    if (error) {
      console.error("[bookings] Insert failed:", JSON.stringify({ code: error.code, message: error.message, details: error.details, hint: error.hint }));
      if (error.code === "23503") {
        return NextResponse.json({ error: "Account profile incomplete. Please update your profile first." }, { status: 400 });
      }
      if (error.code === "23514") {
        return NextResponse.json({ error: "Invalid booking data." }, { status: 400 });
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
          bookingId: booking!.id,
        });
      }
    } catch (emailErr) {
      console.warn("[bookings] Email failed:", emailErr);
    }

    // Send in-app notification (best-effort)
    try {
      await supabase.from("notifications").insert({
        user_id,
        title: "Booking Confirmed ✓",
        body: `Your ${sub_service || service_type} booking is confirmed for ${scheduled_date} at ${scheduled_time}.`,
        type: "booking",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn("[bookings] Notification failed:", notifErr);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("[/api/bookings POST] Unhandled error:", error instanceof Error ? error.stack : String(error));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!await checkIpRateLimit(ip, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const provider_id = searchParams.get("provider_id");
    const date = searchParams.get("date");

    if (provider_id && date) {
      const { data: bookings } = await supabase
        .from("service_bookings")
        .select("*")
        .eq("provider_id", provider_id)
        .eq("scheduled_date", date)
        .eq("status", "confirmed");
      return NextResponse.json({ booked_slots: bookings || [] });
    }

    const { data: userBookings, error: userError } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (userError) {
      // Table doesn't exist yet — return empty gracefully
      if (userError.code === "42P01") return NextResponse.json({ bookings: [] });
      return NextResponse.json({ bookings: [] });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ bookings: userBookings || [] });
    }

    const { data: allBookings } = await supabase
      .from("service_bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ bookings: allBookings || [] });
  } catch (error) {
    console.error("[/api/bookings GET] Unhandled error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ bookings: [] });
  }
}
