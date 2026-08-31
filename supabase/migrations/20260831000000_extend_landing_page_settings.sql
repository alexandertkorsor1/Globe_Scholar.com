-- Migration: Extend landing_page_settings with remaining landing page sections
-- Includes value guides, testimonials (student stories), leadership cards, and footer info.

ALTER TABLE public.landing_page_settings
ADD COLUMN IF NOT EXISTS value_header TEXT NOT NULL DEFAULT 'What guides our work',
ADD COLUMN IF NOT EXISTS value_1_title TEXT NOT NULL DEFAULT 'Ethical guidance',
ADD COLUMN IF NOT EXISTS value_1_description TEXT NOT NULL DEFAULT 'Advice, requirements, and decisions are explained clearly and handled with care.',
ADD COLUMN IF NOT EXISTS value_2_title TEXT NOT NULL DEFAULT 'Human support',
ADD COLUMN IF NOT EXISTS value_2_description TEXT NOT NULL DEFAULT 'Students are supported by real people and accountable departments, not left to navigate alone.',
ADD COLUMN IF NOT EXISTS value_3_title TEXT NOT NULL DEFAULT 'Student-first outcomes',
ADD COLUMN IF NOT EXISTS value_3_description TEXT NOT NULL DEFAULT 'Every recommendation begins with the student’s academic goals, readiness, and long-term success.',

ADD COLUMN IF NOT EXISTS stories_title TEXT NOT NULL DEFAULT 'Guidance that students can feel at every stage.',
ADD COLUMN IF NOT EXISTS stories_description TEXT NOT NULL DEFAULT 'Our process is designed to replace uncertainty with clear action, trusted support, and timely updates.',
ADD COLUMN IF NOT EXISTS story_1_quote TEXT NOT NULL DEFAULT 'Every requirement was clear, and I always knew which step came next. That confidence made a difficult process feel manageable.',
ADD COLUMN IF NOT EXISTS story_1_name TEXT NOT NULL DEFAULT 'Postgraduate applicant',
ADD COLUMN IF NOT EXISTS story_1_pathway TEXT NOT NULL DEFAULT 'United Kingdom pathway',
ADD COLUMN IF NOT EXISTS story_2_quote TEXT NOT NULL DEFAULT 'My counselor listened to my goals before recommending options. I felt supported from the first conversation through submission.',
ADD COLUMN IF NOT EXISTS story_2_name TEXT NOT NULL DEFAULT 'Undergraduate applicant',
ADD COLUMN IF NOT EXISTS story_2_pathway TEXT NOT NULL DEFAULT 'International study pathway',
ADD COLUMN IF NOT EXISTS story_3_quote TEXT NOT NULL DEFAULT 'The updates were practical and timely. I could see my progress without having to chase several different people for answers.',
ADD COLUMN IF NOT EXISTS story_3_name TEXT NOT NULL DEFAULT 'Graduate applicant',
ADD COLUMN IF NOT EXISTS story_3_pathway TEXT NOT NULL DEFAULT 'North America pathway',

ADD COLUMN IF NOT EXISTS leadership_title TEXT NOT NULL DEFAULT 'Experienced leadership. Shared accountability.',
ADD COLUMN IF NOT EXISTS leadership_description TEXT NOT NULL DEFAULT 'Our leadership team sets the standards for student care, operational quality, and responsible international education guidance.',
ADD COLUMN IF NOT EXISTS leader_1_role TEXT NOT NULL DEFAULT 'Founder & Chief Executive Officer',
ADD COLUMN IF NOT EXISTS leader_1_focus TEXT NOT NULL DEFAULT 'Sets the organisation’s strategy and long-term commitment to ethical, student-first guidance.',
ADD COLUMN IF NOT EXISTS leader_2_role TEXT NOT NULL DEFAULT 'Co-founder & Chief Operating Officer',
ADD COLUMN IF NOT EXISTS leader_2_focus TEXT NOT NULL DEFAULT 'Leads service quality, operational accountability, and the experience students receive at every stage.',
ADD COLUMN IF NOT EXISTS leader_3_role TEXT NOT NULL DEFAULT 'Director of Admissions',
ADD COLUMN IF NOT EXISTS leader_3_focus TEXT NOT NULL DEFAULT 'Oversees application quality, eligibility review, and clear communication with partner institutions.',
ADD COLUMN IF NOT EXISTS leader_4_role TEXT NOT NULL DEFAULT 'Director of Student Success',
ADD COLUMN IF NOT EXISTS leader_4_focus TEXT NOT NULL DEFAULT 'Builds the support model that helps students move confidently from planning to enrolment.',

ADD COLUMN IF NOT EXISTS footer_copy TEXT NOT NULL DEFAULT '© 2026 Globe Scholars Pathways, LLC. Student guidance with purpose.';
