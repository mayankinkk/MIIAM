"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ReferralPage() {
  const { t } = useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  async function loadReferralData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate referral code from user ID
      const code = `MIIAM${user.id.slice(0, 8).toUpperCase()}`;
      setReferralCode(code);

      // Check for existing referral record
      const { data: referral } = await supabase
        .from("referrals")
        .select("referral_count, total_earned")
        .eq("user_id", user.id)
        .maybeSingle();

      if (referral) {
        setReferralCount(referral.referral_count || 0);
        setTotalEarned(referral.total_earned || 0);
      }
    } catch {
      // Referrals table may not exist yet
    }
    setLoading(false);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  async function share() {
    const shareData = {
      title: "Join MIIAM",
      text: `Use my referral code ${referralCode} to get ₹50 off your first order on MIIAM! 🎉`,
      url: `https://miiam.in/auth/signup?ref=${referralCode}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyCode();
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="bg-surface border-b border-outline-variant/10 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <Link href="/app/profile" className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-surface">Refer & Earn</h1>
        </div>
      </header>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Profile", href: "/app/profile" }, { label: "Refer & Earn" }]} />

      <main className="px-5 py-6 max-w-2xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 text-white text-center shadow-lg">
          <span className="text-5xl mb-3 block">🎁</span>
          <h2 className="text-2xl font-black">Invite Friends, Earn Rewards</h2>
          <p className="text-white/80 text-sm mt-2">Share your code and get ₹50 for each friend who orders</p>
        </div>

        {/* Referral Code */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 text-center">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Your Referral Code</p>
          <div className="bg-surface-container rounded-xl px-6 py-4 mb-4">
            <p className="text-2xl font-black text-primary tracking-[0.2em] font-mono">{referralCode || "------"}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyCode}
              className="flex-1 py-3 bg-surface-container rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-lg">{copied ? "check" : "content_copy"}</span>
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <button
              onClick={share}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              Share
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 text-center">
            <p className="text-3xl font-black text-primary">{referralCount}</p>
            <p className="text-xs text-on-surface-variant mt-1">Friends Referred</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 text-center">
            <p className="text-3xl font-black text-green-600">₹{totalEarned}</p>
            <p className="text-xs text-on-surface-variant mt-1">Total Earned</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
          <h3 className="font-bold text-on-surface mb-4">How it Works</h3>
          <div className="space-y-4">
            {[
              { step: 1, icon: "share", title: "Share your code", desc: "Send your referral code to friends" },
              { step: 2, icon: "person_add", title: "Friend signs up", desc: "They create an account using your code" },
              { step: 3, icon: "redeem", title: "Both earn ₹50", desc: "You get ₹50, they get ₹50 off first order" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">{item.title}</p>
                  <p className="text-xs text-on-surface-variant">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
