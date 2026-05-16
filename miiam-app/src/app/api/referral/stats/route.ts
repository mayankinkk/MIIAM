import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get user's profile with referral code
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, referral_code, total_loyalty_points, referred_by")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Generate referral code if not exists
    if (!profile.referral_code) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let referralCode = "MIIAM";
      for (let i = 0; i < 6; i++) {
        referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      await supabaseAdmin
        .from("profiles")
        .update({ referral_code: referralCode })
        .eq("id", user_id);

      profile.referral_code = referralCode;
    }

    // Get count of referrals (users who used this person's code)
    const { count: referralCount } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", user_id);

    // Get points transactions
    const { data: transactions } = await supabaseAdmin
      .from("loyalty_points_transactions")
      .select("id, points, type, description, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      referral_code: profile.referral_code,
      total_points: profile.total_loyalty_points || 0,
      referral_count: referralCount || 0,
      transactions: transactions || [],
    });
  } catch (error: any) {
    console.error("[referral-stats] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}