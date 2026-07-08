"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

const supabase = createClient();

export interface RealtimeMetrics {
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  avgOrderValue: number;
  ordersToday: number;
  revenueToday: number;
  lastUpdated: string;
}

export function useRealtimeMetrics(): RealtimeMetrics & { loading: boolean; refresh: () => void } {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    avgOrderValue: 0,
    ordersToday: 0,
    revenueToday: 0,
    lastUpdated: "",
  });
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const [ordersResult, todayResult, activeResult] = await Promise.all([
        supabase.from("orders").select("id, total_amount"),
        supabase.from("orders").select("id, total_amount").gte("created_at", today),
        supabase.from("orders").select("id").in("status", ["pending", "accepted", "preparing", "ready_for_pickup", "shopping", "picked_up", "on_the_way"]),
      ]);

      const allOrders = ordersResult.data || [];
      const todayOrders = todayResult.data || [];
      const activeOrders = activeResult.data || [];

      const totalRevenue = allOrders.reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0);
      const revenueToday = todayOrders.reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0);

      setMetrics({
        totalOrders: allOrders.length,
        totalRevenue,
        activeOrders: activeOrders.length,
        avgOrderValue: allOrders.length > 0 ? Math.round(totalRevenue / allOrders.length) : 0,
        ordersToday: todayOrders.length,
        revenueToday,
        lastUpdated: new Date().toLocaleTimeString("en-IN"),
      });
    } catch (err) {
      logger.error({ err }, "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    channelRef.current = supabase
      .channel("admin-metrics")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchMetrics]);

  return { ...metrics, loading, refresh: fetchMetrics };
}

export function useRealtimeOrders(limit = 20) {
  const [orders, setOrders] = useState<Array<{
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    vendor_id: string;
    user_id: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at, vendor_id, user_id")
        .order("created_at", { ascending: false })
        .limit(limit);

      setOrders(data || []);
    } catch (err) {
      logger.error({ err }, "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchOrders();

    channelRef.current = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchOrders]);

  return { orders, loading, refresh: fetchOrders };
}

export function useRealtimeVendorOrders(vendorId: string) {
  const [orders, setOrders] = useState<Array<{
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    user_id: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at, user_id")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(20);

      setOrders(data || []);
    } catch (err) {
      logger.error({ err }, "Failed to fetch vendor orders");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchOrders();

    channelRef.current = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${vendorId}` },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchOrders, vendorId]);

  return { orders, loading, refresh: fetchOrders };
}
