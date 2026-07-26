"use client";

import { useState } from "react";

interface FestivalBannerProps {
  title: string;
  subtitle: string;
  gradient?: string;
  icon?: string;
  dismissible?: boolean;
}

export default function FestivalBanner({ title, subtitle, gradient = "from-primary via-secondary to-primary", icon = "🎉", dismissible = true }: FestivalBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className={`mx-5 mt-3 rounded-2xl bg-gradient-to-r ${gradient} p-4 shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
      <div className="flex items-start gap-3 relative z-10">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <h3 className="font-black text-white text-sm">{title}</h3>
          <p className="text-white/80 text-xs mt-0.5">{subtitle}</p>
        </div>
        {dismissible && (
          <button onClick={() => setVisible(false)} className="text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>
    </div>
  );
}