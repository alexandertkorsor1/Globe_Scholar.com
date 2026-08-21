-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Department Reporting & Administrative Review System
-- ============================================================

-- ============================================================
-- 1. DEPARTMENT REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.department_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  department TEXT NOT NULL,

  submitted_by UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,

  report_type TEXT NOT NULL DEFAULT 'monthly',

  title TEXT NOT NULL,

  reporting_period_start DATE NOT NULL,

  reporting_period_end DATE NOT NULL,

  executive_summary TEXT,

  key_activities TEXT,

  achievements TEXT,

  challenges TEXT,

  recommendations TEXT,

  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,

  status TEXT NOT NULL DEFAULT 'draft',

  submitted_at TIMESTAMPTZ,

  reviewed_at TIMESTAMPTZ,

  reviewed_by UUID
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  review_comment TEXT,

  revision_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT department_reports_department_check
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
  ),

  CONSTRAINT department_reports_status_check
  CHECK (
    status IN (
      'draft',
      'submitted',
      'under_review',
      'needs_revision',
      'resubmitted',
      'approved',
      'archived'
    )
  ),

  CONSTRAINT department_reports_period_check
  CHECK (
    reporting_period_end >= reporting_period_start
  )
);

-- ============================================================
-- 2. REPORT COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_id UUID NOT NULL
    REFERENCES public.department_reports(id)
    ON DELETE CASCADE,

  author_id UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,

  comment TEXT NOT NULL,

  is_internal BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. REPORT ATTACHMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.report_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_id UUID NOT NULL
    REFERENCES public.department_reports(id)
    ON DELETE CASCADE,

  uploaded_by UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,

  file_name TEXT NOT NULL,

  storage_path TEXT NOT NULL,

  file_size BIGINT,

  mime_type TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. REPORT ACTIVITY / AUDIT TRAIL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.report_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_id UUID NOT NULL
    REFERENCES public.department_reports(id)
    ON DELETE CASCADE,

  actor_id UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,

  action TEXT NOT NULL,

  from_status TEXT,

  to_status TEXT,

  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_department_reports_department
ON public.department_reports(department);

CREATE INDEX IF NOT EXISTS idx_department_reports_status
ON public.department_reports(status);

CREATE INDEX IF NOT EXISTS idx_department_reports_submitted_by
ON public.department_reports(submitted_by);

CREATE INDEX IF NOT EXISTS idx_department_reports_period
ON public.department_reports(
  reporting_period_start,
  reporting_period_end
);

CREATE INDEX IF NOT EXISTS idx_department_reports_created_at
ON public.department_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_comments_report
ON public.report_comments(report_id);

CREATE INDEX IF NOT EXISTS idx_report_attachments_report
ON public.report_attachments(report_id);

CREATE INDEX IF NOT EXISTS idx_report_activity_report
ON public.report_activity(report_id);

CREATE INDEX IF NOT EXISTS idx_report_activity_created
ON public.report_activity(created_at DESC);

-- ============================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_report_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS department_reports_updated_at
ON public.department_reports;

CREATE TRIGGER department_reports_updated_at
BEFORE UPDATE ON public.department_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_report_updated_at();

DROP TRIGGER IF EXISTS report_comments_updated_at
ON public.report_comments;

CREATE TRIGGER report_comments_updated_at
BEFORE UPDATE ON public.report_comments
FOR EACH ROW
EXECUTE FUNCTION public.set_report_updated_at();

-- ============================================================
-- 7. ENABLE RLS
-- ============================================================

ALTER TABLE public.department_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_activity ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. DEPARTMENT REPORT SELECT
--
-- Admin:
--   Can see everything.
--
-- Staff:
--   Can see reports belonging to their department.
--
-- Students:
--   Cannot access departmental reports.
-- ============================================================

DROP POLICY IF EXISTS department_reports_select
ON public.department_reports;

CREATE POLICY department_reports_select
ON public.department_reports
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR (
    (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
    AND department = public.current_report_department()
  )
);

-- ============================================================
-- 9. CREATE REPORT
--
-- Staff can only create reports for their own department.
-- Admin can create reports for any department.
-- ============================================================

DROP POLICY IF EXISTS department_reports_insert
ON public.department_reports;

CREATE POLICY department_reports_insert
ON public.department_reports
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_report_admin()
  OR (
    submitted_by = auth.uid()
    AND department = public.current_report_department()
    AND (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  )
);

-- ============================================================
-- 10. UPDATE REPORT
--
-- Staff:
--   Own department
--   Own reports
--   Only while draft / needs_revision / resubmitted
--
-- Admin:
--   Full control
-- ============================================================

DROP POLICY IF EXISTS department_reports_update
ON public.department_reports;

CREATE POLICY department_reports_update
ON public.department_reports
FOR UPDATE
TO authenticated
USING (
  public.is_report_admin()
  OR (
    submitted_by = auth.uid()
    AND department = public.current_report_department()
    AND status IN (
      'draft',
      'needs_revision',
      'resubmitted'
    )
  )
)
WITH CHECK (
  public.is_report_admin()
  OR (
    submitted_by = auth.uid()
    AND department = public.current_report_department()
    AND status IN (
      'draft',
      'submitted',
      'resubmitted'
    )
  )
);

-- ============================================================
-- 11. DELETE
--
-- Staff can delete only their own drafts.
-- Admin can delete anything.
-- ============================================================

DROP POLICY IF EXISTS department_reports_delete
ON public.department_reports;

CREATE POLICY department_reports_delete
ON public.department_reports
FOR DELETE
TO authenticated
USING (
  public.is_report_admin()
  OR (
    submitted_by = auth.uid()
    AND department = public.current_report_department()
    AND status = 'draft'
  )
);

