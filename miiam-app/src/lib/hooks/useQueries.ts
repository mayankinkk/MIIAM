"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useMemo } from "react";

export function useServices(category?: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["services", category],
    queryFn: async () => {
      let query = supabase
        .from("menu_items")
        .select("id, vendor_id, name, price, category, image_url, is_veg, is_available, description, preparation_time, vendors!inner(shop_name, status, delivery_charge, delivery_time_min, delivery_time_max)");

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useRestaurants(city?: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["restaurants", city],
    queryFn: async () => {
      let query = supabase
        .from("vendors")
        .select("id, shop_name, name, cuisine, image_url, cover_image_url, rating, review_count, delivery_time_min, delivery_time_max, delivery_charge, min_order_amount, is_featured, status, type, pincode, city")
        .eq("status", "active");

      if (city) {
        query = query.ilike("city", `%${city}%`);
      }

      const { data, error } = await query.order("shop_name");
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserBookings(userId?: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["bookings", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("service_bookings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useNotifications(userId?: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
