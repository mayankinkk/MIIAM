"use client";

import { useEffect, useMemo, useState } from "react";
import {
  usePrintServiceStore,
  DEFAULT_SERVICES,
  type ServicePresetId,
} from "@/lib/store/printServiceStore";
import { SERVICE_META } from "@/components/print/PrintServiceGrid";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ServicesCatalogPanel({ open, onClose }: Props) {
  const allServices = usePrintServiceStore((s) => s.services);
  const services = useMemo(
    () => [...allServices].sort((a, b) => a.order - b.order),
    [allServices]
  );
  const setService = usePrintServiceStore((s) => s.setService);
  const toggleEnabled = usePrintServiceStore((s) => s.toggleEnabled);
  const move = usePrintServiceStore((s) => s.move);
  const resetToDefaults = usePrintServiceStore((s) => s.resetToDefaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!open) return null;

  return (
    <div className="mt-2 bg-white rounded-xl border border-slate-100 p-4 max-w-2xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Services catalog ({services.filter((s) => s.enabled).length}/{services.length} visible)
        </p>
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm("Reset all services to defaults? This clears any custom prices, ETAs, and badges.")) {
              resetToDefaults();
            }
          }}
          className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100"
        >
          Reset to defaults
        </button>
      </div>

      {!hydrated ? (
        <p className="text-xs text-slate-400 italic">Loading saved services…</p>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {services.map((svc, idx) => {
            const meta = SERVICE_META[svc.id];
            const isFirst = idx === 0;
            const isLast = idx === services.length - 1;
            return (
              <div
                key={svc.id}
                className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                  svc.enabled ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.accent} flex items-center justify-center shrink-0`}>
                  <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{meta.titleKey.replace("Title", "").toUpperCase()}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      value={svc.price}
                      onChange={(e) => setService(svc.id, { price: e.target.value })}
                      placeholder="from ₹2/pg"
                      className="w-24 px-2 py-0.5 border border-slate-200 rounded text-xs"
                      aria-label="Price label"
                    />
                    <input
                      type="text"
                      value={svc.eta}
                      onChange={(e) => setService(svc.id, { eta: e.target.value })}
                      placeholder="30 min"
                      className="w-20 px-2 py-0.5 border border-slate-200 rounded text-xs"
                      aria-label="ETA"
                    />
                    <input
                      type="text"
                      value={svc.badge ?? ""}
                      onChange={(e) => setService(svc.id, { badge: e.target.value.trim() || null })}
                      placeholder="Badge (optional)"
                      className="w-28 px-2 py-0.5 border border-slate-200 rounded text-xs"
                      aria-label="Badge"
                    />
                    {meta.href && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                        Links to {meta.href.split("/").pop()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => move(svc.id, "up")}
                    disabled={isFirst}
                    className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_drop_up</span>
                  </button>
                  <button
                    onClick={() => move(svc.id, "down")}
                    disabled={isLast}
                    className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                  </button>
                </div>
                <button
                  onClick={() => toggleEnabled(svc.id)}
                  className={`shrink-0 w-10 h-5 rounded-full relative transition-colors ${
                    svc.enabled ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                  aria-label={svc.enabled ? "Hide service" : "Show service"}
                  aria-pressed={svc.enabled}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      svc.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <p className="text-[11px] text-slate-500">
          Changes apply instantly. Hiding a service removes it from the user-facing grid; the preset still works if loaded from a deep link.
        </p>
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export { DEFAULT_SERVICES };
export type { ServicePresetId };
