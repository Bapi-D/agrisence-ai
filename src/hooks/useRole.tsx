import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "farmer" | "officer" | "admin";

/** Reads the signed-in user's roles from the `user_roles` table (RLS: own rows). */
export function useRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (active) setLoading(false);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
      if (!active) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return {
    roles,
    loading,
    isOfficer: roles.includes("officer") || roles.includes("admin"),
    isFarmer: roles.length === 0 || roles.includes("farmer"),
  };
}
