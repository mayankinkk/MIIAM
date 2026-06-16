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
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/10 p-5 max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-primary text-2xl mt-0.5">cookie</span>
          <div className="flex-1">
            <h3 className="font-bold text-on-surface text-sm mb-1">We use cookies</h3>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              MIIAM uses cookies to provide our services, improve your experience, and analyze traffic. By clicking &quot;Accept&quot;, you agree to our use of cookies for essential functionality and analytics.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={decline}
                className="px-4 py-2 bg-surface-container rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
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
