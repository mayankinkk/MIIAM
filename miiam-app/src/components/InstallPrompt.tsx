"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
    <div
      className="bg-surface-container-lowest border-outline-variant animate-in slide-in-from-bottom-8 fixed right-4 bottom-24 left-4 z-50 rounded-2xl border p-4 shadow-2xl duration-300"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
          <span className="material-symbols-outlined text-on-primary text-xl">install_mobile</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-on-surface text-sm font-bold">Install MIIAM</p>
          <p className="text-on-surface-variant mt-0.5 text-xs">
            Add to your home screen for a better experience
          </p>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-on-surface-variant hover:text-on-surface"
          aria-label="Dismiss install prompt"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="bg-primary text-on-primary mt-3 w-full rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
      >
        Install App
      </button>
    </div>
  );
}
