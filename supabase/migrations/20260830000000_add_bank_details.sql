-- Migration: Create system_bank_details table
-- Allows Finance or Admin to publish and manage bank details for student bank transfers.
-- Students can read these details to make fee payments.

CREATE TABLE IF NOT EXISTS public.system_bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  swift_code TEXT NOT NULL,
  iban TEXT,
  reference_format TEXT NOT NULL DEFAULT 'GSP-YYYY-XXXX',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by_name TEXT NOT NULL DEFAULT 'System'
);

-- Enable Row Level Security
ALTER TABLE public.system_bank_details ENABLE ROW LEVEL SECURITY;

-- 1. Anyone authenticated can select bank details
DROP POLICY IF EXISTS "system_bank_details_select_policy" ON public.system_bank_details;
CREATE POLICY "system_bank_details_select_policy"
  ON public.system_bank_details
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Finance and Admin can manage bank details
DROP POLICY IF EXISTS "system_bank_details_manage_policy" ON public.system_bank_details;
CREATE POLICY "system_bank_details_manage_policy"
  ON public.system_bank_details
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR department = 'finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR department = 'finance')
    )
  );

-- Seed initial bank details
INSERT INTO public.system_bank_details (
  bank_name,
  account_name,
  account_number,
  swift_code,
  iban,
  reference_format,
  updated_by_name
) VALUES (
  'Global Executive Bank',
  'Globe Scholars Pathways, LLC',
  '987654321098',
  'GEBXXUS33XXX',
  'US89GEBX987654321098',
  'GSP-STUDENT-EMAIL (e.g. GSP-john@example.com)',
  'System Seed'
) ON CONFLICT DO NOTHING;
