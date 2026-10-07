// Admin pickers historically stored blue/purple gradient class strings.
// Old rows still live in `banners`, `home_promotions` and `site_settings`.
// Normalize at every load/render point so legacy data shows the brand palette.

const EXACT: Record<string, string> = {
  "from-blue-500 to-indigo-500": "from-accent to-accent/70",
  "from-blue-400 to-indigo-400": "from-accent to-accent/70",
  "from-blue-600 to-blue-400": "from-accent to-accent/70",
  "from-blue-500 to-blue-600": "from-accent to-accent/70",
  "from-blue-400 to-indigo-500": "from-accent to-accent/70",
  "from-violet-600 to-purple-400": "from-deal to-deal/70",
  "from-purple-500 to-pink-500": "from-deal to-deal/70",
  "from-purple-400 to-pink-400": "from-deal to-deal/70",
  "from-purple-500 to-violet-600": "from-deal to-deal/70",
  "from-indigo-400 to-purple-400": "from-primary to-accent",
};

export function normalizeGradientClass(gradient: string | null | undefined): string {
  if (!gradient) return "from-accent to-accent/70";
  const exact = EXACT[gradient.trim()];
  if (exact) return exact;
  return gradient
    .replace(/from-(?:blue|indigo)-\d+/g, "from-accent")
    .replace(/to-(?:blue|indigo)-\d+/g, "to-accent/70")
    .replace(/from-(?:purple|violet)-\d+/g, "from-deal")
    .replace(/to-(?:purple|violet)-\d+/g, "to-deal/70");
}
