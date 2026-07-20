/** Shared service-layer types (PROJECT-CONTEXT §3). */

export interface ListParams<F = Record<string, unknown>> {
  cursor?: string;
  limit?: number;
  q?: string;
  filters?: F;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}
