/**
 * Joins class names, skipping falsy values.
 * Lightweight alternative to `clsx` for this project.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Formats a number in the Indian numbering system (e.g. 1,42,381). */
export function formatIndian(value: number): string {
  return value.toLocaleString("en-IN");
}

/** Declarative number-format spec — safe to pass from Server to Client Components. */
export interface ValueFormat {
  prefix?: string;
  suffix?: string;
  /** Fixed decimal places; omit for none. */
  decimals?: number;
  /** Use Indian digit grouping (1,42,381). */
  indian?: boolean;
}

/** Builds an ApexCharts label formatter from a serialisable ValueFormat spec. */
export function buildValueFormatter(format?: ValueFormat): ((value: number) => string) | undefined {
  if (!format) return undefined;
  const { prefix = "", suffix = "", decimals, indian = false } = format;
  return (value: number) => {
    const num =
      decimals !== undefined ? value.toFixed(decimals) : indian ? value.toLocaleString("en-IN") : String(value);
    return `${prefix}${num}${suffix}`;
  };
}
