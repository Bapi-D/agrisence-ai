import { MoistureChart } from "@/components/agri/MoistureChart";

import { useEffect, useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { useServerFn } from "@tanstack/react-start";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Bug,
  Camera,
  Droplets,
  Leaf,
  MapPin,
  ScanLine,
  Thermometer,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import { useFarm } from "@/hooks/useFarm";

import { getWeather } from "@/lib/agri.functions";

import type { WeatherResult } from "@/lib/agri/weather.server";

import { GlassCard } from "@/components/agri/GlassCard";

import { pestPressure } from "@/lib/agri/pests";

import { RiskForecast } from "@/components/agri/RiskForecast";

import { useTranslation } from "react-i18next";

import { useAdvisoryI18n } from "@/i18n/advisory";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Farm Dashboard — AgriSense AI" },
      {
        name: "description",
        content:
          "Live overview of soil moisture, plant health, alerts and weather for your fields in AgriSense AI.",
      },
      {
        property: "og:title",
        content: "Farm Dashboard — AgriSense AI",
      },
      {
        property: "og:description",
        content: "Live soil moisture, plant health and alert overview.",
      },
    ],
  }),
  component: Dashboard,
});

const PANELS = [
  {
    to: "/water",
    emoji: "💧",
    icon: Droplets,
    titleKey: "panelWaterTitle",
    textKey: "panelWaterText",
  },
  {
    to: "/disease",
    emoji: "🔬",
    icon: ScanLine,
    titleKey: "panelDiseaseTitle",
    textKey: "panelDiseaseText",
  },
  {
    to: "/live",
    emoji: "📷",
    icon: Camera,
    titleKey: "panelLiveTitle",
    textKey: "panelLiveText",
  },
  {
    to: "/farm-3d",
    emoji: "🌿",
    icon: Boxes,
    titleKey: "panelFarm3dTitle",
    textKey: "panelFarm3dText",
  },
  {
    to: "/hotspots",
    emoji: "🗺️",
    icon: MapPin,
    titleKey: "panelHotspotsTitle",
    textKey: "panelHotspotsText",
  },
  {
    to: "/pests",
    emoji: "🐛",
    icon: Bug,
    titleKey: "panelPestsTitle",
    textKey: "panelPestsText",
  },
] as const;

