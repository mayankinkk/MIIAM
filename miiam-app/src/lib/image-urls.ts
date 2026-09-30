/**
 * Keep OPTIMIZED_HOSTS in sync with `images.remotePatterns` in next.config.mjs.
 *
 * `next/image` throws synchronously (before `onError` can ever fire) when a src
 * points at a host that is not listed in `remotePatterns`, which takes down the
 * whole route via the error boundary. Passing `unoptimized` skips the loader's
 * hostname validation, so unknown hosts degrade to a plain request instead of a
 * crash. Returns false for anything we should not hand to the optimizer.
 */
const OPTIMIZED_HOSTS = [
  "ui-avatars.com",
  "images.unsplash.com",
  "lh3.googleusercontent.com",
  "*.openstreetmap.org",
  "*.supabase.co",
  "www.tasteofhome.com",
];

export function canOptimizeImage(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    return OPTIMIZED_HOSTS.some((host) =>
      host.startsWith("*.") ? url.hostname.endsWith(host.slice(1)) : url.hostname === host,
    );
  } catch {
    return false;
  }
}
