-- Migration: Add Student Visa Application & Document System

-- 1. Create visa applications table
CREATE TABLE IF NOT EXISTS public.student_visa_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admissions_instructions TEXT DEFAULT 'Please upload your biometric passport page, bank statements or official financial sponsorship letter, visa application form, and admissions offer letter.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create visa documents table
CREATE TABLE IF NOT EXISTS public.student_visa_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_application_id UUID NOT NULL REFERENCES public.student_visa_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.student_visa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_visa_documents ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS policies on student_visa_applications
DROP POLICY IF EXISTS "students_view_own_visa_application" ON public.student_visa_applications;
CREATE POLICY "students_view_own_visa_application"
ON public.student_visa_applications
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
  OR public.is_report_admin()
  OR public.current_report_department() = 'admissions'
);

DROP POLICY IF EXISTS "students_create_own_visa_application" ON public.student_visa_applications;
CREATE POLICY "students_create_own_visa_application"
ON public.student_visa_applications
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.financial_records
    WHERE student_id = auth.uid()
      AND record_type = 'registration_fee'
      AND status = 'paid'
  )
);

DROP POLICY IF EXISTS "authorized_update_visa_application" ON public.student_visa_applications;
CREATE POLICY "authorized_update_visa_application"
ON public.student_visa_applications
FOR UPDATE
TO authenticated
USING (
  student_id = auth.uid()
  OR public.is_report_admin()
  OR public.current_report_department() = 'admissions'
)
WITH CHECK (
  student_id = auth.uid()
  OR public.is_report_admin()
  OR public.current_report_department() = 'admissions'
);

-- 5. Set up RLS policies on student_visa_documents
DROP POLICY IF EXISTS "view_visa_documents" ON public.student_visa_documents;
CREATE POLICY "view_visa_documents"
ON public.student_visa_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_visa_applications
    WHERE id = visa_application_id
      AND (
        student_id = auth.uid()
        OR public.is_report_admin()
        OR public.current_report_department() = 'admissions'
      )
  )
);

DROP POLICY IF EXISTS "create_visa_documents" ON public.student_visa_documents;
CREATE POLICY "create_visa_documents"
ON public.student_visa_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.student_visa_applications
    WHERE id = visa_application_id
      AND student_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.financial_records
        WHERE student_id = auth.uid()
          AND record_type = 'registration_fee'
          AND status = 'paid'
      )
  )
);

DROP POLICY IF EXISTS "delete_visa_documents" ON public.student_visa_documents;
CREATE POLICY "delete_visa_documents"
ON public.student_visa_documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_visa_applications
    WHERE id = visa_application_id
      AND student_id = auth.uid()
  )
);

-- 6. Storage security policies for visa uploads
DROP POLICY IF EXISTS "student_visa_storage_select" ON storage.objects;
CREATE POLICY "student_visa_storage_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'department-reports'
  AND (storage.foldername(name))[1] = 'visa-applications'
  AND (
    public.is_report_admin()
    OR public.current_report_department() = 'admissions'
    OR (storage.foldername(name))[2] = auth.uid()::TEXT
  )
);

DROP POLICY IF EXISTS "student_visa_storage_insert" ON storage.objects;
CREATE POLICY "student_visa_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'department-reports'
  AND (storage.foldername(name))[1] = 'visa-applications'
  AND (storage.foldername(name))[2] = auth.uid()::TEXT
  AND EXISTS (
    SELECT 1 FROM public.financial_records
    WHERE student_id = auth.uid()
      AND record_type = 'registration_fee'
      AND status = 'paid'
  )
);

DROP POLICY IF EXISTS "student_visa_storage_delete" ON storage.objects;
CREATE POLICY "student_visa_storage_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'department-reports'
  AND (storage.foldername(name))[1] = 'visa-applications'
  AND (storage.foldername(name))[2] = auth.uid()::TEXT
);
