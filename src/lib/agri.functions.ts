import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { analyzeLeaf, predictWater, type PixelPayload } from "./agri/logic";
import { analyzePest } from "./agri/pests";
import { fetchWeather, fetchForecastDays } from "./agri/weather.server";
import { forecastRisk } from "./agri/risk";
import { answerFarmQuestion, type ChatTurn } from "./agri/assistant.server";

/** POST /predict — soil-moisture irrigation model. */
export const predictMoisture = createServerFn({ method: "POST" })
  .inputValidator((data: { moisture: number }) => ({ moisture: Number(data.moisture) }))
  .handler(async ({ data }) => predictWater(data.moisture));

/** POST /detect — HSV + texture leaf analysis from a downsampled pixel buffer. */
export const detectDisease = createServerFn({ method: "POST" })
  .inputValidator((data: PixelPayload & { source?: string }) => data)
  .handler(async ({ data }) => analyzeLeaf(data));

/** GET /health — service status check. */
export const healthCheck = createServerFn({ method: "GET" }).handler(async () => ({
  status: "ok",
  service: "agrisense-ai",
  time: new Date().toISOString(),
}));

/** Live local weather for the dashboard (Open-Meteo, no key required). */
export const getWeather = createServerFn({ method: "POST" })
  .inputValidator((data: { latitude: number; longitude: number }) => data)
  .handler(async ({ data }) => fetchWeather(data.latitude, data.longitude));

/** Grounded AI assistant over the signed-in farmer's own sensor history. */
export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { question: string; farmId?: string | null; history?: ChatTurn[] }) => data)
  .handler(async ({ data, context }) =>
    answerFarmQuestion({
      supabase: context.supabase,
      userId: context.userId,
      question: String(data.question ?? "").slice(0, 800),
      farmId: data.farmId ?? null,
      history: (data.history ?? []).slice(-6),
    }),
  );

/** POST /detect-pest — pest identification from a downsampled pixel buffer. */
export const detectPest = createServerFn({ method: "POST" })
  .inputValidator((data: PixelPayload & { source?: string }) => data)
  .handler(async ({ data }) => analyzePest(data));

/**
 * Weather-based risk forecasting engine (equivalent of a `forecast-risk` backend
 * function — on this stack it lives as an authenticated server function, since
 * TanStack Start owns the server runtime).
 *
 * Fetches live + short-term forecast weather for the farm, stores the current
 * reading in `weather_readings`, then combines crop profile, soil-moisture
 * history and local pest/disease history into forward-looking risk scores.
 */
export const getRiskForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { farmId: string; latitude?: number | null; longitude?: number | null }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: farm } = await supabase
      .from("farms")
      .select("id,name,latitude,longitude")
      .eq("id", data.farmId)
      .maybeSingle();

    const latitude = Number(farm?.latitude ?? data.latitude ?? 20.5937);
    const longitude = Number(farm?.longitude ?? data.longitude ?? 78.9629);

    const [current, days, crop, preds, dets, pestDets, traps] = await Promise.all([
      fetchWeather(latitude, longitude).catch(() => null),
      fetchForecastDays(latitude, longitude, 7).catch(() => []),
      supabase
        .from("crop_profiles")
        .select("crop_name,variety,sowing_date,growth_stage")
        .eq("farm_id", data.farmId)
        .maybeSingle()
        .then((r) => r.data),
      supabase
        .from("predictions")
        .select("moisture")
        .eq("farm_id", data.farmId)
        .order("created_at", { ascending: false })
        .limit(30)
        .then((r) => r.data ?? []),
      supabase
        .from("detections")
        .select("severity,created_at")
        .eq("farm_id", data.farmId)
        .neq("label", "Healthy")
        .order("created_at", { ascending: false })
        .limit(20)
        .then((r) => r.data ?? []),
      supabase
        .from("pest_detections")
        .select("infestation_severity")
        .eq("farm_id", data.farmId)
        .order("created_at", { ascending: false })
        .limit(20)
        .then((r) => r.data ?? []),
      supabase
        .from("pest_trap_logs")
        .select("count")
        .eq("farm_id", data.farmId)
        .order("logged_on", { ascending: false })
        .limit(20)
        .then((r) => r.data ?? []),
    ]);

    // Persist the live reading so the weather history builds up over time.
    if (current) {
      await supabase.from("weather_readings").insert({
        user_id: userId,
        farm_id: data.farmId,
        temperature: current.temperature,
        humidity: current.humidity,
        precipitation: current.precipitation,
        wind_speed: current.windSpeed,
        rain_next_24h: current.rainNext24h,
        summary: current.summary,
      });
    }

    const moistures = preds.map((p) => Number(p.moisture)).filter((n) => Number.isFinite(n));
    const soilMoistureAvg = moistures.length
      ? Math.round(moistures.reduce((a, b) => a + b, 0) / moistures.length)
      : null;

    const daysSinceSowing = crop?.sowing_date
      ? Math.max(
          0,
          Math.round((Date.now() - new Date(crop.sowing_date).getTime()) / 86_400_000),
        )
      : null;

    const forecast = forecastRisk({
      days,
      crop: crop
        ? {
            crop_name: crop.crop_name,
            growth_stage: crop.growth_stage,
            daysSinceSowing,
          }
        : null,
      soilMoistureAvg,
      diseaseHistory: dets.map((d) => ({ severity: d.severity, created_at: d.created_at })),
      pestHistory: pestDets.map((p) => ({ infestation_severity: p.infestation_severity })),
      trapCounts: traps.map((t) => Number(t.count) || 0),
    });

    return {
      ...forecast,
      hasCropProfile: Boolean(crop),
      current,
      soilMoistureAvg,
      location: { latitude, longitude },
    };
  });
