-- ============================================================
-- Work Assignment Access Refinement
-- Multi-department staff should see assignments for every
-- department they are assigned to, not only their primary one.
-- Operations manages the assignment board as a department team.
-- ============================================================

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
          OR p_department = ANY(profile.assigned_departments)
        )
    ),
    FALSE
  );
$$;

DROP POLICY IF EXISTS "operations_view_created_assignments"
ON public.department_work_assignments;

CREATE POLICY "operations_view_created_assignments"
ON public.department_work_assignments
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() = 'operations'
);

DROP POLICY IF EXISTS "department_view_assigned_work"
ON public.department_work_assignments;

CREATE POLICY "department_view_assigned_work"
ON public.department_work_assignments
FOR SELECT
TO authenticated
USING (
  public.has_report_department_access(assigned_department)
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
    AND public.current_report_department() = 'operations'
  )
  OR assigned_to = auth.uid()
  OR public.has_report_department_access(assigned_department)
)
WITH CHECK (
  public.is_report_admin()
  OR (
    (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
    AND public.current_report_department() = 'operations'
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
    AND public.current_report_department() = 'operations'
  )
);
