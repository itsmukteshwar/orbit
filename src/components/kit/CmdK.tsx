"use client";

/**
 * Cmd-K global palette. Structure ported from the Vyzor responsive-search-modal
 * partial; built from scratch with Orbit tokens (no cmdk dependency — the
 * allowed dependency set is fixed).
 *
 * Scope: route jump · mock registration search (name/phone) · quick actions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, CalendarPlus, CornerDownLeft, LayoutDashboard, Search, UserPlus, Users,
} from "lucide-react";
import { registrationService } from "@/services/registration";
import { queryKeys } from "@/lib/queries";
import { NAV_SECTIONS } from "@/config/navigation";
import { Badge } from "@/components/ui/Badge";
import { KbdHint } from "@/components/kit/misc";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  group: "Actions" | "Pages" | "Registrations";
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export function CmdK() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  /* Global shortcut */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  /* Registration search (mock service) — enabled from 2 chars */
  const { data: regResults } = useQuery({
    queryKey: queryKeys.registrations.list({ q, limit: 5 }),
    queryFn: () => registrationService.list({ q, limit: 5 }),
    enabled: open && q.trim().length >= 2,
    staleTime: 10_000,
  });

  const items = useMemo<PaletteItem[]>(() => {
    const needle = q.trim().toLowerCase();

    const actions: PaletteItem[] = (
      [
        {
          id: "act-new-event",
          group: "Actions",
          label: "New event",
          icon: <CalendarPlus className="h-4 w-4 text-orbit-500" />,
          onSelect: () => go("/org/events"),
        },
        {
          id: "act-walkin",
          group: "Actions",
          label: "Walk-in desk — register visitor",
          icon: <UserPlus className="h-4 w-4 text-orbit-500" />,
          onSelect: () => go("/visitors/register"),
        },
      ] satisfies PaletteItem[]
    ).filter((a) => !needle || a.label.toLowerCase().includes(needle));

    const pages: PaletteItem[] = NAV_SECTIONS.flatMap((section) =>
      section.items
        .filter((item) => item.href !== "#")
        .map((item) => ({
          id: `page-${item.href}`,
          group: "Pages" as const,
          label: item.label,
          sublabel: section.label,
          icon: <LayoutDashboard className="h-4 w-4 text-slate-400" />,
          onSelect: () => go(item.href),
        })),
    ).filter((p) => !needle || p.label.toLowerCase().includes(needle) || p.sublabel?.toLowerCase().includes(needle));

    const regs: PaletteItem[] = (regResults?.items ?? []).map((r) => ({
      id: `reg-${r.id}`,
      group: "Registrations" as const,
      label: `${r.firstName} ${r.lastName}`,
      sublabel: `${r.phone} · ${r.company ?? r.city}`,
      icon: <Users className="h-4 w-4 text-slate-400" />,
      onSelect: () => go(`/visitors?focus=${r.id}`),
    }));

    return [...actions, ...pages.slice(0, 6), ...regs];
  }, [q, regResults, go]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length, q]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      items[activeIndex].onSelect();
    }
  }

  if (!open) return null;

  let lastGroup: string | null = null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-orbit-900/50" aria-hidden="true" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-card-hover">
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search pages, visitors by name or phone…"
            className="h-12 w-full border-0 text-sm placeholder:text-slate-400 focus:outline-none"
            aria-label="Command palette search"
          />
          <KbdHint keys={["Esc"]} />
        </div>

        {/* Results */}
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {items.length === 0 && (
            <li className="px-3 py-8 text-center text-[13px] text-slate-400">
              No matches{q.trim().length >= 2 ? ` for “${q.trim()}”` : ""}
            </li>
          )}
          {items.map((item, i) => {
            const showHeader = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <li key={item.id}>
                {showHeader && (
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    {item.group}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={item.onSelect}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px]",
                    i === activeIndex ? "bg-orbit-50 text-orbit-700" : "text-slate-600",
                  )}
                >
                  {item.icon}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.label}</span>
                    {item.sublabel && <span className="block truncate text-[11px] text-slate-400">{item.sublabel}</span>}
                  </span>
                  {item.group === "Registrations" && <Badge variant="primary">Visitor</Badge>}
                  {i === activeIndex ? (
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-200" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5"><KbdHint keys={["↑", "↓"]} /> Navigate</span>
          <span className="flex items-center gap-1.5"><KbdHint keys={["↵"]} /> Open</span>
          <span className="ml-auto flex items-center gap-1.5"><KbdHint keys={["⌘", "K"]} /> Toggle</span>
        </div>
      </div>
    </div>
  );
}
