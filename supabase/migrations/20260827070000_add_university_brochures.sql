-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- University Admissions Brochures Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.university_brochures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.university_brochures ENABLE ROW LEVEL SECURITY;

-- Select policy: all authenticated users can read brochures
CREATE POLICY "Allow all authenticated users to read brochures"
  ON public.university_brochures FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Manage policy: Admissions staff and admin can manage brochures
CREATE POLICY "Allow Admissions staff and admin to manage brochures"
  ON public.university_brochures FOR ALL
  TO authenticated
  USING (
    public.is_report_admin()
    OR public.current_report_department() = 'admissions'
  )
  WITH CHECK (
    public.is_report_admin()
    OR public.current_report_department() = 'admissions'
  );

-- Seed some default brochures for demonstration
INSERT INTO public.university_brochures (id, title, description, file_name, storage_path, uploaded_by_name)
VALUES
  ('77777777-7777-7777-7777-777777777771', 'GSP Global Student Prospectus 2026-2027', 'Comprehensive guide detailing our partner universities, study tracks, and eligibility criteria.', 'GSP_Student_Prospectus_2026.pdf', 'brochures/seed_prospectus.pdf', 'Admissions Department'),
  ('77777777-7777-7777-7777-777777777772', 'Admissions & Scholarships Application Handbook', 'Step-by-step handbook on how to select target degrees, prepare documents, and apply for fellowships.', 'Admissions_Scholarships_Handbook.pdf', 'brochures/seed_handbook.pdf', 'Admissions Department')
ON CONFLICT (id) DO NOTHING;
