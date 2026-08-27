-- Migration: Add working_country to department_members
-- Allows admin to record which country each staff member (including Country Directors)
-- is assigned to work in.

ALTER TABLE public.department_members
  ADD COLUMN IF NOT EXISTS working_country TEXT DEFAULT '' NOT NULL;

COMMENT ON COLUMN public.department_members.working_country
  IS 'The country this staff member is assigned to operate in. Mandatory for Country Director role; optional for all other departments.';
