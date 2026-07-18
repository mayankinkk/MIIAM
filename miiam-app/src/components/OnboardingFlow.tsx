"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const slides = [
  {
    icon: "restaurant",
    emoji: "🍕",
    title: "Discover Local Food",
    description: "Browse restaurants and stores near you with real-time delivery tracking.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: "home_repair_service",
    emoji: "🔧",
    title: "Book Home Services",
    description: "AC repair, plumbing, cleaning — book professionals in just a few taps.",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: "local_offer",
    emoji: "🎁",
    title: "Deals & Rewards",
    description: "Earn points on every order. Redeem for discounts and exclusive offers.",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
];

export default function OnboardingFlow() {
  const [current, setCurrent] = useState(0);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("miiam-onboarded", "true");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center px-6">
      {/* Skip button */}
      <Link
        href="/app/home"
        onClick={handleDismiss}
        className="absolute top-6 right-6 text-on-surface-variant text-sm font-bold px-4 py-2 rounded-full hover:bg-surface-container-high transition-colors"
      >
        Skip
      </Link>

      {/* Slides */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${slides[current].gradient} flex items-center justify-center mb-8`}>
              <span className="text-6xl">{slides[current].emoji}</span>
            </div>
            <h2 className="text-2xl font-black text-on-surface mb-3">{slides[current].title}</h2>
            <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">{slides[current].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mb-8">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-primary" : "w-2 bg-outline/30"
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      {current < slides.length - 1 ? (
        <button
          onClick={() => setCurrent(current + 1)}
          className="w-full max-w-sm py-4 bg-primary text-on-primary font-bold rounded-2xl active:scale-[0.98] transition-transform"
        >
          Next
        </button>
      ) : (
        <Link
          href="/app/home"
          onClick={handleDismiss}
          className="w-full max-w-sm py-4 bg-primary text-on-primary font-bold rounded-2xl text-center block active:scale-[0.98] transition-transform"
        >
          Get Started
        </Link>
      )}

      {/* Spacer for bottom safe area */}
      <div className="h-6" />
    </div>
  );
}
