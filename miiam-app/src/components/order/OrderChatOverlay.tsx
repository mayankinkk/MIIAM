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
        className="bg-surface text-on-surface rounded-t-[2.5rem] w-full h-[85vh] flex flex-col animate-slide-up shadow-[0_-20px_40px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-6 pb-4 flex items-center justify-between border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container">
              <span className="material-symbols-outlined text-secondary">arrow_back</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <h1 className="font-bold text-on-surface">{otherName || (senderType === "rider" ? "Customer" : "Rider")}</h1>
              <p className="text-[10px] font-medium text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-6xl block mb-4">chat</span>
              <p>Start the conversation</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                const time = msg.created_at
                  ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "";
                return (
                  <div key={msg.id} className={`flex flex-col gap-1 max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                    <div className={`p-4 rounded-t-2xl shadow-sm ${
                      isMe 
                        ? "bg-primary text-on-primary rounded-bl-2xl rounded-br-sm" 
                        : "bg-secondary-container text-on-secondary-container rounded-br-2xl rounded-bl-sm"
                    }`}>
                      <p className="text-sm font-medium">{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-medium mx-1">{time}</span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}

          {isTyping && (
            <div className="self-start bg-secondary-container p-4 rounded-t-2xl rounded-br-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-on-secondary-container rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-on-secondary-container rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-on-secondary-container rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </main>

        {/* Input */}
        <footer className="p-6 pt-2 border-t border-outline-variant/10 bg-surface-container-low/90 backdrop-blur-2xl rounded-b-[2.5rem]">
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {replies.map((msg) => (
              <button
                key={msg}
                onClick={() => handleQuickReply(msg)}
                className="whitespace-nowrap flex-shrink-0 px-4 py-2 bg-surface-container-lowest border border-outline-variant/20 text-secondary rounded-full text-xs font-bold hover:border-primary active:scale-95 transition-all"
              >
                {msg}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-surface-container-lowest rounded-full h-12 px-5 text-sm outline-none border border-outline-variant/10 focus:ring-2 focus:ring-secondary/20 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
