-- Globe Scholars Pathways, LLC.
-- Deleting a department member revokes staff workspace access from the linked profile.

CREATE OR REPLACE FUNCTION public.revoke_department_member_profile_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    account_type = 'unassigned',
    assigned_departments = ARRAY[]::TEXT[],
    job_title = NULL,
    is_assistant = FALSE
  WHERE
    NOT is_admin
    AND (
      id = OLD.profile_id
      OR LOWER(email) = LOWER(OLD.email)
    );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS department_members_revoke_profile_on_delete
ON public.department_members;

CREATE TRIGGER department_members_revoke_profile_on_delete
AFTER DELETE ON public.department_members
FOR EACH ROW
EXECUTE FUNCTION public.revoke_department_member_profile_on_delete();
