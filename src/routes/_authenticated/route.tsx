import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { FarmProvider } from "@/hooks/useFarm";
import { AppShell } from "@/components/agri/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <FarmProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </FarmProvider>
  ),
});
