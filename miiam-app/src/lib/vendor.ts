import { createClient } from "@/lib/supabase/client";

export async function getVendorForUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try user_id first (if migration has been run)
  const { data: byUserId } = await supabase
    .from("vendors")
    .select("id, shop_name, status, owner_name, rating, review_count, type, email, description, cover_image_url, cuisine, min_order_amount, delivery_charge, delivery_time_min, delivery_time_max, is_pure_veg, gst_number, fssai_number, pan_number, opening_hours, address, city, state, pincode, phone, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (byUserId) return byUserId;

  // Fall back to email matching
  const { data: byEmail } = await supabase
    .from("vendors")
    .select("id, shop_name, status, owner_name, rating, review_count, type, email, description, cover_image_url, cuisine, min_order_amount, delivery_charge, delivery_time_min, delivery_time_max, is_pure_veg, gst_number, fssai_number, pan_number, opening_hours, address, city, state, pincode, phone, created_at")
    .eq("email", user.email)
    .maybeSingle();

  return byEmail;
}

export async function getVendorIdForUser(): Promise<string | null> {
  const vendor = await getVendorForUser();
  return vendor?.id || null;
}
