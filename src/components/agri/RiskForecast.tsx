import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowRight, CloudRain, ShieldAlert, Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";

import { GlassCard } from "@/components/agri/GlassCard";
import { RiskChart } from "@/components/agri/RiskChart";
import { getRiskForecast } from "@/lib/agri.functions";
import { raiseAlert } from "@/lib/agri/alerts";
import type { RiskCategory, RiskFactor, RiskLevel, RiskPoint } from "@/lib/agri/risk";
import { cn } from "@/lib/utils";

type Forecast = {
  crop: string;
  stage: string;
  series: RiskPoint[];
  disease: RiskCategory;
  pest: RiskCategory;
  hasCropProfile: boolean;
  soilMoistureAvg: number | null;
};

const LEVEL_CLASS: Record<RiskLevel, string> = {
  Low: "bg-primary/12 text-primary",
  Medium: "bg-[oklch(0.79_0.152_78_/_18%)] text-[oklch(0.52_0.13_78)]",
  High: "bg-destructive/15 text-destructive",
};

/** Resolves a structured RiskFactor to display text in the current language, falling back to English. */
function useFactorText() {
  const { t, i18n } = useTranslation("advisory");
  return (f: RiskFactor) => {
    const key = `risk.factors.${f.code}`;
    return i18n.exists(`advisory:${key}`) ? t(key, { ...(f.values ?? {}) }) : f.text;
  };
}

export function RiskForecast({ farmId }: { farmId: string | null }) {
  const run = useServerFn(getRiskForecast);
  const factorText = useFactorText();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alerted = useRef<string | null>(null);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    setError(null);
    run({ data: { farmId } })
      .then((res) => setForecast(res as Forecast))
      .catch(() => setError("Risk forecast unavailable right now — weather service did not respond."))
      .finally(() => setLoading(false));
  }, [farmId, run]);

  // In-app alert when forecasted risk crosses into High for the active crop.
  useEffect(() => {
    if (!forecast || !farmId) return;
    const high: string[] = [];
    if (forecast.disease.level === "High") high.push("disease");
    if (forecast.pest.level === "High") high.push("pest");
    if (!high.length) return;
    const key = `${farmId}:${high.join("+")}:${forecast.disease.peakDate ?? ""}`;
    if (alerted.current === key) return;
    alerted.current = key;
    void raiseAlert({
      farmId,
      kind: "risk",
      severity: "critical",
      message: `High ${high.join(" & ")} outbreak risk forecast for ${forecast.crop} — ${
        forecast.disease.factors[0]
          ? factorText(forecast.disease.factors[0])
          : forecast.pest.factors[0]
            ? factorText(forecast.pest.factors[0])
            : "check the risk forecast"
      }.`,
    });
  }, [forecast, farmId, factorText]);

  const highBanner =
    forecast && (forecast.disease.level === "High" || forecast.pest.level === "High");

  return (
    <div className="space-y-4">
      {highBanner && (
        <GlassCard className="animate-rise border-destructive/40 bg-destructive/8">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-destructive/15 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-destructive">
                ⚠️ High outbreak risk forecast for {forecast.crop}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {forecast.disease.level === "High"
                  ? `Disease risk peaks ${formatDate(forecast.disease.peakDate)} (score ${forecast.disease.score}/100). `
                  : ""}
                {forecast.pest.level === "High"
                  ? `Pest risk peaks ${formatDate(forecast.pest.peakDate)} (score ${forecast.pest.score}/100). `
                  : ""}
                Plan a preventive scouting round and keep protectant sprays ready.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="animate-rise">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-secondary text-secondary-foreground">
            <CloudRain className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold">🌦️ Risk Forecast</h2>
            <p className="text-sm text-muted-foreground">
              {forecast
                ? `Next ${forecast.series.length} days for ${forecast.crop} · ${forecast.stage} stage`
                : "Forward-looking disease & pest outbreak risk from live weather"}
            </p>
          </div>
          <Link to="/crop" className="ml-auto">
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
              <Sprout className="h-3.5 w-3.5" />
              Crop profile
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>

        {loading && (
          <p className="mt-4 text-sm text-muted-foreground">Reading weather and field history…</p>
        )}
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {forecast && !forecast.hasCropProfile && (
          <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-secondary/60 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              No crop profile yet — risk is estimated from weather and history only. Add your crop,
              variety and sowing date for a crop-specific forecast.
            </span>
          </div>
        )}

        {forecast && (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <RiskTile title="🍂 Disease risk" category={forecast.disease} factorText={factorText} />
              <RiskTile title="🐛 Pest risk" category={forecast.pest} factorText={factorText} />
            </div>
            <div className="mt-5">
              <RiskChart points={forecast.series} />
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}

function RiskTile({
  title,
  category,
  factorText,
}: {
  title: string;
  category: RiskCategory;
  factorText: (f: RiskFactor) => string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border/60 bg-card/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            LEVEL_CLASS[category.level],
          )}
        >
          {category.level}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{category.score}/100</p>
      <p className="text-xs text-muted-foreground">Peaks {formatDate(category.peakDate)}</p>
      <ul className="mt-3 space-y-1.5">
        {category.factors.map((f) => (
          <li key={f.code} className="flex gap-2 text-xs text-muted-foreground">
            <span className="text-primary">•</span>
            <span>{factorText(f)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
