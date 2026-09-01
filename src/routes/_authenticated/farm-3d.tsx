import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MousePointerClick, Move3d, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { GlassCard } from "@/components/agri/GlassCard";
import type { Plant } from "@/components/agri/FarmScene";
import { cn } from "@/lib/utils";

const FarmScene = lazy(() => import("@/components/agri/FarmScene"));

export const Route = createFileRoute("/_authenticated/farm-3d")({
  head: () => ({
    meta: [
      { title: "3D Farm Monitor — AgriSense AI" },
      {
        name: "description",
        content:
          "Rotate, zoom and click through an interactive 3D grid of your plants, colour-coded by health status.",
      },
      { property: "og:title", content: "3D Farm Monitor — AgriSense AI" },
      { property: "og:description", content: "Interactive 3D field grid with per-plant health stats." },
    ],
  }),
  component: Farm3DPage,
});

const VARIETIES = ["Wheat", "Maize", "Tomato", "Soy", "Rice"];

function Farm3DPage() {
  const { t } = useTranslation("farm3d");
  const { activeFarm } = useFarm();
  const [selected, setSelected] = useState<Plant | null>(null);
  const [seed, setSeed] = useState({ moisture: 58, healthRate: 0.7 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!activeFarm) return;
    void (async () => {
      const [{ data: preds }, { data: dets }] = await Promise.all([
        supabase.from("predictions").select("moisture").eq("farm_id", activeFarm.id).limit(20),
        supabase.from("detections").select("label").eq("farm_id", activeFarm.id).limit(40),
      ]);
      const m = (preds ?? []).map((p) => Number(p.moisture));
      const healthy = (dets ?? []).filter((d) => d.label === "Healthy").length;
      setSeed({
        moisture: m.length ? m.reduce((a, b) => a + b, 0) / m.length : 58,
        healthRate: dets && dets.length ? healthy / dets.length : 0.7,
      });
    })();
  }, [activeFarm]);

  const plants = useMemo<Plant[]>(() => {
    return Array.from({ length: 20 }, (_, i) => {
      // Deterministic pseudo-random spread seeded by real farm aggregates.
      const jitter = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
      const health = Math.max(12, Math.min(99, Math.round(seed.healthRate * 100 + (jitter - 0.5) * 55)));
      const moisture = Math.max(5, Math.min(98, Math.round(seed.moisture + (jitter - 0.5) * 34)));
      const status: Plant["status"] = health >= 70 ? "healthy" : health >= 45 ? "warning" : "diseased";
      return { id: i + 1, status, moisture, health, variety: VARIETIES[i % VARIETIES.length]! };
    });
  }, [seed]);

  const counts = plants.reduce(
    (acc, p) => ({ ...acc, [p.status]: acc[p.status] + 1 }),
    { healthy: 0, warning: 0, diseased: 0 } as Record<Plant["status"], number>,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="animate-rise">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Legend label={t("legend.healthy")} count={counts.healthy} className="bg-primary" />
        <Legend label={t("legend.warning")} count={counts.warning} className="bg-warning" />
        <Legend label={t("legend.diseased")} count={counts.diseased} className="bg-destructive" />
      </div>

      <GlassCard className="animate-rise relative overflow-hidden p-0">
        <div className="h-[26rem] w-full md:h-[32rem]">
          {mounted ? (
            <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">{t("loadingScene")}</div>}>
              <FarmScene plants={plants} onSelect={setSelected} selectedId={selected?.id ?? null} />
            </Suspense>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              {t("preparingScene")}
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1">
            <Move3d className="h-3.5 w-3.5" /> {t("hints.rotate")}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1">
            <MousePointerClick className="h-3.5 w-3.5" /> {t("hints.click")}
          </span>
        </div>

        {selected && (
          <div className="glass-card animate-rise absolute bottom-4 right-4 w-64 p-4">
            <div className="flex items-start justify-between">
              <h2 className="font-semibold">{t("plant.title", { id: selected.id })}</h2>
              <button onClick={() => setSelected(null)} aria-label={t("plant.closeDetails")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{selected.variety}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label={t("plant.status")} value={t(`legend.${selected.status}`)} />
              <Row label={t("plant.healthIndex")} value={`${selected.health}%`} />
              <Row label={t("plant.soilMoisture")} value={`${selected.moisture}%`} />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              {selected.status === "healthy"
                ? t("advice.healthy")
                : selected.status === "warning"
                  ? t("advice.warning")
                  : t("advice.diseased")}
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Legend({ label, count, className }: { label: string; count: number; className: string }) {
  return (
    <GlassCard className="animate-rise flex items-center gap-3 py-4">
      <span className={cn("h-3 w-3 rounded-full", className)} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto font-display text-xl font-semibold">{count}</span>
    </GlassCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
