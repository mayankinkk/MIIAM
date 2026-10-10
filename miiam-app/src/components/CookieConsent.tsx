"use client";

import { useState, useEffect } from "react";

const COOKIE_CONSENT_KEY = "miiam_cookie_consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setShow(true);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShow(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-[100] p-4 md:p-6">
      <div className="bg-surface-container-lowest border-outline-variant/10 mx-auto max-w-2xl rounded-2xl border p-5 shadow-2xl">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-accent mt-0.5 text-2xl">cookie</span>
          <div className="flex-1">
            <h3 className="text-on-surface mb-1 text-sm font-bold">We use cookies</h3>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              MIIAM uses cookies to provide our services, improve your experience, and analyze
              traffic. By clicking &quot;Accept&quot;, you agree to our use of cookies for essential
              functionality and analytics.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={decline}
                className="bg-surface-container text-on-surface-variant hover:bg-surface-container-high rounded-xl px-4 py-2 text-xs font-bold transition-colors"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="bg-primary text-on-primary rounded-xl px-4 py-2 text-xs font-bold transition-all hover:opacity-90 active:scale-95"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
