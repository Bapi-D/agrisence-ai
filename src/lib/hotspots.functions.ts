import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { collectHotspots } from "./agri/hotspots.server";

/**
 * Regional surveillance feed for the hotspot map: anonymised, jittered disease +
 * pest reports from every farm that opted into sharing, plus the signed-in
 * farmer's own reports (always included and flagged).
 */
export const getHotspots = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number }) => ({ days: Number(data?.days ?? 365) }))
  .handler(async ({ data, context }) => collectHotspots(context.userId, data.days));
