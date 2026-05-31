"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/lib/hooks/useChat";

interface OrderChatOverlayProps {
  orderId: string;
  currentUserId: string;
  senderType: "user" | "rider" | "vendor";
  otherName?: string;
  onClose: () => void;
}

const QUICK_REPLIES: Record<string, string[]> = {
  user: ["Where are you?", "Please call me", "Coming soon?", "I'm outside"],
  rider: ["I'm on my way", "I've arrived", "Traffic delay", "Almost there"],
};

export default function OrderChatOverlay({ orderId, currentUserId, senderType, otherName, onClose }: OrderChatOverlayProps) {
  const { messages, loading, isTyping, sendMessage, sendTypingIndicator } = useChat(orderId, currentUserId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input.trim(), senderType);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    sendTypingIndicator(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingIndicator(false), 2000);
  };

  const handleQuickReply = (msg: string) => {
    sendMessage(msg, senderType);
  };

  const replies = QUICK_REPLIES[senderType] || [];

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full h-[70vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">chat</span>
            </div>
            <div>
              <p className="font-bold text-slate-800">{otherName || (senderType === "rider" ? "Customer" : "Rider")}</p>
              <p className="text-[10px] text-green-600 font-medium">Online</p>
            </div>
          </div>
            <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-400">close</span>
            </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-slate-400 text-sm py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">
              <span className="material-symbols-outlined text-4xl block mb-2">chat</span>
              Start the conversation
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const time = msg.created_at
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? "bg-primary text-on-primary" : "bg-surface-container"}`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-[9px] mt-1 ${isMe ? "text-on-primary/70" : "text-on-surface-variant"}`}>{time}</p>
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface-container rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
            {replies.map((msg) => (
              <button
                key={msg}
                onClick={() => handleQuickReply(msg)}
                className="flex-shrink-0 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-surface-container rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-11 h-11 bg-primary text-on-primary rounded-full flex items-center justify-center disabled:opacity-50 active:scale-90 transition-all shadow-lg shadow-primary/30"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
