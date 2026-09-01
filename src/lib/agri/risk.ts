/**
 * Pure weather-driven outbreak risk model. No imports, no side effects — safe to
 * run inside a server function or in the browser.
 *
 * Combines short-term forecast weather, crop type/stage, soil-moisture history
 * and local pest/disease history into forward-looking disease + pest risk scores.
 */

export type ForecastDay = {
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
};

export type CropContext = {
  crop_name: string;
  growth_stage: string;
  daysSinceSowing: number | null;
};

export type RiskLevel = "Low" | "Medium" | "High";

export type RiskPoint = {
  date: string;
  diseaseScore: number;
  pestScore: number;
  diseaseLevel: RiskLevel;
  pestLevel: RiskLevel;
};

/**
 * A single explanation line. `code` maps to a translation key
 * (`advisory:risk.factors.<code>`) and `values` are its interpolation values,
 * so explanations render in the farmer's language, not only English.
 */
export type RiskFactor = {
  code: string;
  values?: Record<string, string | number>;
  /** English fallback, also used by non-UI consumers (alerts, exports). */
  text: string;
};

export type RiskCategory = {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  peakDate: string | null;
};


export type RiskForecast = {
  disease: RiskCategory;
  pest: RiskCategory;
  series: RiskPoint[];
  crop: string;
  stage: string;
};

/** Crops with a known fungal-pressure bias (score multiplier, 1 = neutral). */
const CROP_DISEASE_BIAS: Record<string, number> = {
  grape: 1.25,
  onion: 1.2,
  tomato: 1.2,
  potato: 1.2,
  banana: 1.15,
  soybean: 1.1,
  cotton: 1.05,
  wheat: 1.0,
  sugarcane: 0.95,
  sorghum: 0.9,
  jowar: 0.9,
  gram: 0.95,
};

const CROP_PEST_BIAS: Record<string, number> = {
  cotton: 1.3,
  tomato: 1.2,
  soybean: 1.2,
  sugarcane: 1.15,
  onion: 1.05,
  gram: 1.1,
  wheat: 0.95,
  grape: 1.0,
};

/** Stages where tissue is most vulnerable. */
const STAGE_BIAS: Record<string, number> = {
  Seedling: 1.15,
  Vegetative: 1.05,
  Flowering: 1.2,
  "Fruiting / Maturity": 1.1,
  Harvest: 0.85,
};

export function riskLevel(score: number): RiskLevel {
  return score >= 66 ? "High" : score >= 35 ? "Medium" : "Low";
}

