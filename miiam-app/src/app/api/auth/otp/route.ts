import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SMS_API_KEY;
  const apiUrl = process.env.SMS_API_URL;

  // If no API configured, simulate success for testing
  if (!apiKey || apiKey === "demo_key_placeholder" || !apiUrl) {
    console.log(`[SMS SIMULATED] To: ${phoneNumber} | Message: ${message}`);
    return { success: true };
  }

  try {
    if (apiUrl.includes("fast2sms")) {
      const response = await fetch(`${apiUrl}?authorization=${apiKey}&sender_id=FSTSMS&message=${encodeURIComponent(message)}&language=english&route=p&numbers=${phoneNumber}`, {
        method: "GET"
      });
      
      const data = await response.json();
      
      if (data.return === true) {
        return { success: true };
      } else {
        return { success: false, error: data.message || "SMS failed" };
      }
    }
    
    return { success: true };
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

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in database (delete existing first, then insert)
    const { error: deleteError } = await supabase
      .from("phone_otp_verification")
      .delete()
      .eq("phone_number", cleanPhone)
      .eq("purpose", purpose || "signup");

    const { error: insertError } = await supabase
      .from("phone_otp_verification")
      .insert(
        { phone_number: cleanPhone, otp_code: otp, purpose: purpose || "signup", expires_at: expiresAt }
      );

    if (insertError) {
      console.error("Database error:", insertError);
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

    // Fetch OTP from database
    const { data: stored, error: fetchError } = await supabase
      .from("phone_otp_verification")
      .select("*")
      .eq("phone_number", cleanPhone)
      .single();

    if (fetchError || !stored) {
      return NextResponse.json({ error: "No OTP found. Please request new OTP" }, { status: 400 });
    }

    if (new Date() > new Date(stored.expires_at)) {
      await supabase.from("phone_otp_verification").delete().eq("phone_number", cleanPhone);
      return NextResponse.json({ error: "OTP expired. Request new one" }, { status: 400 });
    }

    if (stored.otp_code !== otpCode) {
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