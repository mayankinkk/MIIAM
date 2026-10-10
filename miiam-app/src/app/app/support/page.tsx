"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { createClient } from "@/lib/supabase/client";
import { useSupportSettings } from "@/lib/hooks/useSupportSettings";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ChatMessage {
  id: string;
  from: "user" | "support";
  text: string;
  time: string;
}

const quickActions = [
  { id: "track", icon: "local_shipping", label: "Track my order", color: "bg-deal/10 text-deal" },
  { id: "cancel", icon: "cancel", label: "Cancel order", color: "bg-red-100 text-red-700" },
  {
    id: "refund",
    icon: "currency_exchange",
    label: "Request refund",
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "report",
    icon: "report_problem",
    label: "Report an issue",
    color: "bg-accent/10 text-accent",
  },
  { id: "review", icon: "star", label: "Write a review", color: "bg-green-100 text-green-700" },
  {
    id: "more",
    icon: "more_horiz",
    label: "More help",
    color: "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]",
  },
];

const faqs = [
  {
    category: "Orders & Delivery",
    questions: [
      {
        q: "Where is my order?",
        a: "You can track your order in real-time from the order details page. Look for the live map showing your rider's location.",
      },
      {
        q: "How long will delivery take?",
        a: "Delivery times vary by restaurant and distance. You'll see an estimated time when you place your order. Most orders arrive within 30-45 minutes.",
      },
      {
        q: "Can I cancel my order?",
        a: "You can cancel your order before it's being prepared. Go to your order details and tap 'Cancel Order'. If the order is already being prepared, please contact support.",
      },
      {
        q: "What if my order is wrong or damaged?",
        a: "We're sorry! Please contact us immediately with a photo. We'll process a refund or send a replacement as per your preference.",
      },
    ],
  },
  {
    category: "Payments & Refunds",
    questions: [
      {
        q: "How do I get a refund?",
        a: "Refunds are processed within 5-7 business days to your original payment method. For UPI, it's usually instant.",
      },
      {
        q: "Why was I charged extra?",
        a: "Extra charges may include delivery fees (unless you have Pro), tip (if added), or taxes. Check your order breakdown for details.",
      },
      {
        q: "I didn't receive my cashback",
        a: "Cashback is usually credited within 24 hours. If you don't see it, please contact support with your order ID.",
      },
    ],
  },
  {
    category: "Account & Profile",
    questions: [
      {
        q: "How do I change my address?",
        a: "Go to your profile > Addresses > Add new address. You can set multiple addresses and choose one at checkout.",
      },
      {
        q: "How do I reset my password?",
        a: "Go to login > Forgot Password > Enter your email. You'll receive a reset link.",
      },
      {
        q: "How do I delete my account?",
        a: "Please contact our support team. Account deletion is processed within 30 days as per our data policy.",
      },
    ],
  },
];

