export function hapticFeedback(pattern: "light" | "medium" | "heavy" | "success" | "error" = "light") {
  if (typeof window === "undefined" || !navigator.vibrate) return;

  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    error: [30, 50, 30],
  };

  navigator.vibrate(patterns[pattern]);
}