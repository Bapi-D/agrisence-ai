import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  assertOfficer,
  loadCoverageStats,
  loadQueue,
  loadRecentValidations,
  recordValidation,
  type CaseKind,
  type ValidationStatus,
} from "./agri/validation.server";

/** Officer console payload: pending AI cases, recent decisions and coverage stats. */
export const getOfficerConsole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOfficer(context.supabase, context.userId);
    const [queue, recent, stats] = await Promise.all([
      loadQueue(40),
      loadRecentValidations(15),
      loadCoverageStats(),
    ]);
    return { queue, recent, stats };
  });

/** Records an expert decision (confirm / correct / refer) against one AI case. */
export const submitValidation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      kind: CaseKind;
      detectionId: string;
      status: ValidationStatus;
      expertLabel?: string | null;
      notes?: string | null;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertOfficer(context.supabase, context.userId);
    return recordValidation({
      officerId: context.userId,
      kind: data.kind === "pest" ? "pest" : "disease",
      detectionId: String(data.detectionId),
      status: data.status,
      expertLabel: data.expertLabel?.slice(0, 120) ?? null,
      notes: data.notes?.slice(0, 800) ?? null,
    });
  });
