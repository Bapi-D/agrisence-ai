import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { downloadCsv, printPdfReport } from "@/lib/agri/export";
import { GlassCard } from "@/components/agri/GlassCard";
import { MoistureChart, type TrendPoint } from "@/components/agri/MoistureChart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdvisoryI18n } from "@/i18n/advisory";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Historical Analytics — AgriSense AI" },
      {
        name: "description",
        content:
          "Review 12 weeks of moisture readings and disease-detection events, with CSV and PDF export.",
      },
      { property: "og:title", content: "Historical Analytics — AgriSense AI" },
      { property: "og:description", content: "Moisture and disease history with heatmap and exports." },
    ],
  }),
  component: AnalyticsPage,
});

type Pred = { id: string; moisture: number; label: string; confidence: number; moisture_category: string; created_at: string };
type Det = { id: string; label: string; disease_name: string | null; severity: string | null; confidence: number; source: string; created_at: string };

const DAYS = 84;

function AnalyticsPage() {
  const { t } = useTranslation("analytics");
  const adv = useAdvisoryI18n();
  const { activeFarm } = useFarm();
  const [preds, setPreds] = useState<Pred[]>([]);
  const [dets, setDets] = useState<Det[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    void (async () => {
      const [{ data: p }, { data: d }] = await Promise.all([
        supabase
          .from("predictions")
          .select("id,moisture,label,confidence,moisture_category,created_at")
          .eq("farm_id", activeFarm.id)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("detections")
          .select("id,label,disease_name,severity,confidence,source,created_at")
          .eq("farm_id", activeFarm.id)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      setPreds((p ?? []) as Pred[]);
      setDets((d ?? []) as Det[]);
    })();
  }, [activeFarm]);

  const heatmap = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = new Map<string, { moisture: number[]; diseased: number }>();
    for (const p of preds) {
      const key = new Date(p.created_at).toDateString();
      const e = map.get(key) ?? { moisture: [], diseased: 0 };
      e.moisture.push(Number(p.moisture));
      map.set(key, e);
    }
    for (const d of dets) {
      const key = new Date(d.created_at).toDateString();
      const e = map.get(key) ?? { moisture: [], diseased: 0 };
      if (d.label === "Diseased") e.diseased += 1;
      map.set(key, e);
    }
    return Array.from({ length: DAYS }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (DAYS - 1 - i));
      const e = map.get(date.toDateString());
      const avg = e?.moisture.length
        ? e.moisture.reduce((a, b) => a + b, 0) / e.moisture.length
        : null;
      return { date, avg, diseased: e?.diseased ?? 0 };
    });
  }, [preds, dets]);

  const weekly: TrendPoint[] = useMemo(() => {
    const buckets: Array<{ sum: number; n: number; label: string }> = [];
    for (let w = 11; w >= 0; w--) {
      const slice = heatmap.slice((11 - w) * 7, (11 - w) * 7 + 7);
      const vals = slice.map((d) => d.avg).filter((v): v is number => v !== null);
      buckets.push({
        sum: vals.reduce((a, b) => a + b, 0),
        n: vals.length,
        label: slice[0] ? slice[0].date.toLocaleDateString([], { month: "short", day: "numeric" }) : "",
      });
    }
    return buckets.map((b) => ({ label: b.label, value: b.n ? Math.round(b.sum / b.n) : 0 }));
  }, [heatmap]);

  const diseasedCount = dets.filter((d) => d.label === "Diseased").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="animate-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">📊 {t("header.title", { defaultValue: "Historical Analytics" })}</h1>
          <p className="text-sm text-muted-foreground">
            {t("header.summary", {
              defaultValue: "{{preds}} moisture readings · {{scans}} leaf scans · {{diseased}} disease events",
              preds: preds.length,
              scans: dets.length,
              diseased: diseasedCount,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(`agrisense-${activeFarm?.name ?? "farm"}-history.csv`, [
                ...preds.map((p) => ({ type: "prediction", ...p })),
                ...dets.map((d) => ({ type: "detection", ...d })),
              ])
            }
          >
            <Download className="mr-2 h-4 w-4" /> {t("actions.csv", { defaultValue: "CSV" })}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              printPdfReport(`AgriSense AI — ${activeFarm?.name ?? "Farm"} report`, [
                { heading: "Moisture predictions", rows: preds },
                { heading: "Disease detections", rows: dets },
              ])
            }
          >
            <FileText className="mr-2 h-4 w-4" /> {t("actions.pdf", { defaultValue: "PDF" })}
          </Button>
        </div>
      </header>

      <GlassCard className="animate-rise">
        <h2 className="mb-4 text-base font-semibold">{t("moistureChart.title", { defaultValue: "Weekly average moisture" })}</h2>
        <MoistureChart points={weekly} threshold={Number(activeFarm?.moisture_threshold ?? 55)} />
      </GlassCard>

      <GlassCard className="animate-rise">
        <h2 className="mb-1 text-base font-semibold">{t("heatmap.title", { defaultValue: "Activity heatmap (12 weeks)" })}</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {t("heatmap.legend", { defaultValue: "Green intensity = average soil moisture · red ring = disease detected that day" })}
        </p>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {Array.from({ length: 12 }, (_, w) => (
            <div key={w} className="flex flex-col gap-1">
              {heatmap.slice(w * 7, w * 7 + 7).map((d) => (
                <div
                  key={d.date.toISOString()}
                  title={`${d.date.toLocaleDateString()} · ${
                    d.avg === null
                      ? t("heatmap.noReading", { defaultValue: "no reading" })
                      : t("heatmap.moisturePercent", { defaultValue: "{{value}}% moisture", value: Math.round(d.avg) })
                  }${
                    d.diseased
                      ? ` · ${t("heatmap.diseaseEvents", { defaultValue: "{{count}} disease event(s)", count: d.diseased })}`
                      : ""
                  }`}
                  className={cn(
                    "h-4 w-4 rounded-[4px] border transition-transform duration-250 hover:scale-125",
                    d.diseased ? "border-destructive" : "border-transparent",
                  )}
                  style={{
                    background:
                      d.avg === null
                        ? "var(--muted)"
                        : `color-mix(in oklab, var(--green-600) ${Math.min(100, Math.max(12, d.avg))}%, var(--green-50))`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="animate-rise">
          <h2 className="mb-3 text-base font-semibold">{t("recentMoisture.title", { defaultValue: "Recent moisture readings" })}</h2>
          <ul className="divide-y divide-border/60 text-sm">
            {preds.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="font-medium">{Number(p.moisture)}%</span>
                <span className={p.label === "Water Needed" ? "text-destructive" : "text-primary"}>
                  {adv.label(p.label)}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
            {!preds.length && (
              <li className="py-6 text-center text-muted-foreground">
                {t("recentMoisture.empty", { defaultValue: "No data yet." })}
              </li>
            )}
          </ul>
        </GlassCard>

        <GlassCard className="animate-rise">
          <h2 className="mb-3 text-base font-semibold">{t("recentDetections.title", { defaultValue: "Recent detections" })}</h2>
          <ul className="divide-y divide-border/60 text-sm">
            {dets.slice(0, 8).map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2">
                <span className={d.label === "Healthy" ? "text-primary" : "text-destructive"}>
                  {adv.label(d.label)}
                </span>
                <span className="text-muted-foreground">{d.disease_name ? adv.name(d.disease_name) : "—"}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {d.source} · {new Date(d.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
            {!dets.length && (
              <li className="py-6 text-center text-muted-foreground">
                {t("recentDetections.empty", { defaultValue: "No scans yet." })}
              </li>
            )}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
