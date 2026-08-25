-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- New Department Access + Visa/Assignment Hardening
-- ============================================================

-- Management needs executive financial read access for dashboard summaries.
DROP POLICY IF EXISTS "management_select_financial_records"
ON public.financial_records;

CREATE POLICY "management_select_financial_records"
ON public.financial_records
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() = 'management'
);

DROP POLICY IF EXISTS "management_select_payment_receipts"
ON public.payment_receipts;

CREATE POLICY "management_select_payment_receipts"
ON public.payment_receipts
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() = 'management'
);

-- Institutional Relations and Management need read-only visibility into
-- student application handoff records and documents.
DROP POLICY IF EXISTS "management_relations_select_applications"
ON public.applications;

CREATE POLICY "management_relations_select_applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() IN ('management', 'institutional_relations')
);

DROP POLICY IF EXISTS "management_relations_select_application_documents"
ON public.application_documents;

CREATE POLICY "management_relations_select_application_documents"
ON public.application_documents
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() IN ('management', 'institutional_relations')
);

DROP POLICY IF EXISTS "management_relations_select_status_history"
ON public.application_status_history;

CREATE POLICY "management_relations_select_status_history"
ON public.application_status_history
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() IN ('management', 'institutional_relations')
);

-- Student visa tables: indexes and updated_at lifecycle.
CREATE INDEX IF NOT EXISTS student_visa_applications_student_idx
  ON public.student_visa_applications(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS student_visa_applications_application_idx
  ON public.student_visa_applications(application_id);

CREATE UNIQUE INDEX IF NOT EXISTS student_visa_applications_student_application_uidx
  ON public.student_visa_applications(student_id, application_id)
  WHERE application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS student_visa_documents_application_idx
  ON public.student_visa_documents(visa_application_id, uploaded_at DESC);

DROP TRIGGER IF EXISTS student_visa_applications_set_updated_at
ON public.student_visa_applications;

CREATE TRIGGER student_visa_applications_set_updated_at
BEFORE UPDATE ON public.student_visa_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Allow executive management to view visa dossiers without giving edit rights.
DROP POLICY IF EXISTS "management_view_visa_applications"
ON public.student_visa_applications;

CREATE POLICY "management_view_visa_applications"
ON public.student_visa_applications
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() = 'management'
);

DROP POLICY IF EXISTS "management_view_visa_documents"
ON public.student_visa_documents;

CREATE POLICY "management_view_visa_documents"
ON public.student_visa_documents
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() = 'management'
);

-- Storage policies for assignment PDFs should depend on valid department
-- folders and the signed-in owner for uploads.
DROP POLICY IF EXISTS department_work_assignments_storage_select
ON storage.objects;

CREATE POLICY department_work_assignments_storage_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'department-reports'
  AND (storage.foldername(name))[3] = 'work-assignments'
  AND (
    public.is_report_admin()
    OR public.current_report_department() IN ('operations', 'management')
    OR public.has_report_department_access((storage.foldername(name))[1])
  )
);

DROP POLICY IF EXISTS department_work_assignments_storage_insert
ON storage.objects;

CREATE POLICY department_work_assignments_storage_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'department-reports'
  AND (storage.foldername(name))[3] = 'work-assignments'
  AND (storage.foldername(name))[2] = auth.uid()::TEXT
  AND public.has_report_department_access((storage.foldername(name))[1])
);

DROP POLICY IF EXISTS department_work_assignments_storage_delete
ON storage.objects;

CREATE POLICY department_work_assignments_storage_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'department-reports'
  AND (storage.foldername(name))[3] = 'work-assignments'
  AND (
    public.is_report_admin()
    OR (
      (storage.foldername(name))[2] = auth.uid()::TEXT
      AND public.has_report_department_access((storage.foldername(name))[1])
    )
  )
);
