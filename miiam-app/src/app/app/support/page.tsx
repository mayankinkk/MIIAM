"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const quickActions = [
  { id: "track", icon: "local_shipping", label: "Track my order", color: "bg-blue-100 text-blue-700" },
  { id: "cancel", icon: "cancel", label: "Cancel order", color: "bg-red-100 text-red-700" },
  { id: "refund", icon: "currency_exchange", label: "Request refund", color: "bg-amber-100 text-amber-700" },
  { id: "report", icon: "report_problem", label: "Report an issue", color: "bg-purple-100 text-purple-700" },
  { id: "review", icon: "star", label: "Write a review", color: "bg-green-100 text-green-700" },
  { id: "more", icon: "more_horiz", label: "More help", color: "bg-slate-100 text-slate-700" },
];

const faqs = [
  {
    category: "Orders & Delivery",
    questions: [
      { q: "Where is my order?", a: "You can track your order in real-time from the order details page. Look for the live map showing your rider's location." },
      { q: "How long will delivery take?", a: "Delivery times vary by restaurant and distance. You'll see an estimated time when you place your order. Most orders arrive within 30-45 minutes." },
      { q: "Can I cancel my order?", a: "You can cancel your order before it's being prepared. Go to your order details and tap 'Cancel Order'. If the order is already being prepared, please contact support." },
      { q: "What if my order is wrong or damaged?", a: "We're sorry! Please contact us immediately with a photo. We'll process a refund or send a replacement as per your preference." },
    ],
  },
  {
    category: "Payments & Refunds",
    questions: [
      { q: "How do I get a refund?", a: "Refunds are processed within 5-7 business days to your original payment method. For UPI, it's usually instant." },
      { q: "Why was I charged extra?", a: "Extra charges may include delivery fees (unless you have Pro), tip (if added), or taxes. Check your order breakdown for details." },
      { q: "I didn't receive my cashback", a: "Cashback is usually credited within 24 hours. If you don't see it, please contact support with your order ID." },
    ],
  },
  {
    category: "Account & Profile",
    questions: [
      { q: "How do I change my address?", a: "Go to your profile > Addresses > Add new address. You can set multiple addresses and choose one at checkout." },
      { q: "How do I reset my password?", a: "Go to login > Forgot Password > Enter your email. You'll receive a reset link." },
      { q: "How do I delete my account?", a: "Please contact our support team. Account deletion is processed within 30 days as per our data policy." },
    ],
  },
];

const chatMessages = [
  { id: 1, from: "bot", text: "Hi! 👋 Welcome to MIIAM Support. How can I help you today?", time: "Just now" },
];

export default function SupportPage() {
  const [tab, setTab] = useState<"home" | "chat" | "faqs">("home");
  const [messages, setMessages] = useState(chatMessages);
  const [newMessage, setNewMessage] = useState("");
  const [issueType, setIssueType] = useState("");
  const [orderIssue, setOrderIssue] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [onlineAgents, setOnlineAgents] = useState(3);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const userMsg = { id: messages.length + 1, from: "user" as const, text: newMessage, time: "Just now" };
    setMessages([...messages, userMsg]);
    setNewMessage("");

    setTimeout(() => {
      const botMsg = { id: messages.length + 2, from: "bot" as const, text: "Thanks for your message! Our team is reviewing your query and will get back to you shortly. For immediate help, please call us at 1800-123-4567.", time: "Just now" };
      setMessages(prev => [...prev, botMsg]);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    setIssueType(action);
    setShowQuickActions(false);
    
    const actionTexts: Record<string, string> = {
      track: "I want to track my order",
      cancel: "I need to cancel my order",
      refund: "I want to request a refund",
      report: "I want to report an issue",
      review: "I want to write a review",
      more: "I need more help",
    };

    const userMsg = { id: messages.length + 1, from: "user" as const, text: actionTexts[action] || action, time: "Just now" };
    setMessages([...messages, userMsg]);

    setTimeout(() => {
      const botMsg = { id: messages.length + 2, from: "bot" as const, text: `I understand you need help with "${action}". Let me connect you with our support team. What's your order ID or the details of your issue?`, time: "Just now" };
      setMessages(prev => [...prev, botMsg]);
    }, 1500);

    setTab("chat");
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      {/* Header */}
      <header className="bg-[#ba001c] text-white px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Help & Support</h1>
            <p className="text-white/70 text-sm mt-1">We&apos;re here to help 24/7</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold">{onlineAgents} agents online</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-4">
        <div className="max-w-2xl mx-auto flex">
          {(["home", "chat", "faqs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${
                tab === t ? "border-[#ba001c] text-[#ba001c]" : "border-transparent text-slate-500"
              }`}
            >
              {t === "home" ? "Home" : t === "chat" ? "💬 Chat" : "❓ FAQs"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {tab === "home" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className={`${action.color} rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all shadow-sm`}
                  >
                    <span className="material-symbols-outlined text-2xl">{action.icon}</span>
                    <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Contact Options */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Contact Us</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setTab("chat")}
                  className="w-full bg-[#ba001c] text-white rounded-2xl p-5 flex items-center gap-4 hover:bg-[#a40017] transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-3xl">chat</span>
                  <div className="text-left flex-1">
                    <p className="font-bold text-lg">Chat with us</p>
                    <p className="text-white/70 text-sm">Average response: 2 mins</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>

                <a
                  href="tel:18001234567"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-[#ba001c] transition-all"
                >
                  <span className="material-symbols-outlined text-3xl text-[#ba001c]">call</span>
                  <div className="text-left flex-1">
                    <p className="font-bold text-lg">Call us</p>
                    <p className="text-slate-500 text-sm">1800-123-4567 (Toll free)</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </a>

                <a
                  href="mailto:support@miiam.com"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-[#ba001c] transition-all"
                >
                  <span className="material-symbols-outlined text-3xl text-[#ba001c]">email</span>
                  <div className="text-left flex-1">
                    <p className="font-bold text-lg">Email us</p>
                    <p className="text-slate-500 text-sm">Response within 24 hours</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </a>
              </div>
            </section>

            {/* Social */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Follow Us</h2>
              <div className="flex gap-3">
                {["Twitter", "Instagram", "Facebook"].map((social) => (
                  <button key={social} className="flex-1 bg-white border border-slate-200 py-3 rounded-xl text-sm font-bold text-slate-600 hover:border-[#ba001c] hover:text-[#ba001c] transition-all">
                    {social}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "chat" && (
          <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    msg.from === "user"
                      ? "bg-[#ba001c] text-white rounded-br-md"
                      : "bg-white text-slate-800 shadow-sm rounded-bl-md"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-xs mt-2 ${msg.from === "user" ? "text-white/50" : "text-slate-400"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Replies */}
            {showQuickActions && (
              <div className="flex flex-wrap gap-2 mb-4">
                {["Track order", "Cancel order", "Refund", "Help me"].map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickAction(reply.toLowerCase().replace(" ", ""))}
                    className="bg-white border border-[#ba001c] text-[#ba001c] px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#fff4f4] transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="bg-white rounded-2xl border border-slate-200 flex items-center gap-3 p-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="w-10 h-10 bg-[#ba001c] text-white rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        )}

        {tab === "faqs" && (
          <div className="space-y-6">
            {faqs.map((section) => (
              <section key={section.category}>
                <h2 className="text-lg font-bold text-slate-800 mb-4">{section.category}</h2>
                <div className="space-y-3">
                  {section.questions.map((faq, i) => (
                    <details key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm group">
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="font-semibold text-slate-800 pr-4">{faq.q}</span>
                        <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                      </summary>
                      <div className="px-5 pb-4 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}