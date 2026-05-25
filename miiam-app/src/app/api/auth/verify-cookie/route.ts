import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    if (purpose !== "password_reset") {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
    }

    const cookieStore = await cookies();
    
    // Use a random token + HMAC signature to prevent forgery
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const randomToken = crypto.randomUUID();
    const hmac = crypto.createHmac("sha256", secret).update(`${email}:${randomToken}`).digest("hex");
    const verifiedToken = `${randomToken}.${hmac}`;
    
    cookieStore.set("password_reset_verified", verifiedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60, // 10 minutes
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify cookie error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}