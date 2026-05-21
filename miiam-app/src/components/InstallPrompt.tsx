"use client";

import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setShowPrompt(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (installed || !showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant p-4 animate-in slide-in-from-bottom-8 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white text-xl">install_mobile</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-on-surface text-sm">Install MIIAM</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Add to your home screen for a better experience</p>
        </div>
        <button onClick={() => setShowPrompt(false)} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="mt-3 w-full py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
      >
        Install App
      </button>
    </div>
  );
}
