"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();
  const [tab, setTab] = useState<"home" | "chat" | "faqs" | "tickets">("home");
  const [messages, setMessages] = useState(chatMessages);
  const [newMessage, setNewMessage] = useState("");
  const [issueType, setIssueType] = useState("");
  const [orderIssue, setOrderIssue] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [onlineAgents, setOnlineAgents] = useState(3);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchOrders() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, vendor:vendors(name), status, total_amount, placed_at")
          .eq("user_id", user.id)
          .order("placed_at", { ascending: false })
          .limit(10);
        setUserOrders(orders || []);
      }
    }
    fetchOrders();
  }, []);

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

    let orderContext = "";
    if (selectedOrder) {
      orderContext = ` (Order: #${selectedOrder.id.slice(0, 8).toUpperCase()} - ${selectedOrder.vendor?.name})`;
    }

    setTimeout(() => {
      const botMsg = { id: messages.length + 2, from: "bot" as const, text: `I understand you need help with "${action}".${orderContext} Let me connect you with our support team. What's the details of your issue?`, time: "Just now" };
      setMessages(prev => [...prev, botMsg]);
    }, 1500);

    setTab("chat");
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col pb-24 md:pb-0">
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
          {(["home", "chat", "tickets", "faqs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${
                tab === t ? "border-[#ba001c] text-[#ba001c]" : "border-transparent text-slate-500"
              }`}
            >
              {t === "home" ? "Home" : t === "chat" ? "💬 Chat" : t === "tickets" ? "🎫 Tickets" : "❓ FAQs"}
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

            {/* Select Order */}
            {userOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Select Order (Optional)</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedOrder(null); setTab("chat"); }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${!selectedOrder ? "border-[#ba001c] bg-[#ffe1e4]" : "border-slate-200 hover:border-[#ba001c]"}`}
                  >
                    <p className="font-semibold text-slate-700">General Query</p>
                    <p className="text-xs text-slate-500">Not related to a specific order</p>
                  </button>
                  {userOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => { setSelectedOrder(order); setTab("chat"); }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedOrder?.id === order.id ? "border-[#ba001c] bg-[#ffe1e4]" : "border-slate-200 hover:border-[#ba001c]"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-700">{order.vendor?.name || "Order"}</p>
                          <p className="text-xs text-slate-500">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#ba001c]">₹{order.total_amount}</p>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full">{order.status}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

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

                <a
                  href="https://wa.me/9118001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition-all"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.162-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.149-.149.297-.347.446-.521.151-.172.2-.296.3-.493.099-.198.05-.371.025-.515-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <div className="text-left flex-1">
                    <p className="font-bold text-lg">WhatsApp</p>
                    <p className="text-white/70 text-sm">Chat with us</p>
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
          <div className="flex flex-col h-[calc(100dvh-280px)] md:h-[calc(100vh-200px)]">
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

        {tab === "tickets" && (
          <div className="space-y-6">
            <div className="bg-[#ba001c] text-white rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-2">Support Tickets</h2>
              <p className="text-white/70 text-sm">Track and manage your support requests</p>
            </div>
            
            <div className="text-center py-12 text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-4">confirmation_number</span>
              <p>No tickets yet</p>
              <p className="text-sm mt-2">Start a chat to create a ticket</p>
              <button 
                onClick={() => setTab("chat")}
                className="mt-4 bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold"
              >
                Start Chat
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6">
              <h3 className="font-bold text-slate-800 mb-4">How Tickets Work</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ba001c] text-white flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <p className="font-semibold text-slate-800">Start a Chat</p>
                    <p className="text-sm text-slate-500">Describe your issue in the chat</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ba001c] text-white flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <p className="font-semibold text-slate-800">We Create a Ticket</p>
                    <p className="text-sm text-slate-500">Our team will create a support ticket for you</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ba001c] text-white flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <p className="font-semibold text-slate-800">Track Here</p>
                    <p className="text-sm text-slate-500">View ticket status and updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "faqs" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search FAQs..."
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:border-[#ba001c] outline-none"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button className="px-4 py-2 bg-[#ba001c] text-white rounded-full text-sm font-bold whitespace-nowrap">
                All
              </button>
              {faqs.map((section) => (
                <button key={section.category} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold whitespace-nowrap">
                  {section.category}
                </button>
              ))}
            </div>

            {faqs.map((section) => {
              const filteredQuestions = faqSearch 
                ? section.questions.filter(faq => 
                    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
                    faq.a.toLowerCase().includes(faqSearch.toLowerCase())
                  )
                : section.questions;
              
              if (filteredQuestions.length === 0) return null;

              return (
                <section key={section.category}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#ba001c]">
                      {section.category === "Orders & Delivery" ? "local_shipping" :
                       section.category === "Payments & Refunds" ? "payments" :
                       section.category === "Account & Profile" ? "person" : "help"}
                    </span>
                    <h2 className="text-lg font-bold text-slate-800">{section.category}</h2>
                  </div>
                  <div className="space-y-3">
                    {filteredQuestions.map((faq, i) => (
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
              );
            })}

            {faqSearch && (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                <p>No FAQs found for "{faqSearch}"</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}