-- ============================================================
-- REPORT.COM
-- Fix application RLS for authenticated students
-- ============================================================

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- STUDENTS: READ THEIR OWN APPLICATIONS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "students_select_own_applications"
ON public.applications;

CREATE POLICY "students_select_own_applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
);

-- ------------------------------------------------------------
-- STUDENTS: CREATE THEIR OWN APPLICATIONS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "students_insert_own_applications"
ON public.applications;

CREATE POLICY "students_insert_own_applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
);

-- ------------------------------------------------------------
-- STUDENTS: UPDATE THEIR OWN APPLICATIONS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "students_update_own_applications"
ON public.applications;

CREATE POLICY "students_update_own_applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  student_id = auth.uid()
)
WITH CHECK (
  student_id = auth.uid()
);

-- ------------------------------------------------------------
-- ADMINS / STAFF
-- ------------------------------------------------------------
-- Staff can read applications.
-- We use the profiles table to determine admin/staff access.

DROP POLICY IF EXISTS "staff_select_applications"
ON public.applications;

CREATE POLICY "staff_select_applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.is_admin = true
        OR p.account_type = 'staff'
      )
  )
);

DROP POLICY IF EXISTS "staff_update_applications"
ON public.applications;

CREATE POLICY "staff_update_applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.is_admin = true
        OR p.account_type = 'staff'
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.is_admin = true
        OR p.account_type = 'staff'
      )
  )
);
