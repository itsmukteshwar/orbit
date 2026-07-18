"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { CalendarRange, ChevronDown, Search } from "lucide-react";
import { EVENTS, type EventStatus } from "@/data/events";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<EventStatus, "success" | "primary" | "neutral"> = {
  Live: "success",
  Upcoming: "primary",
  Completed: "neutral",
};

interface EventSwitcherProps {
  value: string;
  onChange: (eventName: string) => void;
}

/** Searchable event picker used on the Event Dashboard page header. */
export function EventSwitcher({ value, onChange }: EventSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => EVENTS.filter((event) => event.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  /* Close when clicking outside. */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-card hover:bg-slate-50"
      >
        <CalendarRange className="h-4 w-4 text-orbit-500" />
        {value}
        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-card-hover">
          <label className="relative mb-2 block">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events…"
              className="h-8 w-full rounded-lg border border-slate-200 pl-8 pr-2 text-[13px] focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
            />
          </label>

          <ul role="listbox" aria-label="Events" className="max-h-64 space-y-0.5 overflow-y-auto">
            {filtered.map((event) => (
              <li key={event.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={event.name === value}
                  onClick={() => {
                    onChange(event.name);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px]",
                    event.name === value ? "bg-orbit-50 font-semibold text-orbit-600" : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {event.name}
                  <Badge variant={STATUS_TONE[event.status]}>{event.status}</Badge>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-2.5 py-2 text-[12px] text-slate-400">No events found</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
