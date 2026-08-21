-- Globe Scholars Pathways, LLC.
-- Department member directory, assignment, and staff activation workflow.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS is_assistant BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS assigned_departments TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS public.department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  primary_department TEXT NOT NULL,
  departments TEXT[] NOT NULL,
  is_assistant BOOLEAN NOT NULL DEFAULT FALSE,
  employment_status TEXT NOT NULL DEFAULT 'pending_activation',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT department_members_full_name_check CHECK (LENGTH(BTRIM(full_name)) > 1),
  CONSTRAINT department_members_email_check CHECK (POSITION('@' IN email) > 1),
  CONSTRAINT department_members_job_title_check CHECK (LENGTH(BTRIM(job_title)) > 1),
  CONSTRAINT department_members_status_check CHECK (
    employment_status IN ('pending_activation', 'active', 'inactive')
  ),
  CONSTRAINT department_members_departments_check CHECK (
    CARDINALITY(departments) > 0
    AND primary_department = ANY(departments)
    AND departments <@ ARRAY[
      'admin', 'marketing', 'admissions', 'counseling', 'data_applications',
      'operations', 'finance', 'country_directors', 'it_support',
      'legal_compliance', 'alumni_success'
    ]::TEXT[]
  ),
  CONSTRAINT department_members_primary_department_check CHECK (
    primary_department IN (
      'admin', 'marketing', 'admissions', 'counseling', 'data_applications',
      'operations', 'finance', 'country_directors', 'it_support',
      'legal_compliance', 'alumni_success'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS department_members_email_lower_idx
  ON public.department_members (LOWER(email));

CREATE INDEX IF NOT EXISTS department_members_primary_department_idx
  ON public.department_members(primary_department);

CREATE INDEX IF NOT EXISTS department_members_departments_idx
  ON public.department_members USING GIN(departments);

CREATE OR REPLACE FUNCTION public.set_department_member_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email := LOWER(BTRIM(NEW.email));
  NEW.full_name := BTRIM(NEW.full_name);
  NEW.job_title := BTRIM(NEW.job_title);
  NEW.departments := ARRAY(
    SELECT DISTINCT department
    FROM UNNEST(NEW.departments) AS department
    ORDER BY department
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS department_members_before_write ON public.department_members;
CREATE TRIGGER department_members_before_write
BEFORE INSERT OR UPDATE ON public.department_members
FOR EACH ROW
EXECUTE FUNCTION public.set_department_member_updated_at();

-- Existing staff accounts appear in the new directory automatically.
INSERT INTO public.department_members (
  profile_id,
  full_name,
  email,
  job_title,
  primary_department,
  departments,
  is_assistant,
  employment_status,
  created_by
)
SELECT
  profile.id,
  profile.full_name,
  LOWER(profile.email),
  COALESCE(NULLIF(BTRIM(profile.job_title), ''), CASE WHEN profile.is_admin THEN 'Administrator' ELSE 'Department staff member' END),
  profile.department,
  CASE
    WHEN CARDINALITY(profile.assigned_departments) > 0 THEN profile.assigned_departments
    ELSE ARRAY[profile.department]
  END,
  profile.is_assistant,
  'active',
  NULL
FROM public.profiles AS profile
WHERE profile.account_type = 'staff'
ON CONFLICT (profile_id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  job_title = EXCLUDED.job_title,
  primary_department = EXCLUDED.primary_department,
  departments = EXCLUDED.departments,
  is_assistant = EXCLUDED.is_assistant,
  employment_status = 'active';

-- Keep an activated staff profile aligned with its admin-managed directory record.
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
        WHEN NEW.employment_status = 'inactive' THEN 'unassigned'
        ELSE 'staff'
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

DROP TRIGGER IF EXISTS department_members_sync_profile ON public.department_members;
CREATE TRIGGER department_members_sync_profile
AFTER INSERT OR UPDATE OF full_name, email, job_title, primary_department, departments, is_assistant, employment_status, profile_id
ON public.department_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_department_member_to_profile();

ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS department_members_admin_all ON public.department_members;
CREATE POLICY department_members_admin_all
ON public.department_members
FOR ALL
TO authenticated
USING (public.is_report_admin())
WITH CHECK (public.is_report_admin());

DROP POLICY IF EXISTS department_members_select_own ON public.department_members;
CREATE POLICY department_members_select_own
ON public.department_members
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- A directory record made by an administrator grants staff access only when
-- the new Auth account uses the same email address. Browser-supplied metadata
-- cannot grant staff access on its own.
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
BEGIN
  SELECT *
  INTO staff_member
  FROM public.department_members
  WHERE LOWER(email) = LOWER(NEW.email)
    AND employment_status <> 'inactive'
  LIMIT 1;

  account_kind := CASE
    WHEN COALESCE(NEW.raw_user_meta_data ->> 'account_type', '') = 'student' THEN 'student'
    WHEN FOUND THEN 'staff'
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
    SET
      profile_id = NEW.id,
      employment_status = 'active'
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

DROP TRIGGER IF EXISTS create_student_profile_and_draft_on_signup ON auth.users;
DROP TRIGGER IF EXISTS gsp_profile_on_auth_user_created ON auth.users;
CREATE TRIGGER gsp_profile_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
