import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Sprout } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { GlassCard } from "@/components/agri/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdvisoryI18n } from "@/i18n/advisory";

export const Route = createFileRoute("/_authenticated/crop")({
  head: () => ({
    meta: [
      { title: "Crop Profile — AgriSense AI" },
      {
        name: "description",
        content:
          "Set your crop, variety, sowing date and growth stage so AgriSense tunes disease and pest risk forecasts to your field.",
      },
      { property: "og:title", content: "Crop Profile — AgriSense AI" },
      {
        property: "og:description",
        content: "Crop, variety, sowing date and growth stage used by the risk forecast engine.",
      },
    ],
  }),
  component: CropPage,
});

const DEFAULT_CROPS = [
  "Wheat",
  "Cotton",
  "Tomato",
  "Onion",
  "Grape",
  "Soybean",
  "Sugarcane",
  "Potato",
  "Banana",
  "Gram",
  "Sorghum (Jowar)",
];

const VARIETY_SUGGESTIONS: Record<string, string[]> = {
  Wheat: ["HD-2967", "PBW 343", "DBW 187", "HD-3086", "GW 322"],
  Cotton: ["Bt Cotton", "RCH 659", "Bani", "MCU-5"],
  Tomato: ["Pusa Ruby", "Arka Rakshak", "Pusa 120", "Heemsohna"],
  Onion: ["Bhima Super", "Agrifound Dark Red", "N-53"],
  Potato: ["Kufri Jyoti", "Kufri Pukhraj", "Kufri Bahar"],
  Rice: ["Pusa 1121", "IR64", "Swarna", "MTU 1010"],
  Grape: ["Thompson Seedless", "Anab-e-Shahi", "Dilkhush", "Sharad Seedless"],
  Soybean: ["JS 335", "JS 9560", "NRC 37", "MACS 1407"],
  Sugarcane: ["Co 0238", "Co 86032", "Co 0118", "CoLk 94184"],
  Banana: ["Grand Naine (G9)", "Robusta", "Rasthali", "Red Banana"],
  Gram: ["JG 11", "JAKI 9218", "Pusa 372", "DGP 203"],
  "Sorghum (Jowar)": ["CSH 14", "CSH 16", "M35-1 (Maldandi)", "CSV 15"],
};

const STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting / Maturity", "Harvest"];

function CropPage() {
  const { t } = useTranslation("crop");
  const adv = useAdvisoryI18n();
  const { activeFarm } = useFarm();

  const [selectedCropOption, setSelectedCropOption] = useState<string>("Wheat");
  const [customCrop, setCustomCrop] = useState("");
  const [variety, setVariety] = useState("");
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [stage, setStage] = useState("Vegetative");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeFarm) return;
    setLoading(true);
    void supabase
      .from("crop_profiles")
      .select("crop_name,variety,sowing_date,growth_stage")
      .eq("farm_id", activeFarm.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (DEFAULT_CROPS.includes(data.crop_name)) {
            setSelectedCropOption(data.crop_name);
            setCustomCrop("");
          } else {
            setSelectedCropOption("Other");
            setCustomCrop(data.crop_name);
          }
          setVariety(data.variety ?? "");
          setSowingDate(data.sowing_date);
          setStage(data.growth_stage);
        }
        setLoading(false);
      });
  }, [activeFarm]);

  const handleCropChange = (value: string) => {
    setSelectedCropOption(value);
    setVariety(""); // Clears old variety when crop changes
    if (value !== "Other") {
      setCustomCrop("");
    }
  };

  const finalCropName = selectedCropOption === "Other" ? customCrop : selectedCropOption;

  async function save() {
    if (!activeFarm) return;
    if (selectedCropOption === "Other" && !customCrop.trim()) {
      toast.error("Please enter a custom crop name.");
      return;
    }

    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      return;
    }

    const payload = {
      user_id: auth.user.id,
      farm_id: activeFarm.id,
      crop_name: finalCropName.trim(),
      variety: variety.trim() || null,
      sowing_date: sowingDate,
      growth_stage: stage,
    };

    const { error } = await supabase.from("crop_profiles").upsert(payload, { onConflict: "farm_id" });

    setSaving(false);
    if (error) {
      toast.error(t("toast.error"));
    } else {
      toast.success(t("toast.success", { farm: activeFarm.name }));
    }
  }

  const daysSince = Math.max(
    0,
    Math.round((Date.now() - new Date(sowingDate).getTime()) / 86_400_000)
  );

  const suggestedVarieties = VARIETY_SUGGESTIONS[finalCropName] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle", { farm: activeFarm?.name ?? t("yourFarm") })}
        </p>
      </div>

      <GlassCard className="animate-rise max-w-2xl">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Crop Select Dropdown */}
            <div className="space-y-2">
              <Label>{t("fields.crop")}</Label>
              <Select value={selectedCropOption} onValueChange={handleCropChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CROPS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`crops.${c}`, { defaultValue: c })}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">+ Other / Custom Crop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Crop Input Field */}
            {selectedCropOption === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="customCrop">Custom Crop Name</Label>
                <Input
                  id="customCrop"
                  value={customCrop}
                  onChange={(e) => {
                    setCustomCrop(e.target.value);
                    setVariety("");
                  }}
                  placeholder="e.g. Mustard, Maize, Rice..."
                  required
                />
              </div>
            )}

            {/* Variety Input Field & Suggestions */}
            <div className="space-y-2">
              <Label htmlFor="variety">Variety</Label>
              <Input
                id="variety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder={t("fields.varietyPlaceholder", { defaultValue: "e.g. HD-2967" })}
              />
              {suggestedVarieties.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[11px] text-muted-foreground">Suggestions:</span>
                  {suggestedVarieties.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVariety(v)}
                      className="text-[11px] bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sowing Date Input */}
            <div className="space-y-2">
              <Label htmlFor="sowing">{t("fields.sowingDate")}</Label>
              <Input
                id="sowing"
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("fields.daysSinceSowing", { count: daysSince })}
              </p>
            </div>

            {/* Growth Stage Select */}
            <div className="space-y-2">
              <Label>{t("fields.growthStage")}</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {adv.stage(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <div className="sm:col-span-2 pt-2">
              <Button onClick={() => void save()} disabled={saving || !activeFarm}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sprout className="mr-2 h-4 w-4" />
                )}
                {t("save")}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}