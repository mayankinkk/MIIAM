import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const REFERRAL_POINTS = 50;

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const { user_id, referral_code } = await request.json();

    if (!user_id || !referral_code) {
      return NextResponse.json({ error: "User ID and referral code required" }, { status: 400 });
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

    // Check if already referred
    const { data: existingReferral } = await supabaseAdmin
      .from("profiles")
      .select("referred_by")
      .eq("id", user_id)
      .single();

    if (existingReferral?.referred_by) {
      return NextResponse.json({ error: "Already referred" }, { status: 400 });
    }

    // Update the referred user
    const { error: updateReferredError } = await supabaseAdmin
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", user_id);

    if (updateReferredError) {
      return NextResponse.json({ error: updateReferredError.message }, { status: 500 });
    }

    // Award points to referrer
    const { error: referrerPointsError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        total_loyalty_points: (referrer.total_loyalty_points || 0) + REFERRAL_POINTS 
      })
      .eq("id", referrer.id);

    if (referrerPointsError) {
      console.error("[referral-complete] referrer points error:", referrerPointsError);
    }

    // Record referrer's transaction
    await supabaseAdmin.from("loyalty_points_transactions").insert({
      user_id: referrer.id,
      points: REFERRAL_POINTS,
      type: "referral_bonus",
      description: `Referral bonus - ${referral_code} used`,
      reference_id: user_id,
    });

    // Award points to referred user (new user)
    const { data: referredUser, error: referredUserError } = await supabaseAdmin
      .from("profiles")
      .select("total_loyalty_points")
      .eq("id", user_id)
      .single();

    if (!referredUserError && referredUser) {
      const { error: referredPointsError } = await supabaseAdmin
        .from("profiles")
        .update({ 
          total_loyalty_points: (referredUser.total_loyalty_points || 0) + REFERRAL_POINTS 
        })
        .eq("id", user_id);

      if (referredPointsError) {
        console.error("[referral-complete] referred user points error:", referredPointsError);
      }

      // Record referred user's transaction
      await supabaseAdmin.from("loyalty_points_transactions").insert({
        user_id: user_id,
        points: REFERRAL_POINTS,
        type: "signup_bonus",
        description: `Welcome bonus - referral code used`,
        reference_id: referrer.id,
      });
    }

    return NextResponse.json({
      success: true,
      points_awarded: REFERRAL_POINTS,
      referrer_id: referrer.id,
    });
  } catch (error: any) {
    console.error("[referral-complete] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}