"use client";

import { useEffect, useState } from "react";
import { useUiA11yStore, applyUiPrefs, type ContrastMode, type ThemeMode } from "@/lib/store/uiA11yStore";

export default function A11yControls() {
  const contrast = useUiA11yStore((s) => s.contrast);
  const setContrast = useUiA11yStore((s) => s.setContrast);
  const theme = useUiA11yStore((s) => s.theme);
  const setTheme = useUiA11yStore((s) => s.setTheme);
  const reducedMotion = useUiA11yStore((s) => s.reducedMotion);
  const setReducedMotion = useUiA11yStore((s) => s.setReducedMotion);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyUiPrefs(contrast, theme);
  }, [contrast, theme]);

  if (!mounted) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-base text-slate-600">accessibility_new</span>
        <p className="font-bold text-slate-800">Accessibility</p>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Theme</label>
        <div className="grid grid-cols-3 gap-1.5 mt-1">
          {(["light", "dark", "system"] as ThemeMode[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              aria-pressed={theme === t}
              className={`py-1.5 text-xs font-bold rounded-lg border ${
                theme === t ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t === "light" ? "☀" : t === "dark" ? "🌙" : "Auto"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contrast</label>
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {(["normal", "high"] as ContrastMode[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setContrast(c)}
              aria-pressed={contrast === c}
              className={`py-1.5 text-xs font-bold rounded-lg border ${
                contrast === c ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {c === "normal" ? "Normal" : "High contrast"}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => setReducedMotion(e.target.checked)}
          className="w-4 h-4 accent-indigo-600"
        />
        Reduce motion (less animation)
      </label>
    </div>
  );
}
