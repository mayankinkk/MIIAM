"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface ActiveChat {
  orderId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function LiveChatSupport() {
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [chats, setChats] = useState<ActiveChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase]);

  useEffect(() => {
    loadChats();
    const channel = supabase.channel("admin-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        loadChats();
        if (selectedChat) loadMessages(selectedChat);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  async function loadChats() {
    const { data } = await supabase
      .from("chat_messages")
      .select("order_id, created_at, message")
      .order("created_at", { ascending: false });
    
    if (data) {
      const uniqueChats = new Map<string, ActiveChat>();
      data.forEach((msg: { order_id: string; created_at: string; message: string }) => {
        if (!uniqueChats.has(msg.order_id)) {
          uniqueChats.set(msg.order_id, {
            orderId: msg.order_id,
            lastMessage: msg.message,
            lastMessageAt: msg.created_at,
            unreadCount: 0
          });
        }
      });
      setChats(Array.from(uniqueChats.values()));
    }
    setLoading(false);
  }

  async function loadMessages(orderId: string) {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  }

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
      const channel = supabase.channel(`chat-${selectedChat}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `order_id=eq.${selectedChat}` }, () => {
          loadMessages(selectedChat);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim() || !selectedChat || !currentUserId) return;
    await supabase.from("chat_messages").insert({
      order_id: selectedChat,
      sender_id: currentUserId,
      sender_type: "support",
      message: newMessage
    });
    setNewMessage("");
    loadMessages(selectedChat);
  }

  if (loading) return <div className="px-8">Loading chats...</div>;

  return (
    <div className="px-8">
      <div className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-8">Live Chat Support</div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--color-border-subtle)]">
            <h2 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm">Active Chats</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined text-4xl mb-2">chat</span>
                <p>No active chats</p>
              </div>
            ) : (
              chats.map(chat => (
                <button
                  key={chat.orderId}
                  onClick={() => setSelectedChat(chat.orderId)}
                  className={`w-full p-4 text-left border-b border-slate-50 hover:bg-[var(--color-surface-subtle)] transition-colors ${
                    selectedChat === chat.orderId ? "bg-[var(--color-primary)]/5 border-l-4 border-l-[var(--color-primary)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="font-bold text-[var(--color-on-surface)]">Order #{chat.orderId.slice(0, 8)}</span>
                  </div>
                  <p className="text-sm text-[var(--color-outline)] truncate">{chat.lastMessage}</p>
                  <p className="text-xs text-[var(--color-outline-variant)] mt-1">
                    {new Date(chat.lastMessageAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
                <div>
                  <h2 className="font-black text-[var(--color-on-surface)]">Order #{selectedChat.slice(0, 8)}</h2>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-[var(--color-outline-variant)]">Online</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChat(null)}
                  className="p-2 text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
                  title="Close chat"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "support" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl ${
                        msg.sender_type === "support"
                          ? "bg-[var(--color-primary)] text-white rounded-br-md"
                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)] rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
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
                    placeholder="Type a message..."
                    className="flex-1 bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 bg-[var(--color-primary)] text-white rounded-xl hover:bg-[#a00018]"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--color-outline-variant)]">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-2">forum</span>
                <p>Select a chat to start</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}