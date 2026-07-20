"use client";

/**
 * FilterBar — the /visitors filter toolbar as a reusable component:
 * count text (left) + selects/search (right), plus typed removable chips.
 */

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/kit/inputs";

export interface FilterSelect {
  id: string;
  label: string; // used as aria-label + "All …" first option
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface FilterBarProps {
  /** Left slot — e.g. "Showing 400 visitors · Page 1 of 20" */
  summary?: React.ReactNode;
  selects?: FilterSelect[];
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  chips?: FilterChip[];
  onClearAll?: () => void;
  className?: string;
}

export function FilterBar({ summary, selects, search, chips, onClearAll, className }: FilterBarProps) {
  const hasChips = !!chips?.length;

  return (
    <div className={cn("p-5 pb-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {summary && <p className="text-slate-500">{summary}</p>}

        <div className="flex flex-wrap items-center gap-2">
          {selects?.map((s) => (
            <select
              key={s.id}
              aria-label={s.label}
              value={s.value}
              onChange={(e) => s.onChange(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-600 focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
            >
              <option value="">{s.label}</option>
              {s.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ))}

          {search && (
            <SearchInput
              size="sm"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Search…"}
              className="w-56"
            />
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {hasChips && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {chips!.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-orbit-50 py-0.5 pr-1 pl-2 text-[11px] font-semibold text-orbit-600"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remove filter ${chip.label}`}
                onClick={chip.onRemove}
                className="rounded-full p-0.5 hover:bg-orbit-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="ml-1 text-[12px] font-medium text-slate-400 hover:text-slate-600"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
