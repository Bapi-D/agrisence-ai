/**
 * Pure pest-identification logic. Runs the same downsampled RGB buffer used by
 * the disease pipeline through a pest-oriented colour/texture signature model.
 * No side effects, no imports — safe on server and client.
 */

import type { PixelPayload } from "./logic";

export const PEST_TYPES = [
  "Aphids",
  "Stem Borer",
  "Whitefly",
  "Armyworm",
  "Locust",
  "Bollworm",
] as const;

export type PestName = (typeof PEST_TYPES)[number];

export type PestResult = {
  detected: boolean;
  pest_name: PestName | null;
  confidence: number;
  infestation_severity: "Low" | "Medium" | "High";
  crop_stage: "Seedling" | "Vegetative" | "Flowering" | "Fruiting / Maturity";
  ipm_action: string;
  description: string;
  damage_ratio: number;
  texture_variance: number;
  green_ratio: number;
  skin_ratio: number;
};

type PestProfile = {
  description: string;
  ipm_action: string;
  stage: PestResult["crop_stage"];
};

const PROFILES: Record<PestName, PestProfile> = {
  Aphids: {
    description:
      "Dense clusters of small soft-bodied insects on shoots and leaf undersides, with curling leaves and sticky honeydew film.",
    ipm_action:
      "Release ladybird beetles or lacewings, spray neem oil (5 ml/L) or insecticidal soap early morning, and avoid excess nitrogen which drives fresh flush growth.",
    stage: "Vegetative",
  },
  "Stem Borer": {
    description:
      "Bore holes and frass at the stem node with dead-heart shoots — larvae tunnelling inside the stalk disrupt sap flow.",
    ipm_action:
      "Clip and destroy dead hearts, install pheromone traps at 5/acre, release Trichogramma egg parasitoids, and avoid ratooning infested stubble.",
    stage: "Vegetative",
  },
  Whitefly: {
    description:
      "Tiny white winged adults lifting off the canopy when disturbed, with mottled chlorotic patches and sooty mould from honeydew.",
    ipm_action:
      "Hang yellow sticky traps at 10/acre, spray neem or a horticultural oil on leaf undersides, and remove alternate weed hosts around the field bund.",
    stage: "Flowering",
  },
  Armyworm: {
    description:
      "Ragged window-pane feeding and skeletonised leaf blades typical of gregarious armyworm larvae feeding at night.",
    ipm_action:
      "Hand-pick larvae at dusk, apply Bacillus thuringiensis or an NPV bio-pesticide, place poison-bran bait in whorls and keep field borders weed-free.",
    stage: "Vegetative",
  },
  Locust: {
    description:
      "Heavy, coarse defoliation with whole leaf sections removed — a swarm or hopper-band grazing signature.",
    ipm_action:
      "Alert local plant-protection authorities, use metarhizium bio-pesticide on hopper bands, run smoke/noise deterrents and shield nurseries with netting.",
    stage: "Vegetative",
  },
  Bollworm: {
    description:
      "Circular bore holes in buds, squares or fruit with larval excreta at the entry point — classic bollworm/fruit-borer damage.",
    ipm_action:
      "Install pheromone traps at 5/acre for monitoring, release Trichogramma, spray Bt or spinosad at ETL, and remove and destroy damaged squares and bolls.",
    stage: "Fruiting / Maturity",
  },
};

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

const round = (v: number) => Math.round(v * 1000) / 1000;
const clampConf = (v: number) => Math.round(Math.max(55, Math.min(97.5, v)) * 10) / 10;

