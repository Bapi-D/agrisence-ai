import { supabase } from "@/integrations/supabase/client";

export type CaseStatus =
  | "pending"
  | "confirmed"
  | "corrected"
  | "referred_lab"
  | "referred_specialist";

export type CaseStatusInfo = {
  status: CaseStatus;
  expertLabel: string | null;
  notes: string | null;
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  pending: "Pending Review",
  confirmed: "Confirmed by Officer",
  corrected: "Corrected by Officer",
  referred_lab: "Referred to Lab",
  referred_specialist: "Referred to Specialist",
};

export const CASE_STATUS_CLASS: Record<CaseStatus, string> = {
  pending: "bg-secondary text-secondary-foreground",
  confirmed: "bg-primary/15 text-primary",
  corrected: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  referred_lab: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  referred_specialist: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

/**
 * Expert-review status for the farmer's own cases, keyed by detection id.
 * RLS limits `case_validations` reads to rows where the caller is the farmer.
 */
export async function fetchCaseStatuses(
  kind: "disease" | "pest",
  ids: string[],
): Promise<Record<string, CaseStatusInfo>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("case_validations")
    .select("detection_id,status,expert_label,notes")
    .eq("case_kind", kind)
    .in("detection_id", ids);

  const map: Record<string, CaseStatusInfo> = {};
  for (const row of data ?? []) {
    map[row.detection_id] = {
      status: row.status as CaseStatus,
      expertLabel: row.expert_label,
      notes: row.notes,
    };
  }
  return map;
}
