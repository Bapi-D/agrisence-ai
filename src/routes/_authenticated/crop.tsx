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

const CROPS = [
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

const STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting / Maturity", "Harvest"];

function CropPage() {
  const { t } = useTranslation("crop");
  const adv = useAdvisoryI18n();
  const { activeFarm } = useFarm();
  const [cropName, setCropName] = useState("Wheat");
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
          setCropName(data.crop_name);
          setVariety(data.variety ?? "");
          setSowingDate(data.sowing_date);
          setStage(data.growth_stage);
        }
        setLoading(false);
      });
  }, [activeFarm]);

  async function save() {
    if (!activeFarm) return;
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("crop_profiles").upsert(
      {
        user_id: auth.user.id,
        farm_id: activeFarm.id,
        crop_name: cropName,
        variety: variety || null,
        sowing_date: sowingDate,
        growth_stage: stage,
      },
      { onConflict: "farm_id" },
    );
    setSaving(false);
    if (error) toast.error(t("toast.error"));
    else toast.success(t("toast.success", { farm: activeFarm.name }));
  }

  const daysSince = Math.max(
    0,
    Math.round((Date.now() - new Date(sowingDate).getTime()) / 86_400_000),
  );

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
            <div className="space-y-2">
              <Label>{t("fields.crop")}</Label>
              <Select value={cropName} onValueChange={setCropName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CROPS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`crops.${c}`, { defaultValue: c })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variety">{t("fields.variety")}</Label>
              <Input
                id="variety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder={t("fields.varietyPlaceholder")}
              />
            </div>

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

            <div className="sm:col-span-2">
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
