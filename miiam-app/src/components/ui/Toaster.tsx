"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToastStore, type Toast } from "@/lib/store/toastStore";

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  useEffect(() => {
    if (toasts.length > 0) {
      const lastToast = toasts[toasts.length - 1];
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = `${lastToast.type}: ${lastToast.message}`;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    }
  }, [toasts]);

  return (
    <div
      className="pointer-events-none fixed right-4 bottom-24 left-4 z-[9999] flex flex-col gap-2 md:right-6 md:bottom-6 md:left-auto md:max-w-sm"
      role="log"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 3500;

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
      if (elapsed < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [duration]);

  const styles: Record<string, { bg: string; icon: string; bar: string }> = {
    success: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      icon: "text-emerald-500",
      bar: "bg-emerald-500",
    },
    error: {
      bg: "bg-status-error/10 dark:bg-status-error/15",
      icon: "text-status-error",
      bar: "bg-status-error",
    },
    warning: {
      bg: "bg-status-warning/10 dark:bg-status-warning/15",
      icon: "text-status-warning",
      bar: "bg-status-warning",
    },
    info: { bg: "bg-primary/10", icon: "text-accent", bar: "bg-primary" },
  };

  const icons: Record<string, string> = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  };

  const s = styles[toast.type] || styles.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`pointer-events-auto ${s.bg} flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 px-4 py-3 shadow-lg backdrop-blur-lg dark:border-white/5`}
    >
      <span className={`material-symbols-outlined ${s.icon} shrink-0 text-xl`} aria-hidden="true">
        {icons[toast.type]}
      </span>
      <span className="text-on-surface min-w-0 flex-1 text-sm font-medium">{toast.message}</span>
      {toast.action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
          className="text-accent hover:text-accent/80 shrink-0 text-xs font-bold transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="hover:bg-on-surface/10 -mr-1 shrink-0 rounded-full p-1 transition-colors"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
      </button>

      {/* Progress bar */}
      <div className="bg-on-surface/5 absolute right-0 bottom-0 left-0 h-[2px]">
        <motion.div className={`h-full ${s.bar}`} style={{ width: `${progress}%` }} />
      </div>
    </motion.div>
  );
}
