-- Migration: Add image support for student testimonials and leadership profiles in landing_page_settings

ALTER TABLE public.landing_page_settings
ADD COLUMN IF NOT EXISTS story_1_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS story_2_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS story_3_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS leader_1_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS leader_2_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS leader_3_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS leader_4_image_url TEXT DEFAULT NULL;
