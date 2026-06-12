import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { validatePassword, verifyHmac, getClientIp, checkIpRateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(ip, 20, 60_000)) {
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

    // Find existing user using listUsers (getUserByEmail does NOT exist in supabase-js)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error("[create-user] listUsers error:", listError);
      return NextResponse.json({ error: "Failed to look up users" }, { status: 500 });
    }

    const existingUser = users?.find(u => u.email?.toLowerCase() === cleanEmail);

    let userId = null;

    if (existingUser) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        email: cleanEmail,
        password,
        email_confirm: true,
      });

      if (updateError) {
        console.error("[create-user] Update error:", updateError);
        return NextResponse.json({ error: updateError.message || "Failed to update account" }, { status: 500 });
      }

      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { email: cleanEmail },
      });

      if (createError) {
        console.error("[create-user] Create error:", createError);
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
  } catch (error: any) {
    console.error("[create-user] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
