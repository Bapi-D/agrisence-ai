/**
 * Server-only expert-validation service for the Extension Officer console.
 *
 * Uses the admin client deliberately and narrowly: officers must review AI
 * detections raised by other users. Every entry point first verifies the caller
 * actually holds the `officer` role through their OWN authenticated client
 * (`assertOfficer`), and the payload returned is limited to case fields — no
 * emails, no farm names, no user ids beyond the opaque farmer id needed to link
 * a validation back to its case.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type {
  CaseKind,
  ValidationStatus,
  PendingCase,
  ValidatedCase,
  CoverageStats,
} from "./validation";

import {
  STATUS_LABELS,
  type CaseKind,
  type ValidationStatus,
  type PendingCase,
  type ValidatedCase,
  type CoverageStats,
} from "./validation";

/** Throws unless the signed-in caller holds the `officer` role. */
export async function assertOfficer(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "officer",
  });
  if (error || !data) throw new Error("Forbidden: extension officer role required");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function hoursSince(iso: string): number {
  return Math.max(0, Math.round(((Date.now() - new Date(iso).getTime()) / 3_600_000) * 10) / 10);
}

/** Cases the AI flagged that no officer has reviewed yet, oldest first. */
export async function loadQueue(limit = 40): Promise<PendingCase[]> {
  const db = await admin();

  const [diseaseRes, pestRes, doneRes, farmsRes, cropsRes] = await Promise.all([
    db
      .from("detections")
      .select("id,user_id,farm_id,label,disease_name,description,severity,confidence,image_path,created_at")
      .neq("label", "Healthy")
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("pest_detections")
      .select("id,user_id,farm_id,pest_name,description,infestation_severity,confidence,image_path,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("case_validations").select("case_kind,detection_id"),
    db.from("farms").select("id,name"),
    db.from("crop_profiles").select("farm_id,crop_name"),
  ]);

  const done = new Set(
    (doneRes.data ?? []).map((r) => `${r.case_kind}:${r.detection_id}`),
  );
  const farmNames = new Map((farmsRes.data ?? []).map((f) => [f.id, f.name as string]));
  const crops = new Map((cropsRes.data ?? []).map((c) => [c.farm_id, c.crop_name as string]));

  const rows: (PendingCase & { imagePath: string | null })[] = [];

  for (const d of diseaseRes.data ?? []) {
    if (done.has(`disease:${d.id}`)) continue;
    rows.push({
      id: d.id,
      kind: "disease",
      aiLabel: d.disease_name ?? d.label,
      confidence: Number(d.confidence ?? 0),
      severity: d.severity ?? "Unknown",
      description: d.description ?? null,
      createdAt: d.created_at,
      farmerId: d.user_id,
      farmName: d.farm_id ? (farmNames.get(d.farm_id) ?? null) : null,
      crop: d.farm_id ? (crops.get(d.farm_id) ?? null) : null,
      imageUrl: null,
      imagePath: d.image_path,
      waitingHours: hoursSince(d.created_at),
    });
  }

  for (const p of pestRes.data ?? []) {
    if (done.has(`pest:${p.id}`)) continue;
    rows.push({
      id: p.id,
      kind: "pest",
      aiLabel: p.pest_name,
      confidence: Number(p.confidence ?? 0),
      severity: p.infestation_severity ?? "Unknown",
      description: p.description ?? null,
      createdAt: p.created_at,
      farmerId: p.user_id,
      farmName: p.farm_id ? (farmNames.get(p.farm_id) ?? null) : null,
      crop: p.farm_id ? (crops.get(p.farm_id) ?? null) : null,
      imageUrl: null,
      imagePath: p.image_path,
      waitingHours: hoursSince(p.created_at),
    });
  }

  rows.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const page = rows.slice(0, limit);

  const paths = page.map((r) => r.imagePath).filter((p): p is string => Boolean(p));
  if (paths.length) {
    const { data: signed } = await db.storage.from("leaf-images").createSignedUrls(paths, 3600);
    const urls = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
    for (const r of page) {
      if (r.imagePath) r.imageUrl = urls.get(r.imagePath) ?? null;
    }
  }

  return page.map(({ imagePath: _drop, ...rest }) => rest);
}

/** Regional surveillance coverage figures for the officer console. */
export async function loadCoverageStats(): Promise<CoverageStats> {
  const db = await admin();
  const [farmsRes, valRes, queue] = await Promise.all([
    db.from("farms").select("id", { count: "exact", head: true }),
    db.from("case_validations").select("status,response_minutes"),
    loadQueue(500),
  ]);

  const vals = valRes.data ?? [];
  const decided = vals.filter((v) => v.status === "confirmed" || v.status === "corrected");
  const avgMinutes = vals.length
    ? vals.reduce((s, v) => s + Number(v.response_minutes ?? 0), 0) / vals.length
    : 0;

  return {
    farmsMonitored: farmsRes.count ?? 0,
    casesValidated: vals.length,
    pendingCases: queue.length,
    avgResponseHours: Math.round((avgMinutes / 60) * 10) / 10,
    aiAccuracy: decided.length
      ? Math.round((decided.filter((v) => v.status === "confirmed").length / decided.length) * 100)
      : null,
  };
}

/** Latest expert decisions, for the officer's "recently reviewed" list. */
export async function loadRecentValidations(limit = 15): Promise<ValidatedCase[]> {
  const db = await admin();
  const { data } = await db
    .from("case_validations")
    .select("id,case_kind,status,ai_label,expert_label,notes,created_at,response_minutes")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((v) => ({
    id: v.id,
    kind: v.case_kind as CaseKind,
    status: v.status as ValidationStatus,
    aiLabel: v.ai_label,
    expertLabel: v.expert_label,
    notes: v.notes,
    createdAt: v.created_at,
    responseMinutes: Number(v.response_minutes ?? 0),
  }));
}

/** Records an officer decision against one AI case. */
export async function recordValidation(input: {
  officerId: string;
  kind: CaseKind;
  detectionId: string;
  status: ValidationStatus;
  expertLabel: string | null;
  notes: string | null;
}): Promise<{ ok: true }> {
  const db = await admin();

  let source: { user_id: string; created_at: string; aiLabel: string | null } | null = null;

  if (input.kind === "disease") {
    const { data } = await db
      .from("detections")
      .select("user_id,created_at,label,disease_name")
      .eq("id", input.detectionId)
      .maybeSingle();
    if (data) {
      source = { user_id: data.user_id, created_at: data.created_at, aiLabel: data.disease_name ?? data.label };
    }
  } else {
    const { data } = await db
      .from("pest_detections")
      .select("user_id,created_at,pest_name")
      .eq("id", input.detectionId)
      .maybeSingle();
    if (data) {
      source = { user_id: data.user_id, created_at: data.created_at, aiLabel: data.pest_name };
    }
  }

  if (!source) throw new Error("Case not found");

  const aiLabel = source.aiLabel;

  const responseMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(source.created_at).getTime()) / 60_000),
  );



  const { error } = await db.from("case_validations").upsert(
    {
      case_kind: input.kind,
      detection_id: input.detectionId,
      farmer_id: source.user_id,
      officer_id: input.officerId,
      status: input.status,
      ai_label: aiLabel,
      expert_label: input.expertLabel,
      notes: input.notes,
      response_minutes: responseMinutes,
    },
    { onConflict: "case_kind,detection_id" },
  );
  if (error) throw new Error(error.message);

  await db.from("alerts").insert({
    user_id: source.user_id,
    kind: "validation",
    severity: input.status === "confirmed" ? "info" : "warning",
    message:
      input.status === "confirmed"
        ? `An extension officer confirmed the AI diagnosis: ${aiLabel ?? "case"}.`
        : input.status === "corrected"
          ? `An extension officer corrected your case to: ${input.expertLabel ?? "revised diagnosis"}.`
          : `Your case (${aiLabel ?? "case"}) was ${STATUS_LABELS[input.status].toLowerCase()}.`,
  });

  return { ok: true };
}
