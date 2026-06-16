"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useChat, type ChatMessage } from "@/lib/hooks/useChat";

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
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
      if (user) setCurrentUserId(user.id);
      else router.push("/rider/login");
    });
  }, [supabase, router]);

  const { messages, loading, isTyping, sendMessage, sendTypingIndicator } = useChat(orderId, currentUserId);

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
    sendTypingIndicator(e.target.value.length > 0);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(77,33,42,0.06)]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-secondary hover:bg-surface-container rounded-full p-2 transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <h1 className="font-bold text-on-surface">Customer</h1>
              <p className="text-[10px] font-medium text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                Online
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mt-16 mb-24 px-4 pt-6 overflow-y-auto flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60">chat</span>
            <p className="text-on-surface-variant mt-4">No messages yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 max-w-[85%] ${
                  msg.sender_id === currentUserId ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div
                  className={`p-4 rounded-t-2xl shadow-sm ${
                    msg.sender_id === currentUserId
                      ? "bg-primary text-on-primary rounded-bl-2xl rounded-br-sm"
                      : "bg-secondary-container text-on-secondary-container rounded-br-2xl rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm font-medium">{msg.message}</p>
                </div>
                <span className="text-[10px] text-on-surface-variant font-medium mx-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
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

      <footer className="fixed bottom-0 left-0 w-full bg-surface-container-low/90 backdrop-blur-2xl rounded-t-[2.5rem] px-6 pt-4 pb-8 z-50">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-surface-container-lowest rounded-full h-12 px-4 border border-outline-variant/10 focus:ring-2 focus:ring-secondary/20 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 flex items-center justify-center bg-primary text-on-primary rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            {sending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
