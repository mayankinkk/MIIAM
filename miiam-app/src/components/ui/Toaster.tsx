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
      className="fixed bottom-24 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-[9999] flex flex-col gap-2 pointer-events-none"
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

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
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
    success: { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", icon: "text-emerald-500", bar: "bg-emerald-500" },
    error:   { bg: "bg-red-500/10 dark:bg-red-500/15", icon: "text-red-500", bar: "bg-red-500" },
    warning: { bg: "bg-amber-500/10 dark:bg-amber-500/15", icon: "text-amber-500", bar: "bg-amber-500" },
    info:    { bg: "bg-primary/10", icon: "text-primary", bar: "bg-primary" },
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
      className={`pointer-events-auto ${s.bg} backdrop-blur-lg rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg border border-white/10 dark:border-white/5 overflow-hidden`}
    >
      <span className={`material-symbols-outlined ${s.icon} text-xl shrink-0`} aria-hidden="true">
        {icons[toast.type]}
      </span>
      <span className="text-sm font-medium text-on-surface flex-1 min-w-0">
        {toast.message}
      </span>
      {toast.action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
          className="text-xs font-bold text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 -mr-1 rounded-full hover:bg-on-surface/10 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-on-surface/5">
        <motion.div
          className={`h-full ${s.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
