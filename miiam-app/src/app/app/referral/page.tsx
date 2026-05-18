"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function ReferralPage() {
  const [user, setUser] = useState<any>(null);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setUser(authUser);
      const code = authUser.id.slice(0, 8).toUpperCase();
      setReferralCode(code);
      
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", authUser.id)
        .order("created_at", { ascending: false });
      
      if (data) setReferrals(data);
    }
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    if (navigator.vibrate) navigator.vibrate(20);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    const shareData = {
      title: "Join MIIAM",
      text: `Use my referral code ${referralCode} and get exciting rewards on MIIAM!`,
      url: "https://miiam.in/app/register"
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  const totalEarned = referrals.reduce((sum, r) => sum + (r.reward_amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      <header className="bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link href="/app/profile" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a]">Refer & Earn</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-[#ffd709] to-[#ffb700] rounded-3xl p-6 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="material-symbols-outlined text-5xl text-[#ba001c]" style={{ fontVariationSettings: "'FILL' 1" }}>card_membership</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Share & Earn</h2>
              <p className="text-slate-600 mb-6">Invite friends and earn ₹100 for every referral!</p>
              
              <div className="bg-white rounded-2xl p-4 mb-4">
                <p className="text-xs text-slate-500 mb-1">Your Referral Code</p>
                <p className="text-2xl font-black text-[#ba001c] tracking-wider">{referralCode}</p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={copyCode}
                  className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined">{copied ? "check" : "content_copy"}</span>
                  {copied ? "Copied!" : "Copy Code"}
                </button>
                <button 
                  onClick={shareReferral}
                  className="flex-1 bg-[#ba001c] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined">share</span>
                  Share
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800">How it Works</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ba001c]">share</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Share your code</p>
                    <p className="text-xs text-slate-500">Send your referral code to friends</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">person_add</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Friend signs up</p>
                    <p className="text-xs text-slate-500">Your friend creates an account using your code</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600"> monetization_on</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">You earn ₹100</p>
                    <p className="text-xs text-slate-500">Get ₹100 wallet credit for each successful referral</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800">Your Referrals</h3>
                <span className="text-sm font-bold text-[#ba001c]">₹{totalEarned} earned</span>
              </div>
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">🎁</span>
                  <p className="text-slate-500 mt-2">No referrals yet</p>
                  <p className="text-xs text-slate-400">Share your code to start earning!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((ref, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#ba001c]/10 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#ba001c]">person</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Referral #{i + 1}</p>
                          <p className="text-xs text-slate-500">{new Date(ref.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="font-black text-green-600">+₹{ref.reward_amount || 100}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 bg-slate-100 rounded-2xl p-4">
              <p className="text-xs text-slate-500 text-center">
                Terms & Conditions apply. Rewards credited after referred user completes first order.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}