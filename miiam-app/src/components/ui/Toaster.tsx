"use client";

import { useEffect, useRef, useCallback } from "react";
import { useToastStore } from "@/lib/store/toastStore";

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

  if (toasts.length === 0) {
    return (
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
    );
  }

  return (
    <div
      className="fixed bottom-24 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-[9999] flex flex-col gap-2 pointer-events-none"
      role="log"
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} index={index} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
  index,
}: {
  toast: { id: string; message: string; type: string; duration?: number };
  onDismiss: (id: string) => void;
  index: number;
}) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - startX.current;
    if (diff > 0) {
      currentX.current = diff;
      if (elementRef.current) {
        elementRef.current.style.transform = `translateX(${diff}px)`;
        elementRef.current.style.opacity = `${1 - diff / 200}`;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (currentX.current > 100) {
      onDismiss(toast.id);
    } else if (elementRef.current) {
      elementRef.current.style.transform = "";
      elementRef.current.style.opacity = "";
    }
  }, [onDismiss, toast.id]);

  const borderColor =
    toast.type === "success" ? "border-green-500" :
    toast.type === "error" ? "border-red-500" :
    toast.type === "warning" ? "border-amber-500" :
    "border-[var(--color-primary)]";

  const iconColor =
    toast.type === "success" ? "text-green-500" :
    toast.type === "error" ? "text-red-500" :
    toast.type === "warning" ? "text-amber-500" :
    "text-[var(--color-primary)]";

  const icon =
    toast.type === "success" ? "check_circle" :
    toast.type === "error" ? "error" :
    toast.type === "warning" ? "warning" :
    "info";

  return (
    <div
      ref={elementRef}
      className={`pointer-events-auto bg-[var(--color-surface-container-lowest)] shadow-xl rounded-xl px-4 py-3 flex items-center gap-3 border-l-4 cursor-pointer hover:opacity-80 transition-opacity animate-slide-in ${borderColor}`}
      style={{ zIndex: 9999 - index }}
      onClick={() => onDismiss(toast.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onDismiss(toast.id);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <span className={`material-symbols-outlined ${iconColor}`} aria-hidden="true">
        {icon}
      </span>
      <span className="text-sm font-medium text-[var(--color-on-surface)] flex-1">
        {toast.message}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        className="ml-auto p-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-colors"
        aria-label="Dismiss notification"
      >
        <span className="material-symbols-outlined text-sm text-[var(--color-outline)]">
          close
        </span>
      </button>
    </div>
  );
}
