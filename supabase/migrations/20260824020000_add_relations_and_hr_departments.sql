-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Department Constraint Alignment
-- Adds Management, Institutional Relations, and Human Resources
-- across every table that stores department identifiers.
-- ============================================================

-- Profiles
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
      -- Legacy values kept temporarily so old rows do not break migration.
      'it_support',
      'legal_compliance',
      'alumni_success'
    )
  );

-- Department member directory
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

-- Work assignments
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

-- Cross-department communications
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

-- KPI tracker
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
