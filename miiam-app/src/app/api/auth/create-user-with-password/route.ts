import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { validatePassword, verifyHmac, getClientIp, checkIpRateLimit } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";

const logger = createRouteLogger("auth/create-user-with-password");

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!await checkIpRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabaseAdmin = createAdminClient();
  
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify the password reset cookie exists and matches this email
    const cookieStore = await cookies();
    const verifiedToken = cookieStore.get("password_reset_verified")?.value;
    if (!verifiedToken) {
      return NextResponse.json({ error: "Password reset not verified" }, { status: 403 });
    }

    // Verify HMAC signature to prevent forgery
    const [randomToken, hmac] = verifiedToken.split(".");
    if (!randomToken || !hmac) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 403 });
    }
    if (!verifyHmac(cleanEmail, randomToken, hmac)) {
      return NextResponse.json({ error: "Verification token does not match email" }, { status: 403 });
    }

    // Find existing user by email via profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    let userId = null;

    if (existingProfile) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
        email: cleanEmail,
        password,
        email_confirm: true,
      });

      if (updateError) {
        logger.error({ err: updateError }, "Update error");
        return NextResponse.json({ error: updateError.message || "Failed to update account" }, { status: 500 });
      }

      userId = existingProfile.id;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { email: cleanEmail },
      });

      if (createError) {
        logger.error({ err: createError }, "Create error");
        return NextResponse.json({ error: createError.message || "Failed to create account" }, { status: 500 });
      }

      userId = newUser.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Failed to create or find user" }, { status: 500 });
    }

    // Clear the verification cookie
    cookieStore.delete("password_reset_verified");

    return NextResponse.json({
      success: true,
      userId,
      email: cleanEmail,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    logger.error({ err: error }, "Create user error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
