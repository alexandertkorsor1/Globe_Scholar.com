-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Partner Universities & Agreements
-- ============================================================

CREATE TABLE IF NOT EXISTS public.partner_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  country TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  scholarships_offered INTEGER NOT NULL DEFAULT 0,
  active_agreement BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_universities_scholarships_check
    CHECK (scholarships_offered >= 0)
);


-- ============================================================
-- PARTNER AGREEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.partner_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  partner_id UUID NOT NULL
    REFERENCES public.partner_universities(id)
    ON DELETE CASCADE,

  partner_name TEXT NOT NULL,
  document_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,

  effective_date DATE NOT NULL,
  expiry_date DATE NOT NULL,

  status TEXT NOT NULL DEFAULT 'active',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_agreements_status_check
    CHECK (
      status IN (
        'active',
        'expired',
        'under_renegotiation'
      )
    ),

  CONSTRAINT partner_agreements_date_check
    CHECK (expiry_date >= effective_date)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_partner_universities_country
ON public.partner_universities(country);

CREATE INDEX IF NOT EXISTS idx_partner_agreements_partner_id
ON public.partner_agreements(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_agreements_expiry_date
ON public.partner_agreements(expiry_date);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.partner_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_agreements ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PARTNER UNIVERSITY POLICIES
-- ============================================================

CREATE POLICY partner_universities_authenticated_select
ON public.partner_universities
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY partner_universities_admin_insert
ON public.partner_universities
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_report_admin()
);


CREATE POLICY partner_universities_admin_update
ON public.partner_universities
FOR UPDATE
TO authenticated
USING (
  public.is_report_admin()
)
WITH CHECK (
  public.is_report_admin()
);


CREATE POLICY partner_universities_admin_delete
ON public.partner_universities
FOR DELETE
TO authenticated
USING (
  public.is_report_admin()
);


-- ============================================================
-- PARTNER AGREEMENT POLICIES
-- ============================================================

CREATE POLICY partner_agreements_authenticated_select
ON public.partner_agreements
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY partner_agreements_admin_insert
ON public.partner_agreements
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_report_admin()
);


CREATE POLICY partner_agreements_admin_update
ON public.partner_agreements
FOR UPDATE
TO authenticated
USING (
  public.is_report_admin()
)
WITH CHECK (
  public.is_report_admin()
);


CREATE POLICY partner_agreements_admin_delete
ON public.partner_agreements
FOR DELETE
TO authenticated
USING (
  public.is_report_admin()
);


-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.partner_universities IS
'Globe Scholars Pathways, LLC. partner universities and scholarship information.';

COMMENT ON TABLE public.partner_agreements IS
'Agreements and MOU documents associated with partner universities.';
