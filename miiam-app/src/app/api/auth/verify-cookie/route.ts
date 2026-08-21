import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { signHmac, getClientIp, checkIpRateLimit } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";

const logger = createRouteLogger("auth/verify-cookie");

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!await checkIpRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { email, purpose } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    if (purpose !== "password_reset") {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
    }

    // Verify that email OTP was recently verified for this email
    const supabaseAdmin = createAdminClient();
    const cleanEmail = email.toLowerCase().trim();

    // Check for a recent successful email OTP verification (within 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentVerification } = await supabaseAdmin
      .from("email_otps")
      .select("id")
      .eq("email", cleanEmail)
      .eq("verified", true)
      .gte("updated_at", tenMinutesAgo)
      .maybeSingle();

    if (!recentVerification) {
      return NextResponse.json(
        { error: "Email not verified. Please verify OTP first." },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();

    const randomToken = crypto.randomUUID();
    const hmac = signHmac(cleanEmail, randomToken);
    const verifiedToken = `${randomToken}.${hmac}`;
    
    cookieStore.set("password_reset_verified", verifiedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Verify cookie error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
