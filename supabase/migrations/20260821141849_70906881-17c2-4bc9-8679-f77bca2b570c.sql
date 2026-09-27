REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TABLE public.pest_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  farm_id uuid REFERENCES public.farms(id) ON DELETE SET NULL,
  pest_name text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  infestation_severity text NOT NULL DEFAULT 'Low',
  crop_stage text NOT NULL DEFAULT 'Vegetative',
  ipm_action text NOT NULL DEFAULT '',
  description text,
  damage_ratio numeric NOT NULL DEFAULT 0,
  texture_variance numeric NOT NULL DEFAULT 0,
  image_path text,
  source text NOT NULL DEFAULT 'upload',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pest_detections TO authenticated;
GRANT ALL ON public.pest_detections TO service_role;
ALTER TABLE public.pest_detections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pest detections" ON public.pest_detections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.pest_trap_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  farm_id uuid REFERENCES public.farms(id) ON DELETE SET NULL,
  trap_type text NOT NULL DEFAULT 'pheromone',
  pest_type text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  location text,
  notes text,
  logged_on date NOT NULL DEFAULT (now()::date),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pest_trap_logs TO authenticated;
GRANT ALL ON public.pest_trap_logs TO service_role;
ALTER TABLE public.pest_trap_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pest trap logs" ON public.pest_trap_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX pest_detections_farm_created_idx ON public.pest_detections (farm_id, created_at DESC);
CREATE INDEX pest_trap_logs_farm_date_idx ON public.pest_trap_logs (farm_id, logged_on DESC);