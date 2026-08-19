-- ============================================================
-- Cross-department communications
-- Every message is retained in a department-scoped inbox. Staff may send to
-- other departments; students may only submit application/payment notices to
-- Admissions or Finance. The recipient marks its own messages as read.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.department_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_department TEXT NOT NULL,
  recipient_department TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT department_communications_sender_department_check CHECK (
    sender_department IN (
      'admin', 'marketing', 'admissions', 'counseling',
      'data_applications', 'operations', 'finance', 'country_directors',
      'it_support', 'legal_compliance', 'alumni_success'
    )
  ),
  CONSTRAINT department_communications_recipient_department_check CHECK (
    recipient_department IN (
      'all', 'admin', 'marketing', 'admissions', 'counseling',
      'data_applications', 'operations', 'finance', 'country_directors',
      'it_support', 'legal_compliance', 'alumni_success'
    )
  ),
  CONSTRAINT department_communications_type_check CHECK (
    type IN ('notification', 'task', 'alert', 'message', 'escalation')
  ),
  CONSTRAINT department_communications_priority_check CHECK (
    priority IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT department_communications_title_check CHECK (
    char_length(BTRIM(title)) BETWEEN 3 AND 180
  ),
  CONSTRAINT department_communications_body_check CHECK (
    char_length(BTRIM(body)) BETWEEN 3 AND 5000
  )
);

CREATE INDEX IF NOT EXISTS department_communications_recipient_idx
  ON public.department_communications(recipient_department, created_at DESC);

CREATE INDEX IF NOT EXISTS department_communications_sender_idx
  ON public.department_communications(sender_id, created_at DESC);

ALTER TABLE public.department_communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "department_communications_view_scoped" ON public.department_communications;
CREATE POLICY "department_communications_view_scoped"
ON public.department_communications
FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid()
  OR recipient_department = 'all'
  OR recipient_department = public.current_report_department()
  OR public.is_report_admin()
);

DROP POLICY IF EXISTS "department_communications_create_scoped" ON public.department_communications;
CREATE POLICY "department_communications_create_scoped"
ON public.department_communications
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_department = public.current_report_department()
  AND (
    recipient_department <> 'all'
    OR public.is_report_admin()
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = auth.uid()
      AND (
        profile.is_admin = TRUE
        OR profile.account_type = 'staff'
        OR (
          profile.account_type = 'student'
          AND recipient_department IN ('admissions', 'finance')
          AND type = 'notification'
        )
      )
  )
);

CREATE OR REPLACE FUNCTION public.mark_department_communication_read(
  p_communication_id UUID
)
RETURNS public.department_communications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  communication_record public.department_communications;
BEGIN
  SELECT *
  INTO communication_record
  FROM public.department_communications
  WHERE id = p_communication_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Communication not found.';
  END IF;

  IF NOT (
    public.is_report_admin()
    OR communication_record.recipient_department = 'all'
    OR communication_record.recipient_department = public.current_report_department()
  ) THEN
    RAISE EXCEPTION 'You are not permitted to update this communication.';
  END IF;

  UPDATE public.department_communications
  SET is_read = TRUE,
      read_at = COALESCE(read_at, NOW())
  WHERE id = p_communication_id
  RETURNING * INTO communication_record;

  RETURN communication_record;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_department_communication_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_department_communication_read(UUID) TO authenticated;
