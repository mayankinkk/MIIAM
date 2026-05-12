"use client";

import { useEffect } from "react";
import { useToastStore } from "@/lib/store/toastStore";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }: { toast: any; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons: Record<string, string> = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  };

  const colors: Record<string, string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-amber-600",
    info: "bg-blue-600",
  };

  return (
    <div className={`${colors[toast.type] || "bg-slate-800"} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[slideIn_0.3s_ease-out] pointer-events-auto`}>
      <span className="material-symbols-outlined">{icons[toast.type] || "info"}</span>
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}