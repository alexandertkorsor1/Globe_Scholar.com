-- Migration: Add proof_file_path to financial_records
-- Allows students to link a scanned receipt / transaction confirmation file to their payment record.
-- Finance can view and download this proof document to verify the payment.

ALTER TABLE public.financial_records
ADD COLUMN IF NOT EXISTS proof_file_path TEXT;
