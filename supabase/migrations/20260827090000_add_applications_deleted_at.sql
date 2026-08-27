-- Add deleted_at column to applications table for trash collection support
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
