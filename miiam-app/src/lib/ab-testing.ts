"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import logger from "@/lib/logger";

export interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  trafficPercentage: number;
}

export interface Variant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, unknown>;
}

export interface UserAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: string;
}

interface AbTestState {
  experiments: Experiment[];
  assignments: UserAssignment[];
  getVariant: (experimentId: string) => Variant | null;
  trackConversion: (experimentId: string, eventName: string, value?: number) => void;
  loadExperiments: (exps: Experiment[]) => void;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function assignVariant(experiment: Experiment, userId: string): Variant | null {
  if (experiment.variants.length === 0) return null;

  const hash = hashString(`${experiment.id}:${userId}`);
  const bucket = hash % 100;

  if (bucket >= experiment.trafficPercentage) return null;

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant;
  }

  return experiment.variants[experiment.variants.length - 1];
}

export const useAbTestStore = create<AbTestState>()(
  persist(
    (set, get) => ({
      experiments: [],
      assignments: [],

      loadExperiments: (exps: Experiment[]) => {
        set({ experiments: exps });
      },

      getVariant: (experimentId: string) => {
        const state = get();
        const experiment = state.experiments.find(e => e.id === experimentId && e.isActive);
        if (!experiment) return null;

        if (experiment.endDate && new Date(experiment.endDate) < new Date()) {
          return null;
        }

        const existing = state.assignments.find(a => a.experimentId === experimentId);
        if (existing) {
          return experiment.variants.find(v => v.id === existing.variantId) || null;
        }

        const userId = getAnonymousUserId();
        const variant = assignVariant(experiment, userId);
        if (variant) {
          set({
            assignments: [
              ...state.assignments,
              {
                experimentId,
                variantId: variant.id,
                assignedAt: new Date().toISOString(),
              },
            ],
          });
        }

        return variant;
      },

      trackConversion: (experimentId: string, eventName: string, value?: number) => {
        const state = get();
        const assignment = state.assignments.find(a => a.experimentId === experimentId);
        if (!assignment) return;

        try {
          const event = {
            experiment_id: experimentId,
            variant_id: assignment.variantId,
            event_name: eventName,
            event_value: value,
            timestamp: new Date().toISOString(),
          };
          const events = JSON.parse(localStorage.getItem("ab_test_events") || "[]");
          events.push(event);
          localStorage.setItem("ab_test_events", JSON.stringify(events.slice(-1000)));
        } catch (err) {
          logger.error({ err }, "Failed to track A/B test conversion");
        }
      },
    }),
    {
      name: "miiam-ab-tests",
    }
  )
);

function getAnonymousUserId(): string {
  let userId = localStorage.getItem("ab_test_user_id");
  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("ab_test_user_id", userId);
  }
  return userId;
}

export async function fetchActiveExperiments(supabase: {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: unknown) => {
        then: (resolve: (result: { data: Experiment[] | null }) => void) => void;
      };
    };
  };
}): Promise<Experiment[]> {
  try {
    const result = await supabase
      .from("experiments")
      .select("*")
      .eq("is_active", true);
    return result.data || [];
  } catch {
    return [];
  }
}
