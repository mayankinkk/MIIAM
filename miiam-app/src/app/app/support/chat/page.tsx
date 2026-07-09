"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import logger from "@/lib/logger";

const ORDER_ID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
const SHORT_ORDER_REGEX = /\b[a-z]{3,}\d{4,}\b/i;

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Your order is placed and waiting for the restaurant to accept it.",
  accepted: "The restaurant has accepted your order and will start preparing soon.",
  preparing: "Your order is being prepared by the restaurant right now!",
  ready_for_pickup: "Your order is ready! A rider will pick it up shortly.",
  picked_up: "Your rider has picked up your order and is on the way!",
  on_the_way: "Your rider is on the way to deliver your order!",
  arrived: "Your rider has arrived! Please collect your order.",
  delivered: "Your order has been delivered. Enjoy your meal!",
  cancelled: "Your order has been cancelled.",
  refunded: "Your order has been cancelled and a refund is being processed.",
  scheduled: "Your order is scheduled for a future delivery time.",
  no_rider_available: "We're looking for a rider for your order. Please wait a moment.",
};

function getOrderStatusMessage(status: string): string {
  return STATUS_MESSAGES[status] || `Order status: ${status}`;
}

function extractOrderId(text: string): string | null {
  const uuidMatch = text.match(ORDER_ID_REGEX);
  if (uuidMatch) return uuidMatch[0];

  const shortMatch = text.match(SHORT_ORDER_REGEX);
  if (shortMatch) return shortMatch[0];

  return null;
}

interface Message {
  id: string;
  text: string;
  role: "user" | "bot" | "agent";
  time: Date;
  orderData?: {
    id: string;
    status: string;
    total_amount: number;
    placed_at: string;
    vendor_name?: string;
    items?: string;
  };
}

