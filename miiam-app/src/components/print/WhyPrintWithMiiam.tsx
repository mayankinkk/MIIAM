"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

const trustItems = (t: ReturnType<typeof useTranslation>["t"]) => [
  {
    icon: "lock",
    color: "from-emerald-500 to-green-600",
    title: t.print.trustPrivacyTitle,
    desc: t.print.trustPrivacyDesc,
  },
  {
    icon: "bolt",
    color: "from-amber-500 to-orange-600",
    title: t.print.trustSpeedTitle,
    desc: t.print.trustSpeedDesc,
  },
  {
    icon: "support_agent",
    color: "from-blue-500 to-indigo-600",
    title: t.print.trustSupportTitle,
    desc: t.print.trustSupportDesc,
  },
  {
    icon: "price_check",
    color: "from-rose-500 to-pink-600",
    title: t.print.trustPricingTitle,
    desc: t.print.trustPricingDesc,
  },
];

export default function WhyPrintWithMiiam() {
  const { t } = useTranslation();
  const items = trustItems(t);

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
      <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">verified</span>
        {t.print.trustSectionTitle}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="relative p-3 bg-surface-container-high rounded-xl border border-outline-variant/5 overflow-hidden"
          >
            <div
              className={`absolute -right-4 -top-4 w-12 h-12 rounded-full bg-gradient-to-br ${item.color} opacity-10`}
            />
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
              <span className="material-symbols-outlined text-white text-lg">{item.icon}</span>
            </div>
            <p className="text-sm font-bold text-on-surface leading-tight">{item.title}</p>
            <p className="text-[11px] text-on-surface-variant leading-snug mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
