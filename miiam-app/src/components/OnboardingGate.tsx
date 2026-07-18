"use client";

import { useState, useEffect } from "react";
import OnboardingFlow from "@/components/OnboardingFlow";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasOnboarded = localStorage.getItem("miiam-onboarded");
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <>
      {showOnboarding && <OnboardingFlow />}
      {children}
    </>
  );
}
