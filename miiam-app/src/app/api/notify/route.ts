import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { user_id, title, body, type, action_url } = await req.json();

    if (!user_id || !title) {
      return NextResponse.json({ error: "user_id and title are required" }, { status: 400 });
    }

    await query(
      "INSERT INTO notifications (user_id, title, body, type, action_url, read) VALUES ($1, $2, $3, $4, $5, $6)",
      [user_id, title, body, type || "system", action_url || null, false]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Notify API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
