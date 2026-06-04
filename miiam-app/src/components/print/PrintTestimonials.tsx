"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function PrintTestimonials() {
  const { t } = useTranslation();
  const items = t.print.testimonials;

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-amber-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>reviews</span>
        <h3 className="font-bold text-on-surface">{t.print.testimonialsTitle}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-surface-container-high rounded-xl border border-outline-variant/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                {item.name.charAt(0)}
              </div>
              <p className="text-sm font-bold text-on-surface">{item.name}</p>
            </div>
            <p className="text-sm text-on-surface-variant leading-snug">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
