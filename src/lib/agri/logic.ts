/**
 * Pure AgriSense inference logic. Shared by server functions and (for typing)
 * the client. No side effects, no imports — safe everywhere.
 */

export type PredictionResult = {
  moisture: number;
  label: "Water Needed" | "No Water Needed";
  status: "warning" | "ok";
  confidence: number;
  moisture_category: "Dry" | "Moderate" | "Optimal" | "Wet";
  recommendation: string;
};

const THRESHOLD = 55;

export function categorize(moisture: number): PredictionResult["moisture_category"] {
  if (moisture < 30) return "Dry";
  if (moisture < 55) return "Moderate";
  if (moisture <= 75) return "Optimal";
  return "Wet";
}

/** Logistic-regression style threshold model around 55% soil moisture. */
export function predictWater(rawMoisture: number): PredictionResult {
  const moisture = Math.max(0, Math.min(100, Number(rawMoisture)));
  const z = (THRESHOLD - moisture) * 0.13;
  const p = 1 / (1 + Math.exp(-z));
  const needsWater = moisture < THRESHOLD;
  const confidence = Math.round((needsWater ? p : 1 - p) * 1000) / 10;
  const moisture_category = categorize(moisture);

  const recommendation = needsWater
    ? moisture < 30
      ? "Soil is critically dry. Irrigate now with a deep watering cycle and re-check in 6 hours."
      : "Moisture is below the healthy band. Schedule a moderate irrigation cycle within the next few hours."
    : moisture > 85
      ? "Soil is saturated. Hold irrigation and check drainage to avoid root rot."
      : "Moisture is in the optimal band. No irrigation needed — re-check in 12 hours.";

  return {
    moisture,
    label: needsWater ? "Water Needed" : "No Water Needed",
    status: needsWater ? "warning" : "ok",
    confidence,
    moisture_category,
    recommendation,
  };
}

/* ---------------------------------------------------------------- vision */

export type DetectionResult = {
  label: "Healthy" | "Diseased" | "No Plant";
  confidence: number;
  disease_name: string | null;
  description: string;
  treatment: string;
  severity: "None" | "Low" | "Moderate" | "High";
  green_ratio: number;
  brown_ratio: number;
  yellow_ratio: number;
  texture_variance: number;
  /** Fraction of pixels matching human skin tone — used to reject non-plant frames. */
  skin_ratio: number;
};


type Profile = {
  name: string;
  description: string;
  treatment: string;
};

