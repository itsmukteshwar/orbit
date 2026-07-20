/**
 * TanStack Query — query-key factory.
 * Convention: [domain, scope, params]. Always use these factories, never
 * inline string arrays, so invalidation stays consistent.
 */

import type { ListParams } from "@/services/types";

export const queryKeys = {
  auth: {
    currentUser: () => ["auth", "currentUser"] as const,
  },
  orgs: {
    all: () => ["orgs"] as const,
    detail: (id: string) => ["orgs", "detail", id] as const,
    team: (orgId: string) => ["orgs", "team", orgId] as const,
  },
  events: {
    all: () => ["events"] as const,
    list: (params?: ListParams<unknown>) => ["events", "list", params ?? {}] as const,
    detail: (id: string) => ["events", "detail", id] as const,
    categories: (eventId: string) => ["events", "categories", eventId] as const,
  },
  registrations: {
    all: () => ["registrations"] as const,
    list: (params?: ListParams<unknown>) => ["registrations", "list", params ?? {}] as const,
    detail: (id: string) => ["registrations", "detail", id] as const,
    pass: (registrationId: string) => ["registrations", "pass", registrationId] as const,
  },
  forms: {
    versions: (eventId: string) => ["forms", "versions", eventId] as const,
    detail: (id: string) => ["forms", "detail", id] as const,
  },
  exhibitors: {
    all: () => ["exhibitors"] as const,
    list: (params?: ListParams<unknown>) => ["exhibitors", "list", params ?? {}] as const,
    detail: (id: string) => ["exhibitors", "detail", id] as const,
    staff: (exhibitorId: string) => ["exhibitors", "staff", exhibitorId] as const,
  },
  badges: {
    all: () => ["badges"] as const,
    designs: (eventId: string) => ["badges", "designs", eventId] as const,
    printJobs: (params?: ListParams<unknown>) => ["badges", "printJobs", params ?? {}] as const,
    reprints: (eventId: string) => ["badges", "reprints", eventId] as const,
  },
  checkins: {
    all: () => ["checkins"] as const,
    list: (params?: ListParams<unknown>) => ["checkins", "list", params ?? {}] as const,
    gates: (eventId: string) => ["checkins", "gates", eventId] as const,
    devices: (eventId: string) => ["checkins", "devices", eventId] as const,
  },
  food: {
    mealSessions: (eventId: string) => ["food", "mealSessions", eventId] as const,
    counters: (eventId: string) => ["food", "counters", eventId] as const,
    redemptions: (params?: ListParams<unknown>) => ["food", "redemptions", params ?? {}] as const,
  },
  comm: {
    templates: (orgId: string) => ["comm", "templates", orgId] as const,
    messages: (params?: ListParams<unknown>) => ["comm", "messages", params ?? {}] as const,
  },
  reports: {
    registrations: (eventId: string) => ["reports", "registrations", eventId] as const,
    checkins: (eventId: string) => ["reports", "checkins", eventId] as const,
    food: (eventId: string) => ["reports", "food", eventId] as const,
  },
  admin: {
    tenants: (params?: ListParams<unknown>) => ["admin", "tenants", params ?? {}] as const,
    counts: () => ["admin", "counts"] as const,
  },
} as const;
