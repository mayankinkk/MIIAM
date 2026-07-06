import logger from "@/lib/logger";

export interface SurgeConfig {
  enabled: boolean;
  multiplier: number;
  reason: string;
}

export interface SurgeCheck {
  isSurge: boolean;
  multiplier: number;
  reason: string;
  surgeLabel: string;
}

const PEAK_HOURS = [
  { start: 12, end: 14, label: "Lunch rush" },
  { start: 19, end: 21, label: "Dinner rush" },
];

const SURGE_MULTIPLIER = 1.2;

export function checkSurgePricing(params: {
  vendorLat?: number;
  vendorLng?: number;
  orderCount?: number;
  baseSurgeMultiplier?: number;
}): SurgeCheck {
  const { orderCount = 0, baseSurgeMultiplier = SURGE_MULTIPLIER } = params;

  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = ist.getHours();

  let isPeak = false;
  let peakReason = "";

  for (const peak of PEAK_HOURS) {
    if (hour >= peak.start && hour < peak.end) {
      isPeak = true;
      peakReason = peak.label;
      break;
    }
  }

  const dayOfWeek = ist.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let surgeMultiplier = 1;
  let reason = "";

  if (isPeak) {
    surgeMultiplier = baseSurgeMultiplier;
    reason = peakReason;
  }

  if (isWeekend && isPeak) {
    surgeMultiplier = Math.min(surgeMultiplier + 0.1, 1.5);
    reason = `${peakReason} (weekend)`;
  }

  if (orderCount > 50) {
    const demandMultiplier = Math.min(1 + (orderCount - 50) * 0.005, 1.3);
    surgeMultiplier = Math.max(surgeMultiplier, demandMultiplier);
    reason = reason || "High demand";
  }

  const isSurge = surgeMultiplier > 1;

  let surgeLabel = "";
  if (isSurge) {
    const percent = Math.round((surgeMultiplier - 1) * 100);
    surgeLabel = `+${percent}% ${reason}`;
  }

  return {
    isSurge,
    multiplier: +surgeMultiplier.toFixed(2),
    reason,
    surgeLabel,
  };
}

export function applySurgePricing(
  basePrice: number,
  surgeMultiplier: number,
): { finalPrice: number; surgeAmount: number } {
  if (surgeMultiplier <= 1) {
    return { finalPrice: basePrice, surgeAmount: 0 };
  }
  const surgeAmount = +(basePrice * (surgeMultiplier - 1)).toFixed(2);
  const finalPrice = +(basePrice * surgeMultiplier).toFixed(2);
  return { finalPrice, surgeAmount };
}

export async function getVendorSurgeConfig(
  vendorId: string,
  supabase: { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { surge_enabled?: boolean; surge_multiplier?: number } | null }> } } } },
): Promise<SurgeConfig> {
  try {
    const { data } = await supabase
      .from("vendors")
      .select("surge_enabled, surge_multiplier")
      .eq("id", vendorId)
      .maybeSingle();

    if (data?.surge_enabled) {
      return {
        enabled: true,
        multiplier: data.surge_multiplier || SURGE_MULTIPLIER,
        reason: "Peak hours",
      };
    }

    return { enabled: false, multiplier: 1, reason: "" };
  } catch (err) {
    logger.error({ err }, "Failed to get vendor surge config");
    return { enabled: false, multiplier: 1, reason: "" };
  }
}
