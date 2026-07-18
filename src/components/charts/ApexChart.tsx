"use client";

import dynamic from "next/dynamic";
import type { Props as ApexChartProps } from "react-apexcharts";

/**
 * ApexCharts renders only in the browser — this wrapper disables SSR once
 * so every chart component can share it.
 */
export const ApexChart = dynamic<ApexChartProps>(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-lg bg-slate-50" />,
});
