"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrderStatusUpdate {
  id: string;
  status: string;
  estimated_delivery_time?: string | null;
  updated_at: string;
}

interface RiderLocationUpdate {
  id: string;
  order_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

interface UseOrderSubscriptionOptions {
  orderId: string;
  onStatusChange?: (status: string) => void;
  onRiderLocationChange?: (location: { lat: number; lng: number }) => void;
}

export function useOrderSubscription({
  orderId,
  onStatusChange,
  onRiderLocationChange,
}: UseOrderSubscriptionOptions) {
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const orderStatusRef = useRef(orderStatus);
  orderStatusRef.current = orderStatus;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const onRiderLocationChangeRef = useRef(onRiderLocationChange);
  onRiderLocationChangeRef.current = onRiderLocationChange;

  useEffect(() => {
    if (!orderId) return;

    const orderChannel = supabase
      .channel(`order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload: { new: OrderStatusUpdate }) => {
          const newStatus = payload.new?.status;
          if (newStatus && newStatus !== orderStatusRef.current) {
            setOrderStatus(newStatus);
            onStatusChangeRef.current?.(newStatus);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR") {
          setError("Failed to subscribe to order updates");
          setIsConnected(false);
        }
      });

    const locationChannel = supabase
      .channel(`rider-location:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rider_locations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: { new: RiderLocationUpdate }) => {
          const newLocation = payload.new;
          if (newLocation?.lat && newLocation?.lng) {
            setRiderLocation({ lat: newLocation.lat, lng: newLocation.lng });
            onRiderLocationChangeRef.current?.({ lat: newLocation.lat, lng: newLocation.lng });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(locationChannel);
      setIsConnected(false);
    };
  }, [orderId]);

  const refreshOrderStatus = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("status, estimated_delivery_time")
      .eq("id", orderId)
      .single();
    
    if (data) {
      setOrderStatus(data.status);
    }
  }, [orderId]);

  return {
    orderStatus,
    riderLocation,
    isConnected,
    error,
    refreshOrderStatus,
  };
}

export function useRiderLocationSubscription(orderId: string) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`rider-loc:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rider_locations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: { new: RiderLocationUpdate }) => {
          if (payload.new?.lat && payload.new?.lng) {
            setLocation({ lat: payload.new.lat, lng: payload.new.lng });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return location;
}