import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

const supabase = createClient();

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  initial_amount: number;
  sender_id: string;
  recipient_id: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  message: string | null;
  status: "active" | "used" | "expired" | "cancelled";
  expires_at: string | null;
  created_at: string;
}

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  let code = "GIFT-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(arr[i] % chars.length);
  }
  code += "-";
  for (let i = 4; i < 8; i++) {
    code += chars.charAt(arr[i] % chars.length);
  }
  return code;
}

export async function purchaseGiftCard(
  senderId: string,
  amount: number,
  recipientEmail: string,
  recipientName: string,
  message: string,
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    if (amount < 100 || amount > 5000) {
      return { success: false, error: "Gift card amount must be between ₹100 and ₹5000" };
    }

    const code = generateGiftCardCode();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("gift_cards").insert({
      code,
      balance: amount,
      initial_amount: amount,
      sender_id: senderId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      message,
      status: "active",
      expires_at: expiresAt,
    });

    if (error) throw error;

    return { success: true, code };
  } catch (err) {
    logger.error({ err }, "Failed to purchase gift card");
    return { success: false, error: "Failed to create gift card" };
  }
}

export async function getGiftCardBalance(code: string): Promise<{ valid: boolean; balance?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("gift_cards")
      .select("balance, status, expires_at")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (error) throw error;
    if (!data) return { valid: false, error: "Gift card not found" };

    if (data.status !== "active") {
      return { valid: false, error: `Gift card is ${data.status}` };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabase.from("gift_cards").update({ status: "expired" }).eq("code", code.toUpperCase());
      return { valid: false, error: "Gift card has expired" };
    }

    return { valid: true, balance: data.balance };
  } catch {
    return { valid: false, error: "Failed to check gift card" };
  }
}

export async function redeemGiftCard(
  code: string,
  userId: string,
  amount: number,
): Promise<{ success: boolean; discount?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("gift_cards")
      .select("id, balance, status, expires_at")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, error: "Gift card not found" };

    if (data.status !== "active") {
      return { success: false, error: `Gift card is ${data.status}` };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabase.from("gift_cards").update({ status: "expired" }).eq("id", data.id);
      return { success: false, error: "Gift card has expired" };
    }

    if (data.balance < amount) {
      return { success: false, error: `Insufficient gift card balance (₹${data.balance})` };
    }

    const newBalance = data.balance - amount;
    const updateData: Record<string, unknown> = { balance: newBalance };
    if (newBalance === 0) updateData.status = "used";

    await supabase.from("gift_cards").update(updateData).eq("id", data.id);

    await supabase.from("gift_card_transactions").insert({
      gift_card_id: data.id,
      user_id: userId,
      amount: -amount,
      type: "redeemed",
    });

    return { success: true, discount: amount };
  } catch (err) {
    logger.error({ err }, "Failed to redeem gift card");
    return { success: false, error: "Failed to redeem gift card" };
  }
}

export async function getUserGiftCards(userId: string): Promise<GiftCard[]> {
  try {
    const { data: received, error: e1 } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false });

    const { data: sent, error: e2 } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false });

    if (e1 || e2) {
      logger.error({ e1, e2 }, "Failed to load gift cards");
      return [];
    }

    const all = [...(received || []), ...(sent || [])];
    const unique = Array.from(new Map(all.map(g => [g.id, g])).values());
    return unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch {
    return [];
  }
}
