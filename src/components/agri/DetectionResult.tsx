import { Leaf, ScanSearch, ShieldAlert, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DetectionResult } from "@/lib/agri/logic";
import { cn } from "@/lib/utils";
import { useAdvisoryI18n } from "@/i18n/advisory";

export function ResultPanel({ result }: { result: DetectionResult }) {
  const { t } = useTranslation("disease");
  const adv = useAdvisoryI18n();
  const bad = result.label === "Diseased";
  const none = result.label === "No Plant";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            "flex items-center gap-2 font-display text-xl font-semibold",
            none ? "text-muted-foreground" : bad ? "text-destructive" : "text-primary",
          )}
        >
          {none ? (
            <ScanSearch className="h-5 w-5" />
          ) : bad ? (
            <ShieldAlert className="h-5 w-5" />
          ) : (
            <Leaf className="h-5 w-5" />
          )}
          {none ? t("noPlantDetected") : adv.label(result.label)}
        </p>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {t("confidence", { value: result.confidence })}
        </span>
      </div>


      {result.disease_name && (
        <p className="font-medium">
          {adv.name(result.disease_name)}{" "}
          <span
            className={cn(
              "ml-1 rounded-full px-2 py-0.5 text-[11px]",
              result.severity === "High"
                ? "bg-destructive text-destructive-foreground"
                : result.severity === "Moderate"
                  ? "bg-warning text-warning-foreground"
                  : "bg-secondary text-secondary-foreground",
            )}
          >
            {t("severitySuffix", { severity: adv.severity(result.severity) })}
          </span>
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        {adv.diseaseDescription(result.disease_name, result.description)}
      </p>
      <p className="flex gap-2 text-sm">
        <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>{adv.diseaseTreatment(result.disease_name, result.treatment)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        {t("textureVariance", { value: result.texture_variance })}
      </p>
    </div>
  );
}

export function ColorBars({ result }: { result: DetectionResult }) {
  const { t } = useTranslation("disease");
  const bars = [
    { label: t("colors.green"), value: result.green_ratio, color: "var(--green-500)" },
    { label: t("colors.brown"), value: result.brown_ratio, color: "oklch(0.52 0.09 55)" },
    { label: t("colors.yellow"), value: result.yellow_ratio, color: "var(--warning)" },
  ];
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t("colorComposition")}</h3>
      {bars.map((b) => (
        <div key={b.label}>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{b.label}</span>
            <span>{(b.value * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${Math.min(100, b.value * 100)}%`, background: b.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
