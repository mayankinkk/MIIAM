import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { randomInt } from "crypto";
import { checkVerifyRateLimit, incrementVerifyAttempts } from "@/lib/security";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const VERIFY_ATTEMPT_LIMIT = 5;

async function checkRateLimit(supabase: ReturnType<typeof createAdminClient>, phone: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString();
  const { count, error } = await supabase
    .from("phone_otp_verification")
    .select("id", { count: "exact", head: true })
    .eq("phone_number", phone)
    .gte("created_at", windowStart);

  if (error) {
    console.error("Rate limit check error:", error);
    return true;
  }

  return (count || 0) < RATE_LIMIT_MAX;
}

function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SMS_API_KEY;
  const apiUrl = process.env.SMS_API_URL;

  if (!apiKey || apiKey === "demo_key_placeholder" || !apiUrl) {
    return { success: false, error: "SMS service not configured. Please contact support." };
  }

  try {
    if (apiUrl.includes("fast2sms")) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "authorization": apiKey,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          sender_id: "FSTSMS",
          message: message,
          language: "english",
          route: "p",
          numbers: phoneNumber,
        })
      });

      const data = await response.json();

      if (data.return === true) {
        return { success: true };
      } else {
        return { success: false, error: data.message || "SMS failed" };
      }
    }

    return { success: false, error: "Unsupported SMS provider" };
  } catch (error) {
    console.error("SMS Error:", error);
    return { success: false, error: "SMS service unavailable" };
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { phoneNumber, purpose } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    
    if (!isValidPhoneNumber(cleanPhone)) {
      return NextResponse.json({ error: "Invalid phone number. Use 10 digits starting with 6-9" }, { status: 400 });
    }

    if (!(await checkRateLimit(supabase, cleanPhone))) {
      return NextResponse.json({ error: "Too many requests. Please try again after 10 minutes." }, { status: 429 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Hash OTP before storing
    const { default: crypto } = await import("crypto");
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const { error: upsertError } = await supabase
      .from("phone_otp_verification")
      .upsert(
        { phone_number: cleanPhone, otp_code: otpHash, purpose: purpose || "signup", expires_at: expiresAt, attempts: 0 },
        { onConflict: "phone_number,purpose" }
      );

    if (upsertError) {
      console.error("Database error:", upsertError);
      return NextResponse.json({ error: "Failed to store OTP" }, { status: 500 });
    }

    const message = `Your MIIAM verification code is ${otp}. Valid for 10 minutes. Don't share this code.`;
    const result = await sendSMS(cleanPhone, message);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send SMS" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your phone",
      expiresIn: 600,
    });
  } catch (error) {
    console.error("OTP API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { phoneNumber, otpCode } = await request.json();

    if (!phoneNumber || !otpCode) {
      return NextResponse.json({ error: "Phone number and OTP required" }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");

    // Rate limit verification attempts
    if (!(await checkVerifyRateLimit(supabase, "phone_otp_verification", cleanPhone, "phone_number"))) {
      return NextResponse.json({ error: "Too many verification attempts. Please request a new OTP." }, { status: 429 });
    }

    // Fetch OTP from database
    const { data: stored, error: fetchError } = await supabase
      .from("phone_otp_verification")
      .select("*")
      .eq("phone_number", cleanPhone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !stored) {
      return NextResponse.json({ error: "No OTP found. Please request new OTP" }, { status: 400 });
    }

    if (new Date() > new Date(stored.expires_at)) {
      await supabase.from("phone_otp_verification").delete().eq("phone_number", cleanPhone);
      return NextResponse.json({ error: "OTP expired. Request new one" }, { status: 400 });
    }

    // Hash provided OTP and compare
    const { default: crypto } = await import("crypto");
    const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");

    if (stored.otp_code !== otpHash) {
      // Track failed attempt
      await incrementVerifyAttempts(supabase, "phone_otp_verification", cleanPhone, "phone_number");
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Delete OTP after successful verification
    await supabase.from("phone_otp_verification").delete().eq("phone_number", cleanPhone);

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      verified: true,
      phoneNumber: cleanPhone,
      userExists: !!existingProfile,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
