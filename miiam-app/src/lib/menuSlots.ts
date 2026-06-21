export type MenuSlot = "breakfast" | "lunch" | "dinner" | "all_day";

const SLOT_RANGES: Record<Exclude<MenuSlot, "all_day">, { start: number; end: number }> = {
  breakfast: { start: 6, end: 11 },
  lunch: { start: 11, end: 16 },
  dinner: { start: 16, end: 23 },
};

export function getCurrentMenuSlot(): MenuSlot {
  const hour = new Date().getHours();
  if (hour >= SLOT_RANGES.breakfast.start && hour < SLOT_RANGES.breakfast.end) return "breakfast";
  if (hour >= SLOT_RANGES.lunch.start && hour < SLOT_RANGES.lunch.end) return "lunch";
  if (hour >= SLOT_RANGES.dinner.start && hour < SLOT_RANGES.dinner.end) return "dinner";
  return "all_day";
}

export function getSlotLabel(slot: MenuSlot): string {
  return slot === "all_day" ? "All Day" : slot.charAt(0).toUpperCase() + slot.slice(1);
}

export const MENU_SLOTS: MenuSlot[] = ["all_day", "breakfast", "lunch", "dinner"];

export const SLOT_TIME_LABELS: Record<MenuSlot, string> = {
  breakfast: "6 AM – 11 AM",
  lunch: "11 AM – 4 PM",
  dinner: "4 PM – 11 PM",
  all_day: "Always available",
};
