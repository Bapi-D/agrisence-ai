import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bug,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  Loader2,
  MapPin,
  PencilLine,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useRole } from "@/hooks/useRole";
import { useFarm } from "@/hooks/useFarm";
import { GlassCard } from "@/components/agri/GlassCard";
import { getOfficerConsole, submitValidation } from "@/lib/validation.functions";
import { getHotspots } from "@/lib/hotspots.functions";
import type { HotspotPoint } from "@/lib/agri/hotspots";
import type {
  CoverageStats,
  PendingCase,
  ValidatedCase,
  ValidationStatus,
} from "@/lib/agri/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAdvisoryI18n } from "@/i18n/advisory";

const HotspotMap = lazy(() => import("@/components/agri/HotspotMap"));

export const Route = createFileRoute("/_authenticated/official")({
  head: () => ({
    meta: [
      { title: "Officer Console — AgriSense AI" },
      {
        name: "description",
        content:
          "Extension officer console: validate AI disease and pest detections, refer cases to a lab or specialist, and track regional surveillance coverage.",
      },
      { property: "og:title", content: "Officer Console — AgriSense AI" },
      {
        property: "og:description",
        content: "Expert validation queue and regional surveillance for agriculture officials.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OfficialPage,
});

function OfficialPage() {
  const { t } = useTranslation("official");
  const adv = useAdvisoryI18n();
  const { isOfficer, loading: roleLoading } = useRole();
  const { activeFarm } = useFarm();
  const load = useServerFn(getOfficerConsole);
  const submit = useServerFn(submitValidation);
  const loadHotspots = useServerFn(getHotspots);

  const [queue, setQueue] = useState<PendingCase[]>([]);
  const [recent, setRecent] = useState<ValidatedCase[]>([]);
  const [stats, setStats] = useState<CoverageStats | null>(null);
  const [points, setPoints] = useState<HotspotPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<"all" | "disease" | "pest">("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await load();
      setQueue(res.queue as PendingCase[]);
      setRecent(res.recent as ValidatedCase[]);
      setStats(res.stats as CoverageStats);
    } catch {
      toast.error(t("errors.loadQueue", { defaultValue: "Could not load the validation queue." }));
    } finally {
      setLoading(false);
    }
  }, [load, t]);

  useEffect(() => {
    if (!isOfficer) return;
    void refresh();
    loadHotspots({ data: { days: 180 } })
      .then((rows) => setPoints(rows as HotspotPoint[]))
      .catch(() => undefined);
  }, [isOfficer, refresh, loadHotspots]);

  const visible = useMemo(
    () => (kindFilter === "all" ? queue : queue.filter((c) => c.kind === kindFilter)),
    [queue, kindFilter],
  );

  const center = useMemo(() => {
    if (activeFarm?.latitude && activeFarm?.longitude) {
      return { lat: Number(activeFarm.latitude), lng: Number(activeFarm.longitude) };
    }
    if (points[0]) return { lat: points[0].lat, lng: points[0].lng };
    return { lat: 20.5937, lng: 78.9629 };
  }, [activeFarm, points]);

  async function decide(
    c: PendingCase,
    status: ValidationStatus,
    expertLabel: string | null,
    notes: string | null,
  ) {
    try {
      await submit({
        data: { kind: c.kind, detectionId: c.id, status, expertLabel, notes },
      });
      toast.success(
        t("toasts.decided", {
          defaultValue: "Case {{status}} — the farmer has been notified.",
          status: adv.status(status).toLowerCase(),
        }),
      );
      await refresh();
    } catch {
      toast.error(t("errors.saveDecision", { defaultValue: "Could not save that decision." }));
    }
  }

  if (roleLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOfficer) {
    return (
      <div className="mx-auto max-w-2xl">
        <GlassCard className="animate-rise text-center">
          <ShieldCheck className="mx-auto mb-3 h-9 w-9 text-primary" />
          <h1 className="text-xl font-semibold">{t("restricted.title", { defaultValue: "Officer console" })}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("restricted.body", {
              defaultValue:
                "This area is reserved for extension officers and agriculture officials. Your account is registered as a farmer, so validation tools are hidden.",
            })}
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <GlassCard className="animate-rise flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-primary text-primary-foreground">
          <ClipboardCheck className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">🧑‍🌾 {t("header.title", { defaultValue: "Extension Officer Console" })}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("header.subtitle", {
              defaultValue:
                "Review AI detections from monitored farms, confirm or correct diagnoses, and refer difficult cases onward.",
            })}
          </p>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Users}
          label={t("stats.farmsMonitored", { defaultValue: "Farms monitored" })}
          value={`${stats?.farmsMonitored ?? 0}`}
          note={t("stats.registeredFields", { defaultValue: "Registered fields" })}
        />
        <Stat
          icon={CheckCircle2}
          label={t("stats.casesValidated", { defaultValue: "Cases validated" })}
          value={`${stats?.casesValidated ?? 0}`}
          note={t("stats.awaitingReview", { defaultValue: "{{count}} awaiting review", count: stats?.pendingCases ?? 0 })}
        />
        <Stat
          icon={Timer}
          label={t("stats.avgResponse", { defaultValue: "Avg response" })}
          value={stats ? t("stats.hoursValue", { defaultValue: "{{hours}} h", hours: stats.avgResponseHours }) : "—"}
          note={t("stats.detectionToDecision", { defaultValue: "Detection → decision" })}
        />
        <Stat
          icon={ShieldCheck}
          label={t("stats.aiAccuracy", { defaultValue: "AI accuracy" })}
          value={stats?.aiAccuracy != null ? `${stats.aiAccuracy}%` : "—"}
          note={t("stats.expertConfirmedShare", { defaultValue: "Expert-confirmed share" })}
        />
      </div>

      <GlassCard className="animate-rise space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">{t("surveillance.title", { defaultValue: "Regional surveillance" })}</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {t("surveillance.sharedReports", { defaultValue: "{{count}} shared reports · last 180 days", count: points.length })}
          </span>
        </div>
        <div className="h-[22rem] overflow-hidden rounded-[var(--radius-lg)]">
          <ClientOnly fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">{t("surveillance.loadingMap", { defaultValue: "Loading map…" })}</div>}>
            <HotspotMap points={points} center={center} heatmap={false} />
          </ClientOnly>
        </div>
      </GlassCard>

      <GlassCard className="animate-rise space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <h2 className="mr-auto text-base font-semibold">{t("queue.title", { defaultValue: "Validation queue" })}</h2>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("queue.caseType", { defaultValue: "Case type" })}</Label>
            <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as typeof kindFilter)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("queue.allCases", { defaultValue: "All cases" })}</SelectItem>
                <SelectItem value="disease">{t("queue.disease", { defaultValue: "Disease" })}</SelectItem>
                <SelectItem value="pest">{t("queue.pest", { defaultValue: "Pest" })}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("queue.refresh", { defaultValue: "Refresh" })}
          </Button>
        </div>

        {loading && queue.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("queue.loadingCases", { defaultValue: "Loading cases…" })}</p>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t("queue.empty", { defaultValue: "No cases waiting for review 🌱" })}
          </p>
        ) : (
          <div className="space-y-4">
            {visible.map((c) => (
              <CaseCard key={`${c.kind}:${c.id}`} c={c} onDecide={decide} />
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="animate-rise">
        <h2 className="mb-4 text-base font-semibold">{t("recent.title", { defaultValue: "Recently reviewed" })}</h2>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("recent.empty", { defaultValue: "No validations yet." })}</p>
        ) : (
          <ul className="divide-y divide-border/60 text-sm">
            {recent.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="font-medium">
                  {v.expertLabel
                    ? adv.name(v.expertLabel)
                    : v.aiLabel
                      ? adv.name(v.aiLabel)
                      : t("recent.case", { defaultValue: "Case" })}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                  {adv.status(v.status)}
                </span>
                <span className="text-xs text-muted-foreground">{v.kind}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {Math.round(v.responseMinutes / 6) / 10} h · {new Date(v.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function CaseCard({
  c,
  onDecide,
}: {
  c: PendingCase;
  onDecide: (
    c: PendingCase,
    status: ValidationStatus,
    expertLabel: string | null,
    notes: string | null,
  ) => Promise<void>;
}) {
  const { t } = useTranslation("official");
  const adv = useAdvisoryI18n();
  const [expertLabel, setExpertLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<ValidationStatus | null>(null);

  async function run(status: ValidationStatus) {
    if (status === "corrected" && !expertLabel.trim()) {
      toast.error(t("caseCard.enterDiagnosis", { defaultValue: "Enter your diagnosis to correct this case." }));
      return;
    }
    setBusy(status);
    await onDecide(c, status, expertLabel.trim() || null, notes.trim() || null);
    setBusy(null);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border/70 p-4">
      <div className="grid gap-4 md:grid-cols-[13rem_1fr]">
        <div className="overflow-hidden rounded-[var(--radius-md)] bg-secondary">
          {c.imageUrl ? (
            <img
              src={c.imageUrl}
              alt={`${c.kind} case: ${c.aiLabel}`}
              className="h-40 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-40 place-items-center text-xs text-muted-foreground">
              {t("caseCard.noPhoto", { defaultValue: "No photo uploaded" })}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full",
                c.kind === "pest" ? "bg-amber-500/15 text-amber-600" : "bg-destructive/15 text-destructive",
              )}
            >
              {c.kind === "pest" ? <Bug className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" />}
            </span>
            <span className="font-semibold">{adv.name(c.aiLabel)}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
              {t("caseCard.aiConfidenceSeverity", {
                defaultValue: "AI {{confidence}}% · {{severity}}",
                confidence: Math.round(c.confidence),
                severity: adv.severity(c.severity),
              })}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {t("caseCard.waitingHours", { defaultValue: "Waiting {{hours}} h · {{date}}", hours: c.waitingHours, date: new Date(c.createdAt).toLocaleDateString() })}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            {c.farmName ?? t("caseCard.unnamedField", { defaultValue: "Unnamed field" })}
            {c.crop ? ` · ${c.crop}` : ""}
            {c.description ? ` · ${adv.text(c.description)}` : ""}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("caseCard.yourDiagnosis", { defaultValue: "Your diagnosis (for corrections)" })}</Label>
              <Input
                placeholder={t("caseCard.diagnosisPlaceholder", { defaultValue: "e.g. Bacterial leaf blight" })}
                value={expertLabel}
                onChange={(e) => setExpertLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("caseCard.notesForFarmer", { defaultValue: "Notes for the farmer" })}</Label>
              <Textarea
                rows={1}
                placeholder={t("caseCard.notesPlaceholder", { defaultValue: "Advice, referral reason, follow-up…" })}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy !== null} onClick={() => void run("confirmed")}>
              {busy === "confirmed" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {t("caseCard.confirm", { defaultValue: "Confirm" })}
            </Button>
            <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void run("corrected")}>
              <PencilLine className="mr-2 h-4 w-4" />
              {t("caseCard.correct", { defaultValue: "Correct" })}
            </Button>
            <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void run("referred_lab")}>
              <FlaskConical className="mr-2 h-4 w-4" />
              {t("caseCard.referToLab", { defaultValue: "Refer to lab" })}
            </Button>
            <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void run("referred_specialist")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {t("caseCard.referToSpecialist", { defaultValue: "Refer to specialist" })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <GlassCard className="animate-rise">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </GlassCard>
  );
}
