import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: addresses, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user_id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Address fetch error:", error);
    return NextResponse.json({ addresses: [] });
  }

  return NextResponse.json({ addresses: addresses || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { user_id, label, address, city, state, pincode, lat, lng, is_default } = body;

    if (!user_id || !label || !address || !city || !pincode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
        address,
        city,
        state: state || "",
        pincode,
        lat: lat || null,
        lng: lng || null,
        is_default: is_default || false,
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
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { id, user_id, label, address, city, state, pincode, lat, lng, is_default } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
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
        address,
        city,
        state: state || "",
        pincode,
        lat: lat || null,
        lng: lng || null,
        is_default: is_default || false,
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
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Address ID required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_addresses")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Address delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
