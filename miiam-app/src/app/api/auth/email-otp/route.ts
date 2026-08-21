import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { randomInt } from "crypto";
import { checkVerifyRateLimit, incrementVerifyAttempts, checkIpRateLimit, getClientIp } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendEmail(email: string, otp: string, purpose?: string): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: "Email service not configured. Please contact support." };
  }

  const logger = createRouteLogger("auth/email-otp");
  const subject = purpose === "password_reset"
    ? "MIIAM - Reset Your Password"
    : "MIIAM - Your Verification Code";

  try {
    const { error } = await resend.emails.send({
      from: "MIIAM <noreply@miiam.in>",
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, var(--color-primary), #8a0014); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">MIIAM</h1>
          </div>
          <div style="background: var(--color-surface-container-lowest); padding: 30px; border-radius: 0 0 10px 10px; text-align: center;">
            <h2 style="color: var(--color-on-surface); margin-bottom: 20px;">Verify Your Email</h2>
            <p style="color: #666; margin-bottom: 25px;">Use this code to verify your MIIAM account:</p>
            <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block;">
              <span style="font-size: 36px; font-weight: bold; color: var(--color-primary); letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">This code expires in 10 minutes.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      logger.error({ err: error }, "Resend email error");
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error({ err: err }, "Email send error");
    return { success: false, error: "Failed to send email" };
  }
}

export async function POST(request: NextRequest) {
  const logger = createRouteLogger("auth/email-otp");
  const supabase = createAdminClient();

  try {
    const ip = getClientIp(request);
    if (!await checkIpRateLimit(ip, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { email, purpose } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // DB-based rate limit: max 5 OTPs per email per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("email_otps")
      .select("*", { count: "exact", head: true })
      .eq("email", cleanEmail)
      .gte("created_at", tenMinAgo);
    if (count && count >= 5) {
      return NextResponse.json({ error: "Too many requests. Please try again after 10 minutes." }, { status: 429 });
    }

    // For password_reset, check if user exists
    if (purpose === "password_reset") {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();
        if (!profile) {
          return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
        }
      } catch (e) {
        logger.error({ err: e }, "User lookup error");
      }
    }
    
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Hash OTP before storing
    const { default: crypto } = await import("crypto");
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Upsert with purpose in the conflict target
    const { error: insertError } = await supabase
      .from("email_otps")
      .upsert(
        { email: cleanEmail, otp: otpHash, purpose: purpose || "signup", expires_at: expiresAt, verified: false, attempts: 0 },
        { onConflict: "email,purpose" }
      );

    if (insertError) {
      logger.error({ err: insertError }, "Failed to store OTP");
      return NextResponse.json({ error: "Failed to store code" }, { status: 500 });
    }

    const result = await sendEmail(cleanEmail, otp, purpose);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
      expiresIn: 600,
    });
  } catch (error) {
    logger.error({ err: error }, "Email OTP error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const logger = createRouteLogger("auth/email-otp");
  const supabase = createAdminClient();

  try {
    const { email, otpCode, purpose } = await request.json();

    if (!email || !otpCode) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const queryPurpose = purpose || "signup";

    // Rate limit verification attempts
    if (!(await checkVerifyRateLimit(supabase, "email_otps", cleanEmail, "email"))) {
      return NextResponse.json({ error: "Too many verification attempts. Please request a new code." }, { status: 429 });
    }

    // Fetch OTP from database - filter by purpose
    const { data: stored, error: fetchError } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", cleanEmail)
      .eq("purpose", queryPurpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !stored) {
      return NextResponse.json({ error: "No code found. Request new one" }, { status: 400 });
    }

    if (new Date() > new Date(stored.expires_at)) {
      return NextResponse.json({ error: "Code expired. Request new one" }, { status: 400 });
    }

    // Hash provided OTP and compare
    const { default: crypto } = await import("crypto");
    const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");

    if (stored.otp !== otpHash) {
      // Track failed attempt
      await incrementVerifyAttempts(supabase, "email_otps", cleanEmail, "email");
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Mark as verified but DON'T delete yet — verify-cookie needs it
    await supabase
      .from("email_otps")
      .update({ verified: true })
      .eq("email", cleanEmail)
      .eq("purpose", queryPurpose);

    return NextResponse.json({
      success: true,
      verified: true,
      email: cleanEmail,
    });
  } catch (error) {
    logger.error({ err: error }, "Email OTP verify error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
