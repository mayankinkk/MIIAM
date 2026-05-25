import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { user_id, title, body, type, action_url } = await req.json();

    if (!user_id || !title) {
      return NextResponse.json({ error: "user_id and title are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        title,
        body,
        type: type || "system",
        action_url: action_url || null,
        read: false,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Notify API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
