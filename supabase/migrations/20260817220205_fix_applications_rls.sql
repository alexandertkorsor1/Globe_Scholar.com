ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_own_applications"
ON public.applications;

CREATE POLICY "students_select_own_applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
);

DROP POLICY IF EXISTS "students_insert_own_applications"
ON public.applications;

CREATE POLICY "students_insert_own_applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
);

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
