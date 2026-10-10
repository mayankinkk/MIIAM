"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorForUser } from "@/lib/vendor";

interface ChatMessage {
  id: string;
  order_id: string;
  sender: "customer" | "vendor";
  message: string;
  created_at: string;
  read: boolean;
  customer_name?: string;
}

export default function PartnerChatPage() {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const vendorOrderIdsRef = useRef(new Set<string>());

  useEffect(() => {
    init();
  }, []);

  // Real-time subscription for new messages (filtered to this vendor's orders)
  useEffect(() => {
    if (!vendorId) return;
    const channel = supabase
      .channel("partner-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_chat" },
        (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as ChatMessage;
          // Only add if this message belongs to one of this vendor's orders
          if (vendorOrderIdsRef.current.has(newMsg.order_id)) {
            setMessages((prev) => [newMsg, ...prev]);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  async function init() {
    const v = await getVendorForUser();
    if (!v) return;
    setVendorId(v.id);
    const { data } = await supabase
      .from("order_chat")
      .select("*, orders!inner(vendor_id)")
      .eq("orders.vendor_id", v.id)
      .order("created_at", { ascending: false });
    if (data) {
      setMessages(data as ChatMessage[]);
      // Track which orders belong to this vendor for realtime filtering
      vendorOrderIdsRef.current = new Set(data.map((m: ChatMessage) => m.order_id));
    }
  }

  const grouped = messages.reduce(
    (acc, m) => {
      if (!acc[m.order_id]) acc[m.order_id] = [];
      acc[m.order_id].push(m);
      return acc;
    },
    {} as Record<string, ChatMessage[]>
  );

  const orderIds = Object.keys(grouped);

  async function sendReply() {
    if (!reply.trim() || !activeOrder) return;
    setSending(true);
    const sanitized = reply.replace(/<[^>]*>/g, "").trim();
    if (!sanitized) {
      setSending(false);
      return;
    }
    const { error } = await supabase.from("order_chat").insert({
      order_id: activeOrder,
      sender: "vendor",
      message: sanitized,
      read: false,
    });
    if (!error) {
      setReply("");
      // Append the new message locally instead of re-fetching all messages
      const newMsg: ChatMessage = {
        id: crypto.randomUUID(),
        order_id: activeOrder,
        sender: "vendor",
        message: sanitized,
        created_at: new Date().toISOString(),
        read: false,
      };
      setMessages((prev) => [newMsg, ...prev]);
    }
    setSending(false);
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Chat Support
        </h1>
        <p className="mt-1 text-sm text-[var(--color-outline)]">Respond to customer messages</p>
      </div>

      {orderIds.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">
            chat
          </span>
          <p className="mt-3 font-medium text-[var(--color-outline-variant)]">No messages yet</p>
          <p className="mt-1 text-sm text-[var(--color-outline-variant)]">
            Messages from customers will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="divide-y divide-[var(--color-border-subtle)] rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] lg:col-span-1">
            {orderIds.map((oid) => {
              const msgs = grouped[oid];
              const last = msgs[0];
              const unread = msgs.filter((m) => m.sender === "customer" && !m.read).length;
              return (
                <button
                  key={oid}
                  onClick={() => setActiveOrder(oid)}
                  className={`w-full p-4 text-left transition-colors hover:bg-[var(--color-surface-subtle)] ${activeOrder === oid ? "bg-[var(--color-surface-subtle)] ring-1 ring-[var(--color-primary)]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--color-on-surface)]">
                      Order #{oid.slice(0, 8)}
                    </span>
                    {unread > 0 && (
                      <span className="text-on-primary rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--color-outline-variant)]">
                    {last.message}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] lg:col-span-2">
            {!activeOrder ? (
              <div className="p-12 text-center font-medium text-[var(--color-outline-variant)]">
                Select a conversation
              </div>
            ) : (
              <>
                <div className="border-b border-[var(--color-border-subtle)] p-4 text-sm font-bold text-[var(--color-on-surface)]">
                  Order #{activeOrder.slice(0, 8)}
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {(grouped[activeOrder] || [])
                    .slice()
                    .reverse()
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.sender === "vendor" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.sender === "vendor" ? "text-on-primary bg-[var(--color-primary)]" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"}`}
                        >
                          <p>{m.message}</p>
                          <p
                            className={`mt-1 text-[10px] ${m.sender === "vendor" ? "text-white/60" : "text-[var(--color-outline-variant)]"}`}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2 border-t border-[var(--color-border-subtle)] p-4">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    aria-label="Send message"
                    className="text-on-primary rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-primary-dim)] disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
