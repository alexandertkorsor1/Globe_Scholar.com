-- ============================================================
-- REPORT.COM
-- Student Accounts
-- ============================================================

-- ============================================================
-- ACCOUNT TYPE
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'staff';

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_type_check
CHECK (
  account_type IN (
    'staff',
    'student'
  )
);


-- ============================================================
-- STUDENT PROFILE INFORMATION
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country_of_residence TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS passport_number TEXT;


-- ============================================================
-- STAFF MUST REMAIN STAFF
-- STUDENTS MUST NOT BE ADMINISTRATORS
-- ============================================================

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_student_admin_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_student_admin_check
CHECK (
  account_type = 'student'
  AND is_admin = FALSE
  OR account_type = 'staff'
);


-- ============================================================
-- STUDENT PROFILE ACCESS
-- ============================================================

DROP POLICY IF EXISTS profiles_select_own
ON public.profiles;

CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);


-- ============================================================
-- STUDENT CANNOT MODIFY THEIR SECURITY ROLE
-- ============================================================

DROP POLICY IF EXISTS profiles_student_update_own
ON public.profiles;

CREATE POLICY profiles_student_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  AND account_type = 'student'
)
WITH CHECK (
  id = auth.uid()
  AND account_type = 'student'
  AND is_admin = FALSE
);


-- ============================================================
-- DONE
-- ============================================================
