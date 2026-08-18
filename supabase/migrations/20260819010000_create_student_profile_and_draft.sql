-- Create the student profile and its first draft application as one part of
-- Supabase Auth signup. This makes the account ready for the Student Portal
-- as soon as an authenticated session is created.

CREATE OR REPLACE FUNCTION public.create_student_profile_and_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name TEXT;
BEGIN
  -- Staff accounts continue to be managed by the existing staff workflow.
  IF COALESCE(NEW.raw_user_meta_data ->> 'account_type', '') <> 'student' THEN
    RETURN NEW;
  END IF;

  student_name := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
    'Student'
  );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    department,
    is_admin,
    account_type
  )
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    student_name,
    'data_applications',
    FALSE,
    'student'
  )
  ON CONFLICT (id) DO NOTHING;

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
    student_name,
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
    SELECT 1
    FROM public.applications
    WHERE student_id = NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_student_profile_and_draft_on_signup
ON auth.users;

CREATE TRIGGER create_student_profile_and_draft_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_student_profile_and_draft();
