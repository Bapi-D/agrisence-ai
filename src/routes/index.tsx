import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Camera, Droplets, Leaf, ScanLine, Sparkles } from "lucide-react";

import { GlassCard, Orbs } from "@/components/agri/GlassCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriSense AI — Smart Farming Dashboard" },
      {
        name: "description",
        content:
          "AgriSense AI predicts irrigation needs, detects leaf disease from photos or live camera, and maps field health in an interactive 3D monitor.",
      },
      { property: "og:title", content: "AgriSense AI — Smart Farming Dashboard" },
      {
        property: "og:description",
        content:
          "Soil-moisture irrigation predictions, AI leaf-disease detection and a 3D farm health monitor in one dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Droplets, emoji: "💧", title: "Water Prediction", text: "Threshold model turns a moisture reading into a clear irrigation verdict with confidence." },
  { icon: ScanLine, emoji: "🔬", title: "Disease Detection", text: "HSV colour + texture analysis of a leaf photo returns disease, severity and treatment." },
  { icon: Camera, emoji: "📷", title: "Live Camera AI", text: "Continuous webcam scanning with a rolling session health score." },
  { icon: Boxes, emoji: "🌿", title: "3D Farm Monitor", text: "Rotate, zoom and click plants in an interactive field grid colour-coded by health." },
];

function Landing() {
  return (
    <div className="relative min-h-screen">
      <Orbs />
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <header className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold">AgriSense AI</span>
          <Link to="/auth" className="ml-auto">
            <Button variant="outline">Sign in</Button>
          </Link>
        </header>

        <section className="mt-16 max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-powered precision agriculture
          </p>
          <h1 className="text-4xl font-semibold leading-[1.1] md:text-6xl">
            Know exactly when to <span className="text-gradient-green">water</span> and what your{" "}
            <span className="text-gradient-green">leaves</span> are telling you.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            AgriSense AI combines soil-moisture modelling, computer-vision leaf diagnostics and a live
            3D field monitor into one calm, glassy dashboard for your farm.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg">Start monitoring</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                I already have an account
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <GlassCard key={f.title} hover className="animate-rise">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-secondary text-secondary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold">
                  {f.emoji} {f.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </GlassCard>
          ))}
        </section>
      </div>
    </div>
  );
}
