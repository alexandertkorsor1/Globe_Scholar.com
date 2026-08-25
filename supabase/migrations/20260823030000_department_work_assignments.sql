-- ============================================================
-- Department Work Assignment System
-- Operations -> Department -> Staff
-- ============================================================

CREATE TABLE IF NOT EXISTS public.department_work_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  assignment_number TEXT NOT NULL UNIQUE,

  title TEXT NOT NULL,
  description TEXT,

  assigned_department TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (
      status IN (
        'assigned',
        'in_progress',
        'completed',
        'overdue',
        'cancelled'
      )
    ),

  due_date TIMESTAMPTZ,

  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.department_work_assignments
DROP CONSTRAINT IF EXISTS department_work_assignments_department_check;

ALTER TABLE public.department_work_assignments
ADD CONSTRAINT department_work_assignments_department_check
CHECK (
  assigned_department IN (
    'admin',
    'marketing',
    'admissions',
    'counseling',
    'data_applications',
    'operations',
    'finance',
    'country_directors'
  )
);

ALTER TABLE public.department_work_assignments
DROP CONSTRAINT IF EXISTS department_work_assignments_title_check;

ALTER TABLE public.department_work_assignments
ADD CONSTRAINT department_work_assignments_title_check
CHECK (char_length(BTRIM(title)) BETWEEN 3 AND 180);

ALTER TABLE public.department_work_assignments
DROP CONSTRAINT IF EXISTS department_work_assignments_description_check;

ALTER TABLE public.department_work_assignments
ADD CONSTRAINT department_work_assignments_description_check
CHECK (description IS NULL OR char_length(BTRIM(description)) <= 5000);


-- ============================================================
-- Comments / communication attached to an assignment
-- ============================================================

CREATE TABLE IF NOT EXISTS public.department_work_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  assignment_id UUID NOT NULL
    REFERENCES public.department_work_assignments(id)
    ON DELETE CASCADE,

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  comment TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.department_work_comments
DROP CONSTRAINT IF EXISTS department_work_comments_comment_check;

ALTER TABLE public.department_work_comments
ADD CONSTRAINT department_work_comments_comment_check
CHECK (char_length(BTRIM(comment)) BETWEEN 1 AND 5000);


-- ============================================================
-- Assignment attachments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.department_work_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  assignment_id UUID NOT NULL
    REFERENCES public.department_work_assignments(id)
    ON DELETE CASCADE,

  uploaded_by UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.department_work_attachments
DROP CONSTRAINT IF EXISTS department_work_attachments_file_size_check;

ALTER TABLE public.department_work_attachments
ADD CONSTRAINT department_work_attachments_file_size_check
CHECK (file_size IS NULL OR file_size >= 0);


-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_work_assignments_department
  ON public.department_work_assignments(assigned_department);

CREATE INDEX IF NOT EXISTS idx_work_assignments_assigned_to
  ON public.department_work_assignments(assigned_to);

CREATE INDEX IF NOT EXISTS idx_work_assignments_created_by
  ON public.department_work_assignments(created_by);

CREATE INDEX IF NOT EXISTS idx_work_assignments_status
  ON public.department_work_assignments(status);

CREATE INDEX IF NOT EXISTS idx_work_assignments_due_date
  ON public.department_work_assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_work_comments_assignment
  ON public.department_work_comments(assignment_id);

CREATE INDEX IF NOT EXISTS idx_work_attachments_assignment
  ON public.department_work_attachments(assignment_id);


-- ============================================================
-- Assignment number + updated-at trigger
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.department_work_assignment_seq;

CREATE OR REPLACE FUNCTION public.prepare_department_work_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.title := BTRIM(NEW.title);
  NEW.description := NULLIF(BTRIM(COALESCE(NEW.description, '')), '');

  IF NEW.assignment_number IS NULL OR BTRIM(NEW.assignment_number) = '' THEN
    NEW.assignment_number := 'WA-' ||
      TO_CHAR(COALESCE(NEW.created_at, NOW()), 'YYYYMMDD') ||
      '-' ||
      LPAD(NEXTVAL('public.department_work_assignment_seq')::TEXT, 6, '0');
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;

  IF NEW.status <> 'completed' THEN
    NEW.completed_at := NULL;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_department_work_updated_at
ON public.department_work_assignments;

DROP TRIGGER IF EXISTS trg_prepare_department_work_assignment
ON public.department_work_assignments;

