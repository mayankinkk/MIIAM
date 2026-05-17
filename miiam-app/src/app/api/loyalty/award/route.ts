import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const { user_id, points, type, description } = await request.json();

    if (!user_id || !points) {
      return NextResponse.json({ error: "User ID and points required" }, { status: 400 });
    }

    // Get current points
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("total_loyalty_points")
      .eq("id", user_id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const currentPoints = profile?.total_loyalty_points || 0;
    const newPoints = currentPoints + points;

    // Update profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ total_loyalty_points: newPoints })
      .eq("id", user_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Record transaction
    const { error: transError } = await supabaseAdmin
      .from("loyalty_points_transactions")
      .insert({
        user_id,
        points,
        type: type || "bonus",
        description: description || "Points awarded",
      });

    if (transError) {
      console.error("[loyalty-award] Transaction error:", transError);
    }

    return NextResponse.json({
      success: true,
      points_awarded: points,
      total_points: newPoints,
    });
  } catch (error: any) {
    console.error("[loyalty-award] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}