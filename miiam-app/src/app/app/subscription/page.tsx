"use client";

import { useState } from "react";
import Link from "next/link";

const membershipTiers = [
  {
    id: "free",
    name: "MIIAM Basic",
    price: 0,
    period: "Free forever",
    tagline: "Start ordering",
    color: "from-slate-500 to-slate-600",
    features: [
      { text: "Access to all restaurants", included: true },
      { text: "Earn loyalty points on orders", included: true },
      { text: "Standard delivery fees", included: true },
      { text: "Regular customer support", included: true },
      { text: "Free delivery on orders", included: false },
      { text: "Priority support", included: false },
      { text: "Exclusive deals & offers", included: false },
      { text: "Zero platform fee", included: false },
    ],
  },
  {
    id: "pro",
    name: "MIIAM Pro",
    price: 149,
    period: "3 months",
    tagline: "Most popular for foodies",
    color: "from-[#ba001c] to-[#6b0011]",
    popular: true,
    badge: "BEST VALUE",
    features: [
      { text: "Access to all restaurants", included: true },
      { text: "2x loyalty points on orders", included: true },
      { text: "Free delivery on all orders", included: true },
      { text: "Priority customer support", included: true },
      { text: "Exclusive deals & offers", included: true },
      { text: "Zero platform fee", included: true },
      { text: "Early access to new features", included: true },
      { text: "Birthday special rewards", included: true },
    ],
  },
  {
    id: "gold",
    name: "MIIAM Gold",
    price: 399,
    period: "12 months",
    tagline: "Best value for regular users",
    color: "from-amber-500 to-amber-700",
    badge: "SAVE 40%",
    features: [
      { text: "Everything in MIIAM Pro", included: true },
      { text: "3x loyalty points on orders", included: true },
      { text: "Free delivery on all orders", included: true },
      { text: "Dedicated concierge support", included: true },
      { text: "Exclusive Gold member deals", included: true },
      { text: "Free priority delivery", included: true },
      { text: "Waived minimum order fee", included: true },
      { text: "Free birthday meal", included: true },
    ],
  },
];

const faqs = [
  {
    question: "How does free delivery work?",
    answer: "With MIIAM Pro or Gold, you get free delivery on all orders above the restaurant's minimum order value. No delivery fees, ever!",
  },
  {
    question: "How do I earn loyalty points faster?",
    answer: "MIIAM Pro members earn 2x points on every order, and Gold members earn 3x points. Points can be redeemed for discounts on future orders.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes! You can cancel your subscription anytime from your profile settings. You'll continue to enjoy benefits until the end of your current billing period.",
  },
  {
    question: "What are exclusive deals?",
    answer: "Pro and Gold members get access to special deals and offers that aren't available to basic members. These include restaurant-specific discounts, free items, and more.",
  },
  {
    question: "How do I activate my membership?",
    answer: "After subscribing, your benefits are activated immediately. You'll see the Pro/Gold badge on your profile and enjoy all member benefits on your next order.",
  },
];

export default function SubscriptionPage() {
  const [activeTier, setActiveTier] = useState("pro");
  const [showFaq, setShowFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (tierId: string) => {
    if (tierId === "free") return;
    
    setLoading(true);
    setTimeout(() => {
      alert(`Redirecting to payment page for ${tierId} membership...`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app" className="text-2xl font-black text-[#ba001c] tracking-tighter">MIIAM</Link>
          <Link href="/app/profile" className="text-sm font-bold text-slate-600 hover:text-[#ba001c]">
            Skip for now
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#ba001c] to-[#6b0011] px-4 py-12 text-center text-white">
        <div className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-4 backdrop-blur-sm">
          💎 MEMBER BENEFITS
        </div>
        <h1 className="text-4xl font-extrabold mb-3">Eat More, Pay Less</h1>
        <p className="text-white/80 text-lg max-w-md mx-auto">
          Unlock free delivery, exclusive deals, and 2x rewards with MIIAM Pro. Save up to ₹200 every month!
        </p>
      </section>

      {/* Savings Calculator */}
      <section className="bg-white mx-4 -mt-6 rounded-2xl shadow-xl p-6 relative z-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">💰 See How Much You Can Save</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-extrabold text-[#ba001c]">₹40+</p>
            <p className="text-xs text-slate-500 mt-1">Delivery fees saved/month</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-extrabold text-[#ba001c]">₹150+</p>
            <p className="text-xs text-slate-500 mt-1">Exclusive offers/month</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-extrabold text-[#ba001c]">₹500</p>
            <p className="text-xs text-slate-500 mt-1">Welcome reward</p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 text-center">Choose Your Plan</h2>
        <p className="text-slate-500 text-center mb-8">Cancel anytime. No hidden fees.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {membershipTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white rounded-3xl overflow-hidden transition-all duration-300 ${
                activeTier === tier.id ? "ring-2 ring-[#ba001c] shadow-xl scale-[1.02]" : "shadow-md hover:shadow-lg"
              }`}
              onClick={() => setActiveTier(tier.id)}
            >
              {tier.popular && (
                <div className="bg-[#ba001c] text-white text-xs font-bold px-4 py-2 text-center">
                  ⭐ MOST POPULAR
                </div>
              )}
              {tier.badge && !tier.popular && (
                <div className="bg-amber-500 text-white text-xs font-bold px-4 py-2 text-center">
                  {tier.badge}
                </div>
              )}

              <div className={`bg-gradient-to-r ${tier.color} text-white px-6 py-6`}>
                <h3 className="text-xl font-extrabold">{tier.name}</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-extrabold">₹{tier.price}</span>
                  {tier.price > 0 && <span className="text-white/70 text-sm">/{tier.period}</span>}
                  {tier.price === 0 && <span className="text-white/70 text-sm">Free</span>}
                </div>
                <p className="text-white/80 text-sm mt-1">{tier.tagline}</p>
              </div>

              <div className="p-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className={`material-symbols-outlined text-lg ${
                        feature.included ? "text-green-600" : "text-slate-300"
                      }`}>
                        {feature.included ? "check_circle" : "cancel"}
                      </span>
                      <span className={feature.included ? "text-slate-800" : "text-slate-400"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loading || tier.price === 0}
                  className={`w-full mt-6 py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
                    tier.price === 0
                      ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                      : tier.id === activeTier
                      ? "bg-[#ba001c] text-white hover:bg-[#a40017] shadow-lg shadow-[#ba001c]/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tier.price === 0 ? (
                    "Current Plan"
                  ) : loading ? (
                    <>
                      <span className="animate-spin material-symbols-outlined">sync</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Get Started
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gradient-to-r from-[#fff4f4] to-[#ffe1e4] px-4 py-12">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-8 text-center">❤️ Loved by Foodies</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: "Priya S.", text: "MIIAM Pro has saved me over ₹500 in delivery fees alone!", rating: 5 },
            { name: "Rahul M.", text: "The exclusive restaurant deals are amazing. Highly recommend!", rating: 5 },
            { name: "Anita K.", text: "Best food delivery membership. The loyalty points stack up fast!", rating: 5 },
          ].map((review, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(review.rating)].map((_, j) => (
                  <span key={j} className="material-symbols-outlined text-amber-500 text-lg">star</span>
                ))}
              </div>
              <p className="text-slate-700 text-sm italic mb-4">&quot;{review.text}&quot;</p>
              <p className="font-bold text-slate-800 text-sm">— {review.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowFaq(showFaq === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-800">{faq.question}</span>
                <span className={`material-symbols-outlined text-slate-400 transition-transform ${
                  showFaq === i ? "rotate-180" : ""
                }`}>
                  expand_more
                </span>
              </button>
              {showFaq === i && (
                <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#ba001c] px-4 py-16 text-center text-white">
        <h2 className="text-3xl font-extrabold mb-3">Ready to Start Saving?</h2>
        <p className="text-white/80 mb-8 max-w-md mx-auto">
          Join thousands of happy foodies who eat more for less with MIIAM Pro.
        </p>
        <button
          onClick={() => handleSubscribe("pro")}
          className="bg-white text-[#ba001c] px-10 py-4 rounded-2xl font-extrabold inline-flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
        >
          Get MIIAM Pro - ₹149/3 months
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </section>
    </div>
  );
}