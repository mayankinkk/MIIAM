"use client";

import { useEffect, useState, useCallback } from "react";

export function ServiceWorkerRegistration() {
  const [showUpdate, setShowUpdate] = useState(false);

  const handleUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const shouldRegister =
        process.env.NODE_ENV === "production" ||
        process.env.NEXT_PUBLIC_ENABLE_SW === "true";

      if (!shouldRegister) return;

      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setShowUpdate(true);
                }
              });
            }
          });
        })
        .catch(() => {
          // SW registration failed silently
        });
    }
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[200] md:left-auto md:right-6 md:max-w-sm">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl text-green-400">system_update</span>
        <div className="flex-1">
          <p className="text-sm font-bold">New version available</p>
          <p className="text-xs text-[var(--color-outline-variant)]/60">Refresh to get the latest update</p>
        </div>
        <button
          onClick={handleUpdate}
          className="bg-[#ba001c] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#a00018] active:scale-95 transition-all shrink-0"
        >
          Update
        </button>
      </div>
    </div>
  );
}