function Dashboard() {
  const { t } = useTranslation("dashboard");

  const adv = useAdvisoryI18n();

  const { activeFarm } = useFarm();

  const weatherFn = useServerFn(getWeather);

  const [stats, setStats] = useState({
    avgMoisture: 0,
    healthy: 0,
    scans: 0,
    alerts: 0,
  });

  // ADDED: moisture chart data
  const [moistureTrend, setMoistureTrend] = useState<
    { label: string; value: number }[]
  >([]);

  const [weather, setWeather] = useState<WeatherResult | null>(null);

  const [pest, setPest] = useState<{
    score: number;
    level: string;
    trapAvg: number;
  } | null>(null);

  useEffect(() => {
    if (!activeFarm) return;

    void (async () => {
      const [{ data: preds }, { data: dets }, { count: alertCount }] =
        await Promise.all([
          supabase
            .from("predictions")
            .select("moisture, created_at")
            .eq("farm_id", activeFarm.id)
            .order("created_at", { ascending: true })
            .limit(50),

          supabase
            .from("detections")
            .select("label")
            .eq("farm_id", activeFarm.id)
            .limit(100),

          supabase
            .from("alerts")
            .select("id", { count: "exact", head: true })
            .eq("farm_id", activeFarm.id)
            .eq("is_read", false),
        ]);

      const moistures = (preds ?? []).map((p) => Number(p.moisture));

      // ADDED: prepare moisture chart data
      setMoistureTrend(
        (preds ?? []).map((p) => ({
          label: new Date(p.created_at).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
          }),
          value: Number(p.moisture),
        })),
      );

      setStats({
        avgMoisture: moistures.length
          ? Math.round(
              moistures.reduce((a, b) => a + b, 0) / moistures.length,
            )
          : 0,

        healthy: (dets ?? []).filter((d) => d.label === "Healthy").length,

        scans: (dets ?? []).length,

        alerts: alertCount ?? 0,
      });
    })();
  }, [activeFarm]);

  useEffect(() => {
    if (!activeFarm) {
      setPest(null);
      return;
    }

    void (async () => {
      const [{ data: traps }, { data: pestDets }] = await Promise.all([
        supabase
          .from("pest_trap_logs")
          .select("count")
          .eq("farm_id", activeFarm.id)
          .order("logged_on", { ascending: false })
          .limit(20),

        supabase
          .from("pest_detections")
          .select("infestation_severity")
          .eq("farm_id", activeFarm.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      setPest(
        pestPressure({
          trapCounts: (traps ?? []).map((t) => Number(t.count) || 0),

          detections: (pestDets ?? []).map((d) => ({
            infestation_severity: String(d.infestation_severity),
          })),
        }),
      );
    })();
  }, [activeFarm]);

  useEffect(() => {
    const lat = activeFarm?.latitude ?? 20.5937;

    const lon = activeFarm?.longitude ?? 78.9629;

    const load = (latitude: number, longitude: number) =>
      weatherFn({ data: { latitude, longitude } })
        .then(setWeather)
        .catch(() => setWeather(null));

    if (
      !activeFarm?.latitude &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.getCurrentPosition(
        (pos) => void load(pos.coords.latitude, pos.coords.longitude),

        () => void load(lat, lon),

        { timeout: 4000 },
      );
    } else {
      void load(lat, lon);
    }
  }, [activeFarm, weatherFn]);

  const healthPct = stats.scans
    ? Math.round((stats.healthy / stats.scans) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <GlassCard className="animate-rise flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-primary text-primary-foreground">
          <Leaf className="h-7 w-7" />
        </span>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">
            {t("welcomeBack", {
              farm: activeFarm?.name ?? t("yourFarm"),
            })}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {weather
              ? t("weatherSummary", {
                  summary: weather.summary,
                  temp: weather.temperature,
                  rain: weather.rainNext24h,

                  advice:
                    weather.rainNext24h > 4
                      ? t("delayIrrigation")
                      : t("irrigationRestsOnReadings"),
                })
              : t("noWeatherFallback")}
          </p>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Stat
          icon={Droplets}
          emoji="💧"
          label={t("statAvgMoisture")}
          value={`${stats.avgMoisture}%`}
          note={t("statAvgMoistureNote")}
        />

        <Stat
          icon={Leaf}
          emoji="🌿"
          label={t("statHealthyPlants")}
          value={`${stats.healthy}`}
          note={t("statHealthyPlantsNote", {
            pct: healthPct,
            scans: stats.scans,
          })}
        />

        <Stat
          icon={AlertTriangle}
          emoji="⚠️"
          label={t("statAlerts")}
          value={`${stats.alerts}`}
          note={t("statAlertsNote")}
        />

        <Stat
          icon={Thermometer}
          emoji="🌡️"
          label={t("statTemperature")}
          value={weather ? `${weather.temperature}°C` : "—"}
          note={
            weather
              ? t("statTemperatureHumidityNote", {
                  humidity: weather.humidity,
                })
              : t("statTemperatureFetching")
          }
        />

        <Stat
          icon={Bug}
          emoji="🐛"
          label={t("statPestPressure")}
          value={pest ? adv.riskLevel(pest.level) : "—"}
          note={
            pest
              ? t("statPestPressureNote", {
                  score: pest.score,
                  trapAvg: pest.trapAvg,
                })
              : t("statPestPressureEmpty")
          }
        />
      </div>

      {/* ADDED: Soil moisture trend */}
      <GlassCard className="animate-rise">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">💧 Soil Moisture Trend</h2>

          <p className="text-sm text-muted-foreground">
            Recent soil moisture readings for your farm
          </p>
        </div>

        {moistureTrend.length > 0 ? (
          <MoistureChart points={moistureTrend} />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No moisture readings available yet.
          </p>
        )}
      </GlassCard>

      <RiskForecast farmId={activeFarm?.id ?? null} />

      <div className="grid gap-4 sm:grid-cols-2">
        {PANELS.map((p) => (
          <Link key={p.to} to={p.to}>
            <GlassCard hover className="animate-rise h-full">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-secondary text-secondary-foreground">
                  <p.icon className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-semibold">
                    {p.emoji} {t(p.titleKey)}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(p.textKey)}
                  </p>
                </div>

                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      <Link to="/analytics">
        <GlassCard hover className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />

          <p className="text-sm font-medium">{t("openAnalytics")}</p>

          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </GlassCard>
      </Link>
    </div>
  );
}

function Stat({
  icon: Icon,
  emoji,
  label,
  value,
  note,
}: {
  icon: typeof Droplets;
  emoji: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <GlassCard hover className="animate-rise">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {emoji} {label}
        </p>

        <Icon className="h-4 w-4 text-primary" />
      </div>

      <p className="mt-3 text-3xl font-semibold">{value}</p>

      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </GlassCard>
  );
}