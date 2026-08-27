-- Migration: Add CV storage fields to hr_employee_records
-- Allows HR to upload and store a PDF CV for each employee record.

ALTER TABLE public.hr_employee_records
  ADD COLUMN IF NOT EXISTS cv_path     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cv_file_name TEXT DEFAULT NULL;

COMMENT ON COLUMN public.hr_employee_records.cv_path
  IS 'Storage path inside the department-reports bucket for this employee''s CV PDF.';

COMMENT ON COLUMN public.hr_employee_records.cv_file_name
  IS 'Original filename of the uploaded CV PDF (used for display and download).';
