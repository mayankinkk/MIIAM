"use client";

import { useState, useEffect } from "react";

export interface SupportSettings {
  support_phone: string;
  support_phone_label: string;
  support_email: string;
  support_whatsapp: string;
  support_twitter: string;
  support_instagram: string;
  support_facebook: string;
  support_linkedin: string;
  support_youtube: string;
  support_response_time: string;
  support_email_response_time: string;
}

const defaults: SupportSettings = {
  support_phone: "+9118001234567",
  support_phone_label: "1800-123-4567 (Toll free)",
  support_email: "support@miiam.in",
  support_whatsapp: "+9118001234567",
  support_twitter: "https://twitter.com/miiam_in",
  support_instagram: "https://instagram.com/miiam_in",
  support_facebook: "https://facebook.com/miiam.in",
  support_linkedin: "",
  support_youtube: "",
  support_response_time: "2 mins",
  support_email_response_time: "24 hours",
};

let cached: SupportSettings | null = null;

export function useSupportSettings(): SupportSettings {
  const [settings, setSettings] = useState<SupportSettings>(cached || defaults);

  useEffect(() => {
    if (cached) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const merged = { ...defaults };
          for (const key of Object.keys(defaults)) {
            if (data.settings[key]) {
              (merged as Record<string, unknown>)[key] = data.settings[key];
            }
          }
          cached = merged;
          setSettings(merged);
        }
      })
      .catch(() => {});
  }, []);

  return settings;
}
