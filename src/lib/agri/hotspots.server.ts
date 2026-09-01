import { privacyJitter, type HotspotPoint } from "./hotspots";

/**
 * Server-only aggregation of the regional surveillance feed.
 *
 * Uses the admin client deliberately and narrowly: the map is a cross-farm
 * public-health view, so it must read rows owned by other users. Only farms with
 * `share_surveillance = true` and stored coordinates are included, output is
 * limited to coarse fields (label, crop, severity, date, jittered coordinates),
 * and no user ids, farm names or images are ever returned.
 */
export async function collectHotspots(userId: string, days: number): Promise<HotspotPoint[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - Math.max(1, days) * 86_400_000).toISOString();

  const [farmsRes, cropsRes, diseaseRes, pestRes] = await Promise.all([
    supabaseAdmin.from("farms").select("id,user_id,latitude,longitude,share_surveillance"),
    supabaseAdmin.from("crop_profiles").select("farm_id,crop_name"),
    supabaseAdmin
      .from("detections")
      .select("id,farm_id,user_id,label,severity,created_at")
      .neq("label", "Healthy")
      .gte("created_at", since)
      .limit(1500),
    supabaseAdmin
      .from("pest_detections")
      .select("id,farm_id,user_id,pest_name,infestation_severity,created_at")
      .gte("created_at", since)
      .limit(1500),
  ]);

  type FarmRow = { id: string; user_id: string; latitude: number | null; longitude: number | null; share_surveillance: boolean };
  const farms = new Map<string, FarmRow>();
  for (const f of (farmsRes.data ?? []) as FarmRow[]) farms.set(f.id, f);

  const crops = new Map<string, string>();
  for (const c of cropsRes.data ?? []) {
    if (c.farm_id && c.crop_name) crops.set(c.farm_id, c.crop_name);
  }

  const points: HotspotPoint[] = [];

  const push = (row: {
    id: string;
    farm_id: string | null;
    user_id: string;
    name: string;
    severity: string;
    date: string;
    kind: "disease" | "pest";
  }) => {
    const farm = row.farm_id ? farms.get(row.farm_id) : undefined;
    const own = row.user_id === userId;
    if (!farm || farm.latitude == null || farm.longitude == null) return;
    if (!own && !farm.share_surveillance) return;
    const { dLat, dLng } = privacyJitter(`${farm.id}:${row.id}`);
    points.push({
      id: row.id,
      kind: row.kind,
      name: row.name,
      crop: crops.get(farm.id) ?? "Unknown",
      severity: row.severity,
      date: row.date,
      lat: Number(farm.latitude) + (own ? 0 : dLat),
      lng: Number(farm.longitude) + (own ? 0 : dLng),
      own,
    });
  };

  for (const d of diseaseRes.data ?? []) {
    push({
      id: d.id,
      farm_id: d.farm_id,
      user_id: d.user_id,
      name: d.label,
      severity: String(d.severity ?? "Low"),
      date: d.created_at,
      kind: "disease",
    });
  }

  for (const p of pestRes.data ?? []) {
    push({
      id: p.id,
      farm_id: p.farm_id,
      user_id: p.user_id,
      name: p.pest_name,
      severity: String(p.infestation_severity ?? "Low"),
      date: p.created_at,
      kind: "pest",
    });
  }

  return points.sort((a, b) => (a.date < b.date ? 1 : -1));
}
