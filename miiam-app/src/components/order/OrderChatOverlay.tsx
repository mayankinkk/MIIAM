"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/lib/hooks/useChat";
import BlurImage from "@/components/BlurImage";

interface OrderChatOverlayProps {
  orderId: string;
  currentUserId: string;
  senderType: "user" | "rider" | "vendor";
  otherName?: string;
  otherAvatar?: string;
  thread?: "user-vendor" | "user-rider" | "all";
  onClose: () => void;
}

const QUICK_REPLIES: Record<string, Record<string, string[]> | string[]> = {
  user: {
    "user-vendor": [
      "Is my order confirmed?",
      "Any extra items needed?",
      "How long will it take?",
      "Thank you!",
    ],
    "user-rider": ["Where are you?", "Please call me", "Almost there?", "I'm outside"],
    all: ["Where are you?", "Please call me", "Almost there?", "I'm outside"],
  },
  rider: ["I'm on my way", "I've arrived", "Traffic delay", "Almost there"],
  vendor: ["Order accepted", "Will be ready in 10 min", "Item out of stock", "Ready for pickup"],
};

export default function OrderChatOverlay({
  orderId,
  currentUserId,
  senderType,
  otherName,
  otherAvatar,
  thread = "all",
  onClose,
}: OrderChatOverlayProps) {
  const participants =
    thread === "user-vendor"
      ? (["user", "vendor"] as const)
      : thread === "user-rider"
        ? (["user", "rider"] as const)
        : undefined;

  const { messages, loading, isTyping, sendMessage, sendTypingIndicator } = useChat(
    orderId,
    currentUserId,
    {
      participants: participants
        ? (Array.from(participants) as Array<"user" | "rider" | "vendor" | "support">)
        : undefined,
    }
  );
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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
    sendTypingIndicator(val.length > 0);
  };

  const handleQuickReply = (msg: string) => {
    sendMessage(msg, senderType);
  };

  const replies =
    senderType === "user"
      ? (QUICK_REPLIES.user as Record<string, string[]>)[thread] ||
        (QUICK_REPLIES.user as Record<string, string[]>).all
      : (QUICK_REPLIES[senderType] as string[]) || [];

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[100] flex items-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface text-on-surface animate-slide-up flex h-[85vh] w-full flex-col rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="border-outline-variant/10 flex items-center justify-between border-b p-6 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="hover:bg-surface-container flex h-10 w-10 items-center justify-center rounded-full"
            >
              <span className="material-symbols-outlined text-secondary">arrow_back</span>
            </button>
            <div className="bg-primary text-on-primary flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
              {otherAvatar ? (
                <BlurImage
                  src={otherAvatar}
                  alt={otherName || "avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined">
                  {thread === "user-vendor" ? "storefront" : "person"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-on-surface font-bold">
                {otherName ||
                  (senderType === "rider"
                    ? "Customer"
                    : thread === "user-vendor"
                      ? "Restaurant"
                      : "Rider")}
              </h1>
              <p className="text-status-success flex items-center gap-1 text-[10px] font-medium">
                <span className="bg-status-success h-1.5 w-1.5 rounded-full"></span>
                {thread === "user-vendor" ? "Restaurant" : "Online"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover:bg-surface-container flex h-10 w-10 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </header>

        {/* Messages */}
        <main className="flex-1 space-y-6 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-on-surface-variant py-12 text-center">
              <span className="material-symbols-outlined mb-4 block text-6xl">chat</span>
              <p>Start the conversation</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                const time = msg.created_at
                  ? new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <div
                    key={msg.id}
                    className={`flex max-w-[85%] flex-col gap-1 ${isMe ? "items-end self-end" : "items-start self-start"}`}
                  >
                    <div
                      className={`rounded-t-2xl p-4 shadow-sm ${
                        isMe
                          ? "bg-primary text-on-primary rounded-br-sm rounded-bl-2xl"
                          : "bg-secondary-container text-on-secondary-container rounded-br-2xl rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm font-medium">{msg.message}</p>
                    </div>
                    <span className="text-on-surface-variant mx-1 text-[10px] font-medium">
                      {time}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}

          {isTyping && (
            <div className="bg-secondary-container self-start rounded-t-2xl rounded-br-2xl rounded-bl-sm p-4">
              <div className="flex gap-1">
                <span className="bg-on-secondary-container h-2 w-2 animate-bounce rounded-full" />
                <span
                  className="bg-on-secondary-container h-2 w-2 animate-bounce rounded-full"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="bg-on-secondary-container h-2 w-2 animate-bounce rounded-full"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
        </main>

        {/* Input */}
        <footer className="border-outline-variant/10 bg-surface-container-low/90 rounded-b-[2.5rem] border-t p-6 pt-2 backdrop-blur-2xl">
          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
            {replies.map((msg) => (
              <button
                key={msg}
                onClick={() => handleQuickReply(msg)}
                className="bg-surface-container-lowest border-outline-variant/20 text-secondary hover:border-primary flex-shrink-0 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all active:scale-95"
              >
                {msg}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="bg-surface-container-lowest border-outline-variant/10 focus:ring-secondary/20 h-12 flex-1 rounded-full border px-5 text-sm transition-all outline-none focus:ring-2"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-primary text-on-primary shadow-primary/20 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                send
              </span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
