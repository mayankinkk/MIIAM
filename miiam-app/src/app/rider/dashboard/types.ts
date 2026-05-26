export interface Order {
  id: string;
  user_id?: string;
  vendor: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorLat?: number;
  vendorLng?: number;
  customer: string;
  customerPhone: string;
  customerAddress: string;
  customerLat?: number;
  customerLng?: number;
  landmark: string;
  distance: number;
  distance2: number;
  totalDistance: number;
  earnings: number;
  orderTotal: number;
  items: number;
  itemsList: string[];
  time: string;
  time2: string;
  estCompletion: number;
  priority: "high" | "normal";
  peakMultiplier: number;
  specialInstructions: string;
  otp: string;
  type: "food" | "grocery" | "multi_stop";
  stops?: {
    name: string;
    address: string;
    landmark: string;
    distance: number;
    time: string;
    otp: string;
  }[];
}

export interface OrderWithTiming extends Order {
  expiresAt?: number;
  isSnoozed?: boolean;
  snoozeUntil?: number;
  orderDbId?: string;
}

export type DeliveryStep = "shopping" | "picking_up" | "picked" | "delivering" | "arrived";

export const CANCEL_REASONS = [
  "Too far away",
  "Not enough earnings",
  "Order too large",
  "Vehicle issue",
  "Emergency",
  "Other",
];
