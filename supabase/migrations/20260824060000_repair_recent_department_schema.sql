-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Recent Department Schema + Auth Account Repair
-- ============================================================
-- This migration intentionally fixes forward from the current remote state.
-- Earlier local migration files were adjusted after they had already been
-- applied remotely, so the linked database may still have older department
-- constraints. Keep this migration idempotent and safe to rerun.

-- ------------------------------------------------------------
-- 1. One canonical list of department values everywhere.
-- ------------------------------------------------------------

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_department_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_department_check
  CHECK (
    department IN (
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors',
      'management',
      'institutional_relations',
      'human_resources',
      -- Legacy values remain accepted so older records do not break.
      'it_support',
      'legal_compliance',
      'alumni_success'
    )
  );

ALTER TABLE public.department_members
  DROP CONSTRAINT IF EXISTS department_members_departments_check,
  DROP CONSTRAINT IF EXISTS department_members_primary_department_check;

ALTER TABLE public.department_members
  ADD CONSTRAINT department_members_departments_check
  CHECK (
    CARDINALITY(departments) > 0
    AND primary_department = ANY(departments)
    AND departments <@ ARRAY[
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors',
      'management',
      'institutional_relations',
      'human_resources',
      'it_support',
      'legal_compliance',
      'alumni_success'
    ]::TEXT[]
  ),
  ADD CONSTRAINT department_members_primary_department_check
  CHECK (
    primary_department IN (
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors',
      'management',
      'institutional_relations',
      'human_resources',
      'it_support',
      'legal_compliance',
      'alumni_success'
    )
  );

ALTER TABLE public.department_reports
  DROP CONSTRAINT IF EXISTS department_reports_department_check;

ALTER TABLE public.department_reports
  ADD CONSTRAINT department_reports_department_check
  CHECK (
    department IN (
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors',
      'management',
      'institutional_relations',
      'human_resources',
      'it_support',
      'legal_compliance',
      'alumni_success'
    )
  );

ALTER TABLE public.department_work_assignments
  DROP CONSTRAINT IF EXISTS department_work_assignments_department_check;

ALTER TABLE public.department_work_assignments
  ADD CONSTRAINT department_work_assignments_department_check
  CHECK (
    assigned_department IN (
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors',
      'management',
      'institutional_relations',
      'human_resources'
    )
  );

ALTER TABLE public.department_communications
  DROP CONSTRAINT IF EXISTS department_communications_sender_department_check,
  DROP CONSTRAINT IF EXISTS department_communications_recipient_department_check;

ALTER TABLE public.department_communications
  ADD CONSTRAINT department_communications_sender_department_check
  CHECK (
    sender_department IN (
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors',
      'management',
      'institutional_relations',
      'human_resources',
      'it_support',
      'legal_compliance',
      'alumni_success'
    )
  ),
  ADD CONSTRAINT department_communications_recipient_department_check
  CHECK (
    recipient_department IN (
      'all',
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors',
      'management',
      'institutional_relations',
      'human_resources',
      'it_support',
      'legal_compliance',
      'alumni_success'
    )
  );

ALTER TABLE public.department_kpis
  DROP CONSTRAINT IF EXISTS department_kpis_department_check;

ALTER TABLE public.department_kpis
  ADD CONSTRAINT department_kpis_department_check
  CHECK (
    department IN (
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors',
      'management',
      'institutional_relations',
      'human_resources',
      'it_support',
      'legal_compliance',
      'alumni_success'
    )
  );

-- ------------------------------------------------------------
-- 2. Keep multi-department staff checks and assignment policies aligned.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_report_department_access(p_department TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = auth.uid()
        AND profile.account_type = 'staff'
        AND (
          profile.is_admin = TRUE
          OR profile.department = p_department
          OR p_department = ANY(COALESCE(profile.assigned_departments, ARRAY[]::TEXT[]))
        )
    ),
    FALSE
  );
$$;

DROP POLICY IF EXISTS "operations_admin_create_work_assignments"
ON public.department_work_assignments;

