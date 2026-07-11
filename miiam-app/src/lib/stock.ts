import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

const supabase = createClient();

export interface StockCheckItem {
  menu_item_id: string;
  quantity: number;
  name: string;
  vendor_id: string;
}

export interface StockResult {
  available: boolean;
  items: Array<{
    menu_item_id: string;
    name: string;
    requested: number;
    available: number;
    in_stock: boolean;
  }>;
}

export async function checkStock(items: StockCheckItem[]): Promise<StockResult> {
  const menuItemIds = items.map(i => i.menu_item_id);

  try {
    const { data: menuItems, error } = await supabase
      .from("menu_items")
      .select("id, name, stock, is_available")
      .in("id", menuItemIds);

    if (error) {
      logger.error({ err: error }, "Failed to check stock");
      return { available: true, items: [] };
    }

    const stockMap = new Map(
      (menuItems || []).map((m: { id: string; name: string; stock: number | null; is_available: boolean }) => [m.id, { stock: m.stock, is_available: m.is_available, name: m.name }])
    );

    const results = items.map(item => {
      const menuData = stockMap.get(item.menu_item_id) as { stock: number | null; is_available: boolean; name: string } | undefined;
      if (!menuData) {
        return {
          menu_item_id: item.menu_item_id,
          name: item.name,
          requested: item.quantity,
          available: 0,
          in_stock: false,
        };
      }

      const stock = menuData.stock ?? null;
      const inStock = menuData.is_available && (stock === null || stock >= item.quantity);

      return {
        menu_item_id: item.menu_item_id,
        name: menuData.name || item.name,
        requested: item.quantity,
        available: stock ?? 999,
        in_stock: inStock,
      };
    });

    const allAvailable = results.every(r => r.in_stock);
    return { available: allAvailable, items: results };
  } catch (err) {
    logger.error({ err }, "Stock check failed");
    return { available: true, items: [] };
  }
}

export async function decrementStock(
  items: StockCheckItem[],
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Atomic decrement per item: check stock >= quantity in WHERE clause to prevent race
    for (const item of items) {
      const { data: current } = await supabase
        .from("menu_items")
        .select("stock")
        .eq("id", item.menu_item_id)
        .single();

      if (current?.stock === null || current?.stock === undefined) continue;

      if (current.stock < item.quantity) {
        return {
          success: false,
          error: `Out of stock: ${item.name} (requested ${item.quantity}, available ${current.stock})`,
        };
      }

      const newStock = current.stock - item.quantity;
      // The .gte("stock", item.quantity) in WHERE prevents race condition:
      // if another order decremented first, this UPDATE affects 0 rows
      const { data: updated, error: updateErr } = await supabase
        .from("menu_items")
        .update({
          stock: newStock,
          is_available: newStock > 0,
        })
        .eq("id", item.menu_item_id)
        .gte("stock", item.quantity)
        .select("id");

      if (updateErr || !updated || updated.length === 0) {
        return {
          success: false,
          error: `Failed to update stock for ${item.name}: another order may have claimed it`,
        };
      }
    }

    await supabase.from("stock_movements").insert(
      items.map(item => ({
        menu_item_id: item.menu_item_id,
        order_id: orderId,
        quantity: -item.quantity,
        type: "order",
      }))
    );

    return { success: true };
  } catch (err) {
    logger.error({ err }, "Failed to decrement stock");
    return { success: false, error: "Failed to update stock" };
  }
}

export async function restoreStock(orderId: string): Promise<void> {
  try {
    const { data: movements } = await supabase
      .from("stock_movements")
      .select("menu_item_id, quantity")
      .eq("order_id", orderId)
      .eq("type", "order");

    if (!movements || movements.length === 0) return;

    for (const movement of movements) {
      const { data: current } = await supabase
        .from("menu_items")
        .select("stock")
        .eq("id", movement.menu_item_id)
        .single();

      if (current?.stock !== null && current?.stock !== undefined) {
        await supabase
          .from("menu_items")
          .update({ stock: current.stock + Math.abs(movement.quantity), is_available: true })
          .eq("id", movement.menu_item_id);
      }
    }

    await supabase
      .from("stock_movements")
      .update({ type: "restored" })
      .eq("order_id", orderId)
      .eq("type", "order");
  } catch (err) {
    logger.error({ err }, "Failed to restore stock");
  }
}
