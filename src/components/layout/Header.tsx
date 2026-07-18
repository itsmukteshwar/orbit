"use client";

import { Bell, Maximize, Menu, Search } from "lucide-react";

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

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orbit-500"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orbit-500 text-xs font-semibold text-white">
            AR
          </span>
          <span className="hidden text-left leading-tight xl:block">
            <span className="block font-medium text-slate-800">Ananya Rao</span>
            <span className="block text-[11px] text-slate-400">TechFairs India · Admin</span>
          </span>
        </button>
      </div>
    </header>
  );
}
