import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bug, ImageUp, Loader2, MapPin, ScanLine, ShieldCheck, Sprout } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { detectPest } from "@/lib/agri.functions";
import { PEST_TYPES, type PestResult } from "@/lib/agri/pests";
import { loadImageFromFile, sampleImage } from "@/lib/agri/image";
import { raiseAlert } from "@/lib/agri/alerts";
import { GlassCard } from "@/components/agri/GlassCard";
import { useAdvisoryI18n } from "@/i18n/advisory";
import {
  CASE_STATUS_CLASS,
  fetchCaseStatuses,
  type CaseStatusInfo,
} from "@/lib/agri/case-status";
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

export const Route = createFileRoute("/_authenticated/pests")({
  head: () => ({
    meta: [
      { title: "Pest Detection — AgriSense AI" },
      {
        name: "description",
        content:
          "Identify aphids, stem borer, whitefly, armyworm, locust and bollworm from a photo, log trap counts and track pest pressure per farm.",
      },
      { property: "og:title", content: "Pest Detection — AgriSense AI" },
      {
        property: "og:description",
        content: "Photo-based pest ID, trap-count logging and pest history for your fields.",
      },
    ],
  }),
  component: PestPage,
});

type DetectionRow = {
  id: string;
  pest_name: string;
  confidence: number;
  infestation_severity: string;
  crop_stage: string;
  created_at: string;
};

type TrapRow = {
  id: string;
  trap_type: string;
  pest_type: string;
  count: number;
  location: string | null;
  logged_on: string;
};

const today = () => new Date().toISOString().slice(0, 10);

