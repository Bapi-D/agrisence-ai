import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, CameraOff, Activity } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { detectDisease } from "@/lib/agri.functions";
import type { DetectionResult } from "@/lib/agri/logic";
import { sampleImage } from "@/lib/agri/image";
import { raiseAlert } from "@/lib/agri/alerts";
import { GlassCard } from "@/components/agri/GlassCard";
import { useAdvisoryI18n } from "@/i18n/advisory";
import { ColorBars, ResultPanel } from "@/components/agri/DetectionResult";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({
    meta: [
      { title: "Live Camera AI — AgriSense AI" },
      {
        name: "description",
        content:
          "Scan plants continuously with your webcam and track a live session health score powered by AgriSense leaf analysis.",
      },
      { property: "og:title", content: "Live Camera AI — AgriSense AI" },
      { property: "og:description", content: "Continuous webcam leaf scanning with a session health score." },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { t } = useTranslation("live");
  const adv = useAdvisoryI18n();
  const detect = useServerFn(detectDisease);
  const { activeFarm } = useFarm();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const alertedRef = useRef(false);
  const [on, setOn] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [frames, setFrames] = useState<{ healthy: number; total: number }>({ healthy: 0, total: 0 });

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setOn(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setOn(true);
      setFrames({ healthy: 0, total: 0 });
      alertedRef.current = false;
    } catch {
      toast.error(t("toast.cameraDenied"));
    }
  }

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      void (async () => {
        if (busyRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
        busyRef.current = true;
        try {
          const payload = sampleImage(videoRef.current);
          const res = await detect({ data: { ...payload, source: "live" } });
          setResult(res);

          // Non-plant frames (people, hands, walls) are never scored or stored.
          if (res.label === "No Plant") return;

          setFrames((f) => ({
            healthy: f.healthy + (res.label === "Healthy" ? 1 : 0),
            total: f.total + 1,
          }));


          const { data: auth } = await supabase.auth.getUser();
          if (auth.user) {
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
              source: "live",
            });
          }

          if (res.label === "Diseased" && res.severity === "High" && !alertedRef.current) {
            alertedRef.current = true;
            await raiseAlert({
              farmId: activeFarm?.id ?? null,
              kind: "disease",
              message: t("alert.highSeverity", { disease: adv.name(res.disease_name) }),
              severity: "critical",
            });
          }
        } catch {
          /* keep the session alive on transient failures */
        } finally {
          busyRef.current = false;
        }
      })();
    }, 1800);
    return () => clearInterval(id);
  }, [on, detect, activeFarm]);

  const score = frames.total ? Math.round((frames.healthy / frames.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="animate-rise">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="animate-rise">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-muted">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-video w-full object-cover"
            />
            {on && (
              <>
                <div className="pointer-events-none absolute inset-0">
                  <div
                    className="animate-scanline absolute left-0 h-0.5 w-full"
                    style={{ background: "linear-gradient(90deg,transparent,var(--green-400),transparent)" }}
                  />
                </div>
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> {t("scanning")}
                </span>
              </>
            )}
            {!on && (
              <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                {t("cameraOff")}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            {on ? (
              <Button variant="outline" className="flex-1" onClick={stop}>
                <CameraOff className="mr-2 h-4 w-4" /> {t("buttons.stopSession")}
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => void start()}>
                <Camera className="mr-2 h-4 w-4" /> {t("buttons.startLiveScan")}
              </Button>
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="animate-rise">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-primary" /> {t("score.title")}
              </h2>
              <span className="font-display text-3xl font-semibold text-gradient-green">{score}%</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  score >= 70 ? "bg-primary" : score >= 40 ? "bg-warning" : "bg-destructive",
                )}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("score.summary", { healthy: frames.healthy, total: frames.total })}
            </p>
          </GlassCard>

          <GlassCard className="animate-rise">
            {result ? (
              <div className="space-y-5">
                <ResultPanel result={result} />
                <ColorBars result={result} />
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("placeholder")}
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
