import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImageUp, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { detectDisease } from "@/lib/agri.functions";
import type { DetectionResult } from "@/lib/agri/logic";
import { loadImageFromFile, sampleImage } from "@/lib/agri/image";
import { raiseAlert } from "@/lib/agri/alerts";
import { GlassCard } from "@/components/agri/GlassCard";
import {
  CASE_STATUS_CLASS,
  fetchCaseStatuses,
  type CaseStatusInfo,
} from "@/lib/agri/case-status";
import { ColorBars, ResultPanel } from "@/components/agri/DetectionResult";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdvisoryI18n } from "@/i18n/advisory";

export const Route = createFileRoute("/_authenticated/disease")({
  head: () => ({
    meta: [
      { title: "Disease Detection — AgriSense AI" },
      {
        name: "description",
        content:
          "Upload a leaf photo and get a health verdict, disease name, severity, treatment advice and leaf colour ratios.",
      },
      { property: "og:title", content: "Disease Detection — AgriSense AI" },
      { property: "og:description", content: "AI leaf-disease diagnosis from a single photo." },
    ],
  }),
  component: DiseasePage,
});

type Row = {
  id: string;
  label: string;
  disease_name: string | null;
  confidence: number;
  severity: string | null;
  created_at: string;
};

function DiseasePage() {
  const { t } = useTranslation("disease");
  const adv = useAdvisoryI18n();
  const detect = useServerFn(detectDisease);
  const { activeFarm } = useFarm();
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [statuses, setStatuses] = useState<Record<string, CaseStatusInfo>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const loadRows = useCallback(async () => {
    if (!activeFarm) return;
    const { data } = await supabase
      .from("detections")
      .select("id,label,disease_name,confidence,severity,created_at")
      .eq("farm_id", activeFarm.id)
      .eq("source", "upload")
      .order("created_at", { ascending: false })
      .limit(10);
    setRows((data ?? []) as Row[]);
    setStatuses(await fetchCaseStatuses("disease", (data ?? []).map((d) => d.id)));
  }, [activeFarm]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(t("toast.invalidFile"));
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const img = await loadImageFromFile(file);
      setPreview(img.src && file ? URL.createObjectURL(file) : null);
      const payload = sampleImage(img);
      const res = await detect({ data: payload });
      setResult(res);

      if (res.label === "No Plant") {
        toast.warning(t("toast.noLeafDetected"));
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      let imagePath: string | null = null;
      if (auth.user) {
        const path = `${auth.user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("leaf-images").upload(path, file, {
          upsert: false,
          contentType: file.type,
        });
        if (!error) imagePath = path;

        await supabase.from("detections").insert({
          user_id: auth.user.id,
          farm_id: activeFarm?.id ?? null,
          label: res.label,
          confidence: res.confidence,
          disease_name: res.disease_name,
          description: res.description,
          treatment: res.treatment,
          severity: res.severity,
          green_ratio: res.green_ratio,
          brown_ratio: res.brown_ratio,
          yellow_ratio: res.yellow_ratio,
          image_path: imagePath,
          source: "upload",
        });
        await loadRows();
      }

      if (res.label === "Diseased") {
        await raiseAlert({
          farmId: activeFarm?.id ?? null,
          kind: "disease",
          message: t("toast.diseaseAlert", {
            disease: adv.name(res.disease_name),
            severity: adv.severity(res.severity),
            confidence: res.confidence,
          }),
          severity: res.severity === "High" ? "critical" : "warning",
        });
      } else {
        toast.success(t("toast.healthySuccess", { confidence: res.confidence }));
      }

    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.detectionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="animate-rise">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
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
                alt={t("dropzone.previewAlt")}
                className="max-h-64 rounded-[var(--radius-md)] object-contain"
              />
            ) : (
              <div className="space-y-2 text-muted-foreground">
                <ImageUp className="mx-auto h-9 w-9 text-primary" />
                <p className="text-sm font-medium text-foreground">{t("dropzone.prompt")}</p>
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
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            variant="outline"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
            {busy ? t("analysing") : t("chooseAnother")}
          </Button>
        </GlassCard>

        <GlassCard className="animate-rise">
          {result ? (
            <div className="space-y-5">
              <ResultPanel result={result} />
              <ColorBars result={result} />
            </div>
          ) : (
            <div className="grid h-full min-h-[18rem] place-items-center text-center text-sm text-muted-foreground">
              {t("resultsPlaceholder")}
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="animate-rise">
        <h2 className="mb-4 text-base font-semibold">{t("recentUploads")}</h2>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("noScans")}</p>
        ) : (
          <ul className="divide-y divide-border/60 text-sm">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span
                  className={cn(
                    "font-medium",
                    r.label === "Healthy" ? "text-primary" : "text-destructive",
                  )}
                >
                  {adv.label(r.label)}
                </span>
                <span className="text-muted-foreground">{r.disease_name ? adv.name(r.disease_name) : "—"}</span>
                <span className="text-muted-foreground">{adv.severity(r.severity)}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px]",
                    CASE_STATUS_CLASS[statuses[r.id]?.status ?? "pending"],
                  )}
                  title={statuses[r.id]?.notes ?? undefined}
                >
                  {adv.status(statuses[r.id]?.status ?? "pending")}
                  {statuses[r.id]?.expertLabel ? ` · ${statuses[r.id]?.expertLabel}` : ""}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {Number(r.confidence)}% · {new Date(r.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
