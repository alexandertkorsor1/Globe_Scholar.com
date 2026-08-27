-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- University Courses & Custom Scholarships Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.university_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.partner_universities(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  admission_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tuition_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.partner_universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coverage_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  coverage_percentage INTEGER DEFAULT 0,
  eligibility_criteria TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.university_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Allow all authenticated users to read university courses"
  ON public.university_courses FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Allow all authenticated users to read scholarships"
  ON public.scholarships FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Admin manage policies
CREATE POLICY "Allow admins to manage university courses"
  ON public.university_courses FOR ALL
  TO authenticated
  USING (public.is_report_admin());

CREATE POLICY "Allow admins to manage scholarships"
  ON public.scholarships FOR ALL
  TO authenticated
  USING (public.is_report_admin());
