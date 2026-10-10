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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    } catch {
      /* ignore */
    }
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
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bg-surface min-h-screen pb-24">
      <header className="bg-surface border-outline-variant/10 border-b px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/app/profile"
            className="bg-surface-container flex h-10 w-10 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-on-surface text-xl font-black">Refer & Earn</h1>
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "Profile", href: "/app/profile" },
          { label: "Refer & Earn" },
        ]}
      />

      <main className="mx-auto max-w-2xl space-y-6 px-5 py-6">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-center text-white shadow-lg">
          <span className="mb-3 block text-5xl">🎁</span>
          <h2 className="text-2xl font-black">Invite Friends, Earn Rewards</h2>
          <p className="mt-2 text-sm text-white/80">
            Share your code and get ₹50 for each friend who orders
          </p>
        </div>

        {/* Referral Code */}
        <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-5 text-center">
          <p className="text-on-surface-variant mb-3 text-xs font-bold tracking-wider uppercase">
            Your Referral Code
          </p>
          <div className="bg-surface-container mb-4 rounded-xl px-6 py-4">
            <p className="text-accent font-mono text-2xl font-black tracking-[0.2em]">
              {referralCode || "------"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyCode}
              className="bg-surface-container flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <button
              onClick={share}
              className="bg-primary text-on-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              Share
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-5 text-center">
            <p className="text-accent text-3xl font-black">{referralCount}</p>
            <p className="text-on-surface-variant mt-1 text-xs">Friends Referred</p>
          </div>
          <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-5 text-center">
            <p className="text-3xl font-black text-green-600">₹{totalEarned}</p>
            <p className="text-on-surface-variant mt-1 text-xs">Total Earned</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-5">
          <h3 className="text-on-surface mb-4 font-bold">How it Works</h3>
          <div className="space-y-4">
            {[
              {
                step: 1,
                icon: "share",
                title: "Share your code",
                desc: "Send your referral code to friends",
              },
              {
                step: 2,
                icon: "person_add",
                title: "Friend signs up",
                desc: "They create an account using your code",
              },
              {
                step: 3,
                icon: "redeem",
                title: "Both earn ₹50",
                desc: "You get ₹50, they get ₹50 off first order",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="bg-primary text-on-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="text-on-surface text-sm font-bold">{item.title}</p>
                  <p className="text-on-surface-variant text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
