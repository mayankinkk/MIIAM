export type AddOnId =
  | "cover_page"
  | "collate_interleaved"
  | "hole_punch_2"
  | "hole_punch_3"
  | "hole_punch_4"
  | "fold_bi"
  | "fold_tri"
  | "binding_spiral"
  | "binding_soft"
  | "binding_hard"
  | "lamination_a4"
  | "lamination_id";

export type RushTier = "standard" | "rush_30" | "rush_15";

export interface AddOnPricing {
  coverPage: number;
  collatePerPage: number;
  holePunch2: number;
  holePunch3: number;
  holePunch4: number;
  foldBi: number;
  foldTri: number;
  bindingSpiral: number;
  bindingSoft: number;
  bindingHard: number;
  laminationA4: number;
  laminationId: number;
  rush30Multiplier: number; // e.g. 1.4
  rush15Multiplier: number; // e.g. 1.85
}

const STORAGE_KEY = "miiam-printing-addons";

export const DEFAULT_ADDON_PRICING: AddOnPricing = {
  coverPage: 10,
  collatePerPage: 0.5,
  holePunch2: 8,
  holePunch3: 10,
  holePunch4: 12,
  foldBi: 5,
  foldTri: 8,
  bindingSpiral: 35,
  bindingSoft: 80,
  bindingHard: 150,
  laminationA4: 25,
  laminationId: 15,
  rush30Multiplier: 1.4,
  rush15Multiplier: 1.85,
};

export function getAddOnPricing(): AddOnPricing {
  if (typeof window === "undefined") return DEFAULT_ADDON_PRICING;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_ADDON_PRICING, ...parsed };
    }
  } catch (e) {
    console.warn("[printing-addons] Failed to parse stored addon pricing, using defaults:", e);
  }
  return DEFAULT_ADDON_PRICING;
}

export function saveAddOnPricing(pricing: AddOnPricing): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pricing));
  } catch (e) {
    console.error("[printing-addons] Failed to save addon pricing to localStorage:", e);
  }
}

export interface AddOnDescriptor {
  id: AddOnId;
  category: "finishing" | "binding" | "lamination" | "presentation";
  label: string;
  description: string;
  icon: string;
  pricingKey: keyof AddOnPricing;
  unitLabel: string;
}

export const ADDON_CATALOG: AddOnDescriptor[] = [
  {
    id: "cover_page",
    category: "presentation",
    label: "Cover page",
    description: "Premium cardstock cover with title page",
    icon: "auto_stories",
    pricingKey: "coverPage",
    unitLabel: "/order",
  },
  {
    id: "collate_interleaved",
    category: "finishing",
    label: "Interleaved collation",
    description: "Each copy grouped together (1,1,1 2,2,2 ...)",
    icon: "merge_type",
    pricingKey: "collatePerPage",
    unitLabel: "/page",
  },
  {
    id: "hole_punch_2",
    category: "finishing",
    label: "2-hole punch",
    description: "Standard 2-hole punch for binders",
    icon: "circle",
    pricingKey: "holePunch2",
    unitLabel: "/set",
  },
  {
    id: "hole_punch_3",
    category: "finishing",
    label: "3-hole punch",
    description: "US-style 3-hole punch",
    icon: "circle",
    pricingKey: "holePunch3",
    unitLabel: "/set",
  },
  {
    id: "hole_punch_4",
    category: "finishing",
    label: "4-hole punch",
    description: "European 4-hole punch",
    icon: "circle",
    pricingKey: "holePunch4",
    unitLabel: "/set",
  },
  {
    id: "fold_bi",
    category: "finishing",
    label: "Bi-fold",
    description: "Fold page in half",
    icon: "redo",
    pricingKey: "foldBi",
    unitLabel: "/set",
  },
  {
    id: "fold_tri",
    category: "finishing",
    label: "Tri-fold",
    description: "Brochure-style tri-fold",
    icon: "redo",
    pricingKey: "foldTri",
    unitLabel: "/set",
  },
  {
    id: "binding_spiral",
    category: "binding",
    label: "Spiral binding",
    description: "Plastic spiral coil — easy to flip open",
    icon: "auto_awesome",
    pricingKey: "bindingSpiral",
    unitLabel: "/copy",
  },
  {
    id: "binding_soft",
    category: "binding",
    label: "Soft cover",
    description: "Glued spine, soft cover — like a paperback book",
    icon: "book",
    pricingKey: "bindingSoft",
    unitLabel: "/copy",
  },
  {
    id: "binding_hard",
    category: "binding",
    label: "Hard cover",
    description: "Premium hardcover with dust jacket",
    icon: "book",
    pricingKey: "bindingHard",
    unitLabel: "/copy",
  },
  {
    id: "lamination_a4",
    category: "lamination",
    label: "Laminate A4",
    description: "Glossy plastic film on A4 page",
    icon: "layers",
    pricingKey: "laminationA4",
    unitLabel: "/page",
  },
  {
    id: "lamination_id",
    category: "lamination",
    label: "Laminate ID",
    description: "ID-card size lamination (60×95mm)",
    icon: "badge",
    pricingKey: "laminationId",
    unitLabel: "/card",
  },
];

export function getAddOnDescriptor(id: AddOnId): AddOnDescriptor | undefined {
  return ADDON_CATALOG.find((a) => a.id === id);
}

export interface OrderContext {
  totalPages: number;
  copies: number;
}

export function calculateAddOnCost(
  id: AddOnId,
  pricing: AddOnPricing,
  ctx: OrderContext
): number {
  const desc = getAddOnDescriptor(id);
  if (!desc) return 0;
  const unitPrice = (pricing[desc.pricingKey] as number) || 0;

  switch (id) {
    case "cover_page":
      return unitPrice * ctx.copies;
    case "collate_interleaved":
      return unitPrice * ctx.totalPages;
    case "hole_punch_2":
    case "hole_punch_3":
    case "hole_punch_4":
    case "fold_bi":
    case "fold_tri":
      return unitPrice * ctx.copies;
    case "binding_spiral":
    case "binding_soft":
    case "binding_hard":
      return unitPrice * ctx.copies;
    case "lamination_a4":
      return unitPrice * ctx.totalPages;
    case "lamination_id":
      return unitPrice * ctx.copies;
    default:
      return 0;
  }
}

export function rushMultiplier(tier: RushTier, pricing: AddOnPricing): number {
  if (tier === "rush_30") return pricing.rush30Multiplier;
  if (tier === "rush_15") return pricing.rush15Multiplier;
  return 1;
}

export function rushEtaMinutes(tier: RushTier): number {
  if (tier === "rush_15") return 15;
  if (tier === "rush_30") return 30;
  return 60;
}

export function rushLabel(tier: RushTier): string {
  if (tier === "rush_15") return "Rush 15-min";
  if (tier === "rush_30") return "Rush 30-min";
  return "Standard";
}