function bias(map: Record<string, number>, key: string) {
  const k = key.trim().toLowerCase();
  for (const [name, value] of Object.entries(map)) {
    if (k.includes(name)) return value;
  }
  return 1;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function forecastRisk(input: {
  days: ForecastDay[];
  crop: CropContext | null;
  soilMoistureAvg: number | null;
  diseaseHistory: Array<{ severity?: string | null; created_at?: string }>;
  pestHistory: Array<{ infestation_severity?: string | null }>;
  trapCounts: number[];
}): RiskForecast {
  const crop = input.crop;
  const cropName = crop?.crop_name?.trim() || "your crop";
  const stage = crop?.growth_stage || "Vegetative";

  const diseaseCrop = crop ? bias(CROP_DISEASE_BIAS, crop.crop_name) : 1;
  const pestCrop = crop ? bias(CROP_PEST_BIAS, crop.crop_name) : 1;
  const stageBias = STAGE_BIAS[stage] ?? 1;

  // Historical pressure — recent confirmed cases raise the baseline.
  const diseasePressure = input.diseaseHistory.reduce(
    (acc, d) =>
      acc + (d.severity === "High" ? 8 : d.severity === "Medium" ? 5 : d.severity ? 3 : 2),
    0,
  );
  const pestPressureHist = input.pestHistory.reduce(
    (acc, p) =>
      acc +
      (p.infestation_severity === "High" ? 8 : p.infestation_severity === "Medium" ? 5 : 3),
    0,
  );
  const trapAvg = input.trapCounts.length
    ? input.trapCounts.reduce((a, b) => a + b, 0) / input.trapCounts.length
    : 0;

  const historyDisease = Math.min(22, diseasePressure);
  const historyPest = Math.min(22, pestPressureHist) + Math.min(12, trapAvg * 1.5);

  const wetSoil = input.soilMoistureAvg != null && input.soilMoistureAvg >= 70;
  const drySoil = input.soilMoistureAvg != null && input.soilMoistureAvg <= 35;

  const series: RiskPoint[] = input.days.map((d) => {
    // Fungal/bacterial disease: humidity + rainfall + mild-warm temps.
    let disease = 0;
    disease += Math.max(0, d.humidity - 55) * 0.85; // humid canopy
    disease += Math.min(30, d.rainfall * 3.2); // leaf wetness
    if (d.tempMax >= 22 && d.tempMax <= 32) disease += 12; // fungal optimum
    if (d.tempMax > 37) disease -= 10;
    if (d.tempMin < 10) disease -= 8;
    if (d.windSpeed < 6) disease += 6; // stagnant, humid air
    if (wetSoil) disease += 8;
    disease = disease * diseaseCrop * stageBias + historyDisease;

    // Insect pests: warm, drier, low wind favours build-up.
    let pest = 0;
    if (d.tempMax >= 26 && d.tempMax <= 38) pest += 24;
    if (d.tempMax > 38) pest -= 6;
    pest += Math.max(0, 70 - d.humidity) * 0.4; // dry spells favour sucking pests
    pest -= Math.min(18, d.rainfall * 2.4); // heavy rain knocks populations down
    if (d.windSpeed < 8) pest += 8;
    if (drySoil) pest += 6;
    pest = pest * pestCrop * stageBias + historyPest;

    return {
      date: d.date,
      diseaseScore: clamp(disease),
      pestScore: clamp(pest),
      diseaseLevel: riskLevel(clamp(disease)),
      pestLevel: riskLevel(clamp(pest)),
    };
  });

  const peak = (key: "diseaseScore" | "pestScore") =>
    series.reduce<RiskPoint | null>((best, p) => (!best || p[key] > best[key] ? p : best), null);

  const diseasePeak = peak("diseaseScore");
  const pestPeak = peak("pestScore");

  const avgHumidity = avg(input.days.map((d) => d.humidity));
  const totalRain = input.days.reduce((a, d) => a + d.rainfall, 0);
  const avgTempMax = avg(input.days.map((d) => d.tempMax));
  const avgWind = avg(input.days.map((d) => d.windSpeed));

  const diseaseFactors: RiskFactor[] = [];
  const f = (code: string, text: string, values?: Record<string, string | number>): RiskFactor => ({
    code,
    text,
    ...(values ? { values } : {}),
  });

  if (avgHumidity >= 75)
    diseaseFactors.push(
      f(
        "highHumidity",
        `High humidity (${Math.round(avgHumidity)}%) sustains leaf wetness — classic fungal blight weather`,
        { humidity: Math.round(avgHumidity) },
      ),
    );
  else if (avgHumidity >= 62)
    diseaseFactors.push(
      f("moderateHumidity", `Moderately humid canopy (${Math.round(avgHumidity)}%) over the window`, {
        humidity: Math.round(avgHumidity),
      }),
    );
  if (totalRain >= 15)
    diseaseFactors.push(
      f("heavyRain", `${Math.round(totalRain)} mm rainfall forecast spreads spores by splash`, {
        rain: Math.round(totalRain),
      }),
    );
  else if (totalRain >= 4)
    diseaseFactors.push(
      f("lightRain", `Light rain (${Math.round(totalRain)} mm) keeps foliage damp`, {
        rain: Math.round(totalRain),
      }),
    );
  if (avgTempMax >= 22 && avgTempMax <= 32)
    diseaseFactors.push(
      f("fungalTemp", `Temperatures near ${Math.round(avgTempMax)}°C sit in the fungal optimum`, {
        temp: Math.round(avgTempMax),
      }),
    );
  if (avgWind < 6) diseaseFactors.push(f("lowWind", "Low wind means poor canopy drying"));
  if (wetSoil)
    diseaseFactors.push(
      f("wetSoil", "Soil moisture history is high — waterlogged root zone stress"),
    );
  if (input.diseaseHistory.length)
    diseaseFactors.push(
      f("diseaseHistory", `${input.diseaseHistory.length} recent disease detection(s) on this farm`, {
        count: input.diseaseHistory.length,
      }),
    );
  if (crop)
    diseaseFactors.push(
      f("cropStageSusceptible", `${cropName} at ${stage.toLowerCase()} stage is susceptible right now`, {
        crop: cropName,
        stage,
      }),
    );

  const pestFactors: RiskFactor[] = [];
  if (avgTempMax >= 26 && avgTempMax <= 38)
    pestFactors.push(
      f("warmDays", `Warm days near ${Math.round(avgTempMax)}°C speed up pest life cycles`, {
        temp: Math.round(avgTempMax),
      }),
    );
  if (avgHumidity < 60)
    pestFactors.push(
      f("dryAir", `Drier air (${Math.round(avgHumidity)}%) favours aphids and whitefly build-up`, {
        humidity: Math.round(avgHumidity),
      }),
    );
  if (totalRain < 4) pestFactors.push(f("littleRain", "Little rain to wash off larvae and eggs"));
  if (trapAvg > 0)
    pestFactors.push(
      f("trapCatches", `Trap catches averaging ${Math.round(trapAvg * 10) / 10}/trap`, {
        avg: Math.round(trapAvg * 10) / 10,
      }),
    );
  if (input.pestHistory.length)
    pestFactors.push(
      f("pestHistory", `${input.pestHistory.length} recent pest detection(s) logged nearby`, {
        count: input.pestHistory.length,
      }),
    );
  if (drySoil)
    pestFactors.push(f("drySoil", "Dry soil history — stressed plants attract more pests"));


  return {
    crop: cropName,
    stage,
    series,
    disease: {
      score: diseasePeak?.diseaseScore ?? 0,
      level: riskLevel(diseasePeak?.diseaseScore ?? 0),
      factors: diseaseFactors.slice(0, 4),
      peakDate: diseasePeak?.date ?? null,
    },
    pest: {
      score: pestPeak?.pestScore ?? 0,
      level: riskLevel(pestPeak?.pestScore ?? 0),
      factors: pestFactors.slice(0, 4),
      peakDate: pestPeak?.date ?? null,
    },
  };
}

function avg(list: number[]) {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
}
