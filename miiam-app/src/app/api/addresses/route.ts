import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit, checkCsrf } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";
import { z } from "zod";

const logger = createRouteLogger("addresses");

const addressSchema = z.object({
  user_id: z.string().uuid(),
  label: z.string().min(1).max(50),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().max(100).optional().default(""),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  is_default: z.boolean().optional().default(false),
  phone: z.string().max(15).optional().nullable(),
});

type AddressInput = z.infer<typeof addressSchema>;

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
      logger.error({ err: error }, "Address fetch error");
      return NextResponse.json({ addresses: [] });
    }

    return NextResponse.json({ addresses: addresses || [] });
  } catch (err) {
    logger.error({ err }, "Addresses GET error");
    return NextResponse.json({ addresses: [], error: "Failed to load addresses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { user_id, label, address, city, state, pincode, lat, lng, is_default, phone } = parsed.data;

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
        state,
        pincode,
        lat: lat || null,
        lng: lng || null,
        is_default,
        phone: phone || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, address: addressData });
  } catch (error) {
    logger.error({ err: error }, "Address create error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const updateSchema = addressSchema.extend({ id: z.string().uuid() });
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { id, user_id, label, address, city, state, pincode, lat, lng, is_default, phone } = parsed.data;

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
        state,
        pincode,
        lat: lat || null,
        lng: lng || null,
        is_default,
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
    logger.error({ err: error }, "Address update error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

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
    logger.error({ err: error }, "Address delete error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
