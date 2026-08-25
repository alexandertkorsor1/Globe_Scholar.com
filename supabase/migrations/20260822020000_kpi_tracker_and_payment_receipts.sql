-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- KPI performance tracker + Finance payment receipts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.department_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_period TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  staff_email TEXT,
  department TEXT NOT NULL,
  role_title TEXT NOT NULL,
  kpi_lead_management INTEGER NOT NULL DEFAULT 0,
  kpi_conversion INTEGER NOT NULL DEFAULT 0,
  kpi_communications INTEGER NOT NULL DEFAULT 0,
  kpi_reporting INTEGER NOT NULL DEFAULT 0,
  kpi_teamwork INTEGER NOT NULL DEFAULT 0,
  kpi_discipline INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER GENERATED ALWAYS AS (
    kpi_lead_management +
    kpi_conversion +
    kpi_communications +
    kpi_reporting +
    kpi_teamwork +
    kpi_discipline
  ) STORED,
  rating TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (
        kpi_lead_management + kpi_conversion + kpi_communications +
        kpi_reporting + kpi_teamwork + kpi_discipline
      ) >= 90 THEN 'Excellent'
      WHEN (
        kpi_lead_management + kpi_conversion + kpi_communications +
        kpi_reporting + kpi_teamwork + kpi_discipline
      ) >= 80 THEN 'Very Good'
      WHEN (
        kpi_lead_management + kpi_conversion + kpi_communications +
        kpi_reporting + kpi_teamwork + kpi_discipline
      ) >= 70 THEN 'Good'
      WHEN (
        kpi_lead_management + kpi_conversion + kpi_communications +
        kpi_reporting + kpi_teamwork + kpi_discipline
      ) >= 60 THEN 'Needs Improvement'
      ELSE 'Formal Review'
    END
  ) STORED,
  daily_report_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  weekly_report_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  monthly_report_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  consecutive_missed_reports INTEGER NOT NULL DEFAULT 0,
  formal_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  notes_actions TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT department_kpis_department_check CHECK (
    department IN (
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors'
    )
  ),
  CONSTRAINT department_kpis_score_bounds_check CHECK (
    kpi_lead_management BETWEEN 0 AND 20
    AND kpi_conversion BETWEEN 0 AND 25
    AND kpi_communications BETWEEN 0 AND 15
    AND kpi_reporting BETWEEN 0 AND 15
    AND kpi_teamwork BETWEEN 0 AND 10
    AND kpi_discipline BETWEEN 0 AND 15
    AND consecutive_missed_reports >= 0
  )
);

CREATE INDEX IF NOT EXISTS department_kpis_department_idx
  ON public.department_kpis(department, created_at DESC);

CREATE INDEX IF NOT EXISTS department_kpis_period_idx
  ON public.department_kpis(evaluation_period, department);

DROP TRIGGER IF EXISTS department_kpis_set_updated_at ON public.department_kpis;

CREATE TRIGGER department_kpis_set_updated_at
BEFORE UPDATE ON public.department_kpis
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.department_kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "department_kpis_scoped_select" ON public.department_kpis;
CREATE POLICY "department_kpis_scoped_select"
ON public.department_kpis
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR public.current_report_department() = 'operations'
  OR public.current_report_department() = department
);

DROP POLICY IF EXISTS "operations_manage_department_kpis" ON public.department_kpis;
CREATE POLICY "operations_manage_department_kpis"
ON public.department_kpis
FOR ALL
TO authenticated
USING (public.current_report_department() = 'operations')
WITH CHECK (public.current_report_department() = 'operations');

CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  financial_record_id UUID NOT NULL UNIQUE REFERENCES public.financial_records(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  application_number TEXT NOT NULL,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_reference TEXT,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_by_name TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'issued',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_receipts_status_check CHECK (status IN ('issued', 'voided')),
  CONSTRAINT payment_receipts_amount_check CHECK (amount > 0),
  CONSTRAINT payment_receipts_currency_check CHECK (char_length(currency) = 3)
);

CREATE INDEX IF NOT EXISTS payment_receipts_student_idx
  ON public.payment_receipts(student_id, issued_at DESC);

CREATE INDEX IF NOT EXISTS payment_receipts_application_idx
  ON public.payment_receipts(application_id, issued_at DESC);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_own_payment_receipts" ON public.payment_receipts;
CREATE POLICY "students_select_own_payment_receipts"
ON public.payment_receipts
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "finance_admin_select_payment_receipts" ON public.payment_receipts;
CREATE POLICY "finance_admin_select_payment_receipts"
ON public.payment_receipts
FOR SELECT
TO authenticated
USING (
  public.is_report_admin()
  OR public.current_report_department() = 'finance'
);

DROP POLICY IF EXISTS "finance_admin_manage_payment_receipts" ON public.payment_receipts;
CREATE POLICY "finance_admin_manage_payment_receipts"
ON public.payment_receipts
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