CREATE TRIGGER trg_prepare_department_work_assignment
BEFORE INSERT OR UPDATE ON public.department_work_assignments
FOR EACH ROW
EXECUTE FUNCTION public.prepare_department_work_assignment();


-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.department_work_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_work_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_work_attachments ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Assignment policies
-- ============================================================

-- Operations/Admin can create assignments.
DROP POLICY IF EXISTS "operations_admin_create_work_assignments"
ON public.department_work_assignments;

CREATE POLICY "operations_admin_create_work_assignments"
ON public.department_work_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND public.current_report_department() IN ('admin', 'operations')
  AND assigned_department IN (
    'admin',
    'marketing',
    'admissions',
    'counseling',
    'data_applications',
    'operations',
    'finance',
    'country_directors'
  )
);


-- Admin can see everything.
DROP POLICY IF EXISTS "admin_view_all_work_assignments"
ON public.department_work_assignments;

CREATE POLICY "admin_view_all_work_assignments"
ON public.department_work_assignments
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff' AND public.current_report_department() = 'admin'
);


-- Operations can see assignments they created.
DROP POLICY IF EXISTS "operations_view_created_assignments"
ON public.department_work_assignments;

CREATE POLICY "operations_view_created_assignments"
ON public.department_work_assignments
FOR SELECT
TO authenticated
USING (
  public.current_report_department() = 'operations'
  AND created_by = auth.uid()
);


-- Assigned staff member can see their assignment.
DROP POLICY IF EXISTS "assigned_staff_view_work"
ON public.department_work_assignments;

CREATE POLICY "assigned_staff_view_work"
ON public.department_work_assignments
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid()
);


-- Department members can see work assigned to their department.
DROP POLICY IF EXISTS "department_view_assigned_work"
ON public.department_work_assignments;

CREATE POLICY "department_view_assigned_work"
ON public.department_work_assignments
FOR SELECT
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND LOWER(p.department::text) = LOWER(
        department_work_assignments.assigned_department
      )
  )
);


-- Admin / Operations / assigned staff can update.
DROP POLICY IF EXISTS "authorized_update_work_assignments"
ON public.department_work_assignments;

CREATE POLICY "authorized_update_work_assignments"
ON public.department_work_assignments
FOR UPDATE
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff' AND public.current_report_department() = 'admin'
  OR (
    public.current_report_department() = 'operations'
    AND created_by = auth.uid()
  )
  OR assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND LOWER(p.department::text) = LOWER(
        department_work_assignments.assigned_department
      )
  )
)
WITH CHECK (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff' AND public.current_report_department() = 'admin'
  OR (
    public.current_report_department() = 'operations'
    AND created_by = auth.uid()
  )
  OR assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND LOWER(p.department::text) = LOWER(
        department_work_assignments.assigned_department
      )
  )
);


-- Admin/Operations can delete assignments.
DROP POLICY IF EXISTS "admin_operations_delete_work_assignments"
ON public.department_work_assignments;

CREATE POLICY "admin_operations_delete_work_assignments"
ON public.department_work_assignments
FOR DELETE
TO authenticated
USING (
  (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'staff' AND public.current_report_department() = 'admin'
  OR (
    public.current_report_department() = 'operations'
    AND created_by = auth.uid()
  )
);


-- ============================================================
-- Comments
-- ============================================================

DROP POLICY IF EXISTS "work_comment_view"
ON public.department_work_comments;

CREATE POLICY "work_comment_view"
ON public.department_work_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.department_work_assignments a
    WHERE a.id = assignment_id
  )
);


DROP POLICY IF EXISTS "work_comment_create"
ON public.department_work_comments;

CREATE POLICY "work_comment_create"
ON public.department_work_comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.department_work_assignments a
    WHERE a.id = assignment_id
  )
);


-- ============================================================
-- Attachments
-- ============================================================

DROP POLICY IF EXISTS "work_attachment_view"
ON public.department_work_attachments;

CREATE POLICY "work_attachment_view"
ON public.department_work_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.department_work_assignments a
    WHERE a.id = assignment_id
  )
);


DROP POLICY IF EXISTS "work_attachment_create"
ON public.department_work_attachments;

CREATE POLICY "work_attachment_create"
ON public.department_work_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.department_work_assignments a
    WHERE a.id = assignment_id
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.department_work_assignments
TO authenticated;

GRANT SELECT, INSERT
ON public.department_work_comments, public.department_work_attachments
TO authenticated;

GRANT USAGE
ON SEQUENCE public.department_work_assignment_seq
TO authenticated;
