-- Keep account provisioning in one trusted trigger. Public sign-up can create
-- student accounts only; staff access must be assigned by an administrator.

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_type_check
CHECK (account_type IN ('staff', 'student', 'unassigned'));

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_student_admin_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_student_admin_check
CHECK (
  (account_type IN ('student', 'unassigned') AND is_admin = FALSE)
  OR account_type = 'staff'
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_kind TEXT;
  user_name TEXT;
BEGIN
  -- User metadata is supplied by the browser and must never be trusted to
  -- grant staff access. The public registration form explicitly identifies
  -- students; every other new Auth user begins unassigned.
  account_kind := CASE
    WHEN COALESCE(NEW.raw_user_meta_data ->> 'account_type', '') = 'student'
      THEN 'student'
    ELSE 'unassigned'
  END;

  user_name := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(BTRIM(CONCAT_WS(
      ' ',
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name'
    )), ''),
    NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
    'New user'
  );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    country_of_residence,
    passport_number,
    account_type,
    department,
    is_admin
  )
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    user_name,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'country_of_residence',
    NEW.raw_user_meta_data ->> 'passport_number',
    account_kind,
    CASE WHEN account_kind = 'student' THEN 'data_applications' ELSE NULL END,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  IF account_kind = 'student' THEN
    INSERT INTO public.applications (
      application_number,
      student_id,
      student_name,
      student_email,
      status,
      target_country,
      target_university,
      degree_program,
      intake_period,
      scholarship_requested,
      missing_documents_count,
      handed_off_to_admissions
    )
    SELECT
      'GS-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
        UPPER(LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8)),
      NEW.id,
      user_name,
      LOWER(NEW.email),
      'draft',
      'United Kingdom',
      'University of Oxford',
      'MSc Data Science',
      'Fall 2026',
      'GSP Excellence Scholarship',
      0,
      FALSE
    WHERE NOT EXISTS (
      SELECT 1 FROM public.applications WHERE student_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_student_profile_and_draft_on_signup
ON auth.users;

-- The existing on_auth_user_created trigger now uses the secured function.
