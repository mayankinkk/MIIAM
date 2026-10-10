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
    gradient: "from-accent/20 to-accent/70/5",
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
    <div className="bg-surface fixed inset-0 z-[100] flex flex-col items-center justify-center px-6">
      {/* Skip button */}
      <Link
        href="/app/home"
        onClick={handleDismiss}
        className="text-on-surface-variant hover:bg-surface-container-high absolute top-6 right-6 rounded-full px-4 py-2 text-sm font-bold transition-colors"
      >
        Skip
      </Link>

      {/* Slides */}
      <div className="flex w-full max-w-sm flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div
              className={`h-32 w-32 rounded-full bg-gradient-to-br ${slides[current].gradient} mb-8 flex items-center justify-center`}
            >
              <span className="text-6xl">{slides[current].emoji}</span>
            </div>
            <h2 className="text-on-surface mb-3 text-2xl font-black">{slides[current].title}</h2>
            <p className="text-on-surface-variant max-w-xs text-sm leading-relaxed">
              {slides[current].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="mb-8 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "bg-primary w-8" : "bg-outline/30 w-2"
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      {current < slides.length - 1 ? (
        <button
          onClick={() => setCurrent(current + 1)}
          className="bg-primary text-on-primary w-full max-w-sm rounded-2xl py-4 font-bold transition-transform active:scale-[0.98]"
        >
          Next
        </button>
      ) : (
        <Link
          href="/app/home"
          onClick={handleDismiss}
          className="bg-primary text-on-primary block w-full max-w-sm rounded-2xl py-4 text-center font-bold transition-transform active:scale-[0.98]"
        >
          Get Started
        </Link>
      )}

      {/* Spacer for bottom safe area */}
      <div className="h-6" />
    </div>
  );
}
