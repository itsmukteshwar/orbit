import type { Page } from "@/services/types";

/** Global devtools toggle: `window.__mockErrors = true` → ~5% of calls fail. */
declare global {
  interface Window {
    __mockErrors?: boolean;
  }
}

const LATENCY_MS = 300;
const FAILURE_RATE = 0.05;

/** Await this at the top of every mock method: 300ms latency + optional 5% failure. */
export async function simulate(op: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  if (typeof window !== "undefined" && window.__mockErrors && Math.random() < FAILURE_RATE) {
    throw new Error(`Mock failure (${op}) — window.__mockErrors is on`);
  }
}

/** Offset-cursor pagination over an in-memory array. Cursor is a stringified index. */
export function paginate<T>(items: T[], cursor?: string, limit = 50): Page<T> {
  const start = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
  const slice = items.slice(start, start + limit);
  const next = start + limit;
  return {
    items: slice,
    nextCursor: next < items.length ? String(next) : null,
    total: items.length,
  };
}

/** Case-insensitive multi-field text match. */
export function textMatch(q: string | undefined, ...fields: Array<string | null | undefined>): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => f?.toLowerCase().includes(needle));
}

let idCounter = 1000;
/** Runtime id for records created during the session (not seeded — session-scoped). */
export function runtimeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_RT${Date.now().toString(36).toUpperCase()}${idCounter}`;
}
