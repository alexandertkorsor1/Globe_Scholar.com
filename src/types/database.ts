export type DepartmentType =
  | 'admin'
  | 'marketing'
  | 'admissions'
  | 'counseling'
  | 'data_applications'
  | 'operations'
  | 'finance'
  | 'country_directors'
  | 'it_support'
  | 'legal_compliance'
  | 'alumni_success';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'documents_missing'
  | 'documents_verified'
  | 'admissions_review'
  | 'ready_for_processing'
  | 'submitted_to_institution'
  | 'decision_pending'
  | 'approved'
  | 'rejected';

export type CommunicationType =
  | 'notification'
  | 'task'
  | 'alert'
  | 'message'
  | 'escalation';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export type DepartmentReportStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'needs_revision'
  | 'resubmitted'
  | 'approved'
  | 'archived';

export type DocType =
  | 'passport'
  | 'secondary_school_certificate'
  | 'academic_transcript'
  | 'degree_certificate'
  | 'english_proficiency'
  | 'recommendation_letter'
  | 'recommendation_letter_1'
  | 'recommendation_letter_2'
  | 'financial_statement'
  | 'personal_statement'
  | 'research_proposal'
  | 'curriculum_vitae'
  | 'other';

export type StudyLevel =
  | 'foundation'
  | 'undergraduate'
  | 'postgraduate'
  | 'doctoral';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  department: DepartmentType;
  is_admin: boolean;
  job_title?: string;
  is_assistant?: boolean;
  assigned_departments?: DepartmentType[];
  account_type: 'staff' | 'student' | 'unassigned';
  phone?: string;
  first_name?: string;
  last_name?: string;
  country_of_residence?: string;
  passport_number?: string;
  created_at: string;
}

export type DepartmentMemberStatus =
  | 'pending_activation'
  | 'active'
  | 'inactive';

export interface DepartmentMember {
  id: string;
  profile_id?: string | null;
  full_name: string;
  email: string;
  job_title: string;
  primary_department: DepartmentType;
  departments: DepartmentType[];
  is_assistant: boolean;
  employment_status: DepartmentMemberStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentMemberInput {
  full_name: string;
  email: string;
  job_title: string;
  primary_department: DepartmentType;
  departments: DepartmentType[];
  is_assistant: boolean;
  employment_status: DepartmentMemberStatus;
  temporary_password?: string;
}

export interface DepartmentPermission {
  department: DepartmentType;
  resource: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_assign: boolean;
  can_comment: boolean;
  can_export: boolean;
}

export interface CountryDirectorAssignment {
  id: string;
  director_id: string;
  country_code: string;
  country_name: string;
}

export interface Student {
  id: string;
  profile_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country_of_residence: string;
  passport_number?: string;
  gpa: number;
  lead_source?: string;
  assigned_counselor_id?: string;
  assigned_counselor_name?: string;
  registration_fee_paid: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  application_number: string;
  student_id: string;
  student_name: string;
  student_email: string;
  status: ApplicationStatus;
  target_country: string;
  target_university: string;
  study_level?: StudyLevel;
  degree_program: string;
  intake_period: string;
  scholarship_requested?: string;
  missing_documents_count: number;
  admissions_decision?: 'conditional_offer' | 'unconditional_offer' | 'rejected' | 'pending';
  admissions_notes?: string;
  handed_off_to_admissions: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  storage_path: string;
  uploaded_by_name: string;
  uploaded_at: string;
  change_summary: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: DocType;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  current_version: number;
  is_missing: boolean;
  is_verified: boolean;
  verified_by_name?: string;
  verified_at?: string;
  notes?: string;
  signed_url?: string;
  versions: DocumentVersion[];
  created_at: string;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by_name: string;
  department: DepartmentType;
  note: string;
  created_at: string;
}

export interface CounselingSession {
  id: string;
  student_id: string;
  student_name: string;
  counselor_id: string;
  counselor_name: string;
  scheduled_at: string;
  duration_minutes: number;
  google_meet_link: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  session_notes: string; // Restricted from Finance
  scholarship_recommendations: string[];
  created_at: string;
}

export interface AdmissionWindow {
  id: string;
  title: string;
  target_country: string;
  intake_period: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by_name: string;
}

export interface InstitutionTask {
  id: string;
  application_id: string;
  application_number: string;
  title: string;
  description: string;
  assigned_to_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  deadline: string;
  created_at: string;
}

export interface FinancialRecord {
  id: string;
  application_id: string;
  application_number: string;
  student_id: string;
  student_name: string;
  record_type: 'registration_fee' | 'scholarship_disbursement' | 'refund' | 'operational_spend';
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'approved' | 'rejected';
  payment_reference?: string;
  approved_by_name?: string;
  notes?: string;
  created_at: string;
}

export interface PartnerUniversity {
  id: string;
  name: string;
  country: string;
  contact_email: string;
  scholarships_offered: number;
  active_agreement: boolean;
  agreements: PartnerAgreement[];
}

export interface PartnerAgreement {
  id: string;
  partner_id: string;
  partner_name: string;
  document_name: string;
  storage_path: string;
  effective_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'under_renegotiation';
}

export interface DepartmentReport {
  id: string;
  department: DepartmentType;
  submitted_by: string;
  report_type: string;
  title: string;
  reporting_period_start: string;
  reporting_period_end: string;
  executive_summary?: string;
  key_activities?: string;
  achievements?: string;
  challenges?: string;
  recommendations?: string;
  metrics: Record<string, unknown>;
  status: DepartmentReportStatus;
  submitted_at?: string;
  review_comment?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  revision_count: number;
  created_at: string;
  updated_at: string;
  submitted_by_name?: string;
  reviewed_by_name?: string;
  attachments: DepartmentReportAttachment[];
}

export interface DepartmentReportAttachment {
  id: string;
  report_id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface DepartmentReportSubmission {
  title: string;
  reporting_period_start: string;
  reporting_period_end: string;
  executive_summary: string;
  key_activities: string;
  achievements: string;
  challenges: string;
  recommendations: string;
}

export interface Communication {
  id: string;
  type: CommunicationType;
  sender_id?: string;
  sender_name: string;
  recipient_name?: string;
  department?: DepartmentType | 'all';
  related_student_name?: string;
  related_application_number?: string;
  title: string;
  body: string;
  priority: PriorityLevel;
  is_read: boolean;
  parent_id?: string;
  created_at: string;
  replies?: Communication[];
}

export interface AuditLog {
  id: string;
  actor_name: string;
  department: DepartmentType;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: unknown;
  after_state?: unknown;
  created_at: string;
}
