import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";

const logger = createRouteLogger("auth/create-session");

interface AdminAuthExtension {
  createSession(args: { userId: string }): Promise<{
    data: { session: Record<string, unknown> } | null;
    error: { message: string } | null;
  }>;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!await checkIpRateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    // Require authenticated admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabaseAdmin = createAdminClient();
    const { email, fullName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Find or create user by email via profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    
    const userRecord = existingProfile ? { id: existingProfile.id, email: email.toLowerCase() } : null;

    if (!userRecord) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true,
        user_metadata: { email: email.toLowerCase(), full_name: fullName || email.split('@')[0] }
      });
      
      if (createError) {
        logger.error({ err: createError }, "Create user error");
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
      
      const { data: sessionData, error: sessionError } = await (
        supabaseAdmin.auth.admin as unknown as AdminAuthExtension
      ).createSession({ userId: newUser.user.id });

      return NextResponse.json({
        success: true,
        userId: newUser.user.id,
        email: newUser.user.email,
      });
    }

    const { data: sessionData, error: sessionError } = await (
      supabaseAdmin.auth.admin as unknown as AdminAuthExtension
    ).createSession({ userId: userRecord.id });

    if (sessionError) {
      logger.error({ err: sessionError }, "Create session error");
      return NextResponse.json({ 
        success: true, 
        userId: userRecord.id,
        email: userRecord.email 
      });
    }

    return NextResponse.json({
      success: true,
      userId: userRecord.id,
      email: userRecord.email,
    });
  } catch (error) {
    logger.error({ err: error }, "Create session error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
