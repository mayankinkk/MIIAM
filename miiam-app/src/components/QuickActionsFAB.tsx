"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface QuickAction {
  icon: string;
  label: string;
  href: string;
  color?: string;
}

const defaultActions: QuickAction[] = [
  { icon: "restaurant", label: "Order Food", href: "/app/food", color: "bg-emerald-500" },
  { icon: "home_repair_service", label: "Book Service", href: "/app/services", color: "bg-blue-500" },
  { icon: "receipt_long", label: "My Orders", href: "/app/orders", color: "bg-amber-500" },
  { icon: "support_agent", label: "Get Help", href: "/app/support", color: "bg-purple-500" },
];

interface QuickActionsFABProps {
  actions?: QuickAction[];
}

export default function QuickActionsFAB({ actions = defaultActions }: QuickActionsFABProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-40 md:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 flex flex-col gap-2 items-end"
          >
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 bg-surface-container-lowest shadow-lg rounded-full pl-4 pr-3 py-2 hover:scale-105 active:scale-95 transition-transform"
                >
                  <span className="text-xs font-bold text-on-surface whitespace-nowrap">{action.label}</span>
                  <div className={`w-8 h-8 ${action.color} rounded-full flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white text-sm">{action.icon}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center"
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="material-symbols-outlined text-2xl"
        >
          {open ? "close" : "add"}
        </motion.span>
      </motion.button>
    </div>
  );
}
