"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const BOT_RESPONSES: Record<string, string> = {
  default: "Thanks for reaching out! A support agent will respond shortly. For urgent issues, call us at 1800-XXX-XXXX.",
  order: "I can see you have a question about an order. Please share your order ID and we'll look into it right away!",
  refund: "Refunds are processed within 5-7 business days to your original payment method. Can you share your order ID?",
  delivery: "If your delivery is delayed, please wait 10 extra minutes. If still not arrived, share your order ID and we'll coordinate with the rider.",
  payment: "Payment issues are rare but we'll sort it out! Please share your order ID or transaction ID.",
};

function getBotResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("order")) return BOT_RESPONSES.order;
  if (lower.includes("refund") || lower.includes("return") || lower.includes("cancel")) return BOT_RESPONSES.refund;
  if (lower.includes("delivery") || lower.includes("late") || lower.includes("arrived")) return BOT_RESPONSES.delivery;
  if (lower.includes("payment") || lower.includes("pay") || lower.includes("charged")) return BOT_RESPONSES.payment;
  return BOT_RESPONSES.default;
}

interface Message {
  id: string;
  text: string;
  role: "user" | "bot";
  time: Date;
}

export default function SupportChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hi there! I'm MIIAM Support. How can I help you today?",
      role: "bot",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), text, role: "user", time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botText = getBotResponse(text);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), text: botText, role: "bot", time: new Date() }]);
      setTyping(false);
    }, 1200);
  };

  const quickReplies = ["Track my order", "Request refund", "Payment issue", "Delivery problem"];

  return (
    <div className="min-h-screen bg-[#fff4f4] flex flex-col">
      <header className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link href="/app/support" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="w-10 h-10 bg-gradient-to-br from-[#ba001c] to-[#ff7670] rounded-full flex items-center justify-center text-white font-black text-sm">M</div>
          <div className="flex-1">
            <p className="font-bold text-slate-800">MIIAM Support</p>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Online · Usually replies instantly</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-40">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "bot" && (
              <div className="w-8 h-8 bg-gradient-to-br from-[#ba001c] to-[#ff7670] rounded-full flex items-center justify-center text-white text-xs font-black mr-2 flex-shrink-0 mt-auto">M</div>
            )}
            <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#ba001c] text-white rounded-br-sm"
                : "bg-white text-slate-800 shadow-sm rounded-bl-sm"
            }`}>
              {msg.text}
              <p className={`text-[9px] mt-1 ${msg.role === "user" ? "text-white/60" : "text-slate-400"}`}>
                {msg.time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ba001c] to-[#ff7670] rounded-full flex items-center justify-center text-white text-xs font-black">M</div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {quickReplies.map((r) => (
            <button
              key={r}
              onClick={() => { setInput(r); }}
              className="flex-shrink-0 px-3 py-1.5 bg-white border border-[#ba001c] text-[#ba001c] rounded-full text-xs font-bold hover:bg-[#fff4f4] transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2 items-end" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20 resize-none max-h-24"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-11 h-11 bg-[#ba001c] disabled:bg-slate-200 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
}