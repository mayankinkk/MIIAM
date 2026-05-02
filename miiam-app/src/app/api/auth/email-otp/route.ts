import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("RESEND_API_KEY not configured - OTP will be logged to console");
    console.log(`[DEV OTP] Email: ${email}, OTP: ${otp}`);
    return { success: true };
  }
  
  try {
    const { error } = await resend.emails.send({
      from: "MIIAM <noreply@miiam.in>",
      to: email,
      subject: "MIIAM - Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ba001c, #8a0014); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">MIIAM</h1>
          </div>
          <div style="background: #fff4f4; padding: 30px; border-radius: 0 0 10px 10px; text-align: center;">
            <h2 style="color: #4d212a; margin-bottom: 20px;">Verify Your Email</h2>
            <p style="color: #666; margin-bottom: 25px;">Use this code to verify your MIIAM account:</p>
            <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block;">
              <span style="font-size: 36px; font-weight: bold; color: #ba001c; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">This code expires in 10 minutes.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  
  try {
    const { email, purpose } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

const cleanEmail = email.toLowerCase().trim();
    
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // For password_reset, check if user exists
    if (purpose === "password_reset") {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        return NextResponse.json({ error: "Failed to verify user" }, { status: 500 });
      }
      const user = users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (!user) {
        return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
      }
    }
    
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in database (upsert to handle duplicates)
    const { error: insertError } = await supabase
      .from("email_otps")
      .upsert({ email: cleanEmail, otp, expires_at: expiresAt }, { onConflict: "email" });

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json({ error: "Failed to store code" }, { status: 500 });
    }

    const result = await sendEmail(cleanEmail, otp);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
      expiresIn: 600,
    });
  } catch (error) {
    console.error("Email OTP Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = createAdminClient();
  
  try {
    const { email, otpCode } = await request.json();

    if (!email || !otpCode) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Fetch OTP from database
    const { data: stored, error: fetchError } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", cleanEmail)
      .single();

    if (fetchError || !stored) {
      return NextResponse.json({ error: "No code found. Request new one" }, { status: 400 });
    }

    if (new Date() > new Date(stored.expires_at)) {
      await supabase.from("email_otps").delete().eq("email", cleanEmail);
      return NextResponse.json({ error: "Code expired. Request new one" }, { status: 400 });
    }

    if (stored.otp !== otpCode) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Delete OTP after successful verification
    await supabase.from("email_otps").delete().eq("email", cleanEmail);

    return NextResponse.json({
      success: true,
      verified: true,
      email: cleanEmail,
    });
  } catch (error) {
    console.error("Email OTP verify error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}