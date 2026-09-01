import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export async function raiseAlert(input: {
  farmId: string | null;
  kind: "moisture" | "disease" | "pest" | "risk";
  message: string;
  severity?: "info" | "warning" | "critical";
}) {
  const severity = input.severity ?? "warning";
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    await supabase.from("alerts").insert({
      user_id: auth.user.id,
      farm_id: input.farmId,
      kind: input.kind,
      message: input.message,
      severity,
    });
  }
  if (severity === "critical") toast.error(input.message);
  else toast.warning(input.message);
}
