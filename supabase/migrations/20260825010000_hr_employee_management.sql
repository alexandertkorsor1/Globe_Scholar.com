-- ============================================================
-- HR Employee Management System
-- Migration: 20260825010000_hr_employee_management.sql
-- ============================================================

-- 1. HR Employee Records (full roster with start/end dates)
CREATE TABLE IF NOT EXISTS hr_employee_records (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id       UUID REFERENCES department_members(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  job_title       TEXT NOT NULL,
  department      TEXT NOT NULL DEFAULT 'human_resources',
  employment_type TEXT NOT NULL DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'on_leave', 'terminated', 'resigned')),
  salary_band     TEXT,
  notes           TEXT,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. HR Interview Scheduler
CREATE TABLE IF NOT EXISTS hr_interviews (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_name   TEXT NOT NULL,
  candidate_email  TEXT NOT NULL,
  position         TEXT NOT NULL,
  department       TEXT NOT NULL DEFAULT 'human_resources',
  interview_date   DATE NOT NULL,
  interview_time   TIME NOT NULL,
  platform         TEXT NOT NULL DEFAULT 'google_meet'
    CHECK (platform IN ('google_meet', 'zoom', 'in_person')),
  meeting_link     TEXT,
  interviewer_name TEXT,
  status           TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes            TEXT,
  created_by       UUID NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. HR Leave Requests
CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name   TEXT NOT NULL,
  employee_email  TEXT NOT NULL,
  department      TEXT NOT NULL,
  leave_type      TEXT NOT NULL DEFAULT 'annual'
    CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'unpaid')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by     UUID,
  reviewed_at     TIMESTAMPTZ,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- Row-Level Security Policies
-- ============================================================

ALTER TABLE hr_employee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_interviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_requests   ENABLE ROW LEVEL SECURITY;

-- Helper: check if the user is HR or Admin
CREATE OR REPLACE FUNCTION is_hr_or_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid
      AND (
        department IN ('human_resources', 'admin')
        OR is_admin = true
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- HR Employee Records policies
CREATE POLICY hr_employee_records_select ON hr_employee_records
  FOR SELECT USING (is_hr_or_admin(auth.uid()));

CREATE POLICY hr_employee_records_insert ON hr_employee_records
  FOR INSERT WITH CHECK (is_hr_or_admin(auth.uid()));

CREATE POLICY hr_employee_records_update ON hr_employee_records
  FOR UPDATE USING (is_hr_or_admin(auth.uid()));

CREATE POLICY hr_employee_records_delete ON hr_employee_records
  FOR DELETE USING (is_hr_or_admin(auth.uid()));

-- HR Interviews policies
CREATE POLICY hr_interviews_select ON hr_interviews
  FOR SELECT USING (is_hr_or_admin(auth.uid()));

CREATE POLICY hr_interviews_insert ON hr_interviews
  FOR INSERT WITH CHECK (is_hr_or_admin(auth.uid()));

CREATE POLICY hr_interviews_update ON hr_interviews
  FOR UPDATE USING (is_hr_or_admin(auth.uid()));

CREATE POLICY hr_interviews_delete ON hr_interviews
  FOR DELETE USING (is_hr_or_admin(auth.uid()));

-- HR Leave Requests policies
CREATE POLICY hr_leave_requests_select ON hr_leave_requests
  FOR SELECT USING (is_hr_or_admin(auth.uid()));

CREATE POLICY hr_leave_requests_insert ON hr_leave_requests
  FOR INSERT WITH CHECK (is_hr_or_admin(auth.uid()));

CREATE POLICY hr_leave_requests_update ON hr_leave_requests
  FOR UPDATE USING (is_hr_or_admin(auth.uid()));

CREATE POLICY hr_leave_requests_delete ON hr_leave_requests
  FOR DELETE USING (is_hr_or_admin(auth.uid()));

-- Auto-update updated_at on hr_employee_records
CREATE OR REPLACE FUNCTION update_hr_employee_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hr_employee_records_updated_at
  BEFORE UPDATE ON hr_employee_records
  FOR EACH ROW
  EXECUTE FUNCTION update_hr_employee_records_updated_at();
