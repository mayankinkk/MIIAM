"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import type { SupabaseClient } from "@supabase/supabase-js";
import logger from "@/lib/logger";

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

interface OrderItemRecord {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  price: number;
  unit_price: number;
  special_notes?: string | null;
  menu_item?: MenuItemRecord | null;
}

interface MenuItemRecord {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  [key: string]: unknown;
}

interface VendorRecord {
  id: string;
  name?: string;
  shop_name?: string;
  [key: string]: unknown;
}

interface RiderRecord {
  id: string;
  name?: string;
  phone?: string;
  [key: string]: unknown;
}

interface LocationRecord {
  lat: number;
  lng: number;
}

interface OrderRecord {
  id: string;
  status: string;
  user_id: string;
  vendor_id: string | null;
  rider_id: string | null;
  total_amount: number;
  vendor?: VendorRecord | null;
  rider?: RiderRecord | null;
  items?: OrderItemRecord[];
  _location?: LocationRecord | null;
  [key: string]: unknown;
}

interface ActiveOrderRecord {
  id: string;
  status: string;
  total_amount: number;
  placed_at: string;
  vendors?: { shop_name: string }[] | { shop_name: string } | null;
  [key: string]: unknown;
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: "Order placed, waiting for restaurant acceptance",
  accepted: "Restaurant has accepted your order",
  preparing: "Your order is being prepared",
  ready: "Order is ready for pickup",
  ready_for_pickup: "Order is ready — rider is picking it up",
  shopping: "Rider is at the store picking your items",
  picked_up: "Rider has picked up your order and is on the way!",
  picking_up: "Rider is picking up your order",
  on_the_way: "Your order is on the way",
  arrived: "Rider has arrived at your location",
  delivered: "Order delivered successfully",
  cancelled: "Order has been cancelled",
  refunded: "Order has been refunded",
  processing: "We're processing your order",
  no_rider_available: "No riders available",
};

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Order placed!",
  accepted: "Order accepted by restaurant!",
  processing: "We're processing your documents!",
  preparing: "Restaurant is preparing your order",
  ready_for_pickup: "Order is ready — rider picking it up!",
  shopping: "Rider is picking your items at the store",
  picked_up: "Rider has your order! On the way 🛵",
  picking_up: "Rider is picking up your order",
  on_the_way: "Rider is on the way!",
  arrived: "Rider has arrived!",
  delivered: "Order delivered!",
  no_rider_available: "No riders available — please try again",
};

export function useOrderTracking(orderId: string, supabaseClient?: SupabaseClient) {
  const supabase = useMemo(() => supabaseClient || createClient(), [supabaseClient]);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<{ eta: number; distance: string; leg: "to_pickup" | "to_drop" } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const statusRef = useRef(order?.status);
  const { addToast } = useToastStore();
  const addToastRef = useRef(addToast);
  addToastRef.current = addToast;

  useEffect(() => {
    statusRef.current = order?.status;
  }, [order?.status]);

  const fetchOrderData = useCallback(async (id: string) => {
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, vendor_id, rider_id, status, total_amount, delivery_fee, discount_amount, payment_method, delivery_address, special_instructions, placed_at, delivered_at")
      .eq("id", id)
      .maybeSingle();

    if (orderError || !orderData) return null;

    const [vendorRes, riderRes, itemsRes, locationRes] = await Promise.all([
      orderData.vendor_id
        ? supabase.from("vendors").select("id, shop_name, address, phone, latitude, longitude").eq("id", orderData.vendor_id).single()
        : Promise.resolve({ data: null }),
      orderData.rider_id
        ? supabase.from("riders").select("id, name, phone").eq("id", orderData.rider_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("order_items").select("id, order_id, menu_item_id, name, quantity, price, unit_price, special_notes, status, actual_price, picked").eq("order_id", id),
      supabase.from("rider_locations").select("lat, lng").eq("order_id", id).limit(1).maybeSingle(),
    ]);

    const items = itemsRes.data || [];

    if (items.length > 0) {
      const menuItemIds = items.map((i: OrderItemRecord) => i.menu_item_id).filter(Boolean) as string[];
      if (menuItemIds.length > 0) {
        const { data: menuItems } = await supabase.from("menu_items").select("id, name, price, image_url, category").in("id", menuItemIds);
        if (menuItems) {
          items.forEach((item: OrderItemRecord) => {
            item.menu_item = (menuItems as MenuItemRecord[]).find((mi: MenuItemRecord) => mi.id === item.menu_item_id) || null;
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
      logger.error({ err }, "Failed to refresh order");
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
        logger.error({ err }, "Failed to load order");
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
        async         (payload: { new: Record<string, unknown> }) => {
          if (!payload.new || typeof payload.new !== "object") return;
          const newData = payload.new as Record<string, unknown>;
          const newStatus = newData.status as string;
          const oldStatus = statusRef.current;

          let riderData = null;
          if (newData.rider_id) {
            const { data } = await supabase
              .from("riders")
              .select("id, name, phone")
              .eq("id", newData.rider_id as string)
              .maybeSingle();
            riderData = data;
          }

          setOrder((prev: OrderRecord | null) => {
            if (!prev) return prev;
            return { ...prev, ...newData, rider: riderData || prev?.rider };
          });

          if (newStatus !== oldStatus && newStatus) {
            const msg = STATUS_MESSAGES[newStatus];
            if (msg) addToastRef.current(msg, "info");

            const notifyStatuses = ["accepted", "preparing", "ready_for_pickup", "shopping", "picked_up", "delivered"];
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
        (payload: { new: Record<string, unknown> }) => {
          const newRecord = payload.new as Record<string, unknown>;
          if (newRecord.lat && newRecord.lng) {
            setRiderLocation({ lat: newRecord.lat as number, lng: newRecord.lng as number });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase, fetchOrderData]);

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
        (payload: { new: Record<string, unknown> }) => {
          const newLoc = payload.new as Record<string, unknown>;
          if (newLoc.lat && newLoc.lng) {
            setLocation({ lat: newLoc.lat as number, lng: newLoc.lng as number });
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
  const [orders, setOrders] = useState<ActiveOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActiveOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select("id, user_id, vendor_id, status, total_amount, placed_at, vendor:vendors(shop_name)")
        .eq("user_id", userId)
        .in("status", [
          "pending", "accepted", "preparing", "ready_for_pickup",
          "shopping", "picked_up", "picking_up", "on_the_way", "arrived", "scheduled",
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
