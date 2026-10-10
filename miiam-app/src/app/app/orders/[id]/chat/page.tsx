"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "@/lib/hooks/useChat";
import logger from "@/lib/logger";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Skeleton } from "@/components/Skeleton";

export default function ChatPage() {
  const { t } = useTranslation();
  const params = useParams();
  const orderId = useMemo(() => params?.id as string, [params?.id]);
  const supabase = useMemo(() => createClient(), []);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    getUser();
  }, []);

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
    try {
      await sendMessage(newMessage.trim(), "user");
      setNewMessage("");
    } catch (err) {
      logger.error({ err }, "Failed to send message");
    }
    setSending(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTypingIndicator(e.target.value.length > 0);
  };

  const quickReplies = ["Where are you?", "Please call me", "Coming soon?"];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  };

  if (!orderId) {
    return (
      <div
        className="bg-surface flex min-h-screen items-center justify-center"
        aria-label="Loading..."
      >
        <div className="w-full max-w-sm space-y-4 px-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <div
                className={`space-y-2 ${i % 2 === 0 ? "items-end" : "items-start"} flex flex-col`}
              >
                <Skeleton className={`h-12 ${i % 2 === 0 ? "w-40" : "w-48"} rounded-2xl`} />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div
        className="bg-surface flex min-h-screen items-center justify-center"
        aria-label="Loading..."
      >
        <div className="w-full max-w-sm space-y-4 px-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <div
                className={`space-y-2 ${i % 2 === 0 ? "items-end" : "items-start"} flex flex-col`}
              >
                <Skeleton className={`h-12 ${i % 2 === 0 ? "w-40" : "w-48"} rounded-2xl`} />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface flex min-h-screen flex-col">
      {/* Header */}
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-[var(--color-surface-container-lowest)]/80 px-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href={`/app/orders/${orderId}`}
            className="text-secondary hover:bg-surface-container rounded-full p-2 transition-colors duration-200 active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-primary text-on-primary flex h-10 w-10 items-center justify-center rounded-full">
                <span className="material-symbols-outlined">two_wheeler</span>
              </div>
              <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
            </div>
            <div>
              <h1 className="text-on-surface font-bold">Rider</h1>
              <p className="text-secondary flex items-center gap-1 text-[10px] font-medium">
                <span className="bg-secondary h-1.5 w-1.5 rounded-full"></span>
                Active
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:+919957873472"
            className="text-accent flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-[var(--color-surface-container)] active:scale-95"
          >
            <span className="material-symbols-outlined">phone</span>
          </a>
        </div>
      </header>

      {/* Messages */}
      <main className="mt-16 mb-32 flex flex-1 flex-col gap-6 overflow-y-auto px-4 pt-6">
        {loading ? (
          <div className="flex flex-col gap-6" aria-label="Loading messages...">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex max-w-[85%] flex-col gap-1 ${i % 2 === 0 ? "items-end self-end" : "items-start self-start"}`}
              >
                <Skeleton
                  className={`h-12 ${i % 2 === 0 ? "w-40 rounded-br-sm rounded-bl-2xl" : "w-48 rounded-br-2xl rounded-bl-sm"} rounded-t-2xl`}
                />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60">
              chat
            </span>
            <p className="text-on-surface-variant mt-4">No messages yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex max-w-[85%] flex-col gap-1 ${
                  msg.sender_id === currentUserId ? "items-end self-end" : "items-start self-start"
                }`}
              >
                <div
                  className={`rounded-t-2xl p-4 shadow-sm ${
                    msg.sender_id === currentUserId
                      ? "bg-primary text-on-primary rounded-br-sm rounded-bl-2xl"
                      : "bg-secondary-container text-on-secondary-container rounded-br-2xl rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm font-medium">{msg.message}</p>
                </div>
                <span className="text-on-surface-variant mx-1 text-[10px] font-medium">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {isTyping && (
          <div className="bg-secondary-container self-start rounded-t-2xl rounded-br-2xl rounded-bl-sm p-4">
            <div className="flex gap-1">
              <span className="bg-on-secondary-container h-2 w-2 animate-bounce rounded-full"></span>
              <span
                className="bg-on-secondary-container h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="bg-on-secondary-container h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        )}
      </main>

      {/* Quick Replies */}
      <div className="no-scrollbar fixed bottom-24 flex w-full shrink-0 gap-2 overflow-x-auto px-4 py-2">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            onClick={() => {
              sendMessage(reply, "user");
            }}
            className="bg-surface-container-lowest border-outline-variant/20 text-secondary rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap shadow-sm transition-transform active:scale-95"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <footer className="bg-surface-container-low/90 fixed bottom-0 left-0 z-50 w-full rounded-t-[2.5rem] px-6 pt-4 pb-8 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t.orders.typeMessage}
            className="bg-surface-container-lowest border-outline-variant/10 focus:ring-secondary/20 h-12 flex-1 rounded-full border px-4 transition-all focus:ring-2"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-primary text-on-primary shadow-primary/20 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            {sending ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                send
              </span>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
