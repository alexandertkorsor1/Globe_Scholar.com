-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Student Simulated Email Notifications Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.student_emails ENABLE ROW LEVEL SECURITY;

-- Select policy: users can select their own emails, or counseling staff / admin can see all
CREATE POLICY "Allow users to read their own emails"
  ON public.student_emails FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_report_admin()
    OR public.current_report_department() = 'counseling'
  );

-- All policy: counseling staff & admin can manage (e.g. insert) emails
CREATE POLICY "Allow counseling and admin to manage emails"
  ON public.student_emails FOR ALL
  TO authenticated
  USING (
    public.is_report_admin()
    OR public.current_report_department() = 'counseling'
  )
  WITH CHECK (
    public.is_report_admin()
    OR public.current_report_department() = 'counseling'
  );
