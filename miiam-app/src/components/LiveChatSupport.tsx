"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  role: "user" | "support" | "system";
  message: string;
  timestamp: Date;
}

interface LiveChatProps {
  orderId?: string;
  onClose?: () => void;
}

const quickReplies = ["Where is my order?", "I want to cancel", "Refund issue", "Talk to human"];

export function LiveChatSupport({ orderId, onClose }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "support",
      message: "Hi! Welcome to MIIAM support. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      message: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    if (orderId) {
      await supabase.from("support_chats").insert({
        order_id: orderId,
        message: text,
        role: "user",
      });
    }

    setTimeout(() => {
      setIsTyping(false);
      const supportResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "support",
        message:
          "Thanks for your message! A support agent will respond shortly. For urgent issues, call us at +91 99578 73472.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, supportResponse]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white dark:bg-[var(--color-surface)]">
        <div className="text-on-primary flex items-center justify-between bg-[var(--color-primary)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <h3 className="font-bold">MIIAM Support</h3>
              <p className="text-xs text-white/80">Typically replies in minutes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[var(--color-surface-subtle)] p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === "user"
                    ? "text-on-primary rounded-br-md bg-[var(--color-primary)]"
                    : msg.role === "system"
                      ? "bg-yellow-100 text-sm text-yellow-800"
                      : "rounded-bl-md bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] shadow-sm"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p
                  className={`mt-1 text-xs ${
                    msg.role === "user" ? "text-white/60" : "text-[var(--color-outline-variant)]"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-[var(--color-surface-container-lowest)] px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-75" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-150" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="rounded-full bg-[var(--color-surface-container)] px-3 py-2 text-xs text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)]"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <div className="border-t bg-white p-4 dark:bg-[var(--color-surface)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type your message..."
              className="flex-1 rounded-full bg-[var(--color-surface-container)] px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="text-on-primary flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupportButton() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowChat(true)}
        className="text-on-primary fixed right-4 bottom-24 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] shadow-lg transition-transform hover:scale-105"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <span className="material-symbols-outlined text-2xl">chat</span>
        <span className="bg-status-success absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-[var(--color-surface)]" />
      </button>
      {showChat && <LiveChatSupport onClose={() => setShowChat(false)} />}
    </>
  );
}
