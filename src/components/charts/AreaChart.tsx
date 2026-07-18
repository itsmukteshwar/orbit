"use client";

import type { ApexOptions } from "apexcharts";
import { ApexChart } from "@/components/charts/ApexChart";
import { buildValueFormatter, type ValueFormat } from "@/lib/utils";

interface AreaChartProps {
  categories: string[];
  series: { name: string; data: number[] }[];
  colors?: string[];
  height?: number;
  /** Serialisable value format for axis labels and tooltips. */
  format?: ValueFormat;
}

/** Smooth gradient area chart in the Orbit style. */
export function AreaChart({ categories, series, colors = ["#2563EB", "#60A5FA"], height = 290, format }: AreaChartProps) {
  const formatter = buildValueFormatter(format);

  const options: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit" },
    colors,
    fill: { type: "gradient", gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
    stroke: { curve: "smooth", width: 2.5 },
    dataLabels: { enabled: false },
    grid: { borderColor: "#eef2f6", strokeDashArray: 4 },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#94A3B8", fontSize: "11px" } },
    },
    yaxis: { labels: { style: { colors: "#94A3B8", fontSize: "11px" }, formatter } },
    legend: { position: "top", horizontalAlign: "right", fontSize: "12px" },
    tooltip: { y: { formatter } },
  };

  return <ApexChart type="area" options={options} series={series} height={height} />;
}
