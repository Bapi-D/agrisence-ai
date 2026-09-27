CREATE TABLE public.crop_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_name text NOT NULL,
  variety text,
  sowing_date date NOT NULL DEFAULT (now()::date),
  growth_stage text NOT NULL DEFAULT 'Vegetative',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (farm_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_profiles TO authenticated;
GRANT ALL ON public.crop_profiles TO service_role;
ALTER TABLE public.crop_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own crop profiles" ON public.crop_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.weather_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  farm_id uuid REFERENCES public.farms(id) ON DELETE CASCADE,
  temperature numeric NOT NULL,
  humidity numeric NOT NULL,
  precipitation numeric NOT NULL DEFAULT 0,
  wind_speed numeric NOT NULL DEFAULT 0,
  rain_next_24h numeric NOT NULL DEFAULT 0,
  summary text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weather_readings TO authenticated;
GRANT ALL ON public.weather_readings TO service_role;
ALTER TABLE public.weather_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own weather readings" ON public.weather_readings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX weather_readings_farm_time_idx ON public.weather_readings (farm_id, recorded_at DESC);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER crop_profiles_touch BEFORE UPDATE ON public.crop_profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();