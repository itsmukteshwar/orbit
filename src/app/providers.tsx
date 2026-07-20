"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { CmdK } from "@/components/kit/CmdK";

/**
 * App-level client providers: TanStack Query, Sonner toaster (Orbit tokens),
 * and the global Cmd-K palette.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CmdK />
      <Toaster
        position="bottom-right"
        gap={8}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "flex w-[356px] items-center gap-3 rounded-xl bg-white p-4 shadow-card-hover border-l-4 text-sm font-sans",
            title: "font-medium text-slate-800",
            description: "text-[12px] text-slate-500",
            success: "border-l-emerald-500",
            error: "border-l-red-500",
            warning: "border-l-amber-400",
            info: "border-l-orbit-500",
            actionButton:
              "ml-auto shrink-0 rounded-lg bg-orbit-50 px-2.5 py-1 text-[12px] font-semibold text-orbit-600 hover:bg-orbit-100",
            cancelButton:
              "ml-auto shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-medium text-slate-500 hover:bg-slate-100",
          },
        }}
      />
    </QueryClientProvider>
  );
}
