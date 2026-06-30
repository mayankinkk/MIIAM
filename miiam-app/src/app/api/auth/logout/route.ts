import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";

const logger = createRouteLogger("auth/logout");

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
      logger.warn({ err }, "Admin signOut error");
    }

    // Mark all user sessions as revoked in our tracking table
    await supabaseAdmin
      .from("user_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("revoked_at", null);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    logger.error({ err: error }, "Logout error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
