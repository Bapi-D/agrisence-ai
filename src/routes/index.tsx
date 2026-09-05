import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Boxes,
  BrainCircuit,
  Camera,
  CheckCircle2,
  CloudSun,
  Droplets,
  Leaf,
  MapPin,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
      {
        property: "og:title",
        content: "AgriSense AI — Smart Farming Dashboard",
      },
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
  {
    icon: Droplets,
    emoji: "💧",
    title: "Water Prediction",
    text: "Threshold model turns a moisture reading into a clear irrigation verdict with confidence.",
  },
  {
    icon: ScanLine,
    emoji: "🔬",
    title: "Disease Detection",
    text: "HSV colour + texture analysis of a leaf photo returns disease, severity and treatment.",
  },
  {
    icon: Camera,
    emoji: "📷",
    title: "Live Camera AI",
    text: "Continuous webcam scanning with a rolling session health score.",
  },
  {
    icon: Boxes,
    emoji: "🌿",
    title: "3D Farm Monitor",
    text: "Rotate, zoom and click plants in an interactive field grid colour-coded by health.",
  },
];

const WORKFLOW = [
  {
    number: "01",
    title: "Collect",
    text: "Capture soil, crop and field observations.",
  },
  {
    number: "02",
    title: "Analyze",
    text: "AI processes field and plant information.",
  },
  {
    number: "03",
    title: "Predict",
    text: "Identify irrigation, disease and pest risks.",
  },
  {
    number: "04",
    title: "Act",
    text: "Get clear insights to make better farm decisions.",
  },
];

const CAPABILITIES = [
  "Soil-moisture based irrigation guidance",
  "AI-assisted leaf disease detection",
  "Live camera crop monitoring",
  "Disease and pest risk forecasting",
  "Interactive 3D farm visualization",
  "Field hotspot monitoring",
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Orbs />

      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* HEADER */}
        <header className="flex items-center gap-3">
  {/* Logo */}
  <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-foreground shadow-sm">
    <Leaf className="h-5 w-5" />
  </span>

  <span className="font-display text-lg font-semibold">
    AgriSense AI
  </span>

  {/* Navigation */}
  <nav className="ml-auto hidden items-center gap-6 md:flex">
    <a
      href="#features"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Features
    </a>

    <a
      href="#how-it-works"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      How it works
    </a>

    <a
      href="#capabilities"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Capabilities
    </a>
  </nav>

  {/* Sign in */}
  <Link to="/auth" className="ml-2">
    <Button variant="outline">Sign in</Button>
  </Link>
</header>

        {/* HERO */}
