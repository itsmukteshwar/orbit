"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { findSectionByPath } from "@/config/navigation";
import { IconRail } from "@/components/layout/IconRail";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Application chrome: icon rail + text sidebar (accordion) + header + footer.
 * The expanded sidebar section follows the current route and stays in sync
 * with the icon rail; clicking either side updates both.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeSectionId, setActiveSectionId] = useState(() => findSectionByPath(pathname).id);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* When the route changes, expand the section that owns the new page. */
  useEffect(() => {
    setActiveSectionId(findSectionByPath(pathname).id);
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <IconRail activeSectionId={activeSectionId} onSelectSection={setActiveSectionId} />

      <Sidebar
        activeSectionId={activeSectionId}
        onToggleSection={(id) => setActiveSectionId((current) => (current === id ? "" : id))}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Content column: offset by rail (3.5rem) + sidebar (16rem) on desktop */}
      <div className="flex min-h-screen flex-col lg:pl-[19.5rem]">
        <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 p-4 sm:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
