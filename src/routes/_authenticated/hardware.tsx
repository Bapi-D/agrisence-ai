import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BatteryCharging,
  Droplets,
  Gauge,
  RadioTower,
  ShieldCheck,
  Sprout,
  Thermometer,
  Waves,
} from "lucide-react";

import { GlassCard } from "@/components/agri/GlassCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/hardware")({
  head: () => ({
    meta: [
      { title: "AgriSense AI Hardware" },
      {
        name: "description",
        content: "Coming soon: the AgriSense AI field monitoring hardware device.",
      },
    ],
  }),
  component: HardwarePage,
});

const FEATURES = [
  { icon: Waves, title: "Water Level Sensor", text: "Monitor available water levels and get a clearer picture of field water conditions." },
  { icon: Droplets, title: "Soil Moisture", text: "Capture moisture readings to support irrigation and crop-health decisions." },
  { icon: Thermometer, title: "Temperature & Humidity", text: "Track local field conditions for better crop monitoring." },
  { icon: Gauge, title: "Field Insights", text: "Bring sensor readings together with the AgriSense AI dashboard." },
  { icon: RadioTower, title: "Connected Monitoring", text: "Designed to send useful field readings to your AgriSense AI account." },
  { icon: BatteryCharging, title: "Farmer Friendly", text: "A compact, affordable device designed for practical day-to-day farm use." },
];

function HardwarePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <GlassCard className="animate-rise overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                Coming Soon
              </span>
              <span className="text-xs text-muted-foreground">AgriSense AI Hardware</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Bring your field into AgriSense AI.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Our planned field-monitoring device will combine water-level, soil and environmental sensors so farmers can understand their fields without checking every measurement manually.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link to="/hardware/coming-soon">
                <Button className="gap-2">
                  Buy Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">Planned launch price: around ₹399</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[2rem] border border-primary/20 bg-primary/[0.06] p-6 shadow-[var(--shadow-glass)]">
              <div className="mx-auto grid aspect-[4/3] max-w-xs place-items-center rounded-2xl border border-border bg-background/80">
                <div className="text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                    <Sprout className="h-8 w-8" />
                  </span>
                  <p className="mt-4 font-semibold">AgriSense AI</p>
                  <p className="mt-1 text-xs text-muted-foreground">Field Monitor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <GlassCard key={feature.title} hover className="animate-rise h-full">
            <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-secondary text-primary">
              <feature.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="animate-rise border-primary/20 bg-primary/[0.04]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">Designed to work with your AgriSense AI dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sensor readings are planned to become another data source for water prediction, crop health, alerts and field insights.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
