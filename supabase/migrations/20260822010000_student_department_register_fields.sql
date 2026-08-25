-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Student intake fields for department spreadsheet registers
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age INTEGER;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_address TEXT;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_age_reasonable_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_age_reasonable_check
CHECK (age IS NULL OR age BETWEEN 10 AND 90);

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS student_phone TEXT;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS student_age INTEGER;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS student_gender TEXT;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS student_current_address TEXT;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS student_country TEXT;

ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_student_age_reasonable_check;

ALTER TABLE public.applications
ADD CONSTRAINT applications_student_age_reasonable_check
CHECK (student_age IS NULL OR student_age BETWEEN 10 AND 90);

UPDATE public.applications AS application
SET
  student_phone = COALESCE(application.student_phone, profile.phone),
  student_age = COALESCE(application.student_age, profile.age),
  student_gender = COALESCE(application.student_gender, profile.gender),
  student_current_address = COALESCE(application.student_current_address, profile.current_address),
  student_country = COALESCE(application.student_country, profile.country_of_residence, application.target_country)
FROM public.profiles AS profile
WHERE application.student_id = profile.id;

UPDATE public.applications
SET student_country = COALESCE(student_country, target_country)
WHERE student_country IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_kind TEXT;
  user_name TEXT;
  staff_member public.department_members%ROWTYPE;
  has_active_staff_record BOOLEAN;
  student_age INTEGER;
  student_country TEXT;
BEGIN
  SELECT *
  INTO staff_member
  FROM public.department_members
  WHERE LOWER(email) = LOWER(NEW.email)
    AND employment_status = 'active'
  LIMIT 1;

  has_active_staff_record := FOUND;

  IF COALESCE(NEW.raw_user_meta_data ->> 'age', '') ~ '^\d+$' THEN
    student_age := (NEW.raw_user_meta_data ->> 'age')::INTEGER;
  ELSE
    student_age := NULL;
  END IF;

  student_country := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'country_of_residence'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'country'), ''),
    'United Kingdom'
  );

  account_kind := CASE
    WHEN COALESCE(NEW.raw_user_meta_data ->> 'account_type', '') = 'student' THEN 'student'
    WHEN has_active_staff_record THEN 'staff'
    ELSE 'unassigned'
  END;

  user_name := COALESCE(
    CASE WHEN account_kind = 'staff' THEN staff_member.full_name END,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(BTRIM(CONCAT_WS(' ', NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name')), ''),
    NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
    'New user'
  );

  INSERT INTO public.profiles (
    id, email, full_name, first_name, last_name, phone,
    age, gender, current_address,
    country_of_residence, passport_number, account_type, department,
    assigned_departments, job_title, is_assistant, is_admin
  )
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    user_name,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    student_age,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'gender'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'current_address'), ''),
    student_country,
    NEW.raw_user_meta_data ->> 'passport_number',
    account_kind,
    CASE
      WHEN account_kind = 'student' THEN 'data_applications'
      WHEN account_kind = 'staff' THEN staff_member.primary_department
      ELSE 'admin'
    END,
    CASE WHEN account_kind = 'staff' THEN staff_member.departments ELSE ARRAY[]::TEXT[] END,
    CASE WHEN account_kind = 'staff' THEN staff_member.job_title ELSE NULL END,
    CASE WHEN account_kind = 'staff' THEN staff_member.is_assistant ELSE FALSE END,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    age = COALESCE(EXCLUDED.age, public.profiles.age),
    gender = COALESCE(EXCLUDED.gender, public.profiles.gender),
    current_address = COALESCE(EXCLUDED.current_address, public.profiles.current_address),
    country_of_residence = COALESCE(EXCLUDED.country_of_residence, public.profiles.country_of_residence),
    passport_number = COALESCE(EXCLUDED.passport_number, public.profiles.passport_number),
    account_type = EXCLUDED.account_type,
    department = EXCLUDED.department,
    assigned_departments = EXCLUDED.assigned_departments,
    job_title = EXCLUDED.job_title,
    is_assistant = EXCLUDED.is_assistant;

  IF account_kind = 'staff' THEN
    UPDATE public.department_members
    SET profile_id = NEW.id
    WHERE id = staff_member.id;
  END IF;

  IF account_kind = 'student' THEN
    INSERT INTO public.applications (
      application_number, student_id, student_name, student_email,
      student_phone, student_age, student_gender, student_current_address, student_country,
      status, target_country, target_university, degree_program, intake_period,
      scholarship_requested, missing_documents_count, handed_off_to_admissions
    )
    SELECT
      'GS-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || UPPER(LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8)),
      NEW.id,
      user_name,
      LOWER(NEW.email),
      NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'phone'), ''),
      student_age,
      NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'gender'), ''),
      NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'current_address'), ''),
      student_country,
      'draft',
      student_country,
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
