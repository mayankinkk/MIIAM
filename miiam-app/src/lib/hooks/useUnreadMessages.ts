"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadMessages(userId: string) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
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
        data.forEach((msg) => {
          counts[msg.order_id] = (counts[msg.order_id] || 0) + 1;
        });
        setUnreadByOrder(counts);
        setTotalUnread(data.length);
      }
    }

    loadUnread();

    const channel = supabase
      .channel("unread-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        loadUnread();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, () => {
        loadUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { unreadByOrder, totalUnread };
}
