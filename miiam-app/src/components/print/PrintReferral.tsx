"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getMyReferralCode,
  buildReferralLink,
  totalEarnedPages,
  pendingRewardsCount,
  applyReferralCode,
  captureReferralFromUrl,
  consumeStoredReferral,
} from "@/lib/print-referral";
import { useLanguageStore } from "@/lib/store/languageStore";
import { getTranslations } from "@/lib/i18n";

export default function PrintReferral() {
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [earned, setEarned] = useState(0);
  const [pending, setPending] = useState(0);
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      setUser(u ? { email: u.email } : null);
      if (u?.email) {
        const c = getMyReferralCode(u.email);
        setCode(c);
        setLink(buildReferralLink(c));
      }
    });
    setEarned(totalEarnedPages());
    setPending(pendingRewardsCount());

    const captured = captureReferralFromUrl();
    if (captured) {
      setPendingRef(captured);
    } else {
      const stored = consumeStoredReferral();
      if (stored) setPendingRef(stored);
    }
  }, []);

  if (!mounted) return null;
  if (!user) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 text-sm text-slate-600">
        <p className="font-bold text-slate-800 mb-1">Sign in to earn free pages</p>
        <p>Sign in to get your personal referral code. Each friend who prints = 5 free pages for you.</p>
      </div>
    );
  }

  const t = getTranslations(language).print;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleApplyPending = () => {
    if (!pendingRef || !user?.email) return;
    applyReferralCode(pendingRef, user.email);
    setPending(pendingRewardsCount());
    setPendingRef(null);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">redeem</span>
        </div>
        <div>
          <h3 className="font-black text-lg">{t.referralTitle || "Refer & earn free pages"}</h3>
          <p className="text-white/80 text-sm">{t.referralDesc || "Share your code. Each friend who prints = 5 free pages for you."}</p>
        </div>
      </div>

      <div className="flex items-stretch gap-2 mb-3">
        <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 font-mono font-black tracking-widest text-sm flex items-center">
          {code || "—"}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-base">{copied ? "check" : "link"}</span>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-black">{earned}</p>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Pages earned</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-black">{pending}</p>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Pending</p>
        </div>
      </div>

      <p className="text-xs text-white/70">
        {t.referralLinkLabel || "Referral link"}: <span className="font-mono">{link}</span>
      </p>

      {pendingRef && (
        <div className="mt-4 bg-amber-100 text-amber-900 rounded-xl p-3 text-sm flex items-center justify-between gap-2">
          <span>
            Someone referred you with code <strong className="font-mono">{pendingRef}</strong>. 5 free pages will be added to your first order.
          </span>
          <button
            type="button"
            onClick={handleApplyPending}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