CREATE POLICY "operations_admin_create_work_assignments"
ON public.department_work_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() IN ('admin', 'operations', 'management')
  AND assigned_department IN (
    'admin',
    'marketing',
    'admissions',
    'counseling',
    'data_applications',
    'operations',
    'finance',
    'country_directors',
    'management',
    'institutional_relations',
    'human_resources'
  )
);

DROP POLICY IF EXISTS "operations_view_created_assignments"
ON public.department_work_assignments;

CREATE POLICY "operations_view_created_assignments"
ON public.department_work_assignments
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() IN ('admin', 'operations', 'management')
);

DROP POLICY IF EXISTS "authorized_update_work_assignments"
ON public.department_work_assignments;

CREATE POLICY "authorized_update_work_assignments"
ON public.department_work_assignments
FOR UPDATE
TO authenticated
USING (
  public.is_report_admin()
  OR (
    (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
    AND public.current_report_department() IN ('admin', 'operations', 'management')
  )
  OR assigned_to = auth.uid()
  OR public.has_report_department_access(assigned_department)
)
WITH CHECK (
  public.is_report_admin()
  OR (
    (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
    AND public.current_report_department() IN ('admin', 'operations', 'management')
  )
  OR assigned_to = auth.uid()
  OR public.has_report_department_access(assigned_department)
);

DROP POLICY IF EXISTS "admin_operations_delete_work_assignments"
ON public.department_work_assignments;

CREATE POLICY "admin_operations_delete_work_assignments"
ON public.department_work_assignments
FOR DELETE
TO authenticated
USING (
  public.is_report_admin()
  OR (
    (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
    AND public.current_report_department() IN ('admin', 'operations', 'management')
  )
);

-- ------------------------------------------------------------
-- 3. Repair existing seeded accounts for the recent departments.
-- ------------------------------------------------------------
-- Earlier seed data may have created auth.users rows directly. Supabase Auth
-- also expects auth.identities rows for password login. This block links any
-- existing recent-department auth users to profiles, department_members, and
-- email identities without changing their passwords.

DO $$
DECLARE
  staff_account RECORD;
  staff_user_id UUID;
  identity_id_type TEXT;
  has_provider_id BOOLEAN;
BEGIN
  SELECT c.udt_name
  INTO identity_id_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'auth'
    AND c.table_name = 'identities'
    AND c.column_name = 'id'
  LIMIT 1;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'auth'
      AND c.table_name = 'identities'
      AND c.column_name = 'provider_id'
  )
  INTO has_provider_id;

  FOR staff_account IN
    SELECT *
    FROM (
      VALUES
        ('manager@report.com', 'Management Director', 'management', 'Senior Management Director'),
        ('relation@report.com', 'Institutional Relations Director', 'institutional_relations', 'Senior Institutional Relations Director'),
        ('human@report.com', 'Human Resources Manager', 'human_resources', 'Senior Human Resources Manager')
    ) AS account(email, full_name, department, job_title)
  LOOP
    UPDATE public.department_members member
    SET
      full_name = staff_account.full_name,
      job_title = staff_account.job_title,
      primary_department = staff_account.department,
      departments = ARRAY[staff_account.department]::TEXT[],
      is_assistant = FALSE,
      employment_status = 'active',
      updated_at = NOW()
    WHERE LOWER(member.email) = staff_account.email;

    IF NOT FOUND THEN
      INSERT INTO public.department_members (
        full_name,
        email,
        job_title,
        primary_department,
        departments,
        is_assistant,
        employment_status
      )
      VALUES (
        staff_account.full_name,
        staff_account.email,
        staff_account.job_title,
        staff_account.department,
        ARRAY[staff_account.department]::TEXT[],
        FALSE,
        'active'
      );
    END IF;

    SELECT users.id
    INTO staff_user_id
    FROM auth.users users
    WHERE LOWER(users.email) = staff_account.email
    LIMIT 1;

    IF staff_user_id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE auth.users users
    SET
      email = LOWER(users.email),
      email_confirmed_at = COALESCE(users.email_confirmed_at, NOW()),
      raw_app_meta_data = COALESCE(users.raw_app_meta_data, '{}'::JSONB)
        || JSONB_BUILD_OBJECT(
          'provider', 'email',
          'providers', JSONB_BUILD_ARRAY('email')
        ),
      raw_user_meta_data = COALESCE(users.raw_user_meta_data, '{}'::JSONB)
        || JSONB_BUILD_OBJECT(
          'full_name', staff_account.full_name,
          'account_type', 'staff'
        ),
      updated_at = NOW()
    WHERE users.id = staff_user_id;

    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      department,
      is_admin,
      account_type,
      job_title,
      is_assistant,
      assigned_departments
    )
    VALUES (
      staff_user_id,
      staff_account.email,
      staff_account.full_name,
      staff_account.department,
      FALSE,
      'staff',
      staff_account.job_title,
      FALSE,
      ARRAY[staff_account.department]::TEXT[]
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      department = EXCLUDED.department,
      account_type = 'staff',
      job_title = EXCLUDED.job_title,
      is_assistant = EXCLUDED.is_assistant,
      assigned_departments = EXCLUDED.assigned_departments;

    UPDATE public.department_members member
    SET
      profile_id = staff_user_id,
      full_name = staff_account.full_name,
      job_title = staff_account.job_title,
      primary_department = staff_account.department,
      departments = ARRAY[staff_account.department]::TEXT[],
      is_assistant = FALSE,
      employment_status = 'active',
      updated_at = NOW()
    WHERE LOWER(member.email) = staff_account.email;

    IF identity_id_type IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM auth.identities identity
         WHERE identity.user_id = staff_user_id
           AND identity.provider = 'email'
       ) THEN
      IF has_provider_id THEN
        IF identity_id_type = 'uuid' THEN
          EXECUTE
            'INSERT INTO auth.identities (
               id, user_id, provider_id, identity_data, provider,
               last_sign_in_at, created_at, updated_at
             )
             VALUES (
               gen_random_uuid(), $1, $2,
               JSONB_BUILD_OBJECT(
                 ''sub'', $2,
                 ''email'', $3,
                 ''email_verified'', TRUE,
                 ''phone_verified'', FALSE
               ),
               ''email'', NOW(), NOW(), NOW()
             )
             ON CONFLICT DO NOTHING'
          USING staff_user_id, staff_user_id::TEXT, staff_account.email;
        ELSE
          EXECUTE
            'INSERT INTO auth.identities (
               id, user_id, provider_id, identity_data, provider,
               last_sign_in_at, created_at, updated_at
             )
             VALUES (
               $2, $1, $2,
               JSONB_BUILD_OBJECT(
                 ''sub'', $2,
                 ''email'', $3,
                 ''email_verified'', TRUE,
                 ''phone_verified'', FALSE
               ),
               ''email'', NOW(), NOW(), NOW()
             )
             ON CONFLICT DO NOTHING'
          USING staff_user_id, staff_user_id::TEXT, staff_account.email;
        END IF;
      ELSE
        IF identity_id_type = 'uuid' THEN
          EXECUTE
            'INSERT INTO auth.identities (
               id, user_id, identity_data, provider,
               last_sign_in_at, created_at, updated_at
             )
             VALUES (
               gen_random_uuid(), $1,
               JSONB_BUILD_OBJECT(
                 ''sub'', $2,
                 ''email'', $3,
                 ''email_verified'', TRUE,
                 ''phone_verified'', FALSE
               ),
               ''email'', NOW(), NOW(), NOW()
             )
             ON CONFLICT DO NOTHING'
          USING staff_user_id, staff_user_id::TEXT, staff_account.email;
        ELSE
          EXECUTE
            'INSERT INTO auth.identities (
               id, user_id, identity_data, provider,
               last_sign_in_at, created_at, updated_at
             )
             VALUES (
               $2, $1,
               JSONB_BUILD_OBJECT(
                 ''sub'', $2,
                 ''email'', $3,
                 ''email_verified'', TRUE,
                 ''phone_verified'', FALSE
               ),
               ''email'', NOW(), NOW(), NOW()
             )
             ON CONFLICT DO NOTHING'
          USING staff_user_id, staff_user_id::TEXT, staff_account.email;
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;
