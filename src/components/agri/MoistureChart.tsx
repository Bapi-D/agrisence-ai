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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export type TrendPoint = { label: string; value: number };

export function MoistureChart({ points, threshold = 55 }: { points: TrendPoint[]; threshold?: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="h-64 rounded-[var(--radius-md)] bg-muted/40" />;

  return (
    <div className="h-64">
      <Line
        data={{
          labels: points.map((p) => p.label),
          datasets: [
            {
              label: "Soil moisture %",
              data: points.map((p) => p.value),
              borderColor: "oklch(0.595 0.148 151)",
              backgroundColor: "oklch(0.684 0.162 151 / 18%)",
              fill: true,
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 5,
              borderWidth: 2,
            },
            {
              label: `Irrigation threshold (${threshold}%)`,
              data: points.map(() => threshold),
              borderColor: "oklch(0.79 0.152 78)",
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
          plugins: { legend: { position: "bottom", labels: { boxWidth: 12, usePointStyle: true } } },
        }}
      />
    </div>
  );
}