export default function SupportPage() {
  const { t } = useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const support = useSupportSettings();
  const [tab, setTab] = useState<"home" | "chat" | "faqs" | "tickets">("home");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [issueType, setIssueType] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  interface OrderData {
    id: string;
    vendor: { name: string } | null;
    status: string;
    total_amount: number;
    placed_at: string;
  }

  const [userOrders, setUserOrders] = useState<OrderData[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState<string>("All");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const ensureConversation = useCallback(
    async (orderContext?: string) => {
      if (conversationId) return conversationId;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      setUserId(user.id);

      const contextNote = orderContext ? ` [Related to: ${orderContext}]` : "";

      const { data: conv, error } = await supabase
        .from("support_conversations")
        .insert({
          user_id: user.id,
          status: "open",
          priority: "normal",
        })
        .select()
        .single();

      if (error || !conv) return null;
      setConversationId(conv.id);

      await supabase.from("support_messages").insert({
        conversation_id: conv.id,
        sender_id: user.id,
        sender_type: "user",
        message: `Hi! I need help.${contextNote}`,
      });

      return conv.id;
    },
    [conversationId, supabase]
  );

  useEffect(() => {
    async function fetchOrders() {
      setOrdersLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: orders } = await supabase
          .from("orders")
          .select("id, vendor:vendors(shop_name), status, total_amount, placed_at")
          .eq("user_id", user.id)
          .order("placed_at", { ascending: false })
          .limit(10);
        setUserOrders(orders || []);
      }
      setOrdersLoading(false);
    }
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("id, conversation_id, sender_id, sender_type, message, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(
          data.map(
            (m: { id: string; sender_type: string; message: string; created_at: string }) => ({
              id: m.id,
              from: m.sender_type === "user" ? "user" : "support",
              text: m.message,
              time: formatTime(m.created_at),
            })
          )
        );
      }
    };

    loadMessages();

    const channel = supabase
      .channel(`support-msg-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: {
          new: { id: string; sender_type: string; message: string; created_at: string };
        }) => {
          const m = payload.new;
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id,
                from: m.sender_type === "user" ? "user" : "support",
                text: m.message,
                time: formatTime(m.created_at),
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage;
    setNewMessage("");

    const convId = await ensureConversation();
    if (!convId) {
      setSending(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSending(false);
      return;
    }

    await supabase.from("support_messages").insert({
      conversation_id: convId,
      sender_id: user.id,
      sender_type: "user",
      message: text,
    });
    setSending(false);
  };

  const handleQuickAction = async (action: string) => {
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

    let orderContext = "";
    if (selectedOrder) {
      orderContext = `Order #${selectedOrder.id.slice(0, 8).toUpperCase()} - ${selectedOrder.vendor?.name}`;
    }

    const convId = await ensureConversation(orderContext);
    if (!convId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("support_messages").insert({
      conversation_id: convId,
      sender_id: user.id,
      sender_type: "user",
      message: actionTexts[action] || action,
    });

    setTab("chat");
  };

  return (
    <div className="bg-background flex h-[100dvh] flex-col pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-primary text-on-primary shrink-0 px-4 py-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">{t.settings.helpCenter}</h1>
            <p className="text-on-primary/70 mt-1 text-sm">{t.settings.helpCenterSub}</p>
          </div>
        </div>
      </header>

      <Breadcrumbs
        items={[{ label: t.common.home, href: "/app/home" }, { label: t.settings.helpCenter }]}
      />

      {/* Tabs */}
      <div className="bg-surface-container-lowest shrink-0 border-b border-[var(--color-border-subtle)] px-4">
        <div className="mx-auto flex max-w-2xl">
          {(["home", "chat", "tickets", "faqs"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 border-b-2 py-4 text-sm font-bold transition-all ${
                tab === tabKey
                  ? "border-primary text-accent"
                  : "text-on-surface-variant border-transparent"
              }`}
            >
              {tabKey === "home"
                ? t.common.home
                : tabKey === "chat"
                  ? `💬 ${t.settings.chatWithUs}`
                  : tabKey === "tickets"
                    ? `🎫 ${t.settings.support}`
                    : `❓ ${t.settings.helpCenter}`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        {tab === "home" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <section>
              <h2 className="text-on-surface mb-4 text-lg font-bold">{t.home.categories}</h2>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className={`${action.color} flex flex-col items-center gap-2 rounded-2xl p-4 shadow-sm transition-all hover:scale-105`}
                  >
                    <span className="material-symbols-outlined text-2xl">{action.icon}</span>
                    <span className="text-center text-xs leading-tight font-semibold">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Select Order */}
            {ordersLoading ? (
              <section>
                <h2 className="text-on-surface mb-4 text-lg font-bold">Select Order (Optional)</h2>
                <div className="space-y-2">
                  <div className="h-14 w-full animate-pulse rounded-xl bg-[var(--color-surface-container)]" />
                  <div className="h-16 w-full animate-pulse rounded-xl bg-[var(--color-surface-container)]" />
                  <div className="h-16 w-full animate-pulse rounded-xl bg-[var(--color-surface-container)]" />
                </div>
              </section>
            ) : (
              userOrders.length > 0 && (
                <section>
                  <h2 className="text-on-surface mb-4 text-lg font-bold">
                    Select Order (Optional)
                  </h2>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(null);
                        setTab("chat");
                      }}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${!selectedOrder ? "border-primary bg-surface-container" : "border-outline-variant/20 hover:border-primary"}`}
                    >
                      <p className="font-semibold text-[var(--color-on-surface)]">General Query</p>
                      <p className="text-on-surface-variant text-xs">
                        Not related to a specific order
                      </p>
                    </button>
                    {userOrders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setTab("chat");
                        }}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all ${selectedOrder?.id === order.id ? "border-primary bg-surface-container" : "border-outline-variant/20 hover:border-primary"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-[var(--color-on-surface)]">
                              {order.vendor?.name || "Order"}
                            </p>
                            <p className="text-on-surface-variant text-xs">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-on-surface font-bold">₹{order.total_amount}</p>
                            <span className="rounded-full bg-[var(--color-surface-container)] px-2 py-0.5 text-[10px]">
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )
            )}

            {/* Contact Options */}
            <section>
              <h2 className="text-on-surface mb-4 text-lg font-bold">{t.settings.chatWithUs}</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setTab("chat")}
                  className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary flex w-full items-center gap-4 rounded-2xl p-5 shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-3xl">chat</span>
                  <div className="flex-1 text-left">
                    <p className="text-lg font-bold">{t.settings.chatWithUs}</p>
                    <p className="text-on-primary/70 text-sm">{t.settings.chatWithUsSub}</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>

                <a
                  href={`tel:${support.support_phone}`}
                  className="bg-surface-container-lowest border-outline-variant/20 text-on-surface hover:border-primary flex w-full items-center gap-4 rounded-2xl border p-5 transition-all"
                >
                  <span className="material-symbols-outlined text-accent text-3xl">call</span>
                  <div className="flex-1 text-left">
                    <p className="text-lg font-bold">{t.settings.support}</p>
                    <p className="text-on-surface-variant text-sm">{support.support_phone_label}</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </a>

                <a
                  href={`mailto:${support.support_email}`}
                  className="bg-surface-container-lowest border-outline-variant/20 text-on-surface hover:border-primary flex w-full items-center gap-4 rounded-2xl border p-5 transition-all"
                >
                  <span className="material-symbols-outlined text-accent text-3xl">email</span>
                  <div className="flex-1 text-left">
                    <p className="text-lg font-bold">{t.settings.helpCenter}</p>
                    <p className="text-on-surface-variant text-sm">
                      Response within {support.support_email_response_time}
                    </p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </a>

                <a
                  href={`https://wa.me/${support.support_whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-4 rounded-2xl bg-[#25D366] p-5 text-white transition-all hover:opacity-90"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.162-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.149-.149.297-.347.446-.521.151-.172.2-.296.3-.493.099-.198.05-.371.025-.515-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <div className="flex-1 text-left">
                    <p className="text-lg font-bold">WhatsApp</p>
                    <p className="text-sm text-white/70">Chat with us</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </a>
              </div>
            </section>

            {/* Social */}
            <section>
              <h2 className="text-on-surface mb-4 text-lg font-bold">Follow Us</h2>
              <div className="flex gap-3">
                {support.support_twitter && (
                  <a
                    href={support.support_twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant hover:border-primary hover:text-accent flex-1 rounded-xl border py-3 text-center text-sm font-bold transition-all"
                  >
                    Twitter
                  </a>
                )}
                {support.support_instagram && (
                  <a
                    href={support.support_instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant hover:border-primary hover:text-accent flex-1 rounded-xl border py-3 text-center text-sm font-bold transition-all"
                  >
                    Instagram
                  </a>
                )}
                {support.support_facebook && (
                  <a
                    href={support.support_facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant hover:border-primary hover:text-accent flex-1 rounded-xl border py-3 text-center text-sm font-bold transition-all"
                  >
                    Facebook
                  </a>
                )}
              </div>
            </section>
          </div>
        )}

        {tab === "chat" && (
          <div className="flex h-full min-h-0 flex-col">
            {/* Chat Messages */}
            <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
              {messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="bg-surface-container-lowest text-on-surface max-w-[85%] rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                    <p className="text-sm leading-relaxed">
                      Hi! Welcome to MIIAM Support. How can I help you today?
                    </p>
                    <p className="mt-2 text-xs text-[var(--color-outline-variant)]">Just now</p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                      msg.from === "user"
                        ? "bg-primary text-on-primary rounded-br-md"
                        : "bg-surface-container-lowest text-on-surface rounded-bl-md shadow-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p
                      className={`mt-2 text-xs ${msg.from === "user" ? "text-on-primary/50" : "text-[var(--color-outline-variant)]"}`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-end">
                  <div className="bg-primary/70 text-on-primary rounded-2xl rounded-br-md px-5 py-3">
                    <div className="flex gap-1">
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-white/70"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-white/70"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-white/70"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Replies */}
            {showQuickActions && (
              <div className="mb-4 flex flex-wrap gap-2">
                {["Track order", "Cancel order", "Refund", "Help me"].map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickAction(reply.toLowerCase().replace(" ", ""))}
                    className="bg-surface-container-lowest border-primary text-accent hover:bg-surface rounded-full border px-4 py-2 text-sm font-semibold transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="bg-surface-container-lowest border-outline-variant/20 flex items-center gap-3 rounded-2xl border p-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t.orders.typeMessage}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="bg-primary text-on-primary flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-50"
              >
                <span className="material-symbols-outlined">
                  {sending ? "hourglass_empty" : "send"}
                </span>
              </button>
            </div>
          </div>
        )}

        {tab === "tickets" && (
          <div className="space-y-6">
            <div className="bg-primary text-on-primary rounded-2xl p-6">
              <h2 className="mb-2 text-xl font-bold">{t.settings.support}</h2>
              <p className="text-on-primary/70 text-sm">Track and manage your support requests</p>
            </div>

            <div className="text-on-surface-variant py-12 text-center">
              <span className="material-symbols-outlined mb-4 text-5xl">confirmation_number</span>
              <p>{t.home.noNotifications}</p>
              <p className="mt-2 text-sm">Start a chat to create a ticket</p>
              <button
                onClick={() => setTab("chat")}
                className="bg-primary text-on-primary mt-4 rounded-xl px-6 py-3 font-bold"
              >
                Start Chat
              </button>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-6">
              <h3 className="text-on-surface mb-4 font-bold">How Tickets Work</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-on-surface font-semibold">Start a Chat</p>
                    <p className="text-on-surface-variant text-sm">
                      Describe your issue in the chat
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-on-surface font-semibold">We Create a Ticket</p>
                    <p className="text-on-surface-variant text-sm">
                      Our team will create a support ticket for you
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-on-surface font-semibold">Track Here</p>
                    <p className="text-on-surface-variant text-sm">
                      View ticket status and updates
                    </p>
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
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-outline-variant)]">
                search
              </span>
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search FAQs..."
                className="bg-surface-container-lowest border-outline-variant/20 focus:border-primary w-full rounded-2xl border py-4 pr-4 pl-12 outline-none"
              />
            </div>

            {/* Category Pills */}
            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFaqCategory("All")}
                className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap ${faqCategory === "All" ? "bg-primary text-on-primary" : "bg-surface-container-lowest border-outline-variant/20 border"}`}
              >
                All
              </button>
              {faqs.map((section) => (
                <button
                  key={section.category}
                  onClick={() => setFaqCategory(section.category)}
                  className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap ${faqCategory === section.category ? "bg-primary text-on-primary" : "bg-surface-container-lowest border-outline-variant/20 border"}`}
                >
                  {section.category}
                </button>
              ))}
            </div>

            {faqs.map((section) => {
              if (faqCategory !== "All" && section.category !== faqCategory) return null;
              const filteredQuestions = faqSearch
                ? section.questions.filter(
                    (faq) =>
                      faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
                      faq.a.toLowerCase().includes(faqSearch.toLowerCase())
                  )
                : section.questions;

              if (filteredQuestions.length === 0) return null;

              return (
                <section key={section.category}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent">
                      {section.category === "Orders & Delivery"
                        ? "local_shipping"
                        : section.category === "Payments & Refunds"
                          ? "payments"
                          : section.category === "Account & Profile"
                            ? "person"
                            : "help"}
                    </span>
                    <h2 className="text-on-surface text-lg font-bold">{section.category}</h2>
                  </div>
                  <div className="space-y-3">
                    {filteredQuestions.map((faq, i) => (
                      <details
                        key={i}
                        className="bg-surface-container-lowest group overflow-hidden rounded-2xl shadow-sm"
                      >
                        <summary className="hover:bg-surface-container flex cursor-pointer list-none items-center justify-between px-5 py-4 transition-colors">
                          <span className="text-on-surface pr-4 font-semibold">{faq.q}</span>
                          <span className="material-symbols-outlined text-[var(--color-outline-variant)] transition-transform group-open:rotate-180">
                            expand_more
                          </span>
                        </summary>
                        <div className="text-on-surface-variant border-t border-[var(--color-border-subtle)] px-5 pt-4 pb-4 text-sm leading-relaxed">
                          {faq.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              );
            })}

            {faqSearch && (
              <div className="text-on-surface-variant py-8 text-center">
                <span className="material-symbols-outlined mb-2 text-4xl">search_off</span>
                <p>No FAQs found for "{faqSearch}"</p>
              </div>
            )}
          </div>
        )}

        {/* Contact Info */}
        <div className="px-4 py-8">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <h3 className="text-on-surface mb-4 font-bold">Contact Us</h3>
            <div className="text-on-surface-variant space-y-3 text-sm">
              <p>📞 +91 99578 73472</p>
              <p>📞 +91 60000 24164</p>
              <p>✉️ miiamsupport@gmail.com</p>
              <p>📸 Instagram: @miiam.in</p>
              <p>📘 Facebook: Miiam Gauripur</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
