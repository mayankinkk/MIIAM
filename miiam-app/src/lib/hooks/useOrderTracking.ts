"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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

export function useOrderTracking(orderId: string) {
  const supabase = createClient();
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusDescriptions: Record<string, string> = {
    pending: "Order placed, waiting for restaurant acceptance",
    accepted: "Restaurant has accepted your order",
    preparing: "Your order is being prepared",
    ready: "Order is ready for pickup",
    picking_up: "Rider is picking up your order",
    on_the_way: "Your order is on the way",
    delivered: "Order delivered successfully",
    cancelled: "Order has been cancelled",
    refunded: "Order has been refunded",
  };

  const fetchOrderData = useCallback(async () => {
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          vendor:vendors(name),
          rider:riders(name, phone),
          items:order_items(*, menu_item:menu_items(*))
        `)
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      const statusHistory: OrderStatus[] = [
        {
          status: order.status,
          status_description: statusDescriptions[order.status] || "Unknown status",
          timestamp: order.updated_at || order.created_at,
        },
      ];

      const estimatedDeliveryTime = order.estimated_delivery
        ? new Date(order.estimated_delivery)
        : null;

      setTracking({
        orderId: order.id,
        currentStatus: order.status,
        statusHistory,
        estimatedDeliveryTime,
        riderLocation: null,
        isLive: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId, supabase]);

  useEffect(() => {
    fetchOrderData();

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
        (payload) => {
          const newOrder = payload.new as any;
          
          setTracking((prev) => {
            if (!prev) return prev;
            
            const newStatus: OrderStatus = {
              status: newOrder.status,
              status_description: statusDescriptions[newOrder.status] || "Unknown status",
              timestamp: newOrder.updated_at,
            };

            return {
              ...prev,
              currentStatus: newOrder.status,
              statusHistory: [newStatus, ...prev.statusHistory],
              estimatedDeliveryTime: newOrder.estimated_delivery
                ? new Date(newOrder.estimated_delivery)
                : prev.estimatedDeliveryTime,
            };
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_tracking",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const trackingData = payload.new as any;
          
          if (trackingData.location) {
            setTracking((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                riderLocation: {
                  rider_id: trackingData.rider_id || "",
                  rider_name: trackingData.rider_name || "",
                  rider_phone: trackingData.rider_phone || "",
                  location: trackingData.location,
                  updated_at: trackingData.created_at,
                  eta_minutes: trackingData.eta_minutes || 0,
                },
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase, fetchOrderData]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchOrderData();
  }, [fetchOrderData]);

  return {
    tracking,
    loading,
    error,
    refetch,
  };
}

export function useRiderLocation(orderId: string) {
  const supabase = createClient();
  const [location, setLocation] = useState<RiderLocation | null>(null);

  useEffect(() => {
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
        (payload) => {
          const newLocation = payload.new as any;
          setLocation({
            rider_id: newLocation.rider_id,
            rider_name: newLocation.rider_name || "",
            rider_phone: newLocation.rider_phone || "",
            location: newLocation.location,
            updated_at: newLocation.updated_at,
            eta_minutes: newLocation.eta_minutes || 0,
          });
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
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActiveOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select("*, vendor:vendors(name)")
        .eq("user_id", userId)
        .in("status", ["pending", "accepted", "preparing", "ready", "picking_up", "on_the_way", "scheduled"])
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
        (payload) => {
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