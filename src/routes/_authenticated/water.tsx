import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Droplets, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { predictMoisture } from "@/lib/agri.functions";
import type { PredictionResult } from "@/lib/agri/logic";
import { raiseAlert } from "@/lib/agri/alerts";
import { GlassCard } from "@/components/agri/GlassCard";
import { MoistureChart, type TrendPoint } from "@/components/agri/MoistureChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAdvisoryI18n } from "@/i18n/advisory";

export const Route = createFileRoute("/_authenticated/water")({
  head: () => ({
    meta: [
      { title: "Water Prediction — AgriSense AI" },
      {
        name: "description",
        content:
          "Turn a soil-moisture reading into an irrigation verdict with confidence, category and a 24-hour moisture trend.",
      },
      { property: "og:title", content: "Water Prediction — AgriSense AI" },
      { property: "og:description", content: "Soil-moisture irrigation predictions with confidence scoring." },
    ],
  }),
  component: WaterPage,
});

const PRESETS = [12, 32, 48, 64, 88];

type HistoryRow = {
  id: string;
  moisture: number;
  label: string;
  confidence: number;
  moisture_category: string;
  created_at: string;
};

function WaterPage() {
  const { t } = useTranslation("water");
  const adv = useAdvisoryI18n();
  const predict = useServerFn(predictMoisture);
  const { activeFarm } = useFarm();
  const [moisture, setMoisture] = useState(45);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const loadHistory = useCallback(async () => {
    if (!activeFarm) return;
    const { data } = await supabase
      .from("predictions")
      .select("id,moisture,label,confidence,moisture_category,created_at")
      .eq("farm_id", activeFarm.id)
      .order("created_at", { ascending: false })
      .limit(24);
    setHistory((data ?? []) as HistoryRow[]);
  }, [activeFarm]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const trend: TrendPoint[] = useMemo(() => {
    const recorded = [...history]
      .reverse()
      .map((h) => ({
        label: new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        value: Number(h.moisture),
      }));
    if (recorded.length >= 4) return recorded;
    // Simulated 24h decay curve seeded from the current reading until enough
    // real readings exist.
    const base = result?.moisture ?? moisture;
    return Array.from({ length: 24 }, (_, i) => ({
      label: `${String(i).padStart(2, "0")}:00`,
      value: Math.max(
        4,
        Math.min(100, Math.round(base + Math.sin(i / 3.4) * 7 - i * 0.55 + (i % 5) * 0.7)),
      ),
    }));
  }, [history, result, moisture]);

  async function run() {
    setBusy(true);
    try {
      const res = await predict({ data: { moisture } });
      setResult(res);

      const { data: auth } = await supabase.auth.getUser();
      if (auth.user && activeFarm) {
        await supabase.from("predictions").insert({
          user_id: auth.user.id,
          farm_id: activeFarm.id,
          moisture: res.moisture,
          label: res.label,
          status: res.status,
          confidence: res.confidence,
          moisture_category: res.moisture_category,
          recommendation: res.recommendation,
        });
        await loadHistory();
        if (res.moisture < Number(activeFarm.moisture_threshold)) {
          await raiseAlert({
            farmId: activeFarm.id,
            kind: "moisture",
            message: t("toast.thresholdAlert", {
              farm: activeFarm.name,
              moisture: res.moisture,
              threshold: activeFarm.moisture_threshold,
            }),
            severity: res.moisture < 30 ? "critical" : "warning",
          });
        } else {
          toast.success(t("toast.success", { label: adv.label(res.label), confidence: res.confidence }));
        }
      }
    } catch {
      toast.error(t("toast.predictionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="animate-rise">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle", { farm: activeFarm?.name ?? t("yourField") })}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <GlassCard className="animate-rise space-y-6">
          <div>
            <div className="mb-3 flex items-end justify-between">
              <label className="text-sm font-medium">{t("soilMoisture")}</label>
              <span className="font-display text-4xl font-semibold text-gradient-green">{moisture}%</span>
            </div>
            <Slider
              value={[moisture]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => setMoisture(v[0] ?? 0)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={100}
              value={moisture}
              onChange={(e) => setMoisture(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              className="w-28"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setMoisture(p)}
                  className={cn(
                    "rounded-full border border-border px-3 py-1 text-xs transition-colors duration-250 hover:border-primary hover:text-primary",
                    moisture === p && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => void run()} disabled={busy} size="lg" className="w-full">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Droplets className="mr-2 h-4 w-4" />}
            {t("predictButton")}
          </Button>

          {result && (
            <div className="animate-rise space-y-3 rounded-[var(--radius-lg)] border border-border/70 bg-background/50 p-4">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "font-display text-xl font-semibold",
                    result.status === "warning" ? "text-destructive" : "text-primary",
                  )}
                >
                  {adv.label(result.label)}
                </p>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {t("confidence", { value: result.confidence })}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${result.confidence}%` }}
                />
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">{t("category")}</span>{" "}
                <strong>{adv.moisture(result.moisture_category)}</strong>
              </p>
              <p className="flex gap-2 text-sm text-muted-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {adv.advice(result.recommendation)}
              </p>
            </div>
          )}
        </GlassCard>

        <GlassCard className="animate-rise">
          <h2 className="mb-4 text-base font-semibold">{t("trendTitle")}</h2>
          <MoistureChart points={trend} threshold={Number(activeFarm?.moisture_threshold ?? 55)} />
        </GlassCard>
      </div>

      <GlassCard className="animate-rise">
        <h2 className="mb-4 text-base font-semibold">{t("historyTitle")}</h2>
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("noHistory")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">{t("table.time")}</th>
                  <th className="pb-2 pr-4 font-medium">{t("table.moisture")}</th>
                  <th className="pb-2 pr-4 font-medium">{t("table.verdict")}</th>
                  <th className="pb-2 pr-4 font-medium">{t("table.category")}</th>
                  <th className="pb-2 font-medium">{t("table.confidence")}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-border/60">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 font-medium">{Number(h.moisture)}%</td>
                    <td
                      className={cn(
                        "py-2 pr-4",
                        h.label === "Water Needed" ? "text-destructive" : "text-primary",
                      )}
                    >
                      {adv.label(h.label)}
                    </td>
                    <td className="py-2 pr-4">{adv.moisture(h.moisture_category)}</td>
                    <td className="py-2">{Number(h.confidence)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
