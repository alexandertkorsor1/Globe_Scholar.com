-- ============================================================
-- Migration: Add Work Assignment Review System & RLS Policies
-- ============================================================

-- 1. Add review system columns to department_work_assignments
ALTER TABLE public.department_work_assignments
ADD COLUMN IF NOT EXISTS review_status TEXT CHECK (review_status IN ('pending', 'approved', 'revision_requested')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 2. Drop and recreate policies to support management and review workflow
DROP POLICY IF EXISTS "operations_admin_create_work_assignments" ON public.department_work_assignments;
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

DROP POLICY IF EXISTS "operations_view_created_assignments" ON public.department_work_assignments;
CREATE POLICY "operations_view_created_assignments"
ON public.department_work_assignments
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() IN ('admin', 'operations', 'management')
);

DROP POLICY IF EXISTS "authorized_update_work_assignments" ON public.department_work_assignments;
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

DROP POLICY IF EXISTS "admin_operations_delete_work_assignments" ON public.department_work_assignments;
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

-- 3. Storage insertion policies
-- Drop the existing insert policy to allow both admin and staff uploads
DROP POLICY IF EXISTS "department_reports_storage_insert" ON storage.objects;

CREATE POLICY "department_reports_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'department-reports'
  AND (
    public.is_report_admin()
    OR (
      public.is_department_report_staff()
      AND (storage.foldername(name))[1] = public.current_report_department()
      AND (storage.foldername(name))[2] = auth.uid()::TEXT
    )
  )
);
