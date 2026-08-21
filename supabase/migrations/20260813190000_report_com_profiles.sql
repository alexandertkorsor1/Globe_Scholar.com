-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Profiles / Staff Authentication
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  email TEXT NOT NULL,
  full_name TEXT NOT NULL,

  avatar_url TEXT,

  department TEXT NOT NULL DEFAULT 'admin',

  is_admin BOOLEAN NOT NULL DEFAULT FALSE,

  phone TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_department_check
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
      'it_support',
      'legal_compliance',
      'alumni_success'
    )
  )
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY FUNCTION
-- Allows us to determine whether the logged-in user
-- is a Globe Scholars Pathways, LLC. administrator.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_report_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT is_admin
      FROM public.profiles
      WHERE id = auth.uid()
    ),
    FALSE
  );
$$;

-- ============================================================
-- USERS CAN VIEW THEIR OWN PROFILE
-- ============================================================

CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- ============================================================
-- ADMIN CAN VIEW ALL GLOBE SCHOLARS PATHWAYS, LLC. PROFILES
-- ============================================================

CREATE POLICY profiles_admin_select
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
);

-- ============================================================
-- ADMIN CAN CREATE PROFILES
-- ============================================================

CREATE POLICY profiles_admin_insert
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_report_admin()
);

-- ============================================================
-- ADMIN CAN UPDATE PROFILES
-- ============================================================

CREATE POLICY profiles_admin_update
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.is_report_admin()
)
WITH CHECK (
  public.is_report_admin()
);

-- ============================================================
-- ADMIN CAN DELETE PROFILES
-- ============================================================

CREATE POLICY profiles_admin_delete
ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.is_report_admin()
);
