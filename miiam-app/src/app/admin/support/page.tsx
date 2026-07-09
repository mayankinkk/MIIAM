"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

interface SupportConversation {
  id: string;
  user_id: string;
  status: string;
  priority: string;
  created_at: string;
  user_name?: string;
  user_phone?: string;
  lastMessage?: string;
  unreadCount: number;
}

interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export default function LiveChatSupport() {
  const supabase = useMemo(() => createClient(), []);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase]);

  useEffect(() => {
    loadConversations();
    const channel = supabase.channel("admin-support")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, () => {
        loadConversations();
        if (selectedConv) loadMessages(selectedConv);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_conversations" }, () => {
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, selectedConv]);

  async function loadConversations() {
    try {
      const { data: convs } = await supabase
        .from("support_conversations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!convs) { setLoading(false); return; }

      const enriched = await Promise.all(
        convs.map(async (conv: SupportConversation) => {
          // Get user info
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone_number")
            .eq("id", conv.user_id)
            .maybeSingle();

          // Get last message
          const { data: lastMsg } = await supabase
            .from("support_messages")
            .select("message, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count unread (messages from user that admin hasn't seen)
          const { count } = await supabase
            .from("support_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("sender_type", "user");

          return {
            ...conv,
            user_name: profile?.full_name || "User",
            user_phone: profile?.phone_number || "",
            lastMessage: lastMsg?.message || "",
            unreadCount: count || 0,
          };
        })
      );

      setConversations(enriched);
    } catch (err) {
      logger.error({ err: err }, "Failed to load support conversations");
    }
    setLoading(false);
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  }

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);
      const channel = supabase.channel(`support-msg-${selectedConv}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${selectedConv}` }, () => {
          loadMessages(selectedConv);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedConv, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConv || !currentUserId) return;
    await supabase.from("support_messages").insert({
      conversation_id: selectedConv,
      sender_id: currentUserId,
      sender_type: "support",
      message: newMessage,
    });
    setNewMessage("");
    loadMessages(selectedConv);
  }

  async function updateStatus(convId: string, status: string) {
    await supabase
      .from("support_conversations")
      .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
      .eq("id", convId);
    loadConversations();
  }

  if (loading) return <div className="px-8 py-4 text-[var(--color-outline-variant)]">Loading conversations...</div>;

  return (
    <div className="px-8">
      <div className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">Live Chat Support</div>
      <p className="text-sm text-[var(--color-outline-variant)] mb-8">Customer support conversations from the chatbot</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversation List */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--color-border-subtle)]">
            <h2 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined text-4xl mb-2">support_agent</span>
                <p>No conversations yet</p>
                <p className="text-xs mt-1">When customers chat with the bot and need human help, they&apos;ll appear here</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { setSelectedConv(conv.id); }}
                  className={`w-full p-4 text-left border-b border-slate-50 hover:bg-[var(--color-surface-subtle)] transition-colors ${
                    selectedConv === conv.id ? "bg-[var(--color-primary)]/5 border-l-4 border-l-[var(--color-primary)]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        conv.status === "open" ? "bg-green-500 animate-pulse" :
                        conv.status === "pending" ? "bg-amber-500" :
                        conv.status === "resolved" ? "bg-blue-500" : "bg-gray-400"
                      }`} />
                      <span className="font-bold text-[var(--color-on-surface)] text-sm">{conv.user_name}</span>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{conv.unreadCount}</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-outline-variant)] mb-1">{conv.user_phone}</p>
                  <p className="text-sm text-[var(--color-outline)] truncate">{conv.lastMessage}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-[var(--color-outline-variant)]">
                      {new Date(conv.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      conv.status === "open" ? "bg-green-100 text-green-700" :
                      conv.status === "pending" ? "bg-amber-100 text-amber-700" :
                      conv.status === "resolved" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm flex flex-col">
          {selectedConv ? (
            <>
              <div className="p-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
                <div>
                  <h2 className="font-black text-[var(--color-on-surface)]">
                    {conversations.find(c => c.id === selectedConv)?.user_name || "User"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-[var(--color-outline-variant)]">Online</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={conversations.find(c => c.id === selectedConv)?.status || "open"}
                    onChange={(e) => updateStatus(selectedConv, e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    onClick={() => setSelectedConv(null)}
                    className="p-2 text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "support" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender_type !== "support" && (
                      <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-white text-xs font-black mr-2 flex-shrink-0 mt-auto">
                        {msg.sender_type === "user" ? "👤" : "M"}
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl ${
                        msg.sender_type === "support"
                          ? "bg-[var(--color-primary)] text-white rounded-br-md"
                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)] rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender_type === "support" ? "text-white/60" : "text-[var(--color-outline-variant)]"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-[var(--color-border-subtle)]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a reply..."
                    className="flex-1 bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 bg-primary text-white rounded-xl hover:bg-primary-dim"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--color-outline-variant)]">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-2">support_agent</span>
                <p>Select a conversation to start</p>
                <p className="text-xs mt-2">Conversations appear here when customers need human support</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
