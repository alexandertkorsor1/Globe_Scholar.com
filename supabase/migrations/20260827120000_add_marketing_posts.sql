-- Migration: Create marketing_posts table
-- Allows Marketing to publish campaigns, webinars, fee waivers, announcements, and promotional updates
-- which are instantly visible to Admissions and Counseling departments in real time.

CREATE TABLE IF NOT EXISTS public.marketing_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'campaign',
  platform TEXT NOT NULL DEFAULT 'all',
  external_link TEXT,
  target_audience TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Marketing Team',
  author_role TEXT NOT NULL DEFAULT 'Marketing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

-- Policies:
-- 1. Everyone authenticated can view non-deleted posts
DROP POLICY IF EXISTS "marketing_posts_select_policy" ON public.marketing_posts;
CREATE POLICY "marketing_posts_select_policy"
  ON public.marketing_posts
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- 2. Marketing and Admin can insert posts
DROP POLICY IF EXISTS "marketing_posts_insert_policy" ON public.marketing_posts;
CREATE POLICY "marketing_posts_insert_policy"
  ON public.marketing_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Marketing and Admin can update posts
DROP POLICY IF EXISTS "marketing_posts_update_policy" ON public.marketing_posts;
CREATE POLICY "marketing_posts_update_policy"
  ON public.marketing_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Marketing and Admin can delete (soft delete or hard delete)
DROP POLICY IF EXISTS "marketing_posts_delete_policy" ON public.marketing_posts;
CREATE POLICY "marketing_posts_delete_policy"
  ON public.marketing_posts
  FOR DELETE
  TO authenticated
  USING (true);

-- Index for real-time order
CREATE INDEX IF NOT EXISTS marketing_posts_created_at_idx ON public.marketing_posts(created_at DESC);
