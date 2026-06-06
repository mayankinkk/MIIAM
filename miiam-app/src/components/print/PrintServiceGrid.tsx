"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguageStore } from "@/lib/store/languageStore";
import { getTranslations } from "@/lib/i18n";
import {
  usePrintServiceStore,
  type ServicePresetId,
} from "@/lib/store/printServiceStore";

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return [m, setM] as const;
}

export type ServicePreset = ServicePresetId;

interface ServiceMeta {
  icon: string;
  titleKey: "bwTitle" | "colorTitle" | "passportTitle" | "spiralTitle" | "softTitle" | "hardTitle" | "lamA4Title" | "lamIdTitle" | "photoTitle" | "bulkTitle" | "reportsTitle";
  descKey: "bwDesc" | "colorDesc" | "passportDesc" | "spiralDesc" | "softDesc" | "hardDesc" | "lamA4Desc" | "lamIdDesc" | "photoDesc" | "bulkDesc" | "reportsDesc";
  accent: string;
  ring: string;
  href?: string;
}

const SERVICE_META: Record<ServicePresetId, ServiceMeta> = {
  bw: { icon: "description", titleKey: "bwTitle", descKey: "bwDesc", accent: "from-slate-700 to-slate-900", ring: "ring-slate-200 hover:ring-slate-400" },
  color: { icon: "palette", titleKey: "colorTitle", descKey: "colorDesc", accent: "from-indigo-500 to-purple-600", ring: "ring-indigo-200 hover:ring-indigo-400" },
  passport: { icon: "face", titleKey: "passportTitle", descKey: "passportDesc", accent: "from-pink-500 to-rose-600", ring: "ring-pink-200 hover:ring-pink-400", href: "/app/printing/passport" },
  spiral: { icon: "auto_stories", titleKey: "spiralTitle", descKey: "spiralDesc", accent: "from-amber-500 to-orange-600", ring: "ring-amber-200 hover:ring-amber-400" },
  soft: { icon: "menu_book", titleKey: "softTitle", descKey: "softDesc", accent: "from-emerald-500 to-teal-600", ring: "ring-emerald-200 hover:ring-emerald-400" },
  hard: { icon: "book", titleKey: "hardTitle", descKey: "hardDesc", accent: "from-blue-600 to-indigo-700", ring: "ring-blue-200 hover:ring-blue-400" },
  lamination_a4: { icon: "shield", titleKey: "lamA4Title", descKey: "lamA4Desc", accent: "from-cyan-500 to-blue-600", ring: "ring-cyan-200 hover:ring-cyan-400" },
  lamination_id: { icon: "badge", titleKey: "lamIdTitle", descKey: "lamIdDesc", accent: "from-fuchsia-500 to-purple-600", ring: "ring-fuchsia-200 hover:ring-fuchsia-400" },
  photo: { icon: "photo_library", titleKey: "photoTitle", descKey: "photoDesc", accent: "from-rose-500 to-pink-600", ring: "ring-rose-200 hover:ring-rose-400" },
  bulk: { icon: "inventory_2", titleKey: "bulkTitle", descKey: "bulkDesc", accent: "from-violet-500 to-purple-700", ring: "ring-violet-200 hover:ring-violet-400" },
  reports: { icon: "assignment", titleKey: "reportsTitle", descKey: "reportsDesc", accent: "from-orange-500 to-red-600", ring: "ring-orange-200 hover:ring-orange-400" },
};

interface Props {
  activePreset?: ServicePreset | null;
  onSelect: (preset: ServicePreset) => void;
}

export default function PrintServiceGrid({ activePreset, onSelect }: Props) {
  const { language } = useLanguageStore();
  const [mounted] = useMounted();
  const t = mounted ? getTranslations(language).print.services : getTranslations("en").print.services;
  const allServices = usePrintServiceStore((s) => s.services);
  const services = useMemo(
    () => allServices.filter((s) => s.enabled).sort((a, b) => a.order - b.order),
    [allServices]
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard_customize</span>
            {t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">{t.subheading}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {services.map((svc) => {
          const meta = SERVICE_META[svc.id];
          const isActive = activePreset === svc.id;
          const card = (
            <div
              className={`relative group rounded-2xl bg-white p-3 sm:p-4 border-2 transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? "border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-200"
                  : `border-slate-100 ring-1 ${meta.ring} hover:shadow-md hover:-translate-y-0.5`
              }`}
            >
              {svc.badge && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  {svc.badge}
                </span>
              )}
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${meta.accent} flex items-center justify-center shadow-md mb-2`}>
                <span className="material-symbols-outlined text-white text-lg sm:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-slate-800 leading-tight line-clamp-2">{t[meta.titleKey]}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug hidden sm:block">{t[meta.descKey]}</p>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-[10px] sm:text-xs font-black text-indigo-600">{svc.price}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 ml-auto">· {svc.eta}</span>
              </div>
            </div>
          );
          if (meta.href) {
            return (
              <Link key={svc.id} href={meta.href} className="block">
                {card}
              </Link>
            );
          }
          return (
            <button
              key={svc.id}
              type="button"
              onClick={() => onSelect(svc.id)}
              className="text-left"
              aria-pressed={isActive}
            >
              {card}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { SERVICE_META };
