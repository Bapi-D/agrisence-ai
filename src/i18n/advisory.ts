/**
 * Advisory i18n helper.
 *
 * Detection rows in the database store advisory text in English (disease/pest
 * names, descriptions, treatments, water advice, severity labels…). This helper
 * maps those stored English strings back to their `advisory` namespace keys so
 * they render in the farmer's selected language, always falling back to the
 * stored English text when a translation key is missing.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import en from "./locales/en/advisory.json";

type Dict = Record<string, unknown>;

/** Reverse index: English sentence -> dotted key inside the advisory namespace. */
function buildReverseIndex(node: Dict, prefix = "", out: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      if (!(v in out)) out[v] = key;
    } else if (v && typeof v === "object") {
      buildReverseIndex(v as Dict, key, out);
    }
  }
  return out;
}

const REVERSE = buildReverseIndex(en as unknown as Dict);

export function useAdvisoryI18n() {
  const { t } = useTranslation("advisory");

  return useMemo(() => {
    /** Translate `key`, falling back to the stored English value. */
    const tr = (key: string, fallback: string) => t(key, { defaultValue: fallback });

    /** Translate any stored English advisory sentence/label by reverse lookup. */
    const text = (value?: string | null) => {
      if (!value) return value ?? "";
      const key = REVERSE[value];
      return key ? tr(key, value) : value;
    };

    return {
      /** Disease or pest name, e.g. "Leaf Blight" / "Aphids". */
      name: (value?: string | null) => (value ? tr(`names.${value}`, value) : ""),
      /** Detection label: Healthy / Diseased / No Plant / Water Needed… */
      label: (value?: string | null) => (value ? tr(`labels.${value}`, value) : ""),
      severity: (value?: string | null) => (value ? tr(`severity.${value}`, value) : ""),
      moisture: (value?: string | null) => (value ? tr(`moisture.${value}`, value) : ""),
      stage: (value?: string | null) => (value ? tr(`stage.${value}`, value) : ""),
      riskLevel: (value?: string | null) => (value ? tr(`riskLevel.${value}`, value) : ""),
      status: (value?: string | null) => (value ? tr(`status.${value}`, value) : ""),
      /** Disease description stored in DB — prefers the per-disease dictionary entry. */
      diseaseDescription: (diseaseName?: string | null, stored?: string | null) =>
        diseaseName ? tr(`disease.${diseaseName}.description`, stored ?? "") : text(stored),
      diseaseTreatment: (diseaseName?: string | null, stored?: string | null) =>
        diseaseName ? tr(`disease.${diseaseName}.treatment`, stored ?? "") : text(stored),
      pestDescription: (pestName?: string | null, stored?: string | null) =>
        pestName ? tr(`pest.${pestName}.description`, stored ?? "") : text(stored),
      pestIpm: (pestName?: string | null, stored?: string | null) =>
        pestName ? tr(`pest.${pestName}.ipm`, stored ?? "") : text(stored),
      /** Water advice / any other stored advisory sentence. */
      advice: text,
      text,
    };
  }, [t]);
}

export type AdvisoryI18n = ReturnType<typeof useAdvisoryI18n>;