function PestPage() {
  const { t } = useTranslation("pests");
  const adv = useAdvisoryI18n();
  const identify = useServerFn(detectPest);
  const { activeFarm } = useFarm();
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PestResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [detections, setDetections] = useState<DetectionRow[]>([]);
  const [traps, setTraps] = useState<TrapRow[]>([]);
  const [statuses, setStatuses] = useState<Record<string, CaseStatusInfo>>({});

  const [form, setForm] = useState({
    trap_type: "pheromone",
    pest_type: "Aphids",
    count: "",
    location: "",
    notes: "",
    logged_on: today(),
  });
  const [saving, setSaving] = useState(false);

  const [filterPest, setFilterPest] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    if (!activeFarm) return;
    const [{ data: dets }, { data: logs }] = await Promise.all([
      supabase
        .from("pest_detections")
        .select("id,pest_name,confidence,infestation_severity,crop_stage,created_at")
        .eq("farm_id", activeFarm.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("pest_trap_logs")
        .select("id,trap_type,pest_type,count,location,logged_on")
        .eq("farm_id", activeFarm.id)
        .order("logged_on", { ascending: false })
        .limit(100),
    ]);
    setDetections((dets ?? []) as DetectionRow[]);
    setTraps((logs ?? []) as TrapRow[]);
    setStatuses(await fetchCaseStatuses("pest", (dets ?? []).map((d) => d.id)));
  }, [activeFarm]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(t("toast.chooseImage"));
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const img = await loadImageFromFile(file);
      setPreview(URL.createObjectURL(file));
      const res = await identify({ data: sampleImage(img) });
      setResult(res);

      if (!res.detected) {
        toast.message(
          res.pest_name ? t("toast.noPestIdentified") : t("toast.noPestPressure"),
          { description: adv.pestDescription(res.pest_name, res.description) },
        );
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        let imagePath: string | null = null;
        const path = `${auth.user.id}/pest-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("leaf-images").upload(path, file, {
          upsert: false,
          contentType: file.type,
        });
        if (!error) imagePath = path;

        await supabase.from("pest_detections").insert({
          user_id: auth.user.id,
          farm_id: activeFarm?.id ?? null,
          pest_name: res.pest_name!,
          confidence: res.confidence,
          infestation_severity: res.infestation_severity,
          crop_stage: res.crop_stage,
          ipm_action: res.ipm_action,
          description: res.description,
          damage_ratio: res.damage_ratio,
          texture_variance: res.texture_variance,
          image_path: imagePath,
          source: "upload",
        });
        await load();
      }

      await raiseAlert({
        farmId: activeFarm?.id ?? null,
        kind: "disease",
        message: `${res.pest_name} infestation detected (${res.infestation_severity}, ${res.confidence}% confidence).`,
        severity: res.infestation_severity === "High" ? "critical" : "warning",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.identifyFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function saveTrapLog(e: React.FormEvent) {
    e.preventDefault();
    const count = Number(form.count);
    if (!Number.isFinite(count) || count < 0) {
      toast.error(t("toast.invalidCount"));
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("pest_trap_logs").insert({
        user_id: auth.user.id,
        farm_id: activeFarm?.id ?? null,
        trap_type: form.trap_type,
        pest_type: form.pest_type,
        count,
        location: form.location || null,
        notes: form.notes || null,
        logged_on: form.logged_on,
      });
      if (error) throw error;
      toast.success(t("toast.trapLogged"));
      setForm((f) => ({ ...f, count: "", location: "", notes: "" }));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.saveTrapFailed"));
    } finally {
      setSaving(false);
    }
  }

  const history = useMemo(() => {
    const rows = [
      ...detections.map((d) => ({
        id: d.id,
        kind: "Scan" as const,
        kindLabel: t("history.kind.scan"),
        pest: d.pest_name,
        pestLabel: adv.name(d.pest_name),
        detail: t("history.detail.scan", {
          severity: adv.severity(d.infestation_severity),
          stage: adv.stage(d.crop_stage),
        }),
        value: t("history.value.confidence", { value: Number(d.confidence) }),
        date: d.created_at.slice(0, 10),
        review: statuses[d.id] ?? null,
      })),
      ...traps.map((tr) => ({
        id: tr.id,
        kind: "Trap" as const,
        kindLabel: t("history.kind.trap"),
        pest: tr.pest_type,
        pestLabel: adv.name(tr.pest_type),
        detail: tr.location
          ? t("history.detail.trapWithLocation", {
              trapType: t(`trapForm.trapTypes.${tr.trap_type}`, { defaultValue: tr.trap_type }),
              location: tr.location,
            })
          : t("history.detail.trapNoLocation", {
              trapType: t(`trapForm.trapTypes.${tr.trap_type}`, { defaultValue: tr.trap_type }),
            }),
        value: t("history.value.caught", { count: tr.count }),
        date: tr.logged_on,
        review: null as CaseStatusInfo | null,
      })),
    ];
    return rows
      .filter((r) => (filterPest === "all" ? true : r.pest === filterPest))
      .filter((r) => (from ? r.date >= from : true))
      .filter((r) => (to ? r.date <= to : true))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [detections, traps, statuses, filterPest, from, to, t, adv]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="animate-rise">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="animate-rise">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "grid min-h-[18rem] cursor-pointer place-items-center rounded-[var(--radius-lg)] border-2 border-dashed border-border p-6 text-center transition-all duration-250 hover:border-primary",
              drag && "border-primary bg-secondary/60",
            )}
          >
            {preview ? (
              <img
                src={preview}
                alt={t("dropzone.alt")}
                className="max-h-64 rounded-[var(--radius-md)] object-contain"
              />
            ) : (
              <div className="space-y-2 text-muted-foreground">
                <ImageUp className="mx-auto h-9 w-9 text-primary" />
                <p className="text-sm font-medium text-foreground">{t("dropzone.title")}</p>
                <p className="text-xs">{t("dropzone.hint")}</p>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            className="mt-4 w-full"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ScanLine className="mr-2 h-4 w-4" />
            )}
            {busy ? t("buttons.identifying") : t("buttons.chooseAnother")}
          </Button>
        </GlassCard>

        <GlassCard className="animate-rise">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p
                  className={cn(
                    "flex items-center gap-2 font-display text-xl font-semibold",
                    result.detected ? "text-destructive" : "text-primary",
                  )}
                >
                  {result.detected ? <Bug className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  {adv.name(result.pest_name) || t("result.noPestDetected")}
                </p>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {t("result.confidence", { value: result.confidence })}
                </span>
              </div>

              {result.detected && (
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5",
                      result.infestation_severity === "High"
                        ? "bg-destructive text-destructive-foreground"
                        : result.infestation_severity === "Medium"
                          ? "bg-warning text-warning-foreground"
                          : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {t("result.infestation", { severity: adv.severity(result.infestation_severity) })}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                    <Sprout className="h-3 w-3" /> {t("result.stage", { stage: adv.stage(result.crop_stage) })}
                  </span>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {adv.pestDescription(result.pest_name, result.description)}
              </p>
              <div className="rounded-[var(--radius-md)] bg-secondary/60 p-3 text-sm">
                <p className="mb-1 font-medium">{t("result.ipmTitle")}</p>
                <p className="text-muted-foreground">
                  {adv.pestIpm(result.pest_name, result.ipm_action)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("result.damageSignature", {
                  ratio: (result.damage_ratio * 100).toFixed(1),
                  variance: result.texture_variance,
                })}
              </p>
            </div>
          ) : (
            <div className="grid h-full min-h-[18rem] place-items-center text-center text-sm text-muted-foreground">
              {t("result.placeholder")}
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="animate-rise">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <MapPin className="h-4 w-4 text-primary" /> {t("trapForm.title")}
        </h2>
        <form onSubmit={saveTrapLog} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{t("trapForm.trapType")}</Label>
            <Select
              value={form.trap_type}
              onValueChange={(v) => setForm((f) => ({ ...f, trap_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pheromone">{t("trapForm.trapTypes.pheromone")}</SelectItem>
                <SelectItem value="sticky">{t("trapForm.trapTypes.sticky")}</SelectItem>
                <SelectItem value="light">{t("trapForm.trapTypes.light")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("trapForm.pestType")}</Label>
            <Select
              value={form.pest_type}
              onValueChange={(v) => setForm((f) => ({ ...f, pest_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PEST_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {adv.name(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="count">{t("trapForm.count")}</Label>
            <Input
              id="count"
              type="number"
              min={0}
              placeholder={t("trapForm.countPlaceholder")}
              value={form.count}
              onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logged_on">{t("trapForm.date")}</Label>
            <Input
              id="logged_on"
              type="date"
              value={form.logged_on}
              onChange={(e) => setForm((f) => ({ ...f, logged_on: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">{t("trapForm.location")}</Label>
            <Input
              id="location"
              placeholder={t("trapForm.locationPlaceholder")}
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="notes">{t("trapForm.notes")}</Label>
            <Textarea
              id="notes"
              rows={1}
              placeholder={t("trapForm.notesPlaceholder")}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("buttons.saveTrapLog")}
            </Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="animate-rise">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <h2 className="mr-auto text-base font-semibold">{t("history.title")}</h2>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("history.pestFilter")}</Label>
            <Select value={filterPest} onValueChange={setFilterPest}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("history.allPests")}</SelectItem>
                {PEST_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {adv.name(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("history.from")}</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("history.to")}</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("history.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">{t("history.columns.date")}</th>
                  <th className="py-2 pr-3 font-medium">{t("history.columns.source")}</th>
                  <th className="py-2 pr-3 font-medium">{t("history.columns.pest")}</th>
                  <th className="py-2 pr-3 font-medium">{t("history.columns.detail")}</th>
                  <th className="py-2 pr-3 font-medium">{t("history.columns.value")}</th>
                  <th className="py-2 font-medium">{t("history.columns.expertReview")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {history.map((r) => (
                  <tr key={`${r.kind}-${r.id}`}>
                    <td className="py-2 pr-3 whitespace-nowrap">{r.date}</td>
                    <td className="py-2 pr-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                        {r.kindLabel}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-medium">{r.pestLabel}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.detail}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{r.value}</td>
                    <td className="py-2 whitespace-nowrap">
                      {r.kind === "Scan" ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px]",
                            CASE_STATUS_CLASS[r.review?.status ?? "pending"],
                          )}
                          title={r.review?.notes ?? undefined}
                        >
                          {adv.status(r.review?.status ?? "pending")}
                          {r.review?.expertLabel ? ` · ${adv.name(r.review.expertLabel)}` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
