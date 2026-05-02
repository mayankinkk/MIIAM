"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "@/lib/hooks/useChat";

export default function ChatPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    getUser();
  }, [supabase]);

  const { messages, loading, isTyping, sendMessage, sendTypingIndicator } = useChat(
    orderId,
    currentUserId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !currentUserId) return;

    setSending(true);
    await sendMessage(newMessage.trim(), "user");
    setNewMessage("");
    setSending(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTypingIndicator(e.target.value.length > 0);
  };

  const quickReplies = [
    "Where are you?",
    "Please call me",
    "Coming soon?",
  ];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4f4] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-white border-b border-[#dd9ca6]/20">
        <div className="flex items-center gap-3">
          <Link href={`/app/orders/${orderId}`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4]">
            <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
          </Link>
          <div className="w-10 h-10 rounded-full bg-[#ba001c] flex items-center justify-center">
            <span className="material-symbols-outlined text-white">two_wheeler</span>
          </div>
          <div>
            <h1 className="font-bold text-[#4d212a]">Rider Chat</h1>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4]">
            <span className="material-symbols-outlined text-[#ba001c]">call</span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 pt-20 pb-24 px-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300">chat</span>
            <p className="text-[#814c55] mt-4">No messages yet</p>
            <p className="text-sm text-slate-400">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <span className="text-xs text-[#814c55] bg-white/80 px-4 py-1 rounded-full">
                Today
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                    msg.sender_id === currentUserId
                      ? "bg-[#ba001c] text-white rounded-br-md"
                      : "bg-white text-[#4d212a] rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender_id === currentUserId ? "text-white/70" : "text-[#814c55]"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#814c55] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-[#814c55] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-[#814c55] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Replies */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            onClick={() => setNewMessage(reply)}
            className="flex-shrink-0 px-4 py-2 bg-white border border-[#dd9ca6]/30 rounded-full text-xs font-medium text-[#4d212a] hover:border-[#ba001c]"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#dd9ca6]/20">
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4]">
            <span className="material-symbols-outlined text-[#814c55]">add_circle</span>
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-[#fff4f4] rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ba001c] text-white disabled:opacity-50"
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