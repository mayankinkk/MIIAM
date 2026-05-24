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

const MENU_TABLE_MAP: Record<string, string> = {
  food: "menu_items",
  grocery: "grocery_products",
  pharmacy: "pharmacy_medicines",
  flowers: "flower_items",
};

export async function getVendorMenuItems(vendorId: string): Promise<Map<string, { name: string; category: string }>> {
  const supabase = createClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("type")
    .eq("id", vendorId)
    .single();

  const table = MENU_TABLE_MAP[vendor?.type || "food"] || "menu_items";
  const { data } = await supabase
    .from(table)
    .select("id, name, category");

  const map = new Map<string, { name: string; category: string }>();
  if (data) {
    data.forEach((item: any) => map.set(item.id, { name: item.name, category: item.category || "" }));
  }
  return map;
}

export async function getVendorMenuTable(vendorId: string): Promise<string> {
  const supabase = createClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("type")
    .eq("id", vendorId)
    .single();
  return MENU_TABLE_MAP[vendor?.type || "food"] || "menu_items";
}
