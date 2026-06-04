export interface PrintReferral {
  code: string;
  inviterEmail?: string;
  friendEmail?: string;
  createdAt: number;
  status: "pending" | "rewarded" | "expired";
  rewardPages: number;
}

const STORAGE_KEY = "miiam-print-referral";
const MAX_REWARDS = 20;

export function generateReferralCode(email: string): string {
  const prefix = email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "PRT";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

export function getMyReferralCode(email: string): string {
  if (typeof window === "undefined") return generateReferralCode(email);
  const key = `miiam-ref-code-${email}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = generateReferralCode(email);
  localStorage.setItem(key, created);
  return created;
}

export function applyReferralCode(code: string, friendEmail: string): PrintReferral {
  if (typeof window === "undefined") {
    return { code, friendEmail, createdAt: Date.now(), status: "pending", rewardPages: 5 };
  }
  const referral: PrintReferral = {
    code: code.toUpperCase().trim(),
    friendEmail,
    createdAt: Date.now(),
    status: "pending",
    rewardPages: 5,
  };
  const existing = getReferrals();
  existing.push(referral);
  if (existing.length > MAX_REWARDS) existing.splice(0, existing.length - MAX_REWARDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return referral;
}

export function getReferrals(): PrintReferral[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PrintReferral[];
  } catch {
    return [];
  }
}

export function markReferralRewarded(code: string): void {
  if (typeof window === "undefined") return;
  const list = getReferrals();
  const idx = list.findIndex((r) => r.code === code);
  if (idx === -1) return;
  list[idx].status = "rewarded";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function totalEarnedPages(): number {
  return getReferrals()
    .filter((r) => r.status === "rewarded")
    .reduce((acc, r) => acc + r.rewardPages, 0);
}

export function pendingRewardsCount(): number {
  return getReferrals().filter((r) => r.status === "pending").length;
}

export function buildReferralLink(code: string): string {
  if (typeof window === "undefined") return `https://miiam.app/print?ref=${code}`;
  return `${window.location.origin}/print?ref=${code}`;
}

export function captureReferralFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref) return null;
  try {
    sessionStorage.setItem("miiam-pending-ref", ref.toUpperCase().trim());
  } catch {
    // sessionStorage unavailable
  }
  return ref.toUpperCase().trim();
}

export function consumeStoredReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem("miiam-pending-ref");
    if (v) sessionStorage.removeItem("miiam-pending-ref");
    return v;
  } catch {
    return null;
  }
}
