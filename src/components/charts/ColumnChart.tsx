"use client";

import type { ApexOptions } from "apexcharts";
import { ApexChart } from "@/components/charts/ApexChart";
import { buildValueFormatter, type ValueFormat } from "@/lib/utils";

interface ColumnChartProps {
  categories: string[];
  series: { name: string; data: number[] }[];
  colors?: string[];
  height?: number;
  /** Serialisable value format for tooltips. */
  format?: ValueFormat;
}

/** Rounded column chart in the Orbit style. */
export function ColumnChart({ categories, series, colors = ["#B3D1FF", "#2563EB"], height = 260, format }: ColumnChartProps) {
  const formatter = buildValueFormatter(format);

  const options: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    colors,
    plotOptions: { bar: { columnWidth: "40%", borderRadius: 4, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#eef2f6", strokeDashArray: 4 },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#94A3B8", fontSize: "11px" } },
    },
    yaxis: { labels: { style: { colors: "#94A3B8", fontSize: "11px" } } },
    legend: { position: "top", horizontalAlign: "right", fontSize: "12px" },
    tooltip: { y: { formatter } },
  };

  return <ApexChart type="bar" options={options} series={series} height={height} />;
}
