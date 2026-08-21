import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { validatePassword, verifyHmac, getClientIp, checkIpRateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!await checkIpRateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabaseAdmin = createAdminClient();
  const cookieStore = await cookies();
  
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

    // Check cookie verification with HMAC validation
    const verifiedToken = cookieStore.get("password_reset_verified")?.value;
    if (!verifiedToken) {
      return NextResponse.json({ error: "Please verify your email first" }, { status: 403 });
    }

    const [randomToken, hmac] = verifiedToken.split(".");
    if (!randomToken || !hmac) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 403 });
    }
    if (!verifyHmac(cleanEmail, randomToken, hmac)) {
      return NextResponse.json({ error: "Verification mismatch" }, { status: 403 });
    }

    // Find user by email via profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Failed to look up user" }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update password and confirm email
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, { 
      password,
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Clear the verification cookie
    cookieStore.delete("password_reset_verified");

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}