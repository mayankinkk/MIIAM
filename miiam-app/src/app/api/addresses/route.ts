import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const { rows: addresses } = await query(
    "SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
    [user_id]
  );

  return NextResponse.json({ addresses: addresses || [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, label, address, city, state, pincode, lat, lng, is_default } = body;

    if (!user_id || !label || !address || !city || !pincode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (is_default) {
      await query("UPDATE user_addresses SET is_default = false WHERE user_id = $1", [user_id]);
    }

    const { rows } = await query(
      "INSERT INTO user_addresses (user_id, label, address, city, state, pincode, lat, lng, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [user_id, label, address, city, state || "", pincode, lat || null, lng || null, is_default || false]
    );
    const addressData = rows[0];

    return NextResponse.json({ success: true, address: addressData });
  } catch (error) {
    console.error("Address error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, label, address, city, state, pincode, lat, lng, is_default } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
    }

    if (is_default && user_id) {
      await query("UPDATE user_addresses SET is_default = false WHERE user_id = $1", [user_id]);
    }

    const { rows } = await query(
      "UPDATE user_addresses SET label = $1, address = $2, city = $3, state = $4, pincode = $5, lat = $6, lng = $7, is_default = $8 WHERE id = $9 RETURNING *",
      [label, address, city, state || "", pincode, lat || null, lng || null, is_default || false, id]
    );
    const addressData = rows[0];

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
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Address ID required" }, { status: 400 });
  }

  await query("DELETE FROM user_addresses WHERE id = $1", [id]);

  return NextResponse.json({ success: true });
}