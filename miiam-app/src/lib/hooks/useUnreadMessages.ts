"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadMessages(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [unreadByOrder, setUnreadByOrder] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadUnread() {
      const { data } = await supabase
        .from("chat_messages")
        .select("order_id")
        .neq("sender_id", userId)
        .eq("read", false);

      if (data && !cancelled) {
        const counts: Record<string, number> = {};
        data.forEach((msg: { order_id: string }) => {
          counts[msg.order_id] = (counts[msg.order_id] || 0) + 1;
        });
        setUnreadByOrder(counts);
        setTotalUnread(data.length);
      }
    }

    loadUnread();

    async function setupChannel() {
      const { data: orders } = await supabase.from("orders").select("id").eq("user_id", userId);
      const orderIds = (orders?.map((o: { id: string }) => o.id) || []).filter((id: string): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/.test(id));

      // Skip subscription if no orders — filter=undefined would leak ALL messages
      if (orderIds.length === 0) return null;

      const channel = supabase
        .channel(`unread-messages-${userId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `order_id=in.(${orderIds.join(",")})` }, () => {
          loadUnread();
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages", filter: `order_id=in.(${orderIds.join(",")})` }, () => {
          loadUnread();
        })
        .subscribe();
      return channel;
    }

    setupChannel().then(ch => {
      if (cancelled) {
        supabase.removeChannel(ch);
      } else {
        channelRef.current = ch;
      }
    });

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, supabase]);

  return { unreadByOrder, totalUnread };
}
