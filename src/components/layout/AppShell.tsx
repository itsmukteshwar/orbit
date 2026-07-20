"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { findSectionByPath, getNavSections } from "@/config/navigation";
import { useRoleStore } from "@/lib/roles";
import { IconRail } from "@/components/layout/IconRail";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrialBanner } from "@/components/kit/TrialBanner";
import { TrialLockScreen } from "@/components/kit/TrialLockScreen";
import { PlanLimitModal } from "@/components/kit/PlanLimitModal";

/**
 * Application chrome: icon rail + text sidebar (accordion) + header + footer.
 * The expanded sidebar section follows the current route and stays in sync
 * with the icon rail; clicking either side updates both.
 *
 * P-06: the section list is context-aware (legacy / org / event trees from
 * config/navigation.ts) and role-filtered. Auth routes render without chrome.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = useRoleStore((s) => s.role);

  const sections = useMemo(() => getNavSections(pathname, role), [pathname, role]);

  const [activeSectionId, setActiveSectionId] = useState(() => findSectionByPath(pathname, sections).id);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* When the route changes, expand the section that owns the new page. */
  useEffect(() => {
    setActiveSectionId(findSectionByPath(pathname, sections).id);
    setMobileSidebarOpen(false);
  }, [pathname, sections]);

  /* Auth + onboarding + invite + TV + public event/exhibitor routes: no chrome. */
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/tv") ||
    pathname.startsWith("/e/") ||
    pathname.startsWith("/x/")
  ) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <IconRail sections={sections} activeSectionId={activeSectionId} onSelectSection={setActiveSectionId} />

      <Sidebar
        sections={sections}
        activeSectionId={activeSectionId}
        onToggleSection={(id) => setActiveSectionId((current) => (current === id ? "" : id))}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Content column: offset by rail (3.5rem) + sidebar (16rem) on desktop */}
      <div className="flex min-h-screen flex-col lg:pl-[19.5rem]">
        <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <TrialBanner />
        {/* relative so TrialLockScreen can use absolute positioning over this column */}
        <div className="relative flex flex-1 flex-col">
          <TrialLockScreen />
          <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 p-4 sm:p-6">{children}</main>
          <Footer />
        </div>
        <PlanLimitModal />
      </div>
    </div>
  );
}
