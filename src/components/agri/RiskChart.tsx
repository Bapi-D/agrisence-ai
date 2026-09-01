import { useEffect, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

import type { RiskPoint } from "@/lib/agri/risk";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/** Risk-level colours: green (low) → amber (medium) → red (high). */
const LEVEL_COLOR = {
  Low: "oklch(0.595 0.148 151)",
  Medium: "oklch(0.79 0.152 78)",
  High: "oklch(0.577 0.245 27.325)",
} as const;

function pointColors(points: RiskPoint[], key: "diseaseLevel" | "pestLevel") {
  return points.map((p) => LEVEL_COLOR[p[key]]);
}

function dayLabel(date: string) {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

export function RiskChart({ points }: { points: RiskPoint[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="h-64 rounded-[var(--radius-md)] bg-muted/40" />;

  return (
    <div className="h-64">
      <Line
        data={{
          labels: points.map((p) => dayLabel(p.date)),
          datasets: [
            {
              label: "Disease risk",
              data: points.map((p) => p.diseaseScore),
              borderColor: "oklch(0.595 0.148 151)",
              backgroundColor: "oklch(0.684 0.162 151 / 16%)",
              pointBackgroundColor: pointColors(points, "diseaseLevel"),
              pointBorderColor: pointColors(points, "diseaseLevel"),
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2,
            },
            {
              label: "Pest risk",
              data: points.map((p) => p.pestScore),
              borderColor: "oklch(0.62 0.14 45)",
              backgroundColor: "oklch(0.79 0.152 78 / 14%)",
              pointBackgroundColor: pointColors(points, "pestLevel"),
              pointBorderColor: pointColors(points, "pestLevel"),
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2,
              borderDash: [5, 4],
            },
            {
              label: "High-risk threshold",
              data: points.map(() => 66),
              borderColor: "oklch(0.577 0.245 27.325 / 60%)",
              borderDash: [6, 6],
              pointRadius: 0,
              fill: false,
              borderWidth: 1.5,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          scales: {
            y: { min: 0, max: 100, grid: { color: "oklch(0.5 0.05 152 / 12%)" } },
            x: { grid: { display: false } },
          },
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12, usePointStyle: true } },
            tooltip: {
              callbacks: {
                afterBody: (items) => {
                  const p = points[items[0]?.dataIndex ?? 0];
                  return p ? `Disease: ${p.diseaseLevel} · Pest: ${p.pestLevel}` : "";
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
