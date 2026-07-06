import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

const supabase = createClient();

export const LOYALTY_CONFIG = {
  POINTS_PER_RUPEE: 1,           // 1 point per ₹1 spent
  POINTS_TO_REDEEM: 100,         // 100 points = ₹10 discount
  REDEEM_VALUE: 10,              // ₹10 per 100 points
  MIN_REDEEM_POINTS: 100,        // Minimum points to redeem
  WELCOME_BONUS: 50,             // Welcome bonus points
  BIRTHDAY_BONUS: 100,           // Birthday bonus points
  REFERRAL_BONUS: 200,           // Referral bonus points
} as const;

export async function getLoyaltyBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("loyalty_points")
      .select("points")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      logger.error({ err: error }, "Failed to get loyalty balance");
      return 0;
    }
    return data?.points || 0;
  } catch {
    return 0;
  }
}

export async function earnPoints(userId: string, orderId: string, amount: number, description: string): Promise<{ success: boolean; pointsEarned: number }> {
  try {
    const pointsEarned = Math.floor(amount * LOYALTY_CONFIG.POINTS_PER_RUPEE);
    if (pointsEarned <= 0) return { success: false, pointsEarned: 0 };

    const { data: existing } = await supabase
      .from("loyalty_points")
      .select("id, points")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const newBalance = existing.points + pointsEarned;
      await supabase
        .from("loyalty_points")
        .update({ points: newBalance, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("loyalty_points").insert({
        user_id: userId,
        points: pointsEarned,
      });
    }

    await supabase.from("loyalty_history").insert({
      user_id: userId,
      order_id: orderId,
      points: pointsEarned,
      type: "earned",
      description,
    });

    return { success: true, pointsEarned };
  } catch (err) {
    logger.error({ err }, "Failed to earn loyalty points");
    return { success: false, pointsEarned: 0 };
  }
}

export async function redeemPoints(userId: string, orderId: string, pointsToRedeem: number): Promise<{ success: boolean; discount: number; error?: string }> {
  try {
    if (pointsToRedeem < LOYALTY_CONFIG.MIN_REDEEM_POINTS) {
      return { success: false, discount: 0, error: `Minimum ${LOYALTY_CONFIG.MIN_REDEEM_POINTS} points required to redeem` };
    }

    const balance = await getLoyaltyBalance(userId);
    if (balance < pointsToRedeem) {
      return { success: false, discount: 0, error: "Insufficient loyalty points" };
    }

    const discount = Math.floor(pointsToRedeem / LOYALTY_CONFIG.POINTS_TO_REDEEM) * LOYALTY_CONFIG.REDEEM_VALUE;
    const pointsUsed = Math.floor(pointsToRedeem / LOYALTY_CONFIG.POINTS_TO_REDEEM) * LOYALTY_CONFIG.POINTS_TO_REDEEM;

    const { data: existing } = await supabase
      .from("loyalty_points")
      .select("id, points")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const newBalance = existing.points - pointsUsed;
      await supabase
        .from("loyalty_points")
        .update({ points: newBalance, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    await supabase.from("loyalty_history").insert({
      user_id: userId,
      order_id: orderId,
      points: -pointsUsed,
      type: "redeemed",
      description: `Redeemed ${pointsUsed} points for ₹${discount} discount`,
    });

    return { success: true, discount };
  } catch (err) {
    logger.error({ err }, "Failed to redeem loyalty points");
    return { success: false, discount: 0, error: "Failed to redeem points" };
  }
}

export async function getLoyaltyHistory(userId: string, limit = 20): Promise<Array<{
  id: string;
  points: number;
  type: "earned" | "redeemed" | "bonus";
  description: string;
  created_at: string;
}>> {
  try {
    const { data, error } = await supabase
      .from("loyalty_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      logger.error({ err: error }, "Failed to get loyalty history");
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

export async function awardWelcomeBonus(userId: string): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from("loyalty_history")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "bonus")
      .eq("description", "Welcome bonus")
      .maybeSingle();

    if (existing) return;

    const { data: pointsRow } = await supabase
      .from("loyalty_points")
      .select("id, points")
      .eq("user_id", userId)
      .maybeSingle();

    if (pointsRow) {
      await supabase
        .from("loyalty_points")
        .update({ points: pointsRow.points + LOYALTY_CONFIG.WELCOME_BONUS })
        .eq("id", pointsRow.id);
    } else {
      await supabase.from("loyalty_points").insert({
        user_id: userId,
        points: LOYALTY_CONFIG.WELCOME_BONUS,
      });
    }

    await supabase.from("loyalty_history").insert({
      user_id: userId,
      points: LOYALTY_CONFIG.WELCOME_BONUS,
      type: "bonus",
      description: "Welcome bonus",
    });
  } catch (err) {
    logger.error({ err }, "Failed to award welcome bonus");
  }
}
