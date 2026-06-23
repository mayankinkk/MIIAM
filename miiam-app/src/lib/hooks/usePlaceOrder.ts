"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useLocationStore } from "@/lib/store/locationStore";
import { safeMenuItemId } from "@/lib/checkout-utils";
import { PRINTING_VENDOR_ID, SERVICES_VENDOR_ID } from "@/lib/constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import logger from "@/lib/logger";

interface DeliveryAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  flat?: string;
}

interface OrderInsert {
  user_id: string;
  vendor_id: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  discount_amount: number;
  payment_method: string;
  delivery_address: string;
  scheduled_delivery: string | null;
  special_instructions: string | null;
  placed_at: string;
}

interface PaymentDetails {
  paymentId: string;
  razorpayOrderId: string;
}

export function usePlaceOrder(supabase: SupabaseClient) {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { addToast } = useToastStore();
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;

  const validateCheckout = useCallback((deliveryAddress: DeliveryAddress | null): boolean => {
    if (items.length === 0) {
      addToast("Your cart is empty! Add items from the Food page first.", "error");
      return false;
    }
    if (!deliveryAddress) {
      addToast("Please enter your delivery address", "error");
      return false;
    }
    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state) {
      addToast("Please enter your complete delivery address", "error");
      return false;
    }
    if (!deliveryAddress.postal_code || deliveryAddress.postal_code.length < 4) {
      addToast("Please enter a valid pincode", "error");
      return false;
    }
    return true;
  }, [items, addToast]);

  const placeOrder = useCallback(async ({
    deliveryAddress,
    paymentMethod,
    discount,
    subtotal,
    scheduledDate,
    scheduledTime,
    specialInstructions,
    tipAmount,
    isRecurring,
    recurringFrequency,
    recurringDayOfWeek,
    phone,
    paymentDetails,
  }: {
    deliveryAddress: DeliveryAddress | null;
    paymentMethod: string;
    discount: number;
    subtotal: number;
    scheduledDate: string;
    scheduledTime: string;
    specialInstructions: string;
    tipAmount: number;
    isRecurring: boolean;
    recurringFrequency: string;
    recurringDayOfWeek: number;
    phone: string;
    paymentDetails?: PaymentDetails;
  }) => {
    if (!validateCheckout(deliveryAddress)) return false;

    if (scheduledDate && !scheduledTime) {
      logger.warn("Scheduled date provided without time — ignoring scheduled delivery");
    } else if (!scheduledDate && scheduledTime) {
      logger.warn("Scheduled time provided without date — ignoring scheduled delivery");
    }

    const finalAddress = deliveryAddress
      ? [deliveryAddress.flat, deliveryAddress.street, deliveryAddress.city, deliveryAddress.state, deliveryAddress.postal_code].filter(Boolean).join(", ")
      : "452/A Kinetic Plaza, 5th Floor, Skyway Avenue, Tech District, Local Area, State 560001";

    if (userPincode && userPincode !== "000000") {
      const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean))).filter(v => v !== PRINTING_VENDOR_ID);
      if (vendorIds.length > 0) {
        const { data: vendors } = await supabase.from("vendors").select("id, pincode, shop_name").in("id", vendorIds);
        const unserviceable = vendors?.filter(v => v.pincode && v.pincode !== userPincode) || [];
        if (unserviceable.length > 0) {
          addToast(`Some items (${unserviceable.map(v => v.shop_name).join(", ")}) are not deliverable at your location. Please remove them to proceed.`, "error");
          return false;
        }
      }
    }

    try {
      let user = null;
      const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser();
      if (fetchedUser) {
        user = fetchedUser;
      } else if (authError) {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user ?? null;
      }
      if (!user) { router.push("/auth/login"); return false; }

      const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean)));
      let firstOrderId = "";

      for (const vendorId of vendorIds) {
        if (!vendorId) continue;

        const vendorItems = items.filter((i) => i.vendor_id === vendorId);
        const vendorTotal = vendorItems.reduce((s, i) => s + i.price * i.quantity, 0);

        const scheduledIso = scheduledDate && scheduledTime
          ? (() => {
              const timePart = scheduledTime.split(" - ")[0].trim();
              const [time, period] = timePart.split(/\s+/);
              const [hours, minutes] = time.split(":").map(Number);
              let h = hours;
              if (period?.toUpperCase() === "PM" && h < 12) h += 12;
              if (period?.toUpperCase() === "AM" && h === 12) h = 0;
              return new Date(`${scheduledDate}T${String(h).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00`).toISOString();
            })()
          : null;

        const orderData: OrderInsert = {
          user_id: user.id,
          vendor_id: vendorId,
          status: scheduledIso ? "scheduled" : "pending",
          total_amount: vendorTotal,
          delivery_fee: 0,
          discount_amount: subtotal > 0 ? +(discount * (vendorTotal / subtotal)).toFixed(2) : 0,
          payment_method: paymentMethod,
          delivery_address: finalAddress,
          scheduled_delivery: scheduledIso,
          special_instructions: specialInstructions || null,
          placed_at: new Date().toISOString(),
        };

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert(orderData)
          .select()
          .single();

        if (orderError) throw orderError;

        if (order) {
          if (!firstOrderId) firstOrderId = order.id;

          const { error: itemsError } = await supabase.from("order_items").insert(
            vendorItems.map((i) => ({
              order_id: order.id,
              menu_item_id: safeMenuItemId(i.menu_item_id),
              name: i.name,
              quantity: i.quantity,
              unit_price: i.price,
              price: i.price * i.quantity,
              special_notes: i.special_notes || null,
            }))
          );
          if (itemsError) {
            await supabase.from("orders").delete().eq("id", order.id);
            throw itemsError;
          }

          try {
            await fetch("/api/emails/order-confirmation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id }),
            });
          } catch (emailErr) {
            logger.warn({ err: emailErr }, "Failed to send confirmation email");
          }
        }
      }

      if (isRecurring && vendorIds.length === 1 && scheduledDate && scheduledTime) {
        try {
          const { error: scheduleError } = await supabase
            .from("recurring_schedules")
            .insert({
              user_id: user.id,
              vendor_id: vendorIds[0],
              status: "active",
              frequency: recurringFrequency,
              day_of_week: recurringFrequency === "weekly" || recurringFrequency === "biweekly" ? recurringDayOfWeek : null,
              delivery_time: scheduledTime || null,
              delivery_address: finalAddress,
              payment_method: paymentMethod,
              items: items.map((i) => ({
                menu_item_id: i.menu_item_id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                image_url: i.image_url || null,
              })),
              start_date: new Date().toISOString(),
              next_delivery_date: (() => {
                const timePart = (scheduledTime || "09:00 AM").split(" - ")[0].trim();
                const [time, period] = timePart.split(/\s+/);
                const [hours, minutes] = time.split(":").map(Number);
                let h = hours;
                if (period?.toUpperCase() === "PM" && h < 12) h += 12;
                if (period?.toUpperCase() === "AM" && h === 12) h = 0;
                return new Date(`${scheduledDate}T${String(h).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00`).toISOString();
              })(),
            });
          if (scheduleError) logger.warn({ err: scheduleError }, "Failed to create recurring schedule");
        } catch (scheduleErr) {
          logger.warn({ err: scheduleErr }, "Failed to create recurring schedule");
        }
      }

      clearCart();
      const msg = isRecurring ? "🎉 Recurring order set up! First order on its way." : "🎉 Order placed! Tracking your order...";
      addToast(msg, "success");
      const targetPath = firstOrderId ? `/app/orders/${firstOrderId}` : "/app/orders";
      router.push(targetPath);
      return true;
    } catch (error: unknown) {
      logger.error({ err: error }, "Order placement failed");
      let errorMessage = "Something went wrong. Please try again.";
      if (error instanceof Error && error.message) {
        if (error.message.includes('miiam_food')) {
          errorMessage = "Cart error: Please remove items and add again from Food page.";
        } else if (error.message.includes('violates foreign key')) {
          errorMessage = "Database error: Some items may no longer be available.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error: Please check your internet connection.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      addToast(errorMessage, "error");
      return false;
    }
  }, [items, validateCheckout, supabase, userPincode, addToast, router, clearCart]);

  return { validateCheckout, placeOrder };
}
