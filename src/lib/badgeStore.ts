"use client";

/**
 * P-37 — Badge configuration store.
 * Per-event: category → template assignment, per-template field toggles,
 * sponsor strip image (data-URL). Persisted to localStorage.
 */

import { create } from "zustand";
import {
  DEFAULT_FIELD_CONFIG,
  type BadgeFieldConfig,
  type BadgeTemplateId,
} from "@/components/badge/templates";

const storageKey = (eventId: string) => `orbit_badge_config_${eventId}`;

interface PersistedConfig {
  assignments: Record<string, BadgeTemplateId>;
  fieldConfig: Partial<Record<BadgeTemplateId, BadgeFieldConfig>>;
  sponsorStripUrl: string | null;
}

interface BadgeConfigState extends PersistedConfig {
  eventId: string | null;
  load(eventId: string): void;
  assign(categoryId: string, templateId: BadgeTemplateId): void;
  toggleField(templateId: BadgeTemplateId, field: keyof BadgeFieldConfig): void;
  setSponsorStrip(url: string | null): void;
  fieldsFor(templateId: BadgeTemplateId): BadgeFieldConfig;
}

function persist(state: BadgeConfigState) {
  if (!state.eventId) return;
  const data: PersistedConfig = {
    assignments: state.assignments,
    fieldConfig: state.fieldConfig,
    sponsorStripUrl: state.sponsorStripUrl,
  };
  try {
    localStorage.setItem(storageKey(state.eventId), JSON.stringify(data));
  } catch {
    /* quota exceeded (large sponsor image) — keep in-memory only */
  }
}

export const useBadgeStore = create<BadgeConfigState>((set, get) => ({
  eventId: null,
  assignments: {},
  fieldConfig: {},
  sponsorStripUrl: null,

  load(eventId) {
    if (get().eventId === eventId) return;
    let persisted: PersistedConfig = { assignments: {}, fieldConfig: {}, sponsorStripUrl: null };
    try {
      const raw = localStorage.getItem(storageKey(eventId));
      if (raw) persisted = JSON.parse(raw) as PersistedConfig;
    } catch {
      /* corrupted — start fresh */
    }
    set({ eventId, ...persisted });
  },

  assign(categoryId, templateId) {
    set((s) => ({ assignments: { ...s.assignments, [categoryId]: templateId } }));
    persist(get());
  },

  toggleField(templateId, field) {
    set((s) => {
      const current = s.fieldConfig[templateId] ?? DEFAULT_FIELD_CONFIG;
      return {
        fieldConfig: {
          ...s.fieldConfig,
          [templateId]: { ...current, [field]: !current[field] },
        },
      };
    });
    persist(get());
  },

  setSponsorStrip(url) {
    set({ sponsorStripUrl: url });
    persist(get());
  },

  fieldsFor(templateId) {
    return get().fieldConfig[templateId] ?? DEFAULT_FIELD_CONFIG;
  },
}));

/** Default template heuristic when a category has no explicit assignment. */
export function defaultTemplateFor(categoryName: string): BadgeTemplateId {
  const n = categoryName.toLowerCase();
  if (n.includes("vip")) return "vip_gold";
  if (n.includes("exhibitor")) return "exhibitor";
  if (n.includes("staff") || n.includes("volunteer")) return "staff";
  return "classic";
}