-- ============================================================
-- 12. COMMENTS
-- ============================================================

DROP POLICY IF EXISTS report_comments_select
ON public.report_comments;

CREATE POLICY report_comments_select
ON public.report_comments
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.department_reports r
    WHERE r.id = report_comments.report_id
      AND r.department = public.current_report_department()
  )
);

DROP POLICY IF EXISTS report_comments_insert
ON public.report_comments;

CREATE POLICY report_comments_insert
ON public.report_comments
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (
    public.is_report_admin()
    OR EXISTS (
      SELECT 1
      FROM public.department_reports r
      WHERE r.id = report_comments.report_id
        AND r.department = public.current_report_department()
    )
  )
);

-- ============================================================
-- 13. ATTACHMENTS
-- ============================================================

DROP POLICY IF EXISTS report_attachments_select
ON public.report_attachments;

CREATE POLICY report_attachments_select
ON public.report_attachments
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.department_reports r
    WHERE r.id = report_attachments.report_id
      AND r.department = public.current_report_department()
  )
);

DROP POLICY IF EXISTS report_attachments_insert
ON public.report_attachments;

CREATE POLICY report_attachments_insert
ON public.report_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND (
    public.is_report_admin()
    OR EXISTS (
      SELECT 1
      FROM public.department_reports r
      WHERE r.id = report_attachments.report_id
        AND r.department = public.current_report_department()
        AND r.status IN ('draft', 'needs_revision', 'resubmitted')
    )
  )
);

-- ============================================================
-- 14. ACTIVITY LOG
--
-- Activity is readable but never directly editable by clients.
-- We'll insert through trusted application actions.
-- ============================================================

DROP POLICY IF EXISTS report_activity_select
ON public.report_activity;

CREATE POLICY report_activity_select
ON public.report_activity
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR EXISTS (
    SELECT 1
    FROM public.department_reports r
    WHERE r.id = report_activity.report_id
      AND r.department = public.current_report_department()
  )
);

-- ============================================================
-- 15. STATUS TRANSITION FUNCTION
--
-- Centralizes report workflow.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_department_report_status(
  p_report_id UUID,
  p_new_status TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS public.department_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report public.department_reports;
  v_old_status TEXT;
BEGIN

  SELECT *
  INTO v_report
  FROM public.department_reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;

  v_old_status := v_report.status;

  -- ----------------------------------------------------------
  -- Permission checks
  -- ----------------------------------------------------------

  IF NOT public.is_report_admin() THEN

    IF v_report.submitted_by <> auth.uid() THEN
      RAISE EXCEPTION 'You can only modify your own reports';
    END IF;

    IF v_report.department <> public.current_report_department() THEN
      RAISE EXCEPTION 'You cannot modify reports from another department';
    END IF;

  END IF;

  -- ----------------------------------------------------------
  -- Validate transitions
  -- ----------------------------------------------------------

  IF p_new_status = 'submitted'
     AND v_old_status NOT IN ('draft', 'needs_revision') THEN
    RAISE EXCEPTION 'Report cannot be submitted from status %', v_old_status;
  END IF;

  IF p_new_status = 'resubmitted'
     AND v_old_status <> 'needs_revision' THEN
    RAISE EXCEPTION 'Only reports requiring revision can be resubmitted';
  END IF;

  IF p_new_status = 'under_review'
     AND NOT public.is_report_admin() THEN
    RAISE EXCEPTION 'Only administrators can place reports under review';
  END IF;

  IF p_new_status = 'approved'
     AND NOT public.is_report_admin() THEN
    RAISE EXCEPTION 'Only administrators can approve reports';
  END IF;

  IF p_new_status = 'archived'
     AND NOT public.is_report_admin() THEN
    RAISE EXCEPTION 'Only administrators can archive reports';
  END IF;

  -- ----------------------------------------------------------
  -- Update report
  -- ----------------------------------------------------------

  UPDATE public.department_reports
  SET
    status = p_new_status,
    submitted_at = CASE
      WHEN p_new_status IN ('submitted', 'resubmitted')
        THEN COALESCE(submitted_at, NOW())
      ELSE submitted_at
    END,
    reviewed_at = CASE
      WHEN p_new_status IN (
        'under_review',
        'needs_revision',
        'approved'
      )
      THEN NOW()
      ELSE reviewed_at
    END,
    reviewed_by = CASE
      WHEN public.is_report_admin()
       AND p_new_status IN (
        'under_review',
        'needs_revision',
        'approved'
       )
      THEN auth.uid()
      ELSE reviewed_by
    END,
    review_comment = CASE
      WHEN p_comment IS NOT NULL
      THEN p_comment
      ELSE review_comment
    END,
    revision_count = CASE
      WHEN p_new_status = 'needs_revision'
      THEN revision_count + 1
      ELSE revision_count
    END
  WHERE id = p_report_id
  RETURNING *
  INTO v_report;

  -- ----------------------------------------------------------
  -- Activity record
  -- ----------------------------------------------------------

  INSERT INTO public.report_activity (
    report_id,
    actor_id,
    action,
    from_status,
    to_status,
    details
  )
  VALUES (
    p_report_id,
    auth.uid(),
    'status_change',
    v_old_status,
    p_new_status,
    jsonb_build_object(
      'comment',
      p_comment
    )
  );

  RETURN v_report;

END;
$$;

-- ============================================================
-- 16. SECURITY
-- ============================================================

REVOKE ALL
ON FUNCTION public.update_department_report_status(UUID, TEXT, TEXT)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.update_department_report_status(UUID, TEXT, TEXT)
TO authenticated;

-- ============================================================
-- END
-- ============================================================
