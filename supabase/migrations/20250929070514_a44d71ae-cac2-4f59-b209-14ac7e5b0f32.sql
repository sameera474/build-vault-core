-- 0.1 Add email column to profiles if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 0.2 Keep email in sync from auth.users via security definer function
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
BEGIN
  -- fetch email from auth.users; this requires security definer
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  NEW.email := COALESCE(v_email, NEW.email);
  RETURN NEW;
END;
$$;

-- 0.3 Trigger on INSERT/UPDATE of profiles
DROP TRIGGER IF EXISTS trg_profiles_sync_email ON public.profiles;
CREATE TRIGGER trg_profiles_sync_email
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_email();

-- 0.4 Optional: backfill emails once
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email <> u.email);

-- Ensure current_user_company and current_user_role functions exist
CREATE OR REPLACE FUNCTION public.current_user_company()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid()
$$;