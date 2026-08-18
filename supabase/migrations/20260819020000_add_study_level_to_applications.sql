-- Store the application level so the required-document checklist is stable
-- across sessions and can be used by downstream admissions workflows.

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS study_level TEXT;

UPDATE public.applications
SET study_level = 'postgraduate'
WHERE study_level IS NULL;

ALTER TABLE public.applications
ALTER COLUMN study_level SET DEFAULT 'postgraduate',
ALTER COLUMN study_level SET NOT NULL;

ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_study_level_check;

ALTER TABLE public.applications
ADD CONSTRAINT applications_study_level_check
CHECK (study_level IN ('foundation', 'undergraduate', 'postgraduate', 'doctoral'));
