"use client";

/**
 * Trial / plan state — P-13.
 * Mock plan driven by zustand; real impl would come from orgService.
 * Dev menu controls let you simulate all meaningful trial states.
 */

import { create } from "zustand";

export interface PlanState {
  /* ── Plan config ── */
  planName: "Launchpad Trial" | "Nebula" | "Galaxy";
  trialDaysLeft: number;    // 0 = expired
  trialTotalDays: number;   // 14 by default

  /* ── Usage ── */
  activeEventLimit: number;  // 1 on trial
  activeEventsUsed: number;
  registrationLimit: number; // 100 on trial
  registrationsUsed: number;

  /* ── Derived ── */
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isAtEventLimit: boolean;

  /* ── Dev controls ── */
  simulateDay13: () => void;   // 1 day left
  simulateLimitHit: () => void; // events at cap
  simulateExpired: () => void;
  resetPlan: () => void;
}

const DEFAULTS = {
  planName: "Launchpad Trial" as const,
  trialDaysLeft: 14,
  trialTotalDays: 14,
  activeEventLimit: 1,
  activeEventsUsed: 0,
  registrationLimit: 100,
  registrationsUsed: 34,
};

export const usePlanStore = create<PlanState>((set) => ({
  ...DEFAULTS,

  get isTrialActive() { return this.trialDaysLeft > 0; },
  get isTrialExpired() { return this.trialDaysLeft <= 0; },
  get isAtEventLimit() { return this.activeEventsUsed >= this.activeEventLimit; },

  simulateDay13: () =>
    set({ trialDaysLeft: 1, activeEventsUsed: 0 }),

  simulateLimitHit: () =>
    set({ trialDaysLeft: 7, activeEventsUsed: 1, activeEventLimit: 1 }),

  simulateExpired: () =>
    set({ trialDaysLeft: 0, activeEventsUsed: 1 }),

  resetPlan: () => set(DEFAULTS),
}));

/** Convenience selector for banner visibility. */
export function shouldShowTrialBanner(s: PlanState): boolean {
  return s.trialDaysLeft > 0 && s.trialDaysLeft <= 13;
}
