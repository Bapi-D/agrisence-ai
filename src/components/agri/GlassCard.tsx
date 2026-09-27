import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return <div className={cn("glass-card p-6", hover && "glass-hover", className)} {...props} />;
}

export function Orbs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="orb animate-float h-[26rem] w-[26rem] -left-24 -top-24"
        style={{ background: "var(--orb-1)" }}
      />
      <div
        className="orb animate-float h-[22rem] w-[22rem] right-[-6rem] top-1/4"
        style={{ background: "var(--orb-2)", animationDelay: "-5s" }}
      />
      <div
        className="orb animate-float h-[30rem] w-[30rem] bottom-[-10rem] left-1/3"
        style={{ background: "var(--orb-3)", animationDelay: "-9s" }}
      />
    </div>
  );
}
