"use client";

import { useState } from "react";

interface FestivalBannerProps {
  title: string;
  subtitle: string;
  gradient?: string;
  icon?: string;
  dismissible?: boolean;
}

export default function FestivalBanner({
  title,
  subtitle,
  gradient = "from-primary via-secondary to-primary",
  icon = "🎉",
  dismissible = true,
}: FestivalBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className={`mx-5 mt-3 rounded-2xl bg-gradient-to-r ${gradient} relative overflow-hidden p-4 shadow-lg`}
    >
      <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative z-10 flex items-start gap-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-sm font-black text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-white/80">{subtitle}</p>
        </div>
        {dismissible && (
          <button
            onClick={() => setVisible(false)}
            className="text-white/60 transition-colors hover:text-white"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
