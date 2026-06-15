"use client";

import { useEffect, useState, useRef } from "react";
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
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [activeOrder, setActiveOrder] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!vendorId) return;
    const channel = supabase
      .channel("partner-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_chat" }, () => {
        init();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    if (data) setMessages(data as any);
  }

  const grouped = messages.reduce((acc, m) => {
    if (!acc[m.order_id]) acc[m.order_id] = [];
    acc[m.order_id].push(m);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  const orderIds = Object.keys(grouped);

  async function sendReply() {
    if (!reply.trim() || !activeOrder) return;
    setSending(true);
    const { error } = await supabase.from("order_chat").insert({
      order_id: activeOrder,
      sender: "vendor",
      message: reply.trim(),
      read: false,
    });
    if (!error) {
      setReply("");
      init();
    }
    setSending(false);
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chat Support</h1>
        <p className="text-slate-500 text-sm mt-1">Respond to customer messages</p>
      </div>

      {orderIds.length === 0 ? (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-12 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300">chat</span>
          <p className="text-slate-400 font-medium mt-3">No messages yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[var(--color-surface-container-lowest)] rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {orderIds.map((oid) => {
              const msgs = grouped[oid];
              const last = msgs[0];
              const unread = msgs.filter(m => m.sender === "customer" && !m.read).length;
              return (
                <button
                  key={oid}
                  onClick={() => setActiveOrder(oid)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${activeOrder === oid ? "bg-slate-50 ring-1 ring-[#ba001c]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Order #{oid.slice(0, 8)}</span>
                    {unread > 0 && <span className="bg-[#ba001c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">{last.message}</p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] rounded-2xl border border-slate-200 flex flex-col">
            {!activeOrder ? (
              <div className="p-12 text-center text-slate-400 font-medium">Select a conversation</div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-800">
                  Order #{activeOrder.slice(0, 8)}
                </div>
                <div className="flex-1 p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                  {(grouped[activeOrder] || []).slice().reverse().map((m) => (
                    <div key={m.id} className={`flex ${m.sender === "vendor" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.sender === "vendor" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-800"}`}>
                        <p>{m.message}</p>
                        <p className={`text-[10px] mt-1 ${m.sender === "vendor" ? "text-white/60" : "text-slate-400"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#ba001c]"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="px-5 py-2.5 bg-[#ba001c] text-white font-bold rounded-xl text-sm hover:bg-[#a40017] disabled:opacity-50"
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
