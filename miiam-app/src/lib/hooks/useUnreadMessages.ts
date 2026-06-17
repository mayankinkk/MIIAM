"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadMessages(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [unreadByOrder, setUnreadByOrder] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!userId) return;

    async function loadUnread() {
      const { data } = await supabase
        .from("chat_messages")
        .select("order_id")
        .neq("sender_id", userId)
        .eq("read", false);

      if (data) {
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
      const channel = supabase
        .channel(`unread-messages-${userId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: orderIds.length > 0 ? `order_id=in.(${orderIds.join(",")})` : undefined }, () => {
          loadUnread();
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages", filter: orderIds.length > 0 ? `order_id=in.(${orderIds.join(",")})` : undefined }, () => {
          loadUnread();
        })
        .subscribe();
      return channel;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;
    setupChannel().then(ch => { channel = ch; });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { unreadByOrder, totalUnread };
}
