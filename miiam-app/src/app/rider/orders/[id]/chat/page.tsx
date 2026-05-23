"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "@/lib/hooks/useChat";

export default function RiderChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
      else router.push("/rider/login");
    });
  }, [supabase, router]);

  const { messages, loading, sendMessage } = useChat(orderId, currentUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !currentUserId) return;
    setSending(true);
    await sendMessage(newMessage.trim(), "rider");
    setNewMessage("");
    setSending(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-outline-variant/20 shrink-0">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-white">chat</span>
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-on-surface">Customer Chat</h1>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Online
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300">chat</span>
            <p className="text-on-surface-variant mt-4">No messages yet</p>
            <p className="text-sm text-slate-400">Start the conversation with the customer!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  msg.sender_id === currentUserId
                    ? "bg-[#0b50d5] text-white rounded-br-md"
                    : "bg-white text-on-surface rounded-bl-md shadow-sm"
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender_id === currentUserId ? "text-white/70" : "text-on-surface-variant"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 pt-0 bg-white border-t border-outline-variant/20 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-surface rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0b50d5] text-white disabled:opacity-50"
          >
            {sending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined">send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
