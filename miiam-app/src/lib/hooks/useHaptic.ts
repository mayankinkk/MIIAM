"use client";

export type HapticStyle = "light" | "medium" | "heavy" | "success" | "error" | "selection";

const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;

export function useHaptic() {
  const trigger = (style: HapticStyle = "light") => {
    if (!canVibrate) return;

    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 40,
      success: [10, 50, 20],
      error: [30, 50, 30, 50, 30],
      selection: 5,
    };

    try {
      navigator.vibrate(patterns[style]);
    } catch {
      // Silently fail — vibration API may be blocked
    }
  };

  return { trigger };
}
