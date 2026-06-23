import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!await checkIpRateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: addresses, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Address fetch error:", error);
      return NextResponse.json({ addresses: [] });
    }

    return NextResponse.json({ addresses: addresses || [] });
  } catch (err) {
    console.error("Addresses GET error:", err);
    return NextResponse.json({ addresses: [], error: "Failed to load addresses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { user_id, label, address, city, state, pincode, lat, lng, is_default, phone } = body;

    if (!user_id || !label || !address || !city || !pincode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (is_default) {
      await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", user_id);
    }

    const { data: addressData, error } = await supabase
      .from("user_addresses")
      .insert({
        user_id,
        label,
        address_line1: address,
        city,
        state: state || "",
        pincode,
        lat: lat || null,
        lng: lng || null,
        is_default: is_default || false,
        phone: phone || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, address: addressData });
  } catch (error) {
    console.error("Address error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, user_id, label, address, city, state, pincode, lat, lng, is_default, phone } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
    }

    // Verify the address belongs to the authenticated user
    const { data: existingAddress } = await supabase
      .from("user_addresses")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();
    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    if (existingAddress.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (is_default && user_id) {
      await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", user_id);
    }

    const { data: addressData, error } = await supabase
      .from("user_addresses")
      .update({
        label,
        address_line1: address,
        city,
        state: state || "",
        pincode,
        lat: lat || null,
        lng: lng || null,
        is_default: is_default || false,
        phone: phone || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!addressData) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, address: addressData });
  } catch (error) {
    console.error("Address update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Address ID required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Address delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
