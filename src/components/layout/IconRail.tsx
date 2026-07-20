"use client";

import Link from "next/link";
import Image from "next/image";
import { NAV_SECTIONS, type NavSection } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface IconRailProps {
  /** Id of the section currently expanded in the text sidebar. */
  activeSectionId: string;
  /** Expands the given section in the text sidebar. */
  onSelectSection: (sectionId: string) => void;
  /** P-06: context-aware section list (defaults to the legacy tree). */
  sections?: NavSection[];
}

/**
 * Narrow icon strip on the far left — one icon per navigation section.
 * Clicking an icon expands that section in the text sidebar (accordion).
 */
export function IconRail({ activeSectionId, onSelectSection, sections = NAV_SECTIONS }: IconRailProps) {
  return (
    <nav
      aria-label="Section shortcuts"
      className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col items-center gap-1 border-r border-slate-200/80 bg-white py-2.5 lg:flex"
    >
      <Link
        href="/dashboard/super-admin"
        aria-label="Orbit home"
        className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orbit-900 overflow-hidden"
      >
        <Image src="/images/orbit-logo.png" alt="Orbit Event ERP" width={36} height={36} className="object-contain" unoptimized />
      </Link>

      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = section.id === activeSectionId;
        return (
          <button
            key={section.id}
            type="button"
            title={section.label}
            aria-label={section.label}
            aria-pressed={isActive}
            onClick={() => onSelectSection(section.id)}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbit-500",
              isActive
                ? "bg-orbit-50 text-orbit-600"
                : "text-slate-400 hover:bg-orbit-50/60 hover:text-orbit-500",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </nav>
  );
}
