"use client";

import { useState, useRef, useEffect } from "react";
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

const quickReplies = [
  "Where is my order?",
  "I want to cancel",
  "Refund issue",
  "Talk to human",
];

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
  const supabase = createClient();

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

    setMessages(prev => [...prev, userMessage]);
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
        message: "Thanks for your message! A support agent will respond shortly. For urgent issues, call us at +91 98765 43210.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, supportResponse]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-[#ba001c] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <h3 className="font-bold">MIIAM Support</h3>
              <p className="text-xs text-white/80">Typically replies in minutes</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-[#ba001c] text-white rounded-br-md"
                    : msg.role === "system"
                    ? "bg-yellow-100 text-yellow-800 text-sm"
                    : "bg-white text-slate-800 rounded-bl-md shadow-sm"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${
                  msg.role === "user" ? "text-white/60" : "text-slate-400"
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 2 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full text-slate-600 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-10 h-10 bg-[#ba001c] text-white rounded-full flex items-center justify-center disabled:opacity-50"
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
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#ba001c] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-30"
      >
        <span className="material-symbols-outlined text-2xl">chat</span>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </button>
      {showChat && <LiveChatSupport onClose={() => setShowChat(false)} />}
    </>
  );
}