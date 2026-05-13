"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: "discount" | "free_delivery" | "voucher";
  value: number;
  expiresAt?: string;
}

export interface UserRewards {
  points: number;
  lifetimePoints: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  totalOrders: number;
  rewards: Reward[];
  redeemedRewards: { rewardId: string; redeemedAt: string }[];
}

interface RewardsStore {
  userRewards: UserRewards | null;
  setUserRewards: (rewards: UserRewards) => void;
  addPoints: (points: number) => void;
  redeemReward: (rewardId: string) => boolean;
}

const defaultRewards: Reward[] = [
  { id: "r1", title: "₹50 OFF", description: "Flat ₹50 off on orders above ₹200", pointsCost: 200, type: "discount", value: 50 },
  { id: "r2", title: "Free Delivery", description: "One free delivery on any order", pointsCost: 150, type: "free_delivery", value: 0 },
  { id: "r3", title: "₹100 OFF", description: "Flat ₹100 off on orders above ₹400", pointsCost: 350, type: "discount", value: 100 },
  { id: "r4", title: "₹25 OFF", description: "Flat ₹25 off on any order", pointsCost: 100, type: "discount", value: 25 },
];

export const useRewardsStore = create<RewardsStore>()(
  persist(
    (set, get) => ({
      userRewards: {
        points: 0,
        lifetimePoints: 0,
        tier: "bronze",
        totalOrders: 0,
        rewards: defaultRewards,
        redeemedRewards: [],
      },
      
      setUserRewards: (rewards) => set({ userRewards: rewards }),
      
      addPoints: (points) => {
        const { userRewards } = get();
        if (!userRewards) return;
        
        const newLifetime = userRewards.lifetimePoints + points;
        let newTier = userRewards.tier;
        
        if (newLifetime >= 5000) newTier = "platinum";
        else if (newLifetime >= 2000) newTier = "gold";
        else if (newLifetime >= 500) newTier = "silver";
        
        set({
          userRewards: {
            ...userRewards,
            points: userRewards.points + points,
            lifetimePoints: newLifetime,
            tier: newTier,
            totalOrders: userRewards.totalOrders + 1,
          },
        });
      },
      
      redeemReward: (rewardId) => {
        const { userRewards } = get();
        if (!userRewards) return false;
        
        const reward = userRewards.rewards.find(r => r.id === rewardId);
        if (!reward || userRewards.points < reward.pointsCost) return false;
        
        set({
          userRewards: {
            ...userRewards,
            points: userRewards.points - reward.pointsCost,
            redeemedRewards: [...userRewards.redeemedRewards, { rewardId, redeemedAt: new Date().toISOString() }],
          },
        });
        
        return true;
      },
    }),
    { name: "miiam-rewards" }
  )
);

export function calculatePointsForOrder(amount: number): number {
  return Math.floor(amount / 10);
}

export function getTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    bronze: ["Earn 1 point per ₹10"],
    silver: ["Earn 1.25 points per ₹10", "Priority customer support"],
    gold: ["Earn 1.5 points per ₹10", "Priority support", "Exclusive offers"],
    platinum: ["Earn 2 points per ₹10", "24/7 support", "Exclusive offers", "Free delivery on all orders"],
  };
  return benefits[tier] || benefits.bronze;
}