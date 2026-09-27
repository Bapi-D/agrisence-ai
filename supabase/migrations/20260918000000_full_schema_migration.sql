-- ============================================================
-- AgriSense AI — Full Schema Migration
-- Target: xldkbvyzwumzeiyjvixj.supabase.co
-- Run this in your Supabase SQL Editor to set up the entire schema
-- ============================================================

-- ────────────────────────────────────────────────
-- 1. ENUM TYPES
-- ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('farmer', 'officer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ────────────────────────────────────────────────
-- 2. CORE TABLES
-- ────────────────────────────────────────────────

-- 2a. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid        PRIMARY KEY,
  email        text,
  display_name text,
  language     text        NOT NULL DEFAULT 'en',
  created_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles
  FOR ALL TO authenticated
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- 2b. farms
CREATE TABLE IF NOT EXISTS public.farms (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL,
  name                text        NOT NULL,
  location            text,
  latitude            numeric,
  longitude           numeric,
  moisture_threshold  numeric     NOT NULL DEFAULT 40,
  share_surveillance  boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farms TO authenticated;
GRANT ALL ON public.farms TO service_role;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own farms" ON public.farms;
CREATE POLICY "own farms" ON public.farms
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────
-- 3. ROLE SYSTEM
-- ────────────────────────────────────────────────

-- 3a. user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid            NOT NULL,
  role       public.app_role NOT NULL DEFAULT 'farmer',
  created_at timestamptz     NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "self assign farmer or officer" ON public.user_roles;
CREATE POLICY "self assign farmer or officer" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role <> 'admin');

-- 3b. has_role() helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;


-- ────────────────────────────────────────────────
-- 4. AGRICULTURAL TABLES
-- ────────────────────────────────────────────────

-- 4a. crop_profiles
CREATE TABLE IF NOT EXISTS public.crop_profiles (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,
  farm_id      uuid        NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_name    text        NOT NULL,
  variety      text,
  sowing_date  date        NOT NULL DEFAULT (now()::date),
  growth_stage text        NOT NULL DEFAULT 'Vegetative',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (farm_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_profiles TO authenticated;
GRANT ALL ON public.crop_profiles TO service_role;
ALTER TABLE public.crop_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own crop profiles" ON public.crop_profiles;
CREATE POLICY "own crop profiles" ON public.crop_profiles
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4b. weather_readings
CREATE TABLE IF NOT EXISTS public.weather_readings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL,
  farm_id       uuid        REFERENCES public.farms(id) ON DELETE CASCADE,
  temperature   numeric     NOT NULL,
  humidity      numeric     NOT NULL,
  precipitation numeric     NOT NULL DEFAULT 0,
  wind_speed    numeric     NOT NULL DEFAULT 0,
  rain_next_24h numeric     NOT NULL DEFAULT 0,
  summary       text,
  recorded_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weather_readings TO authenticated;
GRANT ALL ON public.weather_readings TO service_role;
ALTER TABLE public.weather_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own weather readings" ON public.weather_readings;
CREATE POLICY "own weather readings" ON public.weather_readings
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS weather_readings_farm_time_idx
  ON public.weather_readings (farm_id, recorded_at DESC);

-- 4c. detections  (disease / crop)
CREATE TABLE IF NOT EXISTS public.detections (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,
  farm_id      uuid        REFERENCES public.farms(id) ON DELETE SET NULL,
  label        text        NOT NULL,
  confidence   numeric     NOT NULL,
  disease_name text,
  description  text,
  treatment    text,
  severity     text,
  green_ratio  numeric     NOT NULL DEFAULT 0,
  yellow_ratio numeric     NOT NULL DEFAULT 0,
  brown_ratio  numeric     NOT NULL DEFAULT 0,
  image_path   text,
  source       text        NOT NULL DEFAULT 'upload',
  created_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detections TO authenticated;
GRANT ALL ON public.detections TO service_role;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own detections" ON public.detections;
CREATE POLICY "own detections" ON public.detections
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4d. pest_detections
CREATE TABLE IF NOT EXISTS public.pest_detections (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL,
  farm_id              uuid        REFERENCES public.farms(id) ON DELETE SET NULL,
  pest_name            text        NOT NULL,
  confidence           numeric     NOT NULL DEFAULT 0,
  infestation_severity text        NOT NULL DEFAULT 'Low',
  crop_stage           text        NOT NULL DEFAULT 'Vegetative',
  ipm_action           text        NOT NULL DEFAULT '',
  description          text,
  damage_ratio         numeric     NOT NULL DEFAULT 0,
  texture_variance     numeric     NOT NULL DEFAULT 0,
  image_path           text,
  source               text        NOT NULL DEFAULT 'upload',
  created_at           timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pest_detections TO authenticated;
GRANT ALL ON public.pest_detections TO service_role;
ALTER TABLE public.pest_detections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own pest detections" ON public.pest_detections;
CREATE POLICY "own pest detections" ON public.pest_detections
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS pest_detections_farm_created_idx
  ON public.pest_detections (farm_id, created_at DESC);

-- 4e. pest_trap_logs
CREATE TABLE IF NOT EXISTS public.pest_trap_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  farm_id    uuid        REFERENCES public.farms(id) ON DELETE SET NULL,
  trap_type  text        NOT NULL DEFAULT 'pheromone',
  pest_type  text        NOT NULL,
  count      integer     NOT NULL DEFAULT 0,
  location   text,
  notes      text,
  logged_on  date        NOT NULL DEFAULT (now()::date),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pest_trap_logs TO authenticated;
GRANT ALL ON public.pest_trap_logs TO service_role;
ALTER TABLE public.pest_trap_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own pest trap logs" ON public.pest_trap_logs;
CREATE POLICY "own pest trap logs" ON public.pest_trap_logs
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS pest_trap_logs_farm_date_idx
  ON public.pest_trap_logs (farm_id, logged_on DESC);

-- 4f. predictions  (soil moisture / water management)
CREATE TABLE IF NOT EXISTS public.predictions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL,
  farm_id            uuid        REFERENCES public.farms(id) ON DELETE SET NULL,
  label              text        NOT NULL,
  confidence         numeric     NOT NULL,
  moisture           numeric     NOT NULL,
  moisture_category  text        NOT NULL,
  recommendation     text        NOT NULL,
  status             text        NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own predictions" ON public.predictions;
CREATE POLICY "own predictions" ON public.predictions
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4g. alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  farm_id    uuid        REFERENCES public.farms(id) ON DELETE SET NULL,
  kind       text        NOT NULL,
  message    text        NOT NULL,
  severity   text        NOT NULL DEFAULT 'info',
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own alerts" ON public.alerts;
CREATE POLICY "own alerts" ON public.alerts
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────
-- 5. OFFICER / VALIDATION TABLES
-- ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.case_validations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_kind        text        NOT NULL,
  detection_id     uuid        NOT NULL,
  farmer_id        uuid        NOT NULL,
  officer_id       uuid        NOT NULL,
  status           text        NOT NULL,
  ai_label         text,
  expert_label     text,
  notes            text,
  response_minutes numeric     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_kind, detection_id)
);
GRANT SELECT, INSERT, UPDATE ON public.case_validations TO authenticated;
GRANT ALL ON public.case_validations TO service_role;
ALTER TABLE public.case_validations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "farmer reads own case validations" ON public.case_validations;
CREATE POLICY "farmer reads own case validations" ON public.case_validations
  FOR SELECT TO authenticated USING (auth.uid() = farmer_id);
DROP POLICY IF EXISTS "officers read validations" ON public.case_validations;
CREATE POLICY "officers read validations" ON public.case_validations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'officer'));
DROP POLICY IF EXISTS "officers create validations" ON public.case_validations;
CREATE POLICY "officers create validations" ON public.case_validations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = officer_id AND public.has_role(auth.uid(), 'officer'));
DROP POLICY IF EXISTS "officers update own validations" ON public.case_validations;
CREATE POLICY "officers update own validations" ON public.case_validations
  FOR UPDATE TO authenticated
  USING     (auth.uid() = officer_id AND public.has_role(auth.uid(), 'officer'))
  WITH CHECK (auth.uid() = officer_id);


-- ────────────────────────────────────────────────
-- 6. UTILITY FUNCTIONS & TRIGGERS
-- ────────────────────────────────────────────────

-- 6a. touch_updated_at trigger function
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

-- 6b. Apply trigger to crop_profiles
DROP TRIGGER IF EXISTS crop_profiles_touch ON public.crop_profiles;
CREATE TRIGGER crop_profiles_touch
  BEFORE UPDATE ON public.crop_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6c. Auto-provision profile + role + farm on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  chosen public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'farmer'), '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    chosen := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'farmer')::public.app_role;
  EXCEPTION WHEN others THEN
    chosen := 'farmer';
  END;
  IF chosen = 'admin' THEN chosen := 'farmer'; END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF chosen = 'farmer' THEN
    INSERT INTO public.farms (user_id, name, location)
    VALUES (NEW.id, 'North Field', 'Home farm');
  END IF;

  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 6d. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────
-- Done! All tables, policies, functions, and
-- triggers are now set up for AgriSense AI.
-- ────────────────────────────────────────────────
