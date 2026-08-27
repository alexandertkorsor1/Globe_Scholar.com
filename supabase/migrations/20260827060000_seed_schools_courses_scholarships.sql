-- ============================================================
-- GLOBE SCHOLARS PATHWAYS, LLC.
-- Seed Partner Universities, Courses, and Scholarships
-- ============================================================

-- 1. Insert default partner universities if they do not exist
INSERT INTO public.partner_universities (id, name, country, contact_email, scholarships_offered, active_agreement)
VALUES
  ('33333333-3333-3333-3333-333333333331', 'University of Oxford', 'United Kingdom', 'admissions@ox.ac.uk', 3, TRUE),
  ('33333333-3333-3333-3333-333333333332', 'University of Cambridge', 'United Kingdom', 'admissions@cam.ac.uk', 2, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Harvard University', 'United States', 'admissions@harvard.edu', 4, TRUE),
  ('33333333-3333-3333-3333-333333333334', 'University of Melbourne', 'Australia', 'admissions@unimelb.edu.au', 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  contact_email = EXCLUDED.contact_email,
  scholarships_offered = EXCLUDED.scholarships_offered,
  active_agreement = EXCLUDED.active_agreement;

-- 2. Insert default courses for Oxford
INSERT INTO public.university_courses (id, university_id, course_name, admission_fee, tuition_fee)
VALUES
  ('44444444-4444-4444-4444-444444444411', '33333333-3333-3333-3333-333333333331', 'B.A. Philosophy, Politics and Economics (PPE)', 150.00, 32000.00),
  ('44444444-4444-4444-4444-444444444412', '33333333-3333-3333-3333-333333333331', 'M.Sc. Computer Science', 200.00, 38000.00),
  ('44444444-4444-4444-4444-444444444413', '33333333-3333-3333-3333-333333333331', 'MBA Business Administration', 250.00, 68000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert default courses for Cambridge
INSERT INTO public.university_courses (id, university_id, course_name, admission_fee, tuition_fee)
VALUES
  ('44444444-4444-4444-4444-444444444421', '33333333-3333-3333-3333-333333333332', 'BA (Hons) Economics', 150.00, 30000.00),
  ('44444444-4444-4444-4444-444444444422', '33333333-3333-3333-3333-333333333332', 'Master of Finance (MFin)', 220.00, 48000.00)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert default courses for Harvard
INSERT INTO public.university_courses (id, university_id, course_name, admission_fee, tuition_fee)
VALUES
  ('44444444-4444-4444-4444-444444444431', '33333333-3333-3333-3333-333333333333', 'A.B. Computer Science', 100.00, 54000.00),
  ('44444444-4444-4444-4444-444444444432', '33333333-3333-3333-3333-333333333333', 'Master of Public Policy (MPP)', 150.00, 48000.00),
  ('44444444-4444-4444-4444-444444444433', '33333333-3333-3333-3333-333333333333', 'Doctor of Medicine (MD)', 300.00, 65000.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert default courses for Melbourne
INSERT INTO public.university_courses (id, university_id, course_name, admission_fee, tuition_fee)
VALUES
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333334', 'Bachelor of Biomedicine', 120.00, 28000.00),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333334', 'Master of Engineering', 180.00, 36000.00)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert default scholarships
INSERT INTO public.scholarships (id, university_id, name, description, coverage_amount, coverage_percentage, eligibility_criteria)
VALUES
  ('55555555-5555-5555-5555-555555555511', '33333333-3333-3333-3333-333333333331', 'Clarendon Fund Scholarship', 'Full tuition coverage and living stipend', 25000.00, 100, 'Academic excellence, GPA > 3.85'),
  ('55555555-5555-5555-5555-555555555512', '33333333-3333-3333-3333-333333333331', 'Rhodes Scholarship', 'Global scholarship for Oxford postgraduate studies', 30000.00, 100, 'Leadership potential, exceptional academic record'),
  ('55555555-5555-5555-5555-555555555521', '33333333-3333-3333-3333-333333333332', 'Gates Cambridge Scholarship', 'Full cost of study at the University of Cambridge', 28000.00, 100, 'Outstanding intellectual ability and leadership'),
  ('55555555-5555-5555-5555-555555555531', '33333333-3333-3333-3333-333333333333', 'Harvard Financial Aid Fellowship', 'Need-based full or partial scholarship grant', 45000.00, 80, 'Demonstrated financial need'),
  ('55555555-5555-5555-5555-555555555541', '33333333-3333-3333-3333-333333333334', 'Melbourne International Undergraduate Scholarship', 'Partial tuition fee remission for international students', 10000.00, 25, 'High school GPA in top 5%')
ON CONFLICT (id) DO NOTHING;