<section className="relative mt-16 md:mt-24">
  <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
    {/* LEFT — HERO CONTENT */}
    <div>
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        AI-powered precision agriculture
      </p>

      <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight md:text-6xl lg:text-7xl">
        Know exactly when to{" "}
        <span className="text-gradient-green">water</span> and what your{" "}
        <span className="text-gradient-green">leaves</span> are telling you.
      </h1>

      <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
        AgriSense AI combines soil-moisture modelling, computer-vision leaf
        diagnostics and intelligent field monitoring into one powerful
        dashboard for your farm.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/auth">
          <Button size="lg" className="gap-2">
            Start monitoring
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <Link to="/auth">
          <Button size="lg" variant="outline">
            I already have an account
          </Button>
        </Link>
      </div>

      {/* TRUST POINTS */}
      <div className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Smart irrigation
        </span>

        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          AI disease detection
        </span>

        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Risk forecasting
        </span>

        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          3D farm monitoring
        </span>
      </div>
    </div>

    {/* RIGHT — FARM INTELLIGENCE PREVIEW */}
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-6 -z-10 rounded-full bg-primary/10 blur-3xl" />

      <GlassCard className="relative overflow-hidden p-4 shadow-xl md:p-5">
        {/* Dashboard header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <BrainCircuit className="h-4 w-4" />
            </span>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                AgriSense Intelligence
              </p>
              <p className="text-sm font-semibold">Farm Command Center</p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-medium">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            AI ACTIVE
          </span>
        </div>

        {/* Field preview */}
        <div className="relative mt-4 h-48 overflow-hidden rounded-xl border border-border/50 bg-secondary/40">
          <div className="absolute left-4 top-4 z-10">
            <p className="text-[10px] font-medium text-muted-foreground">
              FIELD OVERVIEW
            </p>
            <p className="mt-1 text-sm font-semibold">Crop Health Map</p>
          </div>

          {/* Crop rows */}
          <div className="absolute inset-x-5 bottom-5 top-20 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className="relative rounded-md border border-primary/10 bg-primary/10 transition-all duration-300 hover:scale-105"
              >
                <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/60" />
              </div>
            ))}
          </div>

          {/* Map status */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-[10px] backdrop-blur">
            <Activity className="h-3 w-3 text-primary" />
            Field health
            <span className="font-semibold">Healthy</span>
          </div>

          <div className="absolute right-3 top-3 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1.5 text-[10px] text-muted-foreground backdrop-blur">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Live field view
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Moisture */}
          <div className="rounded-xl border border-border/50 bg-background/50 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">Soil moisture</span>
              </div>

              <span className="text-sm font-semibold">62%</span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[62%] rounded-full bg-primary" />
            </div>

            <p className="mt-2 text-[10px] text-muted-foreground">
              Irrigation conditions stable
            </p>
          </div>

          {/* Plant health */}
          <div className="rounded-xl border border-border/50 bg-background/50 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">Plant health</span>
              </div>

              <span className="text-sm font-semibold">87%</span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[87%] rounded-full bg-primary" />
            </div>

            <p className="mt-2 text-[10px] text-muted-foreground">
              Healthy crop signals
            </p>
          </div>
        </div>

        {/* AI insights */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-3">
            <ShieldCheck className="h-4 w-4 text-primary" />

            <div>
              <p className="text-[10px] text-muted-foreground">
                Disease risk
              </p>
              <p className="text-xs font-semibold">Low</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-3">
            <CloudSun className="h-4 w-4 text-primary" />

            <div>
              <p className="text-[10px] text-muted-foreground">
                Field conditions
              </p>
              <p className="text-xs font-semibold">Optimal</p>
            </div>
          </div>
        </div>

        {/* Bottom insight */}
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </span>

          <div>
            <p className="text-xs font-medium">AI insight layer</p>
            <p className="text-[10px] text-muted-foreground">
              Combining field signals into actionable intelligence.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Floating status */}
      <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-2 shadow-lg backdrop-blur sm:flex">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10">
          <Activity className="h-3.5 w-3.5 text-primary" />
        </span>

        <div>
          <p className="text-[9px] text-muted-foreground">
            FIELD STATUS
          </p>
          <p className="text-xs font-semibold">Monitoring active</p>
        </div>
      </div>
    </div>
  </div>
</section>
        {/* EXISTING FEATURES */}
        <section
  id="features"
  className="mt-20 grid gap-4 sm:grid-cols-2"
>
          {FEATURES.map((f) => (
            <GlassCard
  key={f.title}
  hover
  className="group animate-rise cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-secondary text-secondary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>

                <h2 className="text-base font-semibold">
                  {f.emoji} {f.title}
                </h2>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                {f.text}
              </p>

              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                Explore capability
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </GlassCard>
          ))}
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">
              SIMPLE. INTELLIGENT. ACTIONABLE.
            </p>

            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
              From field data to better decisions.
            </h2>

            <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
              AgriSense AI turns everyday farm observations into insights that
              are easier to understand and act on.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {WORKFLOW.map((step, index) => (
              <GlassCard
                key={step.number}
                className="relative animate-rise"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-semibold text-primary/30">
                    {step.number}
                  </span>

                  {index < WORKFLOW.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
                  )}
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.text}
                </p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* AI CAPABILITIES */}
        <section id="capabilities" className="mt-24">
          <div className="grid gap-8 rounded-[var(--radius-lg)] border border-border/60 bg-background/50 p-6 backdrop-blur-sm md:grid-cols-2 md:p-10">
            <div>
              <p className="text-sm font-medium text-primary">
                ONE FARM. ONE INTELLIGENCE LAYER.
              </p>

              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
                Everything you need to understand your field.
              </h2>

              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                Bring multiple sources of farm information together and turn
                them into a clearer picture of crop health, irrigation needs
                and potential risks.
              </p>

              <Link to="/auth" className="mt-6 inline-flex">
                <Button className="gap-2">
                  Explore AgriSense AI
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {CAPABILITIES.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border/50 bg-card/60 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <span className="text-sm text-muted-foreground">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mt-24 pb-10">
          <GlassCard className="relative overflow-hidden p-8 text-center md:p-12">
            <div className="relative z-10 mx-auto max-w-2xl">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">
                <Leaf className="h-6 w-6" />
              </span>

              <h2 className="mt-5 text-3xl font-semibold md:text-4xl">
                Make every farm decision smarter.
              </h2>

              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                Monitor your crops, understand risks and turn field data into
                actionable insights with AgriSense AI.
              </p>

              <Link to="/auth" className="mt-7 inline-flex">
                <Button size="lg" className="gap-2">
                  Start monitoring
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}