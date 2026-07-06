import logger from "@/lib/logger";

export interface VendorHours {
  vendor_id: string;
  shop_name: string;
  opening_hours: string | null;
  is_active: boolean;
}

export interface DaySchedule {
  open: string;
  close: string;
  is_closed: boolean;
}

export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAY_NAMES: WeekDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function parseOpeningHours(hoursJson: string | null): Record<WeekDay, DaySchedule> | null {
  if (!hoursJson) return null;
  try {
    const parsed = JSON.parse(hoursJson);
    const defaultSchedule: DaySchedule = { open: "09:00", close: "22:00", is_closed: false };
    const result: Partial<Record<WeekDay, DaySchedule>> = {};
    for (const day of DAY_NAMES) {
      result[day] = parsed[day] || defaultSchedule;
    }
    return result as Record<WeekDay, DaySchedule>;
  } catch {
    return null;
  }
}

export function isVendorOpen(hoursJson: string | null, timezone?: string): { open: boolean; nextOpen?: string } {
  const schedule = parseOpeningHours(hoursJson);
  if (!schedule) return { open: true };

  const now = new Date();
  const tz = timezone || "Asia/Kolkata";
  let localTime: Date;
  try {
    localTime = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  } catch {
    localTime = now;
  }

  const dayIndex = localTime.getDay();
  const dayName = DAY_NAMES[dayIndex];
  const todaySchedule = schedule[dayName];

  const currentMinutes = localTime.getHours() * 60 + localTime.getMinutes();

  const [openHour, openMin] = todaySchedule.open.split(":").map(Number);
  const [closeHour, closeMin] = todaySchedule.close.split(":").map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  if (todaySchedule.is_closed) {
    return { open: false, nextOpen: findNextOpen(schedule, dayIndex) };
  }

  if (closeMinutes < openMinutes) {
    if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
      return { open: true };
    }
  } else {
    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return { open: true };
    }
  }

  return { open: false, nextOpen: findNextOpen(schedule, dayIndex) };
}

function findNextOpen(schedule: Record<WeekDay, DaySchedule>, currentDayIndex: number): string {
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = DAY_NAMES[nextDayIndex];
    const nextSchedule = schedule[nextDay];
    if (!nextSchedule.is_closed) {
      return `${capitalize(nextDay)} at ${nextSchedule.open}`;
    }
  }
  return "Check back later";
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getVendorCurrentStatus(vendor: VendorHours): {
  isOpen: boolean;
  statusText: string;
  nextOpen?: string;
} {
  if (!vendor.is_active) {
    return { isOpen: false, statusText: "Temporarily unavailable" };
  }

  const { open, nextOpen } = isVendorOpen(vendor.opening_hours);

  if (open) {
    return { isOpen: true, statusText: "Open now" };
  }

  return {
    isOpen: false,
    statusText: nextOpen ? `Closed — Opens ${nextOpen}` : "Currently closed",
    nextOpen,
  };
}
