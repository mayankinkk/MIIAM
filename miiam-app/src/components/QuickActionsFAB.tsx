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
  { icon: "home_repair_service", label: "Book Service", href: "/app/services", color: "bg-accent" },
  { icon: "receipt_long", label: "My Orders", href: "/app/orders", color: "bg-amber-500" },
  { icon: "support_agent", label: "Get Help", href: "/app/support", color: "bg-accent" },
];

interface QuickActionsFABProps {
  actions?: QuickAction[];
}

export default function QuickActionsFAB({ actions = defaultActions }: QuickActionsFABProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-24 z-40 md:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 bottom-16 flex flex-col items-end gap-2"
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
                  className="bg-surface-container-lowest flex items-center gap-2 rounded-full py-2 pr-3 pl-4 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <span className="text-on-surface text-xs font-bold whitespace-nowrap">
                    {action.label}
                  </span>
                  <div
                    className={`h-8 w-8 ${action.color} flex items-center justify-center rounded-full`}
                  >
                    <span className="material-symbols-outlined text-sm text-white">
                      {action.icon}
                    </span>
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
        className="bg-primary text-on-primary shadow-primary/30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
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
