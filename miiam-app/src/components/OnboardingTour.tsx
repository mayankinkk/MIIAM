"use client";

import { useState, useEffect, useCallback } from "react";

const TOUR_KEY = "miiam_onboarding_tour_done";

const steps = [
  {
    title: "Browse Services",
    description: "Explore a wide range of services from food delivery to home cleaning — all in one place.",
    icon: "explore",
    highlight: "header",
  },
  {
    title: "Your Cart",
    description: "Add items from different services and manage your orders easily from the cart.",
    icon: "shopping_cart",
    highlight: "cart",
  },
  {
    title: "Your Profile",
    description: "Manage your account, view order history, and customize your preferences anytime.",
    icon: "account_circle",
    highlight: "profile",
  },
];

interface TourStep {
  title: string;
  description: string;
  icon: string;
  highlight: string;
}

interface OnboardingTourProps {
  onComplete?: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setIsDismissed(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem(TOUR_KEY, "true");
    setIsDismissed(true);
    onComplete?.();
  }, [onComplete]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [currentStep, dismiss]);

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, []);

  if (!isVisible || isDismissed) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={dismiss} />

      {/* Tour Card */}
      <div className="fixed bottom-8 left-4 right-4 z-50 max-w-md mx-auto">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-2xl p-6 animate-slide-up">
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i <= currentStep ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-container-high)]"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">{step.icon}</span>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-black text-[var(--color-on-surface)]">{step.title}</h3>
              <p className="text-sm text-[var(--color-outline)] mt-1">{step.description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={dismiss}
              className="text-xs font-bold text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)] transition-colors min-h-11 px-3 py-2"
            >
              Skip all
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={prev}
                  className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dim transition-colors"
              >
                {currentStep < steps.length - 1 ? "Next" : "Get Started"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
