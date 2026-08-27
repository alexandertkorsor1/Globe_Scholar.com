-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Monthly Meetings System
-- ============================================================

CREATE TABLE IF NOT EXISTS public.monthly_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  platform TEXT NOT NULL DEFAULT 'google_meet',
  meeting_link TEXT NOT NULL,
  agenda TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.monthly_meetings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated profiles to select/view meetings
CREATE POLICY "Allow all authenticated users to read monthly meetings" 
  ON public.monthly_meetings FOR SELECT 
  TO authenticated 
  USING (deleted_at IS NULL);

-- Allow Admin, Operations, and Management profiles to insert/update/delete meetings
CREATE POLICY "Allow Admin, Operations, and Management to manage meetings" 
  ON public.monthly_meetings FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR department IN ('admin', 'operations', 'management'))
    )
  );
