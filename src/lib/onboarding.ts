"use client";

/**
 * Onboarding wizard state — P-12.
 * Single zustand store for all 3 steps; survives re-renders without prop-drilling.
 */

import { create } from "zustand";

export type OnboardingStep = 1 | 2 | 3;

interface OnboardingState {
  step: OnboardingStep;

  /* Step 1 — org profile */
  city: string;
  state: string;
  logoDataUrl: string | null; // base64 data URL (mock storage)

  /* Step 2 — optional first event */
  skipEvent: boolean;
  eventName: string;
  eventStartDate: string; // YYYY-MM-DD
  eventEndDate: string;
  venue: string;

  /* Step 3 — demo data choice */
  loadDemo: boolean | null; // null = not yet chosen

  /* Actions */
  setCity: (v: string) => void;
  setState: (v: string) => void;
  setLogo: (dataUrl: string | null) => void;
  setSkipEvent: (v: boolean) => void;
  setEventName: (v: string) => void;
  setEventStartDate: (v: string) => void;
  setEventEndDate: (v: string) => void;
  setVenue: (v: string) => void;
  setLoadDemo: (v: boolean) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
}

const INITIAL: Omit<
  OnboardingState,
  | "setCity" | "setState" | "setLogo" | "setSkipEvent"
  | "setEventName" | "setEventStartDate" | "setEventEndDate" | "setVenue"
  | "setLoadDemo" | "next" | "back" | "reset"
> = {
  step: 1,
  city: "",
  state: "",
  logoDataUrl: null,
  skipEvent: false,
  eventName: "",
  eventStartDate: "",
  eventEndDate: "",
  venue: "",
  loadDemo: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...INITIAL,
  setCity: (city) => set({ city }),
  setState: (state) => set({ state }),
  setLogo: (logoDataUrl) => set({ logoDataUrl }),
  setSkipEvent: (skipEvent) => set({ skipEvent }),
  setEventName: (eventName) => set({ eventName }),
  setEventStartDate: (eventStartDate) => set({ eventStartDate }),
  setEventEndDate: (eventEndDate) => set({ eventEndDate }),
  setVenue: (venue) => set({ venue }),
  setLoadDemo: (loadDemo) => set({ loadDemo }),
  next: () => set((s) => ({ step: Math.min(s.step + 1, 3) as OnboardingStep })),
  back: () => set((s) => ({ step: Math.max(s.step - 1, 1) as OnboardingStep })),
  reset: () => set(INITIAL),
}));

/* Indian states list for the dropdown. */
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
] as const;
