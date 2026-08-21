-- Globe Scholars Pathways, LLC.
-- Staff directory records must be active before they grant department access.

CREATE OR REPLACE FUNCTION public.sync_department_member_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_profile_id UUID;
BEGIN
  linked_profile_id := NEW.profile_id;

  IF linked_profile_id IS NULL THEN
    SELECT id
    INTO linked_profile_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;
  END IF;

  IF linked_profile_id IS NOT NULL THEN
    UPDATE public.profiles
    SET
      full_name = NEW.full_name,
      department = NEW.primary_department,
      assigned_departments = NEW.departments,
      job_title = NEW.job_title,
      is_assistant = NEW.is_assistant,
      account_type = CASE
        WHEN NEW.employment_status = 'active' THEN 'staff'
        ELSE 'unassigned'
      END
    WHERE id = linked_profile_id;

    IF NEW.profile_id IS DISTINCT FROM linked_profile_id THEN
      UPDATE public.department_members
      SET profile_id = linked_profile_id
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

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
BEGIN
  SELECT *
  INTO staff_member
  FROM public.department_members
  WHERE LOWER(email) = LOWER(NEW.email)
    AND employment_status = 'active'
  LIMIT 1;

  has_active_staff_record := FOUND;

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
    NEW.raw_user_meta_data ->> 'country_of_residence',
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
      application_number, student_id, student_name, student_email, status,
      target_country, target_university, degree_program, intake_period,
      scholarship_requested, missing_documents_count, handed_off_to_admissions
    )
    SELECT
      'GS-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || UPPER(LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8)),
      NEW.id, user_name, LOWER(NEW.email), 'draft', 'United Kingdom',
      'University of Oxford', 'MSc Data Science', 'Fall 2026',
      'GSP Excellence Scholarship', 0, FALSE
    WHERE NOT EXISTS (
      SELECT 1 FROM public.applications WHERE student_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;
