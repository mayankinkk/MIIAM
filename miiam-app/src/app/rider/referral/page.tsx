"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RiderReferralPage() {
  const supabase = createClient();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ totalReferrals: 0, successfulReferrals: 0, totalEarned: 0, pendingBonus: 0 });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReferrals() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: rider } = await supabase.from("riders").select("referral_code").eq("user_id", user.id).single();
      if (rider?.referral_code) {
        setReferralCode(rider.referral_code);
      } else {
        setReferralCode(`MIIAM${user.id.slice(0, 8).toUpperCase()}`);
      }

      const { data: referred } = await supabase
        .from("riders")
        .select("name, phone, created_at, total_deliveries")
        .eq("referred_by", user.id);

      let total = 0, successful = 0, earned = 0;
      const list = referred?.map(r => {
        const success = r.total_deliveries >= 10;
        const bonus = success ? 500 : 0;
        if (success) { successful++; earned += bonus; }
        total++;
        return {
          name: r.name || "Rider",
          phone: r.phone ? `${r.phone.slice(0, 3)}*****${r.phone.slice(-2)}` : "N/A",
          joinedDate: new Date(r.created_at).toLocaleDateString("en-IN"),
          orders: r.total_deliveries || 0,
          status: success ? "Completed" : "In Progress",
          bonus,
        };
      }) || [];

      setStats({ totalReferrals: total, successfulReferrals: successful, totalEarned: earned, pendingBonus: (total - successful) * 500 });
      setReferrals(list);
      setLoading(false);
    }
    loadReferrals();
  }, [supabase]);

  const referralLink = `https://miiam.app/ref/${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>
        <h1 className="text-2xl font-bold mt-4">🎁 Refer Friends</h1>
        <p className="text-sm opacity-80">Earn ₹500 for each referral</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
            <p className="text-3xl font-black text-[#4d212a]">{stats.totalReferrals}</p>
            <p className="text-xs text-slate-400">Referrals</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
            <p className="text-3xl font-black text-green-600">₹{stats.totalEarned}</p>
            <p className="text-xs text-slate-400">Earned</p>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-3">Your Referral Code</h3>
          <div className="bg-slate-50 p-4 rounded-xl text-center mb-4">
            <p className="text-2xl font-black tracking-widest text-[#0b50d5]">{referralCode}</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="w-full py-3 bg-[#0b50d5] text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">{copied ? "check" : "content_copy"}</span>
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4">How it works</h3>
          <div className="space-y-4">
            {[
              { step: 1, title: "Share Link", description: "Send your unique referral link", icon: "share" },
              { step: 2, title: "Friend Signs Up", description: "Friend downloads app and registers", icon: "person_add" },
              { step: 3, title: "They Complete 10 Orders", description: "Your friend delivers 10 orders", icon: "inventory_2" },
              { step: 4, title: "You Earn ₹500", description: "Get ₹500 bonus instantly", icon: "payments" },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0b50d5]/10 text-[#0b50d5] flex items-center justify-center font-black text-sm">
                  {item.step}
                </div>
                <div>
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals List */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4">Your Referrals ({referrals.length})</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <span className="material-symbols-outlined text-4xl">people</span>
              <p className="text-sm mt-2">No referrals yet. Share your code!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((ref, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-sm">{ref.name}</p>
                    <p className="text-xs text-slate-400">{ref.orders} orders</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${ref.status === "Completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {ref.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}