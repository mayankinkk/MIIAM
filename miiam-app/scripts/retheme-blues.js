/* One-off codemod: blue/indigo/purple/violet → MIIAM yellow-green theme tokens. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../src");
const SKIP = new Set([
  "src/components/layout/LandingNavbar.tsx", // dead code, indigo variant kept as-is
  "src/components/layout/A11yControls.tsx", // dead code
]);

// Ordered exact-phrase rules (applied first, left to right).
const PHRASES = [
  // status pills
  ["bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal"],
  ["bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal"],
  ["bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", "bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent"],
  ["bg-indigo-100 text-indigo-700", "bg-deal/10 text-deal"],
  ["bg-purple-100 text-purple-700 border-purple-200", "bg-accent/10 text-accent border-accent/20"],
  ["bg-purple-100 text-purple-700", "bg-accent/10 text-accent"],
  ["bg-blue-50 text-blue-600", "bg-accent/10 text-accent"],
  ["bg-purple-50 text-purple-600", "bg-accent/10 text-accent"],
  ["bg-blue-100 text-blue-700", "bg-deal/10 text-deal"],
  // buttons / active states with white text
  ["bg-blue-600 text-white", "bg-primary text-on-primary"],
  ["bg-blue-500 text-white", "bg-primary text-on-primary"],
  ["bg-indigo-600 text-white", "bg-primary text-on-primary"],
  ["hover:bg-blue-700", "hover:bg-primary-hover"],
  ["hover:bg-indigo-700", "hover:bg-primary-hover"],
  ["hover:bg-blue-50 hover:text-blue-600", "hover:bg-accent/10 hover:text-accent"],
  ["text-blue-600 dark:text-blue-400", "text-accent"],
  // gradients (known values)
  ["from-blue-600 to-blue-400", "from-accent to-accent/70"],
  ["from-blue-500 to-blue-600", "from-accent to-accent/70"],
  ["from-blue-500 to-indigo-500", "from-accent to-accent/70"],
  ["from-blue-400 to-indigo-400", "from-accent to-accent/70"],
  ["from-violet-600 to-purple-400", "from-deal to-deal/70"],
  ["from-purple-500 to-pink-500", "from-deal to-deal/70"],
  ["from-purple-500 to-violet-600", "from-deal to-deal/70"],
  ["from-purple-400 to-pink-400", "from-deal to-deal/70"],
  ["from-indigo-400 to-purple-400", "from-primary to-accent"],
  // shadows / rings / borders / spinners
  ["shadow-indigo-500/30", "shadow-accent/30"],
  ["shadow-indigo-500/20", "shadow-accent/20"],
  ["shadow-blue-600/20", "shadow-accent/20"],
  ["ring-blue-500", "ring-accent/40"],
  ["ring-blue-600", "ring-accent"],
  ["border-t-blue-600", "border-t-primary"],
  ["border-blue-600", "border-accent"],
  ["border-blue-200", "border-accent/30"],
  ["border-purple-200", "border-accent/20"],
  ["border-indigo-600", "border-accent"],
  ["border-indigo-500", "border-accent"],
  // opacity forms
  ["bg-blue-500/20", "bg-accent/20"],
  ["bg-blue-600/20", "bg-accent/20"],
  ["bg-indigo-500/30", "bg-accent/20"],
  ["bg-indigo-500/20", "bg-accent/20"],
  ["bg-purple-500/20", "bg-accent/20"],
  ["bg-blue-500/30", "bg-accent/20"],
  // dark variants
  ["dark:bg-blue-900/30", "dark:bg-accent/20"],
  ["dark:text-blue-300", "dark:text-accent"],
  ["dark:text-blue-400", "dark:text-accent"],
  ["dark:bg-indigo-900/30", "dark:bg-accent/20"],
  ["dark:text-indigo-300", "dark:text-accent"],
  ["dark:text-indigo-400", "dark:text-accent"],
  ["dark:bg-purple-900/30", "dark:bg-accent/20"],
  ["dark:text-purple-300", "dark:text-accent"],
  ["dark:text-purple-400", "dark:text-accent"],
  ["hover:border-purple-500/30", "hover:border-accent/40"],
  ["hover:bg-purple-100", "hover:bg-accent/20"],
  ["hover:bg-blue-50", "hover:bg-accent/10"],
  // pass 2: dark/opacity leftovers
  ["dark:hover:bg-blue-900/30", "dark:hover:bg-accent/20"],
  ["dark:bg-blue-900/20", "dark:bg-accent/20"],
  ["dark:bg-blue-900/10", "dark:bg-accent/20"],
  ["dark:bg-purple-900/20", "dark:bg-accent/20"],
  ["dark:bg-indigo-900/20", "dark:bg-accent/20"],
  ["hover:bg-blue-200", "hover:bg-accent/20"],
  ["border-l-indigo-500", "border-l-accent"],
  ["border-l-blue-500", "border-l-accent"],
  ["bg-purple-500/10", "bg-accent/10"],
  ["bg-purple-200", "bg-accent/20"],
  ["bg-indigo-100/40", "bg-accent/10"],
  ["bg-blue-500/10", "bg-accent/10"],
  ["bg-blue-50/30", "bg-accent/10"],
];

// Ordered regex rules (applied after phrases). Careful: no naive prefixes.
const HUE = "(blue|indigo)";
const HUE2 = "(purple|violet)";
const REGEXES = [
  // gradients leftover
  [new RegExp(`from-${HUE}-\\d+`, "g"), "from-accent"],
  [new RegExp(`via-${HUE}-\\d+`, "g"), "via-accent/80"],
  [new RegExp(`to-${HUE}-\\d+`, "g"), "to-accent/70"],
  [new RegExp(`from-${HUE2}-\\d+`, "g"), "from-deal"],
  [new RegExp(`via-${HUE2}-\\d+`, "g"), "via-deal/80"],
  [new RegExp(`to-${HUE2}-\\d+`, "g"), "to-deal/70"],
  // text colors
  [new RegExp(`text-${HUE}-\\d+(?![\\d/])`, "g"), "text-accent"],
  [new RegExp(`text-${HUE2}-\\d+(?![\\d/])`, "g"), "text-accent"],
  [new RegExp(`text-${HUE}-\\d+/(\\d+)`, "g"), "text-accent/$1"],
  [new RegExp(`text-${HUE2}-\\d+/(\\d+)`, "g"), "text-accent/$1"],
  // bg solids/tints (opacity forms handled first below)
  [new RegExp(`bg-${HUE}-50(?![\\d/])`, "g"), "bg-accent/10"],
  [new RegExp(`bg-${HUE}-100(?![\\d/])`, "g"), "bg-accent/10"],
  [new RegExp(`bg-${HUE}-(?:500|600|700)(?![\\d/])`, "g"), "bg-accent"],
  [new RegExp(`bg-${HUE2}-50(?![\\d/])`, "g"), "bg-accent/10"],
  [new RegExp(`bg-${HUE2}-100(?![\\d/])`, "g"), "bg-accent/10"],
  [new RegExp(`bg-${HUE2}-(?:400|500|600|700)(?![\\d/])`, "g"), "bg-accent"],
  // borders
  [new RegExp(`border-${HUE}-\\d+`, "g"), "border-accent/40"],
  [new RegExp(`border-${HUE2}-\\d+`, "g"), "border-accent/40"],
  // misc utilities
  [new RegExp(`accent-${HUE}-\\d+`, "g"), "accent-primary"],
  [new RegExp(`fill-${HUE}-\\d+`, "g"), "fill-accent"],
  [new RegExp(`stroke-${HUE}-\\d+`, "g"), "stroke-accent"],
  [new RegExp(`divide-${HUE}-\\d+`, "g"), "divide-accent/20"],
  [new RegExp(`outline-${HUE}-\\d+`, "g"), "outline-accent"],
  [new RegExp(`decoration-${HUE}-\\d+`, "g"), "decoration-accent"],
  [new RegExp(`shadow-${HUE}-\\d+(?:/\\d+)?`, "g"), "shadow-accent/20"],
  [new RegExp(`shadow-${HUE2}-\\d+(?:/\\d+)?`, "g"), "shadow-deal/20"],
  [new RegExp(`ring-${HUE2}-\\d+`, "g"), "ring-deal/40"],
  [new RegExp(`placeholder-${HUE}-\\d+`, "g"), "placeholder-accent"],
  [new RegExp(`caret-${HUE}-\\d+`, "g"), "caret-accent"],
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(path.join(__dirname, ".."), file).split(path.sep).join("/");
  if (SKIP.has(rel)) continue;
  let src = fs.readFileSync(file, "utf8");
  const orig = src;
  for (const [from, to] of PHRASES) src = src.split(from).join(to);
  for (const [re, to] of REGEXES) src = src.replace(re, to);
  if (src !== orig) {
    fs.writeFileSync(file, src);
    changed++;
    console.log("updated", rel);
  }
}
console.log("files changed:", changed);
