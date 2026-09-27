import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Clock3, Cpu, Sparkles } from "lucide-react";

import { GlassCard } from "@/components/agri/GlassCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/hardware/coming-soon")({
  head: () => ({
    meta: [
      { title: "Hardware Coming Soon — AgriSense AI" },
      {
        name: "description",
        content: "AgriSense AI field hardware is coming soon.",
      },
    ],
  }),
  component: HardwareComingSoonPage,
});

function HardwareComingSoonPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center justify-center">
      <GlassCard className="w-full animate-rise p-8 text-center sm:p-12">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-[var(--radius-lg)] bg-primary text-primary-foreground shadow-[var(--shadow-glass)]">
          <Cpu className="h-9 w-9" />
        </span>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          AgriSense AI Hardware
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Our hardware is coming soon.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          We are building an affordable field-monitoring device with water-level, soil-moisture and environmental sensors to give farmers easier access to their field data.
        </p>

        <div className="mx-auto mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] bg-secondary/50 p-4 text-left">
            <Clock3 className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-medium">Launching soon</p>
            <p className="mt-1 text-xs text-muted-foreground">We will make the device available from this section when it is ready.</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-secondary/50 p-4 text-left">
            <Bell className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-medium">Stay connected</p>
            <p className="mt-1 text-xs text-muted-foreground">The hardware will be designed to work with your AgriSense AI account.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/hardware">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to hardware
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
