import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MIIAM";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const { referral_code } = await request.json();

    if (!referral_code) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    const cleanCode = referral_code.toUpperCase().trim();

    // Find the referrer
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, total_loyalty_points")
      .eq("referral_code", cleanCode)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      referrer_id: referrer.id,
      referrer_name: referrer.full_name,
    });
  } catch (error: any) {
    console.error("[referral-apply] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Generate unique referral code
    let referralCode = "";
    let isUnique = false;
    
    while (!isUnique) {
      referralCode = generateReferralCode();
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .single();
      isUnique = !existing;
    }

    // Save referral code
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ referral_code: referralCode })
      .eq("id", user_id);

    if (updateError) {
      console.error("[generate-referral] update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      referral_code: referralCode,
    });
  } catch (error: any) {
    console.error("[generate-referral] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}