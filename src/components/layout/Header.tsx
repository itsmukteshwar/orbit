"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, FlaskConical, Maximize, Menu, Search, UserCog } from "lucide-react";
import { ROLES } from "@/types/domain";
import { ROLE_LABELS, useRoleStore } from "@/lib/roles";
import { usePlanStore } from "@/lib/plan";
import { cn } from "@/lib/utils";

const IS_DEV = process.env.NODE_ENV === "development";

interface HeaderProps {
  /** Mobile: opens the sidebar drawer. */
  onOpenMobileSidebar: () => void;
}

/** Sticky application header: mobile menu, global search, notifications, profile. */
export function Header({ onOpenMobileSidebar }: HeaderProps) {
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        aria-label="Open menu"
        className="rounded-lg p-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orbit-500 lg:hidden"
      >
        <Menu className="h-5 w-5 text-slate-600" />
      </button>

      <label htmlFor="global-search" className="relative hidden w-80 md:block">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="global-search"
          type="search"
          placeholder="Search visitors, events, badges…"
          className="h-9 w-full rounded-lg border border-transparent bg-slate-100/80 pr-3 pl-9 text-sm placeholder:text-slate-400 transition focus:border-orbit-300 focus:bg-white focus:ring-2 focus:ring-orbit-100 focus:outline-none"
        />
      </label>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Notifications — unread"
          className="relative rounded-lg p-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orbit-500"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
          className="hidden rounded-lg p-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orbit-500 md:block"
        >
          <Maximize className="h-5 w-5 text-slate-600" />
        </button>

        <UserMenu />
      </div>
    </header>
  );
}

/**
 * P-06(d): user menu with the mock role switcher. The trigger is pixel-identical
 * to the original profile button; the dropdown lists all 8 roles.
 */
function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const role = useRoleStore((s) => s.role);
  const setRole = useRoleStore((s) => s.setRole);
  const plan = usePlanStore();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* Keep the canon at-rest label for the default role. */
  const subLabel = role === "org_admin" ? "TechFairs India · Admin" : `TechFairs India · ${ROLE_LABELS[role]}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orbit-500"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orbit-500 text-xs font-semibold text-white">
          AR
        </span>
        <span className="hidden text-left leading-tight xl:block">
          <span className="block font-medium text-slate-800">Ananya Rao</span>
          <span className="block text-[11px] text-slate-400">{subLabel}</span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-card-hover"
        >
          <p className="flex items-center gap-2 px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <UserCog className="h-3.5 w-3.5" /> Switch role (mock)
          </p>
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              role="menuitemradio"
              aria-checked={r === role}
              onClick={() => {
                setRole(r);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px]",
                r === role ? "bg-orbit-50 font-semibold text-orbit-600" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {ROLE_LABELS[r]}
              {r === role && <Check className="ml-auto h-3.5 w-3.5 text-orbit-500" />}
            </button>
          ))}

          {/* Dev-only trial state controls */}
          {IS_DEV && (
            <>
              <div className="my-1 border-t border-dashed border-amber-200" />
              <p className="flex items-center gap-2 px-2.5 pt-1 pb-1 text-[11px] font-semibold tracking-wider text-amber-500 uppercase">
                <FlaskConical className="h-3.5 w-3.5" /> Trial state (dev)
              </p>
              {[
                {
                  label: `Day 13 (1 day left)`,
                  active: plan.trialDaysLeft === 1,
                  action: plan.simulateDay13,
                },
                {
                  label: `Limit hit (${plan.activeEventsUsed}/${plan.activeEventLimit} events)`,
                  active: plan.activeEventsUsed >= plan.activeEventLimit && plan.trialDaysLeft > 0,
                  action: plan.simulateLimitHit,
                },
                {
                  label: "Expired (day 0)",
                  active: plan.trialDaysLeft <= 0,
                  action: plan.simulateExpired,
                },
                {
                  label: `Reset (day ${plan.trialTotalDays})`,
                  active: plan.trialDaysLeft === plan.trialTotalDays,
                  action: plan.resetPlan,
                },
              ].map(({ label, active, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { action(); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px]",
                    active
                      ? "bg-amber-50 font-semibold text-amber-700"
                      : "text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {active && <Check className="h-3 w-3 text-amber-500" />}
                  <span className={active ? "" : "pl-[15px]"}>{label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
