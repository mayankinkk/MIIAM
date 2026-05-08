"use client";

import { useToastStore } from "@/lib/store/toastStore";

export default function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto bg-white shadow-xl rounded-xl px-4 py-3 flex items-center gap-3 border-l-4 animate-slide-in ${
            toast.type === "success" ? "border-green-500" :
            toast.type === "error" ? "border-red-500" :
            toast.type === "warning" ? "border-amber-500" :
            "border-[#0b50d5]"
          }`}
          onClick={() => removeToast(toast.id)}
        >
          <span className={`material-symbols-outlined ${
            toast.type === "success" ? "text-green-500" :
            toast.type === "error" ? "text-red-500" :
            toast.type === "warning" ? "text-amber-500" :
            "text-[#0b50d5]"
          }`}>
            {toast.type === "success" ? "check_circle" :
             toast.type === "error" ? "error" :
             toast.type === "warning" ? "warning" :
             "info"}
          </span>
          <span className="text-sm font-medium text-[#4d212a]">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}