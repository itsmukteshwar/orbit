"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NAV_SECTIONS, type BadgeTone, type NavSection } from "@/config/navigation";
import { cn } from "@/lib/utils";

const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  primary: "bg-orbit-50 text-orbit-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  secondary: "bg-violet-50 text-violet-600",
};

interface SidebarProps {
  /** Id of the expanded section — all other sections show only their title. */
  activeSectionId: string;
  /** Toggles a section open/closed (accordion). */
  onToggleSection: (sectionId: string) => void;
  /** Mobile: whether the sidebar drawer is open. */
  mobileOpen: boolean;
  onMobileClose: () => void;
  /** P-06: context-aware section list (defaults to the legacy tree). */
  sections?: NavSection[];
}

/**
 * Text sidebar listing every navigation section. Exactly one section is
 * expanded at a time; the rest collapse to their titles (accordion).
 */
export function Sidebar({ activeSectionId, onToggleSection, mobileOpen, onMobileClose, sections = NAV_SECTIONS }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-orbit-900/40 lg:hidden"
          aria-hidden="true"
          onClick={onMobileClose}
        />
      )}

      <aside
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 z-40 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200",
          "left-0 lg:left-14",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex shrink-0 items-center justify-center border-b border-slate-100 px-4 py-3">
          <Image src="/images/orbit-logo.png" alt="Orbit" width={28} height={28} className="lg:hidden shrink-0 object-contain mr-2" unoptimized />
          <Image src="/images/org.png" alt="Orbit Event ERP" width={148} height={40} className="w-auto h-auto max-h-10 object-contain" unoptimized />
        </div>

        {/* Sections */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = section.id === activeSectionId;
            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => onToggleSection(section.id)}
                  aria-expanded={isOpen}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-orbit-500",
                    isOpen ? "bg-orbit-50/70 font-semibold text-orbit-700" : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", isOpen ? "text-orbit-500" : "text-slate-400")} />
                  {section.label}
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 text-slate-400 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {isOpen && (
                  <ul className="mt-0.5 mb-1 space-y-0.5">
                    {section.items.map((item) => {
                      const isCurrent = item.href !== "#" && pathname.startsWith(item.href);
                      return (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            aria-current={isCurrent ? "page" : undefined}
                            onClick={onMobileClose}
                            className={cn(
                              "flex items-center gap-2 rounded-lg py-1.5 pr-3 pl-11 text-[13px] transition-colors",
                              "focus-visible:outline-2 focus-visible:outline-orbit-500",
                              isCurrent
                                ? "bg-orbit-50 font-semibold text-orbit-600"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                            )}
                          >
                            {item.label}
                            {item.badge && (
                              <span
                                className={cn(
                                  "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                  BADGE_TONE_CLASSES[item.badge.tone],
                                )}
                              >
                                {item.badge.text}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orbit-500 text-xs font-semibold text-white">
              AR
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-medium text-slate-800">Ananya Rao</p>
              <p className="truncate text-[11px] text-slate-400">TechFairs India · Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
