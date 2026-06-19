import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!await checkIpRateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Revoke all user sessions server-side
    const supabaseAdmin = createAdminClient();
    try {
      await supabaseAdmin.auth.admin.signOut(user.id);
    } catch (err) {
      // signOut may not exist on all Supabase versions — log but don't fail
      console.warn("[logout] Admin signOut error:", err);
    }

    // Mark all user sessions as revoked in our tracking table
    await supabaseAdmin
      .from("user_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("revoked_at", null);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[logout] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
