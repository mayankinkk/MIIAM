"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface SupportMessage {
  id: string;
  sender_type: "user" | "support";
  message: string;
  created_at: string;
  attachment_url?: string;
}

const botResponses = [
  "I understand. Let me help you with that.",
  "Thank you for sharing. One moment please.",
  "I see your concern. Here's what I can do...",
  "Let me check on that for you right away.",
];

export default function SupportChatPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<SupportMessage[]>([
    { id: "1", sender_type: "support", message: "Hi! Welcome to MIIAM Support. How can I help you today?", created_at: new Date().toISOString() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, [supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !userId) return;

    const userMessage: SupportMessage = {
      id: Date.now().toString(),
      sender_type: "user",
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setSending(true);

    // Simulate bot response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botMessage: SupportMessage = {
        id: (Date.now() + 1).toString(),
        sender_type: "support",
        message: botResponses[Math.floor(Math.random() * botResponses.length)],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setSending(false);
    }, 1500);
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !userId) return;

    // Create support conversation
    const { data: ticket, error } = await supabase
      .from("support_conversations")
      .insert({
        user_id: userId,
        subject: subject.trim(),
        status: "open",
      })
      .select()
      .single();

    if (ticket) {
      setTicketId(ticket.id);
      setShowTicketForm(false);
      
      // Add initial message
      await supabase.from("support_messages").insert({
        conversation_id: ticket.id,
        sender_id: userId,
        sender_type: "user",
        message: subject.trim(),
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  };

  const helpTopics = [
    { icon: "receipt", label: "Order Issues", desc: "Problems with your order" },
    { icon: "payment", label: "Payments", desc: "Billing & refunds" },
    { icon: "account_circle", label: "Account", desc: "Login & profile" },
    { icon: "restaurant", label: "Vendors", desc: "Restaurant concerns" },
  ];

  return (
    <div className="min-h-screen bg-[#fff4f4] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-white border-b border-[#dd9ca6]/20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#ba001c] cursor-pointer" onClick={() => window.history.back()}>
            arrow_back
          </span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ba001c] to-[#ff7670] flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          <div>
            <h1 className="font-bold text-[#4d212a]">MIIAM Support</h1>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Online • Usually replies in 5 mins
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowTicketForm(true)}
          className="px-3 py-1.5 bg-[#ba001c] text-white text-xs font-bold rounded-full"
        >
          New Ticket
        </button>
      </header>

      {/* Help Topics (show when no conversation) */}
      {messages.length <= 1 && (
        <div className="pt-20 px-4 pb-4">
          <p className="text-sm text-[#814c55] mb-4">What can we help you with?</p>
          <div className="grid grid-cols-2 gap-3">
            {helpTopics.map((topic) => (
              <button
                key={topic.label}
                onClick={() => setNewMessage(`I need help with: ${topic.label}`)}
                className="bg-white p-4 rounded-xl text-left hover:shadow-md transition-shadow"
              >
                <span className="material-symbols-outlined text-[#ba001c]">{topic.icon}</span>
                <p className="font-bold text-[#4d212a] mt-2">{topic.label}</p>
                <p className="text-xs text-[#814c55]">{topic.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 pt-4 pb-24 px-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.sender_type === "user"
                    ? "bg-[#ba001c] text-white rounded-br-md"
                    : "bg-white text-[#4d212a] rounded-bl-md shadow-sm"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${msg.sender_type === "user" ? "text-white/70" : "text-[#814c55]"}`}>
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
      </div>

      {/* Ticket Form Modal */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[#4d212a] mb-4">Create Support Ticket</h2>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Describe your issue..."
              className="w-full p-4 bg-[#fff4f4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowTicketForm(false)}
                className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!subject.trim()}
                className="flex-1 bg-[#ba001c] text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#dd9ca6]/20">
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4]">
            <span className="material-symbols-outlined text-[#814c55]">add_circle</span>
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
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