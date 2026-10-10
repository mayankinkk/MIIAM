"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useChat, type ChatMessage } from "@/lib/hooks/useChat";

export default function RiderChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const supabase = useMemo(() => createClient(), []);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
        if (user) setCurrentUserId(user.id);
        else router.push("/rider/login");
      });
  }, [supabase, router]);

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
      <div className="bg-surface flex min-h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="bg-surface flex min-h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface flex min-h-screen flex-col">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-[var(--color-surface-container-lowest)]/80 px-6 shadow-[0_20px_40px_rgba(77,33,42,0.06)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-secondary hover:bg-surface-container rounded-full p-2 transition-colors duration-200 active:scale-95"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-on-primary flex h-10 w-10 items-center justify-center rounded-full">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <h1 className="text-on-surface font-bold">Customer</h1>
              <p className="text-secondary flex items-center gap-1 text-[10px] font-medium">
                <span className="bg-secondary h-1.5 w-1.5 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mt-16 mb-24 flex flex-1 flex-col gap-6 overflow-y-auto px-4 pt-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
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
            {messages.map((msg: ChatMessage) => (
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

      <footer className="bg-surface-container-low/90 fixed bottom-0 left-0 z-50 w-full rounded-t-[2.5rem] px-6 pt-4 pb-8 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="bg-surface-container-lowest border-outline-variant/10 focus:ring-secondary/20 h-12 flex-1 rounded-full border px-4 transition-all focus:ring-2"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-primary text-on-primary shadow-primary/20 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            aria-label="Send message"
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
