"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";
import PullToRefresh from "@/components/PullToRefresh";

interface GiftCard {
  id: string;
  code: string;
  balance: number;
  recipient: string;
  message: string;
  design: string;
  created_at: string;
}

const DESIGN_OPTIONS = [
  { id: "birthday", icon: "cake", label: "Birthday", gradient: "from-pink-400 to-pink-600" },
  { id: "celebration", icon: "celebration", label: "Celebration", gradient: "from-purple-400 to-purple-600" },
  { id: "thankyou", icon: "workspace_premium", label: "Thank You", gradient: "from-yellow-400 to-orange-500" },
  { id: "love", icon: "favorite", label: "Love", gradient: "from-green-400 to-green-600" },
];

const PRESET_AMOUNTS = [500, 1000, 2000];

function generateCardCode(): string {
  const rand = () => Math.floor(1000 + Math.random() * 9000);
  return `${rand()}${rand()}`;
}

export default function GiftCardsPage() {
  const supabase = createClient();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [design, setDesign] = useState("celebration");
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    loadGiftCards();
  }, [supabase]);

  async function loadGiftCards() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("gift_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setCards(data as GiftCard[]);
    }
    setLoading(false);
  }

  function handlePresetClick(val: number) {
    setAmount(val);
    setCustomAmount("");
  }

  function handleCustomChange(val: string) {
    setCustomAmount(val);
    if (val) setAmount(parseInt(val) || 0);
  }

  async function handleBuy() {
    const finalAmount = customAmount ? parseInt(customAmount) : amount;
    if (!recipient || finalAmount < 100) return;

    setBuying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBuying(false); return; }

    const { data, error } = await supabase
      .from("gift_cards")
      .insert({
        user_id: user.id,
        code: generateCardCode(),
        balance: finalAmount,
        recipient,
        message,
        design,
      })
      .select()
      .single();

    if (!error && data) {
      setCards(prev => [data as GiftCard, ...prev]);
      setRecipient("");
      setMessage("");
      setCustomAmount("");
      setAmount(1000);
      setDesign("celebration");
    }
    setBuying(false);
  }

  return (
    <PullToRefresh onRefresh={loadGiftCards}>
    <div className="min-h-screen bg-surface pb-32">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-surface/80 backdrop-blur-2xl shadow-[0px_10px_30px_rgba(77,33,42,0.04)]">
        <div className="flex items-center gap-4">
          <Link href="/app/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="text-xl font-extrabold text-primary">MIIAM Gift Cards</span>
        </div>
      </nav>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Profile', href: '/app/profile' }, { label: 'Gift Cards' }]} />

      <main className="pt-24 max-w-2xl mx-auto px-4">
        {/* Gift Card Hero */}
        <section className="bg-gradient-to-br from-tertiary to-tertiary-container p-8 rounded-2xl text-on-tertiary-fixed mb-8">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>card_giftcard</span>
            <h2 className="text-3xl font-extrabold mb-2">Gift Food, Not Guess</h2>
            <p className="text-on-tertiary-fixed/80 mb-6">Perfect for birthdays, celebrations & everything in between</p>
          </div>
        </section>

        {/* Buy Gift Card */}
        <section className="bg-surface-container-lowest p-6 rounded-xl mb-8 shadow-lg">
          <h3 className="text-xl font-bold mb-4">Buy a Gift Card</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AMOUNTS.map(val => (
                <button
                  key={val}
                  onClick={() => handlePresetClick(val)}
                  className={`p-4 rounded-xl border-2 font-bold transition-colors ${
                    amount === val && !customAmount
                      ? "border-primary bg-primary-container"
                      : "border-outline-variant hover:border-primary"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm font-bold text-on-surface-variant mb-2 block">Or enter custom amount</label>
              <input
                className="w-full p-4 bg-surface-container rounded-xl border-2 border-outline-variant focus:border-primary outline-none text-lg"
                placeholder="₹100 - ₹10,000"
                type="number"
                min={100}
                max={10000}
                value={customAmount}
                onChange={(e) => handleCustomChange(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-on-surface-variant mb-2 block">Recipient Name</label>
              <input
                className="w-full p-4 bg-surface-container rounded-xl border-2 border-outline-variant focus:border-primary outline-none"
                placeholder="Enter name"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-on-surface-variant mb-2 block">Your Message</label>
              <textarea
                className="w-full p-4 bg-surface-container rounded-xl border-2 border-outline-variant focus:border-primary outline-none"
                placeholder="Write a sweet message..."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Gift Card Designs */}
            <div>
              <label className="text-sm font-bold text-on-surface-variant mb-2 block">Choose a Design</label>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {DESIGN_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setDesign(opt.id)}
                    className={`flex-shrink-0 w-32 rounded-xl p-3 text-white font-bold text-sm transition-all ${
                      design === opt.id ? "ring-2 ring-primary ring-offset-2 scale-105" : ""
                    } bg-gradient-to-br ${opt.gradient}`}
                  >
                    <span className="material-symbols-outlined text-2xl block mb-1">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBuy}
              disabled={buying || !recipient || (customAmount ? (parseInt(customAmount) < 100) : false)}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {buying ? "Buying..." : "Buy Gift Card"}
            </button>
          </div>
        </section>

        {/* My Gift Cards */}
        <section>
          <h3 className="text-lg font-bold mb-4">My Gift Cards</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-surface-container p-4 rounded-xl animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-36 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">card_giftcard</span>
              <p className="text-sm text-slate-500 mt-2">No gift cards yet</p>
              <p className="text-xs text-slate-400 mt-1">Buy one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map(card => (
                <div key={card.id} className="bg-surface-container p-4 rounded-xl flex items-center gap-4">
                  <div className="bg-tertiary-container p-3 rounded-lg">
                    <span className="material-symbols-outlined text-tertiary">card_giftcard</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Gift Card •••• {card.code.slice(-4)}</p>
                    <p className="text-sm text-on-surface-variant">For: {card.recipient}</p>
                    <p className="text-sm text-on-surface-variant">Balance: ₹{card.balance}</p>
                  </div>
                  <button className="text-primary font-bold text-sm hover:underline">Redeem</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
    </PullToRefresh>
  );
}