const PROFILES: Record<string, Profile> = {
  "Leaf Blight": {
    name: "Leaf Blight",
    description:
      "Large irregular brown necrotic patches spreading from the leaf margins, typical of bacterial or fungal blight under humid conditions.",
    treatment:
      "Remove and destroy affected leaves, improve airflow between rows, and apply a copper-based fungicide every 7–10 days.",
  },
  "Powdery Mildew": {
    name: "Powdery Mildew",
    description:
      "Pale, low-saturation powdery film across the leaf surface caused by fungal mycelium growth in warm, dry days with humid nights.",
    treatment:
      "Spray a potassium-bicarbonate or sulphur solution in the early morning, reduce canopy density and avoid overhead watering.",
  },
  "Leaf Spot": {
    name: "Leaf Spot",
    description:
      "Small, high-contrast dark brown lesions scattered across the blade — a classic fungal leaf-spot texture signature.",
    treatment:
      "Prune infected foliage, keep leaves dry, and rotate a chlorothalonil or neem-oil treatment on a weekly cycle.",
  },
  "Rust Disease": {
    name: "Rust Disease",
    description:
      "Orange-brown pustules mixed with yellow chlorotic haloes, indicating a rust fungus colonising the underside of the leaf.",
    treatment:
      "Apply a triazole fungicide, clear crop debris around the plant, and avoid nitrogen over-fertilisation.",
  },
  Chlorosis: {
    name: "Chlorosis",
    description:
      "Widespread yellowing with veins still green — nutrient chlorosis, usually iron, magnesium or nitrogen deficiency or waterlogging.",
    treatment:
      "Apply chelated iron or a balanced micronutrient feed, check soil pH (target 6.0–6.8) and correct drainage.",
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
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export type PixelPayload = { width: number; height: number; pixels: number[] };

/**
 * HSV colour-space analysis + Laplacian-style texture variance over a
 * downsampled RGB buffer (the browser-side canvas equivalent of the original
 * OpenCV pipeline).
 */
export function analyzeLeaf(payload: PixelPayload): DetectionResult {
  const { width, height, pixels } = payload;
  const total = width * height;
  if (!total || pixels.length < total * 3) {
    throw new Error("Invalid image data");
  }

  let green = 0;
  let brown = 0;
  let yellow = 0;
  let whitish = 0;
  let counted = 0;
  let skin = 0;
  const gray = new Float64Array(total);

  for (let i = 0; i < total; i++) {
    const r = pixels[i * 3]!;
    const g = pixels[i * 3 + 1]!;
    const b = pixels[i * 3 + 2]!;
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;

    const { h, s, v } = rgbToHsv(r, g, b);
    if (v < 0.12) continue; // ignore near-black background
    counted++;

    // Human skin tone rule (RGB + hue), used to reject faces/hands/bodies.
    if (
      r > 80 &&
      g > 30 &&
      b > 15 &&
      r > g &&
      g > b &&
      r - Math.min(g, b) > 12 &&
      h >= 0 &&
      h <= 50 &&
      s >= 0.1 &&
      s <= 0.68
    ) {
      skin++;
    }

    if (s < 0.18 && v > 0.62) {
      whitish++;
      continue;
    }
    if (s < 0.15) continue;

    // Hue bands mirror the original OpenCV ranges (degrees).
    if (h >= 70 && h <= 170) green++;
    else if (h >= 20 && h < 45) yellow++;
    else if (h >= 8 && h < 20) brown++;
    else if (h >= 45 && h < 70) {
      green += 0.5;
      yellow += 0.5;
    }
  }

  const denom = Math.max(1, counted);
  const green_ratio = round(green / denom);
  const brown_ratio = round(brown / denom);
  const yellow_ratio = round(yellow / denom);
  const white_ratio = whitish / denom;
  const skin_ratio = round(skin / denom);


  // Laplacian variance ≈ blur / lesion texture measure.
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        4 * gray[i]! - gray[i - 1]! - gray[i + 1]! - gray[i - width]! - gray[i + width]!;
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = n ? sum / n : 0;
  const variance = n ? sumSq / n - mean * mean : 0;
  const texture_variance = Math.round(variance * 10) / 10;

  // ---- Plant gate: reject frames that are clearly not foliage (people, walls,
  // hands, furniture). Foliage always carries a meaningful chlorophyll signal;
  // skin-dominated frames are rejected outright.
  const foliage = green_ratio + Math.min(brown_ratio + yellow_ratio, green_ratio);
  const notPlant = green_ratio < 0.18 || (skin_ratio > 0.2 && green_ratio < skin_ratio * 1.4);

  if (notPlant) {
    const confidence = clampConf(60 + Math.min(skin_ratio, 0.6) * 60 + (0.18 - Math.min(green_ratio, 0.18)) * 90);
    return {
      label: "No Plant",
      confidence,
      disease_name: null,
      description:
        skin_ratio > 0.2
          ? "The frame looks like a person or skin tone rather than foliage — no chlorophyll signature was found."
          : "No leaf detected. The frame has too little chlorophyll signal to analyse.",
      treatment:
        "Point the camera at a single leaf, fill most of the frame with it and keep good, even lighting.",
      severity: "None",
      green_ratio,
      brown_ratio,
      yellow_ratio,
      texture_variance,
      skin_ratio,
    };
  }

  const healthy =
    foliage > 0 &&
    green_ratio >= 0.5 &&
    brown_ratio < 0.1 &&
    yellow_ratio < 0.14 &&
    white_ratio < 0.16;

  if (healthy) {
    const confidence = clampConf(55 + green_ratio * 45 - (brown_ratio + yellow_ratio) * 60);
    return {
      label: "Healthy",
      confidence,
      disease_name: null,
      description:
        "Chlorophyll signature is strong and evenly distributed with no significant necrotic or chlorotic pixels.",
      treatment:
        "No action needed. Maintain the current irrigation and feeding schedule and re-scan in 3–5 days.",
      severity: "None",
      green_ratio,
      brown_ratio,
      yellow_ratio,
      texture_variance,
      skin_ratio,
    };
  }


  // Rule-match the ratio signature against the disease profiles.
  const scores: Array<{ key: string; score: number }> = [
    { key: "Leaf Blight", score: brown_ratio * 2.6 + (texture_variance < 120 ? 0.15 : 0) },
    {
      key: "Leaf Spot",
      score: brown_ratio * 1.5 + (texture_variance > 140 ? 0.45 : 0) + (1 - green_ratio) * 0.2,
    },
    { key: "Chlorosis", score: yellow_ratio * 2.4 + (brown_ratio < 0.08 ? 0.2 : 0) },
    { key: "Powdery Mildew", score: white_ratio * 2.8 },
    {
      key: "Rust Disease",
      score: Math.min(brown_ratio, yellow_ratio) * 3.4 + (yellow_ratio > 0.12 && brown_ratio > 0.08 ? 0.3 : 0),
    },
  ];
  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0]!;
  const profile = PROFILES[winner.key]!;

  const damage = brown_ratio + yellow_ratio + white_ratio;
  const severity: DetectionResult["severity"] =
    damage > 0.45 ? "High" : damage > 0.24 ? "Moderate" : "Low";

  const margin = winner.score - (scores[1]?.score ?? 0);
  const confidence = clampConf(58 + winner.score * 40 + margin * 30);

  return {
    label: "Diseased",
    confidence,
    disease_name: profile.name,
    description: profile.description,
    treatment: profile.treatment,
    severity,
    green_ratio,
    brown_ratio,
    yellow_ratio,
    texture_variance,
    skin_ratio,
  };
}

function round(v: number) {
  return Math.round(v * 1000) / 1000;
}

function clampConf(v: number) {
  return Math.round(Math.max(55, Math.min(98.5, v)) * 10) / 10;
}
