"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface OrderStatus {
  status: string;
  status_description: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface RiderLocation {
  rider_id: string;
  rider_name: string;
  rider_phone: string;
  location: {
    lat: number;
    lng: number;
  };
  updated_at: string;
  eta_minutes: number;
}

export interface OrderTracking {
  orderId: string;
  currentStatus: string;
  statusHistory: OrderStatus[];
  estimatedDeliveryTime: Date | null;
  riderLocation: RiderLocation | null;
  isLive: boolean;
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: "Order placed, waiting for restaurant acceptance",
  accepted: "Restaurant has accepted your order",
  preparing: "Your order is being prepared",
  ready: "Order is ready for pickup",
  ready_for_pickup: "Order is ready for rider pickup",
  picking_up: "Rider is picking up your order",
  on_the_way: "Your order is on the way",
  arrived: "Rider has arrived at your location",
  delivered: "Order delivered successfully",
  cancelled: "Order has been cancelled",
  refunded: "Order has been refunded",
  processing: "We're processing your order",
  shopping: "Rider is shopping for your items",
  no_rider_available: "No riders available",
};

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Order placed!",
  accepted: "Rider accepted your order!",
  processing: "We're processing your documents!",
  preparing: "Restaurant is preparing your order",
  ready_for_pickup: "Order is ready for rider pickup!",
  shopping: "Rider is shopping for your items",
  picking_up: "Rider is picking up your order",
  on_the_way: "Rider is on the way!",
  arrived: "Rider has arrived!",
  delivered: "Order delivered!",
  no_rider_available: "No riders available — please try again",
};

export function useOrderTracking(orderId: string, supabaseClient?: SupabaseClient) {
  const supabase = useMemo(() => supabaseClient || createClient(), [supabaseClient]);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      orderData.vendor_id
        ? supabase.from("vendors").select("*").eq("id", orderData.vendor_id).single()
        : Promise.resolve({ data: null }),
      orderData.rider_id
        ? supabase.from("riders").select("*").eq("id", orderData.rider_id).single()
        : Promise.resolve({ data: null }),
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
      rider: riderRes.data,
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

        const { data: { user } } = await supabase.auth.getUser();
        if (user && mounted) setCurrentUserId(user.id);

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
        setError(err instanceof Error ? err.message : "Failed to load order");
      }
      setLoading(false);
    }

    loadData();

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        async (payload: Record<string, unknown>) => {
          if (!payload.new || typeof payload.new !== "object") return;
          const newData = payload.new as Record<string, unknown>;
          const newStatus = newData.status as string;
          const oldStatus = statusRef.current;

          let riderData = null;
          if (newData.rider_id) {
            const { data } = await supabase
              .from("riders")
              .select("*")
              .eq("id", newData.rider_id as string)
              .maybeSingle();
            riderData = data;
          }

          setOrder((prev: any) => {
            if (!prev) return prev;
            return { ...prev, ...newData, rider: riderData || prev?.rider };
          });

          if (newStatus !== oldStatus && newStatus) {
            const msg = STATUS_MESSAGES[newStatus];
            if (msg) addToast(msg, "info");

            const notifyStatuses = ["accepted", "on_the_way", "arrived", "delivered"];
            if (
              notifyStatuses.includes(newStatus) &&
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("MIIAM", {
                body: STATUS_MESSAGES[newStatus] || `Order status: ${newStatus}`,
                icon: "/icons/icon-192.svg",
                tag: `order-${orderId}`,
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rider_locations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: any) => {
          if (payload.new?.lat && payload.new?.lng) {
            setRiderLocation({ lat: payload.new.lat, lng: payload.new.lng });
          }
        }
      )
      .subscribe();

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
    error,
    riderLocation,
    trackingInfo,
    setTrackingInfo,
    isRefreshing,
    refreshOrder,
    currentUserId,
    statusDescriptions: STATUS_DESCRIPTIONS,
  };
}

export function useRiderLocation(orderId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`rider-location-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rider_locations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: any) => {
          if (payload.new?.lat && payload.new?.lng) {
            setLocation({ lat: payload.new.lat, lng: payload.new.lng });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  return location;
}

export function useActiveOrders(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActiveOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select("*, vendor:vendors(name)")
        .eq("user_id", userId)
        .in("status", [
          "pending", "accepted", "preparing", "ready",
          "picking_up", "on_the_way", "arrived", "scheduled",
        ])
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    }

    fetchActiveOrders();

    const channel = supabase
      .channel("active-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchActiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { orders, loading };
}
