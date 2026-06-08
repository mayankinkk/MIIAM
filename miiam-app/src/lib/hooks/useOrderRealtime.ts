"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useToastStore } from "@/lib/store/toastStore";
import type { SupabaseClient } from "@supabase/supabase-js";

export function useOrderRealtime(supabase: SupabaseClient, orderId: string) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<{ eta: number; distance: string; leg: "to_pickup" | "to_drop" } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const statusRef = useRef(order?.status);
  const { addToast } = useToastStore();

  useEffect(() => {
    statusRef.current = order?.status;
  }, [order?.status]);

  const fetchOrderData = useCallback(async (id: string) => {
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (orderError || !orderData) return null;

    const [vendorRes, riderRes, itemsRes, locationRes] = await Promise.all([
      orderData.vendor_id ? supabase.from("vendors").select("*").eq("id", orderData.vendor_id).single() : Promise.resolve({ data: null }),
      orderData.rider_id ? supabase.from("riders").select("*").eq("id", orderData.rider_id).single() : Promise.resolve({ data: null }),
      supabase.from("order_items").select("*").eq("order_id", id),
      supabase.from("rider_locations").select("lat, lng").eq("order_id", id).limit(1).maybeSingle(),
    ]);

    const items = itemsRes.data || [];

    if (items.length > 0) {
      const menuItemIds = items.map((i: any) => i.menu_item_id).filter(Boolean);
      if (menuItemIds.length > 0) {
        const { data: menuItems } = await supabase.from("menu_items").select("*").in("id", menuItemIds);
        if (menuItems) {
          items.forEach((item: any) => {
            item.menu_item = menuItems.find((mi: any) => mi.id === item.menu_item_id) || null;
          });
        }
      }
    }

    return {
      ...orderData,
      vendor: vendorRes.data,
      riders: riderRes.data,
      items,
      _location: locationRes.data,
    };
  }, [supabase]);

  const refreshOrder = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchOrderData(orderId);
      if (data) {
        const { _location, ...orderData } = data;
        setOrder(orderData);
        if (_location) setRiderLocation({ lat: _location.lat, lng: _location.lng });
      }
    } catch (err) {
      console.error("Failed to refresh order:", err);
    }
    setIsRefreshing(false);
  }, [orderId, fetchOrderData]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        await new Promise(r => setTimeout(r, 500));

        const { data: { user } } = await supabase.auth.getUser();
        if (user && mounted) setCurrentUserId(user.id);

        const { data: basicOrder, error: fetchError } = await supabase
          .from("orders")
          .select("id, user_id, status")
          .eq("id", orderId)
          .maybeSingle();

        if (fetchError) {
          console.error("Order fetch error:", fetchError, "ID:", orderId);
          addToast("Failed to load order details. Please try again.", "error");
          if (!mounted) return;
          setOrder(null);
          setLoading(false);
          return;
        }

        if (!user) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            if (!mounted) return;
            setOrder(null);
            setLoading(false);
            return;
          }
        }

        const data = await fetchOrderData(orderId);
        if (!mounted) return;
        if (data) {
          const { _location, ...orderData } = data;
          setOrder(orderData);
          if (_location) setRiderLocation({ lat: _location.lat, lng: _location.lng });
        } else {
          setOrder(null);
        }
      } catch (err) {
        console.error("Failed to load order:", err);
        if (!mounted) return;
        setOrder(null);
      }
      setLoading(false);
    }

    loadData();

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      }, async (payload) => {
        if (payload.new && typeof payload.new === "object") {
          const newData = payload.new as any;
          const newStatus = newData.status;
          const oldStatus = statusRef.current;

          let riderData = null;
          if (newData.rider_id) {
            const { data } = await supabase.from("riders").select("*").eq("id", newData.rider_id).maybeSingle();
            riderData = data;
          }

          setOrder((prev: any) => {
            if (!prev) return prev;
            return { ...prev, ...newData, riders: riderData || prev?.riders };
          });

          if (newStatus !== oldStatus && newStatus) {
            const statusMessages: Record<string, string> = {
              pending: "Order placed!",
              accepted: "🚴 Rider accepted your order!",
              processing: "🖨️ We're printing your documents!",
              preparing: "Restaurant is preparing your order",
              ready_for_pickup: "📦 Order is ready for rider pickup!",
              shopping: "Rider is shopping for your items",
              picking_up: "Rider is picking up your order",
              on_the_way: "🚴 Rider is on the way!",
              arrived: "📍 Rider has arrived!",
              delivered: "✅ Order delivered!",
              no_rider_available: "❌ No riders available — please try again",
            };
            const msg = statusMessages[newStatus];
            if (msg) addToast(msg, "info");

            const notifyStatuses = ["accepted", "on_the_way", "arrived", "delivered"];
            if (notifyStatuses.includes(newStatus) && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("MIIAM", {
                body: statusMessages[newStatus] || `Order status: ${newStatus}`,
                icon: "/icons/icon-192.svg",
                tag: `order-${orderId}`,
              });
            }
          }
        }
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "rider_locations",
        filter: `order_id=eq.${orderId}`,
      }, (payload: any) => {
        if (payload.new?.lat && payload.new?.lng) {
          setRiderLocation({ lat: payload.new.lat, lng: payload.new.lng });
        }
      })
      .subscribe((status) => {
        console.log("Order tracking channel status:", status);
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase, addToast, fetchOrderData]);

  useEffect(() => {
    const interval = setInterval(refreshOrder, 25000);
    return () => clearInterval(interval);
  }, [refreshOrder]);

  return {
    order,
    setOrder,
    loading,
    riderLocation,
    trackingInfo,
    setTrackingInfo,
    isRefreshing,
    refreshOrder,
    currentUserId,
  };
}
