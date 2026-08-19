-- ============================================================
-- Student payment workflow
-- A student can submit one registration-fee payment confirmation. Finance
-- verifies it, while Admissions can see its status for application review.
-- No card details are ever stored in this application database.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  application_number TEXT NOT NULL,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  record_type TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT UNIQUE,
  approved_by_name TEXT,
  notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT financial_records_type_check CHECK (
    record_type IN (
      'registration_fee',
      'scholarship_disbursement',
      'refund',
      'operational_spend'
    )
  ),
  CONSTRAINT financial_records_status_check CHECK (
    status IN ('pending', 'paid', 'approved', 'rejected')
  ),
  CONSTRAINT financial_records_amount_check CHECK (amount > 0),
  CONSTRAINT financial_records_currency_check CHECK (char_length(currency) = 3)
);

CREATE INDEX IF NOT EXISTS financial_records_application_id_idx
  ON public.financial_records(application_id);

CREATE INDEX IF NOT EXISTS financial_records_student_id_idx
  ON public.financial_records(student_id);

CREATE INDEX IF NOT EXISTS financial_records_status_idx
  ON public.financial_records(status, created_at DESC);

DROP TRIGGER IF EXISTS financial_records_set_updated_at ON public.financial_records;

CREATE TRIGGER financial_records_set_updated_at
BEFORE UPDATE ON public.financial_records
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_own_financial_records" ON public.financial_records;
CREATE POLICY "students_select_own_financial_records"
ON public.financial_records
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "students_submit_own_registration_fee" ON public.financial_records;
CREATE POLICY "students_submit_own_registration_fee"
ON public.financial_records
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND record_type = 'registration_fee'
  AND status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.applications application
    WHERE application.id = financial_records.application_id
      AND application.student_id = auth.uid()
      AND application.application_number = financial_records.application_number
  )
);

DROP POLICY IF EXISTS "finance_and_admin_manage_financial_records" ON public.financial_records;
CREATE POLICY "finance_and_admin_manage_financial_records"
ON public.financial_records
FOR ALL
TO authenticated
USING (
  public.is_report_admin()
  OR public.current_report_department() = 'finance'
)
WITH CHECK (
  public.is_report_admin()
  OR public.current_report_department() = 'finance'
);

DROP POLICY IF EXISTS "admissions_view_registration_fee_status" ON public.financial_records;
CREATE POLICY "admissions_view_registration_fee_status"
ON public.financial_records
FOR SELECT
TO authenticated
USING (
  public.current_report_department() = 'admissions'
  AND record_type = 'registration_fee'
);