/** Colour + texture signature model for common field pests. */
export function analyzePest(payload: PixelPayload): PestResult {
  const { width, height, pixels } = payload;
  const total = width * height;
  if (!total || pixels.length < total * 3) throw new Error("Invalid image data");

  let green = 0;
  let brown = 0;
  let yellow = 0;
  let whitish = 0;
  let dark = 0;
  let skin = 0;
  let counted = 0;
  const gray = new Float64Array(total);

  for (let i = 0; i < total; i++) {
    const r = pixels[i * 3]!;
    const g = pixels[i * 3 + 1]!;
    const b = pixels[i * 3 + 2]!;
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    const { h, s, v } = rgbToHsv(r, g, b);
    if (v < 0.1) continue;
    counted++;

    if (
      r > 80 && g > 30 && b > 15 && r > g && g > b &&
      r - Math.min(g, b) > 12 && h >= 0 && h <= 50 && s >= 0.1 && s <= 0.68
    ) {
      skin++;
    }

    if (v < 0.26) {
      dark++;
      continue;
    }
    if (s < 0.18 && v > 0.6) {
      whitish++;
      continue;
    }
    if (s < 0.15) continue;
    if (h >= 70 && h <= 170) green++;
    else if (h >= 20 && h < 45) yellow++;
    else if (h >= 8 && h < 20) brown++;
  }

  const denom = Math.max(1, counted);
  const green_ratio = round(green / denom);
  const brown_ratio = round(brown / denom);
  const yellow_ratio = round(yellow / denom);
  const white_ratio = round(whitish / denom);
  const dark_ratio = round(dark / denom);
  const skin_ratio = round(skin / denom);

  // Laplacian variance — pest bodies, bore holes and chewed edges raise it.
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = 4 * gray[i]! - gray[i - 1]! - gray[i + 1]! - gray[i - width]! - gray[i + width]!;
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = n ? sum / n : 0;
  const texture_variance = Math.round((n ? sumSq / n - mean * mean : 0) * 10) / 10;

  const notPlant = green_ratio < 0.15 || (skin_ratio > 0.2 && green_ratio < skin_ratio * 1.4);
  if (notPlant) {
    return {
      detected: false,
      pest_name: null,
      confidence: clampConf(62 + Math.min(skin_ratio, 0.5) * 60),
      infestation_severity: "Low",
      crop_stage: "Vegetative",
      ipm_action:
        "Point the camera at the affected crop foliage, stem or fruit and fill the frame with it in even light.",
      description:
        skin_ratio > 0.2
          ? "The frame looks like a person rather than a crop — no foliage signal to inspect for pests."
          : "No crop foliage detected in this frame, so no pest assessment could be made.",
      damage_ratio: 0,
      texture_variance,
      green_ratio,
      skin_ratio,
    };
  }

  const damage_ratio = round(Math.min(1, brown_ratio + yellow_ratio * 0.8 + white_ratio * 0.6 + dark_ratio * 0.5));

  const scores: Array<{ key: PestName; score: number }> = [
    { key: "Whitefly", score: white_ratio * 2.9 + (texture_variance > 120 ? 0.2 : 0) },
    { key: "Aphids", score: dark_ratio * 1.9 + white_ratio * 0.8 + (texture_variance > 150 ? 0.35 : 0) },
    { key: "Armyworm", score: yellow_ratio * 1.6 + (texture_variance > 190 ? 0.6 : 0) + dark_ratio * 0.6 },
    { key: "Bollworm", score: dark_ratio * 2.1 + brown_ratio * 1.2 + (texture_variance > 160 ? 0.3 : 0) },
    { key: "Stem Borer", score: brown_ratio * 2.4 + (texture_variance < 110 ? 0.25 : 0) },
    { key: "Locust", score: (1 - green_ratio) * 1.4 + yellow_ratio * 0.9 + (texture_variance > 220 ? 0.4 : 0) },
  ];
  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0]!;
  const profile = PROFILES[winner.key];

  const clean = damage_ratio < 0.12 && texture_variance < 130 && green_ratio > 0.5;
  if (clean) {
    return {
      detected: false,
      pest_name: null,
      confidence: clampConf(60 + green_ratio * 40 - damage_ratio * 80),
      infestation_severity: "Low",
      crop_stage: "Vegetative",
      ipm_action:
        "No treatment needed. Keep pheromone/sticky traps in place and re-scout the block in 3–4 days.",
      description:
        "Canopy looks clean — no clustered insect bodies, bore holes or chewing damage in the colour and texture signature.",
      damage_ratio,
      texture_variance,
      green_ratio,
      skin_ratio,
    };
  }

  const infestation_severity: PestResult["infestation_severity"] =
    damage_ratio > 0.42 ? "High" : damage_ratio > 0.2 ? "Medium" : "Low";

  const margin = winner.score - (scores[1]?.score ?? 0);

  return {
    detected: true,
    pest_name: winner.key,
    confidence: clampConf(60 + winner.score * 38 + margin * 28),
    infestation_severity,
    crop_stage: profile.stage,
    ipm_action: profile.ipm_action,
    description: profile.description,
    damage_ratio,
    texture_variance,
    green_ratio,
    skin_ratio,
  };
}

/** Pest pressure index from recent trap counts + detections. */
export function pestPressure(input: {
  trapCounts: number[];
  detections: Array<{ infestation_severity: string }>;
}) {
  const trapAvg = input.trapCounts.length
    ? input.trapCounts.reduce((a, b) => a + b, 0) / input.trapCounts.length
    : 0;
  const sevScore = input.detections.reduce(
    (acc, d) =>
      acc + (d.infestation_severity === "High" ? 3 : d.infestation_severity === "Medium" ? 2 : 1),
    0,
  );
  const score = Math.min(100, Math.round(trapAvg * 4 + sevScore * 6));
  const level: "Low" | "Moderate" | "High" | "Severe" =
    score >= 75 ? "Severe" : score >= 50 ? "High" : score >= 25 ? "Moderate" : "Low";
  return { score, level, trapAvg: Math.round(trapAvg * 10) / 10 };
}
