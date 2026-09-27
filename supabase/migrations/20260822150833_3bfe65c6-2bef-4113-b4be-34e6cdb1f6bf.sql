DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('farmer','officer','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'farmer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "self assign farmer or officer" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role <> 'admin');

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE IF NOT EXISTS public.case_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_kind text NOT NULL,
  detection_id uuid NOT NULL,
  farmer_id uuid NOT NULL,
  officer_id uuid NOT NULL,
  status text NOT NULL,
  ai_label text,
  expert_label text,
  notes text,
  response_minutes numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_kind, detection_id)
);

GRANT SELECT, INSERT, UPDATE ON public.case_validations TO authenticated;
GRANT ALL ON public.case_validations TO service_role;
ALTER TABLE public.case_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farmer reads own case validations" ON public.case_validations
  FOR SELECT TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "officers read validations" ON public.case_validations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'officer'));
CREATE POLICY "officers create validations" ON public.case_validations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = officer_id AND public.has_role(auth.uid(), 'officer'));
CREATE POLICY "officers update own validations" ON public.case_validations
  FOR UPDATE TO authenticated USING (auth.uid() = officer_id AND public.has_role(auth.uid(), 'officer'))
  WITH CHECK (auth.uid() = officer_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  chosen public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email,'farmer'), '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    chosen := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'farmer')::public.app_role;
  EXCEPTION WHEN others THEN
    chosen := 'farmer';
  END;
  IF chosen = 'admin' THEN chosen := 'farmer'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, chosen)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF chosen = 'farmer' THEN
    INSERT INTO public.farms (user_id, name, location)
    VALUES (NEW.id, 'North Field', 'Home farm');
  END IF;

  RETURN NEW;
END;
$function$;