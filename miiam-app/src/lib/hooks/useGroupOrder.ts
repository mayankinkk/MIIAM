"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

export interface GroupOrder {
  id: string;
  creator_id: string;
  vendor_id: string;
  code: string;
  status: "open" | "locked" | "ordered";
  expires_at: string;
  created_at: string;
}

export interface GroupOrderMember {
  id: string;
  group_order_id: string;
  user_id: string;
  display_name: string;
  items: Array<{
    menu_item_id: string;
    name: string;
    quantity: number;
    price: number;
    special_instructions?: string;
  }>;
  joined_at: string;
}

function generateGroupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useGroupOrder() {
  const [loading, setLoading] = useState(false);
  const [groupOrder, setGroupOrder] = useState<GroupOrder | null>(null);
  const [members, setMembers] = useState<GroupOrderMember[]>([]);
  const { addToast } = useToastStore();
  const supabase = createClient();

  const createGroupOrder = useCallback(async (vendorId: string, creatorId: string, displayName: string) => {
    setLoading(true);
    try {
      const code = generateGroupCode();
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("group_orders")
        .insert({
          creator_id: creatorId,
          vendor_id: vendorId,
          code,
          status: "open",
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("group_order_members").insert({
        group_order_id: data.id,
        user_id: creatorId,
        display_name: displayName,
        items: [],
      });

      setGroupOrder(data);
      addToast(`Group order created! Share code: ${code}`, "success");
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to create group order");
      addToast("Failed to create group order", "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, addToast]);

  const joinGroupOrder = useCallback(async (code: string, userId: string, displayName: string) => {
    setLoading(true);
    try {
      const { data: groupData, error: groupError } = await supabase
        .from("group_orders")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("status", "open")
        .single();

      if (groupError || !groupData) {
        addToast("Invalid or expired group order code", "error");
        return null;
      }

      if (new Date(groupData.expires_at) < new Date()) {
        addToast("This group order has expired", "error");
        return null;
      }

      const { data: existingMember } = await supabase
        .from("group_order_members")
        .select("id")
        .eq("group_order_id", groupData.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingMember) {
        const { error: memberError } = await supabase.from("group_order_members").insert({
          group_order_id: groupData.id,
          user_id: userId,
          display_name: displayName,
          items: [],
        });
        if (memberError) throw memberError;
      }

      setGroupOrder(groupData);
      addToast(`Joined group order ${code}!`, "success");
      return groupData;
    } catch (err) {
      logger.error({ err }, "Failed to join group order");
      addToast("Failed to join group order", "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, addToast]);

  const updateMyItems = useCallback(async (memberId: string, items: GroupOrderMember["items"]) => {
    try {
      const { error } = await supabase
        .from("group_order_members")
        .update({ items })
        .eq("id", memberId);
      if (error) throw error;
    } catch (err) {
      logger.error({ err }, "Failed to update group order items");
    }
  }, [supabase]);

  const lockGroupOrder = useCallback(async (groupOrderId: string) => {
    try {
      const { error } = await supabase
        .from("group_orders")
        .update({ status: "locked" })
        .eq("id", groupOrderId);
      if (error) throw error;
      setGroupOrder(prev => prev ? { ...prev, status: "locked" } : null);
      addToast("Group order locked! Proceeding to checkout.", "success");
    } catch (err) {
      logger.error({ err }, "Failed to lock group order");
    }
  }, [supabase, addToast]);

  const loadMembers = useCallback(async (groupOrderId: string) => {
    try {
      const { data, error } = await supabase
        .from("group_order_members")
        .select("*")
        .eq("group_order_id", groupOrderId)
        .order("joined_at");
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      logger.error({ err }, "Failed to load group order members");
    }
  }, [supabase]);

  return {
    loading,
    groupOrder,
    members,
    createGroupOrder,
    joinGroupOrder,
    updateMyItems,
    lockGroupOrder,
    loadMembers,
  };
}
