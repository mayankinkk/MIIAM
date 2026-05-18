"use client";

import { useState } from "react";
import Link from "next/link";

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
  color: string;
}

interface QuickActionsFABProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  { id: "food", icon: "restaurant", label: "Food", href: "/app/food", color: "bg-orange-500" },
  { id: "cart", icon: "shopping_cart", label: "Cart", href: "/app/cart", color: "bg-[#ba001c]" },
  { id: "orders", icon: "receipt_long", label: "Orders", href: "/app/orders", color: "bg-blue-500" },
  { id: "support", icon: "support_agent", label: "Support", href: "/app/support", color: "bg-green-500" },
];

export default function QuickActionsFAB({ actions = defaultActions }: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Quick Actions Menu */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3">
        {isOpen && (
          <div className="flex flex-col gap-2 animate-fade-in">
            {actions.map((action) => (
              <Link
                key={action.id}
                href={action.href || "#"}
                onClick={(e) => {
                  if (action.onClick) {
                    e.preventDefault();
                    handleAction(action);
                  }
                }}
                className="flex items-center gap-3 group"
              >
                <span className="bg-white text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-lg opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap">
                  {action.label}
                </span>
                <div
                  className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}
                >
                  <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {action.icon}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 bg-gradient-to-br from-[#ba001c] to-[#ff7670] rounded-full flex items-center justify-center shadow-2xl shadow-[#ba001c]/30 active:scale-90 transition-all duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
          aria-label="Quick actions"
        >
          <span className="material-symbols-outlined text-white text-2xl transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isOpen ? "close" : "add"}
          </span>
        </button>

        {/* Pulse effect when closed */}
        {!isOpen && (
          <div className="absolute inset-0 w-14 h-14 rounded-full bg-[#ba001c]/30 animate-ping -z-10" />
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export function MiniFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-[#ba001c] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isOpen ? "close" : "menu"}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 animate-slide-in">
          <Link
            href="/app/food"
            className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined text-white text-lg">restaurant</span>
          </Link>
          <Link
            href="/app/orders"
            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined text-white text-lg">receipt_long</span>
          </Link>
          <Link
            href="/app/support"
            className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined text-white text-lg">support_agent</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export function ChatFAB() {
  return (
    <Link
      href="/app/support/chat"
      className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-bounce-in"
    >
      <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
        chat
      </span>
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
    </Link>
  );
}