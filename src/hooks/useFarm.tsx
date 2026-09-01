import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export type Farm = {
  id: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  moisture_threshold: number;
  share_surveillance: boolean;
};

type Ctx = {
  farms: Farm[];
  activeFarm: Farm | null;
  setActiveFarmId: (id: string) => void;
  reload: () => Promise<void>;
  createFarm: (input: { name: string; location?: string }) => Promise<void>;
  loading: boolean;
};

const FarmContext = createContext<Ctx | null>(null);
const KEY = "agrisense-active-farm";

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("farms")
      .select("id,name,location,latitude,longitude,moisture_threshold,share_surveillance")
      .order("created_at", { ascending: true });
    const list = (data ?? []) as Farm[];
    setFarms(list);
    setActiveId((current) => {
      const stored = current ?? localStorage.getItem(KEY);
      return list.some((f) => f.id === stored) ? stored! : (list[0]?.id ?? null);
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setActiveFarmId = useCallback((id: string) => {
    localStorage.setItem(KEY, id);
    setActiveId(id);
  }, []);

  const createFarm = useCallback(
    async (input: { name: string; location?: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data, error } = await supabase
        .from("farms")
        .insert({ name: input.name, location: input.location ?? null, user_id: auth.user.id })
        .select("id")
        .single();
      if (error) throw error;
      await reload();
      if (data?.id) setActiveFarmId(data.id);
    },
    [reload, setActiveFarmId],
  );

  const value = useMemo<Ctx>(
    () => ({
      farms,
      activeFarm: farms.find((f) => f.id === activeId) ?? null,
      setActiveFarmId,
      reload,
      createFarm,
      loading,
    }),
    [farms, activeId, setActiveFarmId, reload, createFarm, loading],
  );

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error("useFarm must be used inside FarmProvider");
  return ctx;
}