export default function SupportChatPage() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hi there! I'm MIIAM Support. How can I help you today?\n\nYou can ask about:\n• Order status (share your order ID)\n• Refunds\n• Delivery issues\n• Payment problems",
      role: "bot",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [humanMode, setHumanMode] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function lookupOrder(orderId: string): Promise<Message["orderData"] | null> {
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, status, total_amount, placed_at, vendor_id, items:order_items(name, quantity)")
        .ilike("id", orderId)
        .single();

      if (error || !order) return null;

      const vendorRes = await supabase
        .from("vendors")
        .select("shop_name")
        .eq("id", order.vendor_id)
        .single();

      const items = (order.items as { name: string; quantity: number }[] | null)
        ?.map((i) => `${i.name} x${i.quantity}`)
        .join(", ");

      return {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        placed_at: order.placed_at,
        vendor_name: vendorRes.data?.shop_name,
        items,
      };
    } catch (err) {
      logger.error({ err: err }, "Order lookup failed");
      return null;
    }
  }

  async function createSupportConversation(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("support_conversations")
        .insert({ user_id: userId, status: "open", priority: "normal" })
        .select("id")
        .single();

      if (error || !data) return null;
      return data.id;
    } catch (err) {
      logger.error({ err: err }, "Failed to create support conversation");
      return null;
    }
  }

  async function saveSupportMessage(conversationId: string, text: string, senderType: "user" | "support", senderId: string) {
    try {
      await supabase.from("support_messages").insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        message: text,
      });
    } catch (err) {
      logger.error({ err: err }, "Failed to save support message");
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), text, role: "user", time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    // Save user message if in human mode
    if (humanMode && conversationId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await saveSupportMessage(conversationId, text, "user", user.id);
    }

    const lower = text.toLowerCase();

    // Check for order ID
    const orderId = extractOrderId(text);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      // Human handoff mode
      if (humanMode) {
        setTyping(false);
        return;
      }

      // Order lookup
      if (orderId) {
        const orderData = await lookupOrder(orderId);
        if (orderData) {
          const statusMsg = getOrderStatusMessage(orderData.status);
          const botText = `📦 **Order Found!**\n\n` +
            `Order ID: ${orderData.id.slice(0, 8)}...\n` +
            `Status: ${orderData.status.replace(/_/g, " ").toUpperCase()}\n` +
            `${statusMsg}\n\n` +
            `Restaurant: ${orderData.vendor_name || "N/A"}\n` +
            `Items: ${orderData.items || "N/A"}\n` +
            `Total: ₹${orderData.total_amount}\n` +
            `Placed: ${new Date(orderData.placed_at).toLocaleString("en-IN")}\n\n` +
            `Need more help? Type "agent" to talk to a human support agent.`;

          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            text: botText,
            role: "bot",
            time: new Date(),
            orderData,
          }]);
        } else {
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            text: `❌ I couldn't find an order with ID "${orderId}". Please double-check the order ID and try again.\n\nYou can find your order ID in:\n• Order confirmation screen\n• Order history\n• Email/SMS notifications`,
            role: "bot",
            time: new Date(),
          }]);
        }
        setTyping(false);
        return;
      }

      // Keyword matching
      if (lower.includes("agent") || lower.includes("human") || lower.includes("talk") || lower.includes("person")) {
        // Initiate human handoff
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const convId = await createSupportConversation(user.id);
          if (convId) {
            setConversationId(convId);
            setHumanMode(true);
            await saveSupportMessage(convId, text, "user", user.id);
            setMessages((prev) => [...prev, {
              id: (Date.now() + 1).toString(),
              text: "🧑‍💼 I've connected you with our support team. A human agent will reply shortly.\n\nIn the meantime, you can continue typing your message here. For urgent issues, call us at 99578 73472.",
              role: "agent",
              time: new Date(),
            }]);
          } else {
            setMessages((prev) => [...prev, {
              id: (Date.now() + 1).toString(),
              text: "I'm having trouble connecting you to a human agent right now. Please call us at 99578 73472 for immediate assistance.",
              role: "bot",
              time: new Date(),
            }]);
          }
        } else {
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "Please log in first to connect with a human agent, or call us at 99578 73472.",
            role: "bot",
            time: new Date(),
          }]);
        }
        setTyping(false);
        return;
      }

      if (lower.includes("order")) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "I can help with order issues! Please share your order ID (e.g., tdbb772 or the full UUID from your order history) and I'll look it up for you.",
          role: "bot",
          time: new Date(),
        }]);
      } else if (lower.includes("refund") || lower.includes("return") || lower.includes("cancel")) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "For refunds, I'll need your order ID to check the status. Refunds are processed within 5-7 business days to your original payment method. For UPI, it's usually instant.\n\nShare your order ID and I'll look into it.",
          role: "bot",
          time: new Date(),
        }]);
      } else if (lower.includes("delivery") || lower.includes("late") || lower.includes("arrived")) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "If your delivery is delayed, please wait 10 extra minutes. If it still hasn't arrived, share your order ID and I'll check the rider's status.\n\nYou can also type \"agent\" to talk to a human support agent.",
          role: "bot",
          time: new Date(),
        }]);
      } else if (lower.includes("payment") || lower.includes("pay") || lower.includes("charged")) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "Payment issues are rare but we'll sort it out! Please share your order ID or transaction ID and I'll check the payment status.\n\nFor immediate help, call us at 99578 73472.",
          role: "bot",
          time: new Date(),
        }]);
      } else {
        // Unknown query - offer human handoff
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "I'm not sure I understand. I can help with:\n• **Order status** — share your order ID\n• **Refunds** — share your order ID\n• **Delivery issues** — share your order ID\n• **Payment problems** — share your order ID\n\nOr type \"agent\" to talk to a human support agent.\n\nFor urgent issues, call us at **99578 73472**.",
          role: "bot",
          time: new Date(),
        }]);
      }
      setTyping(false);
    }, 1200);
  };

  const quickReplies = ["Track my order", "Request refund", "Payment issue", "Delivery problem", "Talk to agent"];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-[var(--color-surface-container-lowest)] px-4 py-4 sticky top-0 z-10 shadow-sm border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <Link href="/app/support" aria-label="Go back" className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center text-white font-black text-sm">M</div>
          <div className="flex-1">
            <p className="font-bold text-[var(--color-on-surface)]">MIIAM Support</p>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${humanMode ? "bg-blue-500" : "bg-green-500 animate-pulse"}`} />
              <span className={`text-xs font-medium ${humanMode ? "text-blue-600" : "text-green-600"}`}>
                {humanMode ? "Connected to support agent" : "Online · Usually replies instantly"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Help & Support', href: '/app/support' }, { label: 'Chat' }]} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-40">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black mr-2 flex-shrink-0 mt-auto ${
                msg.role === "agent" ? "bg-blue-500" : "bg-gradient-to-br from-primary to-primary-container"
              }`}>
                {msg.role === "agent" ? "🧑‍💼" : "M"}
              </div>
            )}
            <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
              msg.role === "user"
                ? "bg-primary text-white rounded-br-sm"
                : msg.role === "agent"
                  ? "bg-blue-50 text-blue-900 border border-blue-200 rounded-bl-sm"
                  : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] shadow-sm rounded-bl-sm"
            }`}>
              {msg.text}
              <p className={`text-[9px] mt-1 ${msg.role === "user" ? "text-white/60" : "text-[var(--color-outline-variant)]"}`}>
                {msg.time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center text-white text-xs font-black">M</div>
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      <div className="fixed bottom-28 left-0 right-0 px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {quickReplies.map((r) => (
            <button
              key={r}
              onClick={() => { setInput(r); }}
              className="flex-shrink-0 px-3 py-1.5 bg-[var(--color-surface-container-lowest)] border border-primary text-primary rounded-full text-xs font-bold hover:bg-surface transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface-container-lowest)] border-t border-[var(--color-border-subtle)] px-4 py-3 flex gap-2 items-end" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
          placeholder={humanMode ? "Type a message for the support agent..." : "Type a message..."}
          rows={1}
          className="flex-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none max-h-24"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-11 h-11 bg-primary disabled:bg-[var(--color-surface-container-high)] text-white rounded-2xl flex items-center justify-center transition-all active:scale-90"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
}
