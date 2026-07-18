"use client";

import type { ApexOptions } from "apexcharts";
import { ApexChart } from "@/components/charts/ApexChart";
import { buildValueFormatter, type ValueFormat } from "@/lib/utils";

interface DonutChartProps {
  labels: string[];
  series: number[];
  colors: string[];
  height?: number;
  /** Centre caption under the total. */
  totalLabel?: string;
  /** Pre-formatted centre total (e.g. "14,208"). */
  totalValue?: string;
  /** Serialisable value format for tooltips. */
  format?: ValueFormat;
}

/** Donut chart with a centred total, in the Orbit style. */
export function DonutChart({ labels, series, colors, height = 220, totalLabel = "Total", totalValue, format }: DonutChartProps) {
  const formatter = buildValueFormatter(format);

  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels,
    colors,
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 2, colors: ["#fff"] },
    plotOptions: {
      pie: {
        donut: {
          size: "76%",
          labels: {
            show: true,
            name: { fontSize: "12px", color: "#64748B" },
            value: { fontSize: "20px", fontWeight: 600, color: "#0B132B" },
            total: {
              show: true,
              label: totalLabel,
              fontSize: "12px",
              color: "#94A3B8",
              formatter: totalValue !== undefined ? () => totalValue : undefined,
            },
          },
        },
      },
    },
    tooltip: { y: { formatter } },
  };

  return <ApexChart type="donut" options={options} series={series} height={height} />;
}
