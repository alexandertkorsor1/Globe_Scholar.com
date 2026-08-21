-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Application Workflow
-- Applications + Documents + Versions + Status History
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- APPLICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  application_number TEXT NOT NULL UNIQUE,

  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'draft',

  target_country TEXT NOT NULL,
  target_university TEXT NOT NULL,
  degree_program TEXT NOT NULL,
  intake_period TEXT NOT NULL,

  scholarship_requested TEXT,

  missing_documents_count INTEGER NOT NULL DEFAULT 0,

  admissions_decision TEXT,
  admissions_notes TEXT,

  handed_off_to_admissions BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT applications_missing_documents_check
    CHECK (missing_documents_count >= 0),

  CONSTRAINT applications_status_check
    CHECK (
      status IN (
        'draft',
        'submitted',
        'under_review',
        'documents_missing',
        'admissions_review',
        'approved',
        'rejected'
      )
    ),

  CONSTRAINT applications_admissions_decision_check
    CHECK (
      admissions_decision IS NULL
      OR admissions_decision IN (
        'conditional_offer',
        'unconditional_offer',
        'rejected',
        'pending'
      )
    )
);

CREATE INDEX IF NOT EXISTS applications_student_id_idx
  ON public.applications(student_id);

CREATE INDEX IF NOT EXISTS applications_status_idx
  ON public.applications(status);

CREATE INDEX IF NOT EXISTS applications_created_at_idx
  ON public.applications(created_at DESC);


-- ============================================================
-- APPLICATION DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  application_id UUID NOT NULL
    REFERENCES public.applications(id)
    ON DELETE CASCADE,

  document_type TEXT NOT NULL,

  file_name TEXT NOT NULL,

  storage_path TEXT NOT NULL DEFAULT '',

  file_size BIGINT NOT NULL DEFAULT 0,

  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',

  current_version INTEGER NOT NULL DEFAULT 1,

  is_missing BOOLEAN NOT NULL DEFAULT FALSE,

  is_verified BOOLEAN NOT NULL DEFAULT FALSE,

  verified_by_name TEXT,

  verified_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT application_documents_file_size_check
    CHECK (file_size >= 0),

  CONSTRAINT application_documents_version_check
    CHECK (current_version >= 1)
);

CREATE INDEX IF NOT EXISTS application_documents_application_id_idx
  ON public.application_documents(application_id);

CREATE INDEX IF NOT EXISTS application_documents_missing_idx
  ON public.application_documents(is_missing);

CREATE INDEX IF NOT EXISTS application_documents_verified_idx
  ON public.application_documents(is_verified);


-- ============================================================
-- DOCUMENT VERSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  document_id UUID NOT NULL
    REFERENCES public.application_documents(id)
    ON DELETE CASCADE,

  version_number INTEGER NOT NULL,

  storage_path TEXT NOT NULL,

  uploaded_by_name TEXT NOT NULL,

  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  change_summary TEXT NOT NULL DEFAULT '',

  CONSTRAINT document_versions_version_check
    CHECK (version_number >= 1),

  CONSTRAINT document_versions_unique_version
    UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS document_versions_document_id_idx
  ON public.document_versions(document_id);


-- ============================================================
-- APPLICATION STATUS HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  application_id UUID NOT NULL
    REFERENCES public.applications(id)
    ON DELETE CASCADE,

  from_status TEXT,

  to_status TEXT NOT NULL,

  changed_by_name TEXT NOT NULL,

  department TEXT NOT NULL,

  note TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS application_status_history_application_id_idx
  ON public.application_status_history(application_id);

CREATE INDEX IF NOT EXISTS application_status_history_created_at_idx
  ON public.application_status_history(created_at DESC);


-- ============================================================
-- UPDATED_AT HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_set_updated_at
ON public.applications;

CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STAFF ACCESS
-- ============================================================

DROP POLICY IF EXISTS "Staff can view applications"
ON public.applications;

CREATE POLICY "Staff can view applications"
ON public.applications
FOR SELECT
TO authenticated
USING (true);


DROP POLICY IF EXISTS "Staff can create applications"
ON public.applications;

CREATE POLICY "Staff can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Staff can update applications"
ON public.applications;

CREATE POLICY "Staff can update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Staff can view application documents"
ON public.application_documents;

CREATE POLICY "Staff can view application documents"
ON public.application_documents
FOR SELECT
TO authenticated
USING (true);


DROP POLICY IF EXISTS "Staff can create application documents"
ON public.application_documents;

CREATE POLICY "Staff can create application documents"
ON public.application_documents
FOR INSERT
TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Staff can update application documents"
ON public.application_documents;

CREATE POLICY "Staff can update application documents"
ON public.application_documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Staff can view document versions"
ON public.document_versions;

CREATE POLICY "Staff can view document versions"
ON public.document_versions
FOR SELECT
TO authenticated
USING (true);


DROP POLICY IF EXISTS "Staff can create document versions"
ON public.document_versions;

CREATE POLICY "Staff can create document versions"
ON public.document_versions
FOR INSERT
TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Staff can view application status history"
ON public.application_status_history;

CREATE POLICY "Staff can view application status history"
ON public.application_status_history
FOR SELECT
TO authenticated
USING (true);


DROP POLICY IF EXISTS "Staff can create application status history"
ON public.application_status_history;

CREATE POLICY "Staff can create application status history"
ON public.application_status_history
FOR INSERT
TO authenticated
WITH CHECK (true);


-- ============================================================
-- DONE
-- ============================================================
