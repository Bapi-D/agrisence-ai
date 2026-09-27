/**
 * Pure helpers for the regional surveillance hotspot map. No imports, no side
 * effects — safe on the server and in the browser.
 */

export type HotspotKind = "disease" | "pest";

export type HotspotPoint = {
  id: string;
  kind: HotspotKind;
  name: string;
  crop: string;
  severity: string;
  date: string;
  lat: number;
  lng: number;
  own: boolean;
};

export type HotspotFilters = {
  kind: "all" | HotspotKind;
  crop: string;
  name: string;
  days: number;
};

export const HOTSPOT_DAY_RANGES = [7, 30, 90, 365] as const;

const SEVERITY_WEIGHT: Record<string, number> = {
  low: 1,
  mild: 1,
  moderate: 2,
  medium: 2,
  high: 3,
  severe: 3,
  critical: 4,
};

export function severityWeight(severity: string): number {
  return SEVERITY_WEIGHT[String(severity).toLowerCase()] ?? 1;
}

/** Colour token per severity weight — mirrors the risk palette. */
export function severityColor(severity: string): string {
  const w = severityWeight(severity);
  if (w >= 3) return "#d3453c";
  if (w === 2) return "#e0a03a";
  return "#3f9c58";
}

/**
 * Deterministic ±~1.5 km jitter so a shared farm's exact coordinates are never
 * published, while repeat reports still cluster in the same spot.
 */
export function privacyJitter(seed: string): { dLat: number; dLng: number } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const a = ((h >>> 0) % 10000) / 10000;
  const b = ((Math.imul(h, 48271) >>> 0) % 10000) / 10000;
  return { dLat: (a - 0.5) * 0.03, dLng: (b - 0.5) * 0.03 };
}

export function filterHotspots(points: HotspotPoint[], f: HotspotFilters): HotspotPoint[] {
  const cutoff = Date.now() - f.days * 86_400_000;
  return points.filter((p) => {
    if (f.kind !== "all" && p.kind !== f.kind) return false;
    if (f.crop !== "all" && p.crop !== f.crop) return false;
    if (f.name !== "all" && p.name !== f.name) return false;
    return new Date(p.date).getTime() >= cutoff;
  });
}

export function hotspotStats(points: HotspotPoint[]) {
  const severe = points.filter((p) => severityWeight(p.severity) >= 3).length;
  const crops = new Set(points.map((p) => p.crop).filter((c) => c && c !== "Unknown"));
  const names = new Map<string, number>();
  for (const p of points) names.set(p.name, (names.get(p.name) ?? 0) + 1);
  const top = [...names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  return { total: points.length, severe, crops: crops.size, top };
}

export function uniqueValues(points: HotspotPoint[], key: "crop" | "name"): string[] {
  return [...new Set(points.map((p) => p[key]).filter(Boolean))].sort();
}
