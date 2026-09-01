import { lazy, useEffect, useMemo, useState } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, ShieldCheck, Sprout, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { GlassCard } from "@/components/agri/GlassCard";
import { getHotspots } from "@/lib/hotspots.functions";
import {
  HOTSPOT_DAY_RANGES,
  filterHotspots,
  hotspotStats,
  uniqueValues,
  type HotspotFilters,
  type HotspotPoint,
} from "@/lib/agri/hotspots";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdvisoryI18n } from "@/i18n/advisory";

const HotspotMap = lazy(() => import("@/components/agri/HotspotMap"));

export const Route = createFileRoute("/_authenticated/hotspots")({
  head: () => ({
    meta: [
      { title: "Hotspot Map — AgriSense AI" },
      {
        name: "description",
        content:
          "Regional disease and pest surveillance map: see anonymised outbreak reports around your farm, filtered by crop, disease and date.",
      },
      { property: "og:title", content: "Hotspot Map — AgriSense AI" },
      {
        property: "og:description",
        content: "Anonymised regional pest and disease surveillance, filtered by crop and date.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HotspotsPage,
});

function HotspotsPage() {
  const { t } = useTranslation("hotspots");
  const adv = useAdvisoryI18n();
  const { activeFarm, reload } = useFarm();
  const run = useServerFn(getHotspots);
  const [points, setPoints] = useState<HotspotPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [heatmap, setHeatmap] = useState(false);
  const [sharing, setSharing] = useState(true);
  const [filters, setFilters] = useState<HotspotFilters>({
    kind: "all",
    crop: "all",
    name: "all",
    days: 30,
  });

  useEffect(() => {
    setSharing(activeFarm?.share_surveillance ?? true);
  }, [activeFarm]);

  useEffect(() => {
    setLoading(true);
    run({ data: { days: 365 } })
      .then((rows) => setPoints(rows as HotspotPoint[]))
      .catch(() => toast.error(t("errors.loadFeed", { defaultValue: "Could not load the surveillance feed." })))
      .finally(() => setLoading(false));
  }, [run, t]);

  const visible = useMemo(() => filterHotspots(points, filters), [points, filters]);
  const stats = useMemo(() => hotspotStats(visible), [visible]);
  const crops = useMemo(() => uniqueValues(points, "crop"), [points]);
  const names = useMemo(
    () => uniqueValues(filters.kind === "all" ? points : points.filter((p) => p.kind === filters.kind), "name"),
    [points, filters.kind],
  );

  const center = useMemo(() => {
    if (activeFarm?.latitude && activeFarm?.longitude) {
      return { lat: Number(activeFarm.latitude), lng: Number(activeFarm.longitude) };
    }
    const own = points.find((p) => p.own);
    if (own) return { lat: own.lat, lng: own.lng };
    if (points[0]) return { lat: points[0].lat, lng: points[0].lng };
    return { lat: 20.5937, lng: 78.9629 };
  }, [activeFarm, points]);

  async function toggleSharing(next: boolean) {
    if (!activeFarm) return;
    setSharing(next);
    const { error } = await supabase
      .from("farms")
      .update({ share_surveillance: next })
      .eq("id", activeFarm.id);
    if (error) {
      setSharing(!next);
      toast.error(t("errors.updateSharing", { defaultValue: "Could not update sharing." }));
      return;
    }
    await reload();
    toast.success(
      next
        ? t("toasts.sharingOn", { defaultValue: "Sharing anonymised reports regionally." })
        : t("toasts.sharingOff", { defaultValue: "Your farm is no longer shared." }),
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <GlassCard className="animate-rise flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-primary text-primary-foreground">
          <MapPin className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">🗺️ {t("header.title", { defaultValue: "Regional Hotspot Map" })}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("header.subtitle", {
              defaultValue:
                "Anonymised disease and pest reports from farms that opted into surveillance. Locations of other farms are offset by up to ~1.5 km; your own fields show exactly.",
            })}
          </p>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={t("stats.reportsShown", { defaultValue: "📍 Reports shown" })}
          value={`${stats.total}`}
          note={t("stats.lastDays", { defaultValue: "Last {{days}} days", days: filters.days })}
        />
        <Stat
          label={t("stats.severe", { defaultValue: "🚨 Severe" })}
          value={`${stats.severe}`}
          note={t("stats.severeNote", { defaultValue: "High / severe severity" })}
        />
        <Stat
          label={t("stats.cropsAffected", { defaultValue: "🌱 Crops affected" })}
          value={`${stats.crops}`}
          note={t("stats.cropsNote", { defaultValue: "Distinct crops in view" })}
        />
        <Stat
          label={t("stats.topReport", { defaultValue: "🔥 Top report" })}
          value={stats.top[0] ? adv.name(stats.top[0][0]) : "—"}
          note={
            stats.top[0]
              ? t("stats.sightings", { defaultValue: "{{count}} sightings", count: stats.top[0][1] })
              : t("stats.noReportsInRange", { defaultValue: "No reports in range" })
          }
        />
      </div>

      <GlassCard className="animate-rise space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("filters.type", { defaultValue: "Type" })}>
            <Select
              value={filters.kind}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, kind: v as HotspotFilters["kind"], name: "all" }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allReports", { defaultValue: "All reports" })}</SelectItem>
                <SelectItem value="disease">{t("filters.diseaseOnly", { defaultValue: "Disease only" })}</SelectItem>
                <SelectItem value="pest">{t("filters.pestOnly", { defaultValue: "Pest only" })}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("filters.crop", { defaultValue: "Crop" })}>
            <Select value={filters.crop} onValueChange={(v) => setFilters((f) => ({ ...f, crop: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allCrops", { defaultValue: "All crops" })}</SelectItem>
                {crops.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("filters.diseasePest", { defaultValue: "Disease / pest" })}>
            <Select value={filters.name} onValueChange={(v) => setFilters((f) => ({ ...f, name: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all", { defaultValue: "All" })}</SelectItem>
                {names.map((n) => (
                  <SelectItem key={n} value={n}>{adv.name(n)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("filters.dateRange", { defaultValue: "Date range" })}>
            <Select
              value={String(filters.days)}
              onValueChange={(v) => setFilters((f) => ({ ...f, days: Number(v) }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOTSPOT_DAY_RANGES.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d === 365
                      ? t("filters.last12Months", { defaultValue: "Last 12 months" })
                      : t("filters.lastDays", { defaultValue: "Last {{days}} days", days: d })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <Switch id="heatmap" checked={heatmap} onCheckedChange={setHeatmap} />
            <Label htmlFor="heatmap" className="text-sm">{t("controls.heatmapView", { defaultValue: "Heatmap view" })}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="sharing"
              checked={sharing}
              disabled={!activeFarm}
              onCheckedChange={(v) => void toggleSharing(v)}
            />
            <Label htmlFor="sharing" className="text-sm">
              {t("controls.shareReports", { defaultValue: "Share my reports anonymously" })}
            </Label>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
            <Legend color="#3f9c58" label={t("legend.low", { defaultValue: "Low" })} />
            <Legend color="#e0a03a" label={t("legend.moderate", { defaultValue: "Moderate" })} />
            <Legend color="#d3453c" label={t("legend.high", { defaultValue: "High" })} />
          </div>
        </div>

        {loading ? (
          <div className="grid h-[26rem] place-items-center text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("map.loading", { defaultValue: "Loading surveillance feed…" })}
            </span>
          </div>
        ) : (
          <ClientOnly
            fallback={<div className="h-[26rem] rounded-[var(--radius-lg)] bg-secondary/40" />}
          >
            <HotspotMap points={visible} center={center} heatmap={heatmap} />
          </ClientOnly>
        )}

        {!loading && visible.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <TriangleAlert className="h-4 w-4" />{" "}
            {t("map.noReports", {
              defaultValue: "No reports match these filters yet — scan a leaf or log a pest to put your field on the map.",
            })}
          </p>
        )}
      </GlassCard>

      <GlassCard className="animate-rise space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sprout className="h-4 w-4 text-primary" /> {t("mostReported.title", { defaultValue: "Most reported in view" })}
        </h2>
        {stats.top.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {stats.top.map(([name, count]) => (
              <li
                key={name}
                className="flex items-center justify-between rounded-[var(--radius-md)] bg-secondary/50 px-3 py-2 text-sm"
              >
                <span>{adv.name(name)}</span>
                <span className="text-muted-foreground">{count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("mostReported.empty", { defaultValue: "Nothing reported in this range." })}</p>
        )}
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />{" "}
          {t("mostReported.privacyNote", {
            defaultValue: "Shared reports never include your name, farm name or photos — only crop, severity, date and an offset location.",
          })}
        </p>
      </GlassCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <GlassCard hover className="animate-rise">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 truncate text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </GlassCard>
  );
}
