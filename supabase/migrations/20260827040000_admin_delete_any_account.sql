-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Admin Account Deletion Trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Automatically delete the actual auth user record when their profile is deleted
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS profiles_delete_auth_user ON public.profiles;

CREATE TRIGGER profiles_delete_auth_user
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();
