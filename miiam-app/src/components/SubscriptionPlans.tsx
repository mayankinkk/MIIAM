"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SubscriptionTier = "none" | "basic" | "pro" | "elite";

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  period: "monthly" | "yearly";
  features: string[];
  savings: number;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "MIIAM Basic",
    price: 49,
    period: "monthly",
    features: [
      "Free delivery on orders above ₹99",
      "5% off on all orders",
      "Early access to sales",
    ],
    savings: 99,
  },
  {
    id: "pro",
    name: "MIIAM Pro",
    price: 149,
    period: "monthly",
    features: [
      "Free delivery on all orders",
      "10% off on all orders",
      "Priority support",
      "Exclusive deals",
      "No delivery surge",
    ],
    savings: 299,
  },
  {
    id: "elite",
    name: "MIIAM Elite",
    price: 299,
    period: "monthly",
    features: [
      "Free delivery on all orders",
      "15% off on all orders",
      "24/7 dedicated support",
      "Exclusive deals & early access",
      "No delivery surge",
      "Free birthday meal",
      "Referral bonus doubled",
    ],
    savings: 599,
  },
];

interface SubscriptionStore {
  currentPlan: SubscriptionTier;
  expiresAt: string | null;
  setPlan: (plan: SubscriptionTier, expiresAt?: string) => void;
  cancelPlan: () => void;
  isActive: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      currentPlan: "none",
      expiresAt: null,
      
      setPlan: (plan, expiresAt) => set({ 
        currentPlan: plan, 
        expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
      }),
      
      cancelPlan: () => set({ currentPlan: "none", expiresAt: null }),
      
      isActive: () => {
        const { currentPlan, expiresAt } = get();
        if (currentPlan === "none") return false;
        if (!expiresAt) return true;
        return new Date(expiresAt) > new Date();
      },
    }),
    { name: "miiam-subscription" }
  )
);

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSubscribe: (plan: SubscriptionPlan) => void;
}

export function SubscriptionCard({ plan, isCurrentPlan, onSubscribe }: SubscriptionCardProps) {
  return (
    <div className={`relative bg-white rounded-2xl p-6 border-2 transition-all ${
      isCurrentPlan 
        ? "border-[#ba001c] shadow-lg shadow-[#ba001c]/10" 
        : "border-slate-100 hover:border-slate-200"
    }`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ba001c] text-white px-4 py-1 rounded-full text-xs font-bold">
          Current Plan
        </div>
      )}
      
      <h3 className="text-xl font-black text-slate-800 mb-1">{plan.name}</h3>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-black text-[#ba001c]">₹{plan.price}</span>
        <span className="text-slate-500">/month</span>
      </div>
      
      <div className="text-xs text-green-600 font-bold mb-4">
        Save ₹{plan.savings}/month with free delivery
      </div>
      
      <ul className="space-y-2 mb-6">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
            {feature}
          </li>
        ))}
      </ul>
      
      <button
        onClick={() => onSubscribe(plan)}
        disabled={isCurrentPlan}
        className={`w-full py-3 rounded-xl font-bold transition-all ${
          isCurrentPlan
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-[#ba001c] text-white hover:opacity-90"
        }`}
      >
        {isCurrentPlan ? "Active" : "Subscribe"}
      </button>
    </div>
  );
}

export function SubscriptionBadge() {
  const { currentPlan, isActive } = useSubscriptionStore();
  
  if (!isActive() || currentPlan === "none") return null;
  
  const plan = subscriptionPlans.find(p => p.id === currentPlan);
  
  return (
    <div className="bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold">
      <span className="material-symbols-outlined">workspace_premium</span>
      <span>{plan?.name || "MIIAM Member"}</span>
    </div>
  );
}