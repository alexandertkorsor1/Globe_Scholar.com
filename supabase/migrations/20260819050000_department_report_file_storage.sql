-- Private storage for the existing Department Reporting & Administrative Review System.

CREATE OR REPLACE FUNCTION public.is_department_report_staff()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.account_type = 'staff'
        AND p.is_admin = FALSE
        AND p.department IS NOT NULL
        AND p.department <> 'admin'
      FROM public.profiles p
      WHERE p.id = auth.uid()
    ),
    FALSE
  );
$$;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'department-reports',
  'department-reports',
  FALSE,
  15728640,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS department_reports_storage_select ON storage.objects;
DROP POLICY IF EXISTS department_reports_storage_insert ON storage.objects;
DROP POLICY IF EXISTS department_reports_storage_delete ON storage.objects;

CREATE POLICY department_reports_storage_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'department-reports'
  AND (
    public.is_report_admin()
    OR (
      public.is_department_report_staff()
      AND (storage.foldername(name))[1] = public.current_report_department()
    )
  )
);

CREATE POLICY department_reports_storage_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'department-reports'
  AND public.is_department_report_staff()
  AND (storage.foldername(name))[1] = public.current_report_department()
  AND (storage.foldername(name))[2] = auth.uid()::TEXT
);

CREATE POLICY department_reports_storage_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
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
