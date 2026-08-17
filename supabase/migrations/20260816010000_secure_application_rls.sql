-- ============================================================
-- REPORT.COM
-- Secure Application Workflow RLS
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
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


CREATE OR REPLACE FUNCTION public.current_report_department()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT department
  FROM public.profiles
  WHERE id = auth.uid();
$$;


-- ============================================================
-- APPLICATIONS
-- ============================================================

DROP POLICY IF EXISTS "Staff can view applications"
ON public.applications;

DROP POLICY IF EXISTS "Staff can create applications"
ON public.applications;

DROP POLICY IF EXISTS "Staff can update applications"
ON public.applications;


-- ADMIN + STAFF + APPLICATION OWNER CAN VIEW
CREATE POLICY "Secure staff can view applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR student_id = auth.uid()
  OR public.current_report_department() IN (
    'marketing',
    'admissions',
    'counseling',
    'data_applications',
    'operations',
    'finance',
    'country_directors'
  )
);


-- AUTHENTICATED STAFF CAN CREATE APPLICATIONS
CREATE POLICY "Secure staff can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_report_admin()
  OR student_id = auth.uid()
  OR public.current_report_department() IN (
    'marketing',
    'admissions',
    'counseling',
    'data_applications',
    'operations',
    'country_directors'
  )
);


-- ADMIN OR AUTHORIZED STAFF CAN UPDATE
CREATE POLICY "Secure staff can update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  public.is_report_admin()
  OR student_id = auth.uid()
  OR public.current_report_department() IN (
    'marketing',
    'admissions',
    'counseling',
    'data_applications',
    'operations',
    'country_directors'
  )
)
WITH CHECK (
  public.is_report_admin()
  OR student_id = auth.uid()
  OR public.current_report_department() IN (
    'marketing',
    'admissions',
    'counseling',
    'data_applications',
    'operations',
    'country_directors'
  )
);


-- ============================================================
-- APPLICATION DOCUMENTS
-- ============================================================

DROP POLICY IF EXISTS "Staff can view application documents"
ON public.application_documents;

DROP POLICY IF EXISTS "Staff can create application documents"
ON public.application_documents;

DROP POLICY IF EXISTS "Staff can update application documents"
ON public.application_documents;


CREATE POLICY "Secure staff can view application documents"
ON public.application_documents
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = application_documents.application_id
      AND (
        a.student_id = auth.uid()
        OR public.current_report_department() IN (
          'marketing',
          'admissions',
          'counseling',
          'data_applications',
          'operations',
          'country_directors'
        )
      )
  )
);


CREATE POLICY "Secure staff can create application documents"
ON public.application_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = application_documents.application_id
      AND (
        a.student_id = auth.uid()
        OR public.current_report_department() IN (
          'admissions',
          'counseling',
          'data_applications',
          'operations',
          'country_directors'
        )
      )
  )
);


CREATE POLICY "Secure staff can update application documents"
ON public.application_documents
FOR UPDATE
TO authenticated
USING (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = application_documents.application_id
      AND (
        a.student_id = auth.uid()
        OR public.current_report_department() IN (
          'admissions',
          'counseling',
          'data_applications',
          'operations',
          'country_directors'
        )
      )
  )
)
WITH CHECK (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = application_documents.application_id
      AND (
        a.student_id = auth.uid()
        OR public.current_report_department() IN (
          'admissions',
          'counseling',
          'data_applications',
          'operations',
          'country_directors'
        )
      )
  )
);


-- ============================================================
-- DOCUMENT VERSIONS
-- ============================================================

DROP POLICY IF EXISTS "Staff can view document versions"
ON public.document_versions;

DROP POLICY IF EXISTS "Staff can create document versions"
ON public.document_versions;


CREATE POLICY "Secure staff can view document versions"
ON public.document_versions
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.application_documents d
    JOIN public.applications a
      ON a.id = d.application_id
    WHERE d.id = document_versions.document_id
      AND (
        a.student_id = auth.uid()
        OR public.current_report_department() IN (
          'admissions',
          'counseling',
          'data_applications',
          'operations',
          'country_directors'
        )
      )
  )
);


CREATE POLICY "Secure staff can create document versions"
ON public.document_versions
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.application_documents d
    JOIN public.applications a
      ON a.id = d.application_id
    WHERE d.id = document_versions.document_id
      AND (
        a.student_id = auth.uid()
        OR public.current_report_department() IN (
          'admissions',
          'counseling',
          'data_applications',
          'operations',
          'country_directors'
        )
      )
  )
);


-- ============================================================
-- APPLICATION STATUS HISTORY
-- ============================================================

DROP POLICY IF EXISTS "Staff can view application status history"
ON public.application_status_history;

DROP POLICY IF EXISTS "Staff can create application status history"
ON public.application_status_history;


CREATE POLICY "Secure staff can view application status history"
ON public.application_status_history
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = application_status_history.application_id
      AND (
        a.student_id = auth.uid()
        OR public.current_report_department() IN (
          'admissions',
          'counseling',
          'data_applications',
          'operations',
          'country_directors'
        )
      )
  )
);


CREATE POLICY "Secure staff can create application status history"
ON public.application_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = application_status_history.application_id
      AND (
        a.student_id = auth.uid()
        OR public.current_report_department() IN (
          'admissions',
          'counseling',
          'data_applications',
          'operations',
          'country_directors'
        )
      )
  )
);


-- ============================================================
-- DONE
-- ============================================================
