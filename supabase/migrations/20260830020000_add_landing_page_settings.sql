-- Migration: Add landing_page_settings table
-- Enables content management for the main public landing page.
-- Admins can update this content from the Admin CMS tab, and it takes effect immediately.

CREATE TABLE IF NOT EXISTS public.landing_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_eyebrow TEXT NOT NULL,
  hero_title TEXT NOT NULL,
  hero_span TEXT NOT NULL,
  hero_description TEXT NOT NULL,
  trust_point_1 TEXT NOT NULL,
  trust_point_2 TEXT NOT NULL,
  trust_point_3 TEXT NOT NULL,
  card_label TEXT NOT NULL,
  card_title TEXT NOT NULL,
  step_1_title TEXT NOT NULL,
  step_1_description TEXT NOT NULL,
  step_2_title TEXT NOT NULL,
  step_2_description TEXT NOT NULL,
  step_3_title TEXT NOT NULL,
  step_3_description TEXT NOT NULL,
  story_title TEXT NOT NULL,
  story_description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by_name TEXT NOT NULL DEFAULT 'System'
);

-- RLS policies
ALTER TABLE public.landing_page_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select landing page settings" ON public.landing_page_settings;
CREATE POLICY "Anyone can select landing page settings"
ON public.landing_page_settings
FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Admins can manage landing page settings" ON public.landing_page_settings;
CREATE POLICY "Admins can manage landing page settings"
ON public.landing_page_settings
FOR ALL
TO authenticated
USING (
  public.is_report_admin()
)
WITH CHECK (
  public.is_report_admin()
);

-- Seed initial row matching current static content
INSERT INTO public.landing_page_settings (
  hero_eyebrow,
  hero_title,
  hero_span,
  hero_description,
  trust_point_1,
  trust_point_2,
  trust_point_3,
  card_label,
  card_title,
  step_1_title,
  step_1_description,
  step_2_title,
  step_2_description,
  step_3_title,
  step_3_description,
  story_title,
  story_description,
  updated_by_name
) VALUES (
  'International education guidance',
  'Your next chapter deserves a ',
  'clearer path.',
  'Globe Scholars Pathways, LLC. brings students, counselors, admissions, and finance together in one transparent journey—from your first question to your final enrolment step.',
  'Clear requirements',
  'Progress you can follow',
  'Department-led support',
  'One accountable journey',
  'See exactly where your application stands.',
  'Apply with confidence',
  'Guided documents and eligibility',
  'Receive expert review',
  'Counseling and admissions support',
  'Move forward prepared',
  'Clear decisions and next steps',
  'Built around a simple belief: students deserve clarity.',
  'Globe Scholars Pathways, LLC. was created to make international education guidance more personal, accountable, and easy to follow. Our team combines local understanding with a structured process, so each student receives the right support at the right time.',
  'System'
);
