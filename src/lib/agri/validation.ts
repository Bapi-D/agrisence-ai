/** Client-safe shared types and labels for expert case validation. */
export type CaseKind = "disease" | "pest";

export type ValidationStatus =
  | "confirmed"
  | "corrected"
  | "referred_lab"
  | "referred_specialist";

export type PendingCase = {
  id: string;
  kind: CaseKind;
  aiLabel: string;
  confidence: number;
  severity: string;
  description: string | null;
  createdAt: string;
  farmerId: string;
  farmName: string | null;
  crop: string | null;
  imageUrl: string | null;
  waitingHours: number;
};

export type ValidatedCase = {
  id: string;
  kind: CaseKind;
  status: ValidationStatus;
  aiLabel: string | null;
  expertLabel: string | null;
  notes: string | null;
  createdAt: string;
  responseMinutes: number;
};

export type CoverageStats = {
  farmsMonitored: number;
  casesValidated: number;
  pendingCases: number;
  avgResponseHours: number;
  aiAccuracy: number | null;
};

export const STATUS_LABELS: Record<ValidationStatus, string> = {
  confirmed: "Confirmed by Officer",
  corrected: "Corrected by Officer",
  referred_lab: "Referred to Lab",
  referred_specialist: "Referred to Specialist",
};

