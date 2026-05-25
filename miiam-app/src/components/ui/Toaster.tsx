"use client";

import { useEffect } from "react";
import { useToastStore } from "@/lib/store/toastStore";
import { VisuallyHidden } from "@/lib/accessibility";

export default function Toaster() {
  const { toasts, removeToast } = useToastStore();

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

  if (toasts.length === 0) return <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" />;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-[9999] flex flex-col gap-2 pointer-events-none" role="log" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto bg-surface-container-lowest shadow-xl rounded-xl px-4 py-3 flex items-center gap-3 border-l-4 animate-slide-in ${
            toast.type === "success" ? "border-green-500" :
            toast.type === "error" ? "border-red-500" :
            toast.type === "warning" ? "border-amber-500" :
            "border-primary"
          }`}
          onClick={() => removeToast(toast.id)}
        >
          <span className={`material-symbols-outlined ${
            toast.type === "success" ? "text-green-500" :
            toast.type === "error" ? "text-red-500" :
            toast.type === "warning" ? "text-amber-500" :
            "text-primary"
          }`} aria-hidden="true">
            {toast.type === "success" ? "check_circle" :
             toast.type === "error" ? "error" :
             toast.type === "warning" ? "warning" :
             "info"}
          </span>
          <span className="text-sm font-medium text-on-surface">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
