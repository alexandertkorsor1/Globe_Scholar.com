import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import {
  Application,
  Student,
  ApplicationDocument,
  CounselingSession,
  InstitutionTask,
  FinancialRecord,
  PartnerUniversity,
  PartnerAgreement,
  Communication,
  AuditLog,
  ApplicationStatusHistory,
  ApplicationStatus,
  DocType,
  CommunicationType,
  PriorityLevel,
  DepartmentReport,
  DepartmentReportStatus,
  DepartmentReportSubmission,
  DepartmentType,
  DepartmentKpiRecord,
  DepartmentKpiInput,
  PaymentReceipt,
  WorkAssignment,
  WorkAssignmentComment,
  WorkAssignmentPriority,
  WorkAssignmentStatus,
  VisaApplication,
  VisaDocument,
  HrEmployeeRecord,
  HrInterview,
  HrLeaveRequest,
  HrEmploymentType,
  HrEmployeeStatus,
  HrInterviewPlatform,
  HrInterviewStatus,
  HrLeaveType,
  HrLeaveStatus,
  TrashItem,
  MonthlyMeeting,
  UniversityCourse,
  Scholarship,
  UniversityBrochure
} from '../types/database';
import {
  INITIAL_APPLICATIONS,
  INITIAL_STUDENTS,
  INITIAL_APPLICATION_DOCUMENTS,
  INITIAL_COUNSELING_SESSIONS,
  INITIAL_INSTITUTION_TASKS,
  INITIAL_FINANCIAL_RECORDS,
  INITIAL_PARTNER_UNIVERSITIES,
  INITIAL_COMMUNICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_STATUS_HISTORY,
  INITIAL_DEPARTMENT_KPIS,
  INITIAL_PAYMENT_RECEIPTS
} from '../lib/mock-data';
import { useAuth } from './AuthContext';
import { RLSSimulationEngine, RLSPermissionResult } from '../lib/rls-simulation';

interface ApplicationContextType {
  applications: Application[];
  students: Student[];
  documents: ApplicationDocument[];
  counselingSessions: CounselingSession[];
  institutionTasks: InstitutionTask[];
  financialRecords: FinancialRecord[];
  partnerUniversities: PartnerUniversity[];
  departmentReports: DepartmentReport[];
  departmentKpis: DepartmentKpiRecord[];
  paymentReceipts: PaymentReceipt[];
  communications: Communication[];
  auditLogs: AuditLog[];
  statusHistory: ApplicationStatusHistory[];
  workAssignments: WorkAssignment[];
  workAssignmentComments: WorkAssignmentComment[];
  studentApplicationsLoading: boolean;
  
  // RLS-scoped getters
  getScopedApplications: () => RLSPermissionResult<Application>;
  getScopedCounselingSessions: () => RLSPermissionResult<CounselingSession>;
  getScopedFinancialRecords: () => RLSPermissionResult<FinancialRecord>;
  getScopedStudents: () => RLSPermissionResult<Student>;

  // Action methods
  updateApplicationStatus: (appId: string, newStatus: ApplicationStatus, note: string) => void;
  handoffToAdmissions: (appId: string) => Promise<void>;
  addDocument: (appId: string, docType: DocType, file: File) => Promise<ApplicationDocument>;
  updateDocumentVersion: (docId: string, changeSummary: string) => void;
  verifyDocument: (docId: string, verified: boolean) => void;
  toggleMissingDocFlag: (docId: string, isMissing: boolean) => void;
  scheduleCounselingSession: (studentId: string, scheduledAt: string, meetLink: string, notes: string) => void;
  createInstitutionTask: (appId: string, title: string, description: string, assigneeName: string, deadline: string) => void;
  processFeePayment: (
    appId: string,
    amount: number,
    paymentRef: string,
    paymentType?: 'registration_fee' | 'tuition_fee' | 'admission_fee'
  ) => Promise<FinancialRecord>;
  createFinancialRecord: (
    record: Omit<FinancialRecord, 'id' | 'created_at' | 'approved_by_name'>
  ) => Promise<FinancialRecord>;
  reviewRegistrationPayment: (
    recordId: string,
    approved: boolean,
    note?: string
  ) => Promise<FinancialRecord>;
  generatePaymentReceipt: (recordId: string) => Promise<PaymentReceipt>;
  saveDepartmentKpi: (
    record: DepartmentKpiInput,
    id?: string
  ) => Promise<DepartmentKpiRecord>;
  deleteDepartmentKpi: (recordId: string) => Promise<void>;
  addCommunication: (
    type: CommunicationType,
    title: string,
    body: string,
    priority?: PriorityLevel,
    dept?: DepartmentType | 'all'
  ) => Promise<void>;
  markCommunicationRead: (communicationId: string) => Promise<void>;
  makeAdmissionsDecision: (appId: string, decision: 'conditional_offer' | 'unconditional_offer' | 'rejected', notes: string) => void;
  addStudent: (student: Partial<Student>) => Student;
  
createApplication: (
    appData: Partial<Application>
  ) => Promise<Application>;
addPartnerUniversity: (
  partnerData: Omit<PartnerUniversity, 'id'>
) => Promise<PartnerUniversity>;

uploadPartnerAgreement: (
  partnerId: string,
  file: File,
  expiryDate: string
) => Promise<PartnerAgreement>;
deletePartnerUniversity: (partnerId: string) => Promise<void>;
submitDepartmentReport: (
  report: DepartmentReportSubmission,
  file: File
) => Promise<DepartmentReport>;
reviewDepartmentReport: (
  reportId: string,
  status: DepartmentReportStatus,
  adminNote: string
) => Promise<DepartmentReport>;
getDepartmentReportDownloadUrl: (
  report: DepartmentReport
) => Promise<string>;

  // Work assignment methods
  createWorkAssignment: (
    title: string,
    description: string,
    assignedDepartment: DepartmentType,
    priority: WorkAssignmentPriority,
    dueDate?: string
  ) => Promise<WorkAssignment>;
  updateWorkAssignmentStatus: (
    assignmentId: string,
    status: WorkAssignmentStatus
  ) => Promise<void>;
  reviewWorkAssignment: (
    assignmentId: string,
    reviewStatus: 'approved' | 'revision_requested',
    notes: string
  ) => Promise<void>;
  addWorkAssignmentComment: (
    assignmentId: string,
    comment: string
  ) => Promise<WorkAssignmentComment>;

  // Visa application methods
  visaApplications: VisaApplication[];
  applyForVisa: (applicationId: string) => Promise<VisaApplication>;
  loadVisaDocuments: (visaApplicationId: string) => Promise<VisaDocument[]>;
  uploadVisaDocument: (visaApplicationId: string, documentType: string, file: File) => Promise<void>;
  deleteVisaDocument: (documentId: string, filePath: string) => Promise<void>;
  reviewVisaApplication: (
    visaApplicationId: string,
    status: 'pending' | 'under_review' | 'approved' | 'rejected',
    instructions: string
  ) => Promise<void>;

  // HR Management System state & methods
  hrEmployeeRecords: HrEmployeeRecord[];
  addHrEmployeeRecord: (record: Omit<HrEmployeeRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<HrEmployeeRecord>;
  updateHrEmployeeRecord: (id: string, record: Partial<HrEmployeeRecord>) => Promise<HrEmployeeRecord>;
  deleteHrEmployeeRecord: (id: string) => Promise<void>;
  hrInterviews: HrInterview[];
  scheduleHrInterview: (interview: Omit<HrInterview, 'id' | 'created_at' | 'created_by'>) => Promise<HrInterview>;
  updateHrInterview: (id: string, interview: Partial<HrInterview>) => Promise<HrInterview>;
  hrLeaveRequests: HrLeaveRequest[];
  submitHrLeaveRequest: (request: Omit<HrLeaveRequest, 'id' | 'created_at' | 'created_by' | 'status'>) => Promise<HrLeaveRequest>;
  reviewHrLeaveRequest: (id: string, status: HrLeaveStatus, notes?: string | null) => Promise<void>;
  fetchTrashItems: (departmentKey: string) => Promise<TrashItem[]>;
  restoreTrashItem: (type: string, id: string) => Promise<void>;
  deleteTrashItemPermanently: (type: string, id: string) => Promise<void>;
  monthlyMeetings: MonthlyMeeting[];
  scheduleMonthlyMeeting: (meeting: Omit<MonthlyMeeting, 'id' | 'created_at' | 'created_by' | 'deleted_at'>) => Promise<MonthlyMeeting>;
  deleteMonthlyMeeting: (id: string) => Promise<void>;
  universityCourses: UniversityCourse[];
  addUniversityCourse: (course: Omit<UniversityCourse, 'id' | 'created_at' | 'deleted_at'>) => Promise<UniversityCourse>;
  deleteUniversityCourse: (id: string) => Promise<void>;
  scholarships: Scholarship[];
  addScholarship: (scholarship: Omit<Scholarship, 'id' | 'created_at' | 'deleted_at'>) => Promise<Scholarship>;
  deleteScholarship: (id: string) => Promise<void>;
  universityBrochures: UniversityBrochure[];
  uploadUniversityBrochure: (title: string, description: string, file: File) => Promise<UniversityBrochure>;
  deleteUniversityBrochure: (id: string) => Promise<void>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const ApplicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentProfile, loading } = useAuth();

  const [applications, setApplications] =
    useState<Application[]>(INITIAL_APPLICATIONS);

  const [students, setStudents] =
    useState<Student[]>(INITIAL_STUDENTS);

  const [documents, setDocuments] =
    useState<ApplicationDocument[]>(INITIAL_APPLICATION_DOCUMENTS);

  const [counselingSessions, setCounselingSessions] =
    useState<CounselingSession[]>(INITIAL_COUNSELING_SESSIONS);

  const [institutionTasks, setInstitutionTasks] =
    useState<InstitutionTask[]>(INITIAL_INSTITUTION_TASKS);

  const [financialRecords, setFinancialRecords] =
    useState<FinancialRecord[]>(INITIAL_FINANCIAL_RECORDS);

  const [partnerUniversities, setPartnerUniversities] =
    useState<PartnerUniversity[]>(INITIAL_PARTNER_UNIVERSITIES);

  const [departmentReports, setDepartmentReports] =
    useState<DepartmentReport[]>([]);

  const [departmentKpis, setDepartmentKpis] =
    useState<DepartmentKpiRecord[]>(INITIAL_DEPARTMENT_KPIS);

  const [paymentReceipts, setPaymentReceipts] =
    useState<PaymentReceipt[]>(INITIAL_PAYMENT_RECEIPTS);

  const [communications, setCommunications] =
    useState<Communication[]>(INITIAL_COMMUNICATIONS);

  const [auditLogs, setAuditLogs] =
    useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const [statusHistory, setStatusHistory] =
    useState<ApplicationStatusHistory[]>(INITIAL_STATUS_HISTORY);

  const [workAssignments, setWorkAssignments] =
    useState<WorkAssignment[]>([]);

  const [workAssignmentComments, setWorkAssignmentComments] =
    useState<WorkAssignmentComment[]>([]);

  const [visaApplications, setVisaApplications] =
    useState<VisaApplication[]>([]);

  const [studentApplicationsLoading, setStudentApplicationsLoading] = useState(false);
  
  // Mock data definitions for HR
  const initialHrEmployees: HrEmployeeRecord[] = [
    {
      id: 'emp-01',
      full_name: 'Olivia Martinez',
      email: 'olivia.m@globescholars.com',
      phone: '+1 (555) 019-2834',
      job_title: 'Operations Director',
      department: 'operations',
      employment_type: 'full_time',
      start_date: '2024-01-15',
      status: 'active',
      salary_band: 'Band D',
      notes: 'Senior team member handling global directives.',
      created_by: 'usr-admin-01',
      created_at: new Date('2024-01-15').toISOString(),
      updated_at: new Date('2024-01-15').toISOString()
    },
    {
      id: 'emp-02',
      full_name: 'Elena Rostova',
      email: 'elena.r@globescholars.com',
      phone: '+1 (555) 014-3829',
      job_title: 'Senior Counselor',
      department: 'counseling',
      employment_type: 'full_time',
      start_date: '2024-06-10',
      status: 'active',
      salary_band: 'Band C',
      notes: 'Assigned to international student counseling.',
      created_by: 'usr-admin-01',
      created_at: new Date('2024-06-10').toISOString(),
      updated_at: new Date('2024-06-10').toISOString()
    },
    {
      id: 'emp-03',
      full_name: 'Marcus Vance',
      email: 'marcus.v@globescholars.com',
      phone: '+1 (555) 012-9843',
      job_title: 'Marketing Specialist',
      department: 'marketing',
      employment_type: 'contract',
      start_date: '2025-03-01',
      end_date: '2026-03-01',
      status: 'active',
      salary_band: 'Band B',
      notes: 'Contractor for campaigns.',
      created_by: 'usr-admin-01',
      created_at: new Date('2025-03-01').toISOString(),
      updated_at: new Date('2025-03-01').toISOString()
    }
  ];

  const initialHrInterviews: HrInterview[] = [
    {
      id: 'int-01',
      candidate_name: 'Sarah Jenkins',
      candidate_email: 'sarah.j@gmail.com',
      position: 'Junior Developer',
      department: 'data_applications',
      interview_date: '2026-08-27',
      interview_time: '10:00',
      platform: 'google_meet',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      interviewer_name: 'David Carter (Data & Apps)',
      status: 'scheduled',
      created_by: 'usr-admin-01',
      created_at: new Date().toISOString()
    },
    {
      id: 'int-02',
      candidate_name: 'Robert Chen',
      candidate_email: 'r.chen@yahoo.com',
      position: 'Admissions Officer',
      department: 'admissions',
      interview_date: '2026-08-28',
      interview_time: '14:30',
      platform: 'zoom',
      meeting_link: 'https://zoom.us/j/9876543210',
      interviewer_name: 'Sarah Paulson',
      status: 'scheduled',
      created_by: 'usr-admin-01',
      created_at: new Date().toISOString()
    }
  ];

  const initialHrLeaves: HrLeaveRequest[] = [
    {
      id: 'lv-01',
      employee_name: 'Elena Rostova',
      employee_email: 'elena.r@globescholars.com',
      department: 'counseling',
      leave_type: 'annual',
      start_date: '2026-09-01',
      end_date: '2026-09-07',
      reason: 'Family vacation',
      status: 'pending',
      created_by: 'usr-cns-01',
      created_at: new Date().toISOString()
    }
  ];

  const [hrEmployeeRecords, setHrEmployeeRecords] = useState<HrEmployeeRecord[]>(initialHrEmployees);
  const [hrInterviews, setHrInterviews] = useState<HrInterview[]>(initialHrInterviews);
  const [hrLeaveRequests, setHrLeaveRequests] = useState<HrLeaveRequest[]>(initialHrLeaves);
  const [monthlyMeetings, setMonthlyMeetings] = useState<MonthlyMeeting[]>([]);
  const [universityCourses, setUniversityCourses] = useState<UniversityCourse[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [universityBrochures, setUniversityBrochures] = useState<UniversityBrochure[]>([]);

  useEffect(() => {
    if (loading) return;

    const loadApplications = async () => {
      if (!currentProfile?.id || currentProfile.account_type === 'unassigned') {
        setApplications([]);
        setDocuments([]);
        setStatusHistory([]);
        setStudentApplicationsLoading(false);
        return;
      }

      const isStudent = currentProfile.account_type === 'student';
      setStudentApplicationsLoading(isStudent);

      try {
        let applicationQuery = supabase
          .from('applications')
          .select('*')
          .order('created_at', { ascending: false });

        if (isStudent) {
          applicationQuery = applicationQuery.eq('student_id', currentProfile.id);
        }

        const { data, error } = await applicationQuery;

        if (error) {
          console.error('Error loading applications:', error);
          return;
        }

        const applicationRows = (data || []) as Application[];
        setApplications(applicationRows);

        if (applicationRows.length === 0) {
          setDocuments([]);
          setStatusHistory([]);
          return;
        }

        // Finance can see payment records but never confidential application
        // documents or full case history.
        if (currentProfile.department === 'finance' && !currentProfile.is_admin) {
          setDocuments([]);
          setStatusHistory([]);
          return;
        }

        const { data: documentRows, error: documentsError } = await supabase
          .from('application_documents')
          .select('*')
          .in(
            'application_id',
            applicationRows.map((application) => application.id)
          )
          .order('created_at', { ascending: false });

        if (documentsError) {
          console.error('Error loading student documents:', documentsError);
          return;
        }

        setDocuments(
          (documentRows || []).map((document) => ({
            ...document,
            document_type: document.document_type as DocType,
            file_size: Number(document.file_size),
            versions: [],
          })) as ApplicationDocument[]
        );

        const { data: historyRows, error: historyError } = await supabase
          .from('application_status_history')
          .select('*')
          .in(
            'application_id',
            applicationRows.map((application) => application.id)
          )
          .order('created_at', { ascending: false });

        if (historyError) {
          console.error('Error loading student application history:', historyError);
          return;
        }

        setStatusHistory(
          (historyRows || []).map((history) => ({
            ...history,
            from_status: history.from_status as ApplicationStatus | null,
            to_status: history.to_status as ApplicationStatus,
          })) as ApplicationStatusHistory[]
        );
      } finally {
        setStudentApplicationsLoading(false);
      }
    };

    const loadFinancialRecords = async () => {
      const mayViewFinancialRecords =
        currentProfile?.account_type === 'student' ||
        currentProfile?.is_admin ||
        ['finance', 'admissions'].includes(currentProfile?.department || '');

      if (!currentProfile?.id || currentProfile.account_type === 'unassigned' || !mayViewFinancialRecords) {
        setFinancialRecords([]);
        return;
      }

      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading financial records:', error);
        return;
      }

      setFinancialRecords(
        (data || []).map((record) => ({
          ...record,
          amount: Number(record.amount),
        })) as FinancialRecord[]
      );
    };

    const loadPaymentReceipts = async () => {
      const mayViewPaymentReceipts =
        currentProfile?.account_type === 'student' ||
        currentProfile?.is_admin ||
        currentProfile?.department === 'finance';

      if (!currentProfile?.id || currentProfile.account_type === 'unassigned' || !mayViewPaymentReceipts) {
        setPaymentReceipts([]);
        return;
      }

      const { data, error } = await supabase
        .from('payment_receipts')
        .select('*')
        .order('issued_at', { ascending: false });

      if (error) {
        console.error('Error loading payment receipts:', error);
        return;
      }

      setPaymentReceipts(
        (data || []).map((receipt) => ({
          ...receipt,
          amount: Number(receipt.amount),
          status: receipt.status as PaymentReceipt['status'],
        })) as PaymentReceipt[]
      );
    };

    const loadMonthlyMeetings = async () => {
      try {
        const { data, error } = await supabase
          .from('monthly_meetings')
          .select('*')
          .is('deleted_at', null)
          .order('scheduled_at', { ascending: true });
        
        if (error) throw error;
        setMonthlyMeetings(data as MonthlyMeeting[]);
      } catch (err) {
        console.warn('Failed to load monthly meetings:', err);
      }
    };

    loadApplications();
    loadFinancialRecords();
    loadPaymentReceipts();
    loadMonthlyMeetings();

    const loadPartnerUniversities = async () => {
      const { data: universities, error: universitiesError } = await supabase
        .from('partner_universities')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (universitiesError) {
        console.error('Error loading partner universities:', universitiesError);
        return;
      }

      const { data: agreements, error: agreementsError } = await supabase
        .from('partner_agreements')
        .select('*')
        .order('created_at', { ascending: false });

      if (agreementsError) {
        console.error('Error loading partner agreements:', agreementsError);
        return;
      }

      const partners: PartnerUniversity[] = (universities || []).map((partner) => ({
        ...partner,
        agreements: (agreements || []).filter(
          (agreement) => agreement.partner_id === partner.id
        )
      }));

      setPartnerUniversities(partners);
    };

    const loadUniversityCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('university_courses')
          .select('*')
          .is('deleted_at', null)
          .order('course_name', { ascending: true });
        if (error) throw error;
        setUniversityCourses((data || []).map(c => ({
          ...c,
          admission_fee: Number(c.admission_fee),
          tuition_fee: Number(c.tuition_fee)
        })));
      } catch (err) {
        console.error('Error loading university courses:', err);
      }
    };

    const loadScholarships = async () => {
      try {
        const { data, error } = await supabase
          .from('scholarships')
          .select('*')
          .is('deleted_at', null)
          .order('name', { ascending: true });
        if (error) throw error;
        setScholarships((data || []).map(s => ({
          ...s,
          coverage_amount: Number(s.coverage_amount),
          coverage_percentage: s.coverage_percentage ? Number(s.coverage_percentage) : null
        })));
      } catch (err) {
        console.error('Error loading scholarships:', err);
      }
    };

    const loadUniversityBrochures = async () => {
      try {
        const { data, error } = await supabase
          .from('university_brochures')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setUniversityBrochures(data as UniversityBrochure[]);
      } catch (err) {
        console.error('Error loading university brochures:', err);
      }
    };

    const loadDepartmentReports = async () => {
      if (
        !currentProfile?.id ||
        currentProfile.account_type === 'student' ||
        currentProfile.account_type === 'unassigned'
      ) {
        setDepartmentReports([]);
        return;
      }

      let query = supabase
        .from('department_reports')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (!currentProfile.is_admin) {
        query = query.eq('department', currentProfile.department);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading department reports:', error);
        return;
      }

      const reportRows = data || [];
      const reportIds = reportRows.map((report) => report.id);

      const { data: attachmentRows, error: attachmentsError } = reportIds.length
        ? await supabase
            .from('report_attachments')
            .select('*')
            .in('report_id', reportIds)
            .order('created_at', { ascending: true })
        : { data: [], error: null };

      if (attachmentsError) {
        console.error('Error loading department report attachments:', attachmentsError);
        return;
      }

      const profileIds = currentProfile.is_admin
        ? [...new Set(reportRows.flatMap((report) => [report.submitted_by, report.reviewed_by]).filter(Boolean))]
        : [currentProfile.id];
      const profileNames = new Map<string, string>([
        [currentProfile.id, currentProfile.full_name],
      ]);

      if (currentProfile.is_admin && profileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', profileIds);

        if (profilesError) {
          console.error('Error loading department report authors:', profilesError);
        } else {
          (profiles || []).forEach((profile) => {
            profileNames.set(profile.id, profile.full_name);
          });
        }
      }

      setDepartmentReports(
        reportRows.map((report) => ({
          ...report,
          department: report.department as DepartmentReport['department'],
          status: report.status as DepartmentReportStatus,
          revision_count: Number(report.revision_count || 0),
          submitted_by_name: profileNames.get(report.submitted_by) || 'Department staff',
          reviewed_by_name: report.reviewed_by
            ? profileNames.get(report.reviewed_by)
            : undefined,
          attachments: (attachmentRows || [])
            .filter((attachment) => attachment.report_id === report.id)
            .map((attachment) => ({
              ...attachment,
              file_size: attachment.file_size == null
                ? undefined
                : Number(attachment.file_size),
            })),
        })) as DepartmentReport[]
      );
    };

    const loadDepartmentKpis = async () => {
      if (
        !currentProfile?.id ||
        currentProfile.account_type === 'student' ||
        currentProfile.account_type === 'unassigned'
      ) {
        setDepartmentKpis([]);
        return;
      }

      const { data, error } = await supabase
        .from('department_kpis')
        .select('*')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading department KPI records:', error);
        return;
      }

      setDepartmentKpis(
        (data || []).map((record) => ({
          ...record,
          department: record.department as DepartmentType,
          rating: record.rating as DepartmentKpiRecord['rating'],
          kpi_lead_management: Number(record.kpi_lead_management),
          kpi_conversion: Number(record.kpi_conversion),
          kpi_communications: Number(record.kpi_communications),
          kpi_reporting: Number(record.kpi_reporting),
          kpi_teamwork: Number(record.kpi_teamwork),
          kpi_discipline: Number(record.kpi_discipline),
          total_score: Number(record.total_score),
          consecutive_missed_reports: Number(record.consecutive_missed_reports),
        })) as DepartmentKpiRecord[]
      );
    };

    loadPartnerUniversities();
    loadUniversityCourses();
    loadScholarships();
    loadUniversityBrochures();
    loadDepartmentReports();
    loadDepartmentKpis();

    const loadWorkAssignments = async () => {
      if (
        !currentProfile?.id ||
        currentProfile.account_type === 'student' ||
        currentProfile.account_type === 'unassigned'
      ) {
        setWorkAssignments([]);
        setWorkAssignmentComments([]);
        return;
      }

      // Privileged roles see all assignments; regular departments only see
      // tasks assigned TO their department or tasks they personally created.
      const isPrivileged =
        currentProfile.is_admin ||
        currentProfile.department === 'admin' ||
        currentProfile.department === 'operations' ||
        currentProfile.department === 'management';

      let query = supabase
        .from('department_work_assignments')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (!isPrivileged) {
        // Use Supabase OR filter: assigned to my department OR I created it
        query = query.or(
          `assigned_department.eq.${currentProfile.department},created_by.eq.${currentProfile.id}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading work assignments:', error);
        return;
      }

      const rows = data || [];
      const creatorIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))];
      const creatorNames = new Map<string, string>();

      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, department')
          .in('id', creatorIds);

        (profiles || []).forEach((p) => {
          creatorNames.set(p.id, `${p.full_name} (${p.department})`);
        });
      }

      setWorkAssignments(
        rows.map((row) => ({
          ...row,
          assigned_department: row.assigned_department as DepartmentType,
          priority: row.priority as WorkAssignment['priority'],
          status: row.status as WorkAssignment['status'],
          creator_name: creatorNames.get(row.created_by) || 'Operations',
        })) as WorkAssignment[]
      );

      // Load comments for all visible assignments
      const assignmentIds = rows.map((r) => r.id);
      if (assignmentIds.length > 0) {
        const { data: commentRows, error: commentError } = await supabase
          .from('department_work_comments')
          .select('*')
          .in('assignment_id', assignmentIds)
          .order('created_at', { ascending: true });

        if (commentError) {
          console.error('Error loading work assignment comments:', commentError);
        } else {
          const commenterIds = [...new Set((commentRows || []).map((c) => c.user_id))];
          const commenterNames = new Map<string, string>();

          if (commenterIds.length > 0) {
            const { data: cProfiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', commenterIds);

            (cProfiles || []).forEach((p) => {
              commenterNames.set(p.id, p.full_name);
            });
          }

          setWorkAssignmentComments(
            (commentRows || []).map((c) => ({
              ...c,
              user_name: commenterNames.get(c.user_id) || 'Staff',
            })) as WorkAssignmentComment[]
          );
        }
      }
    };

    loadWorkAssignments();
  }, [
    loading,
    currentProfile?.id,
    currentProfile?.account_type,
    currentProfile?.department,
    currentProfile?.is_admin,
  ]);

  useEffect(() => {
    if (loading || !currentProfile?.id || currentProfile.account_type === 'unassigned') {
      setVisaApplications([]);
      return;
    }

    const loadVisaApplications = async () => {
      const isStaffOrAdmin =
        currentProfile.is_admin || currentProfile.department === 'admissions';

      let query = supabase.from('student_visa_applications').select('*');
      if (!isStaffOrAdmin) {
        query = query.eq('student_id', currentProfile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to load visa applications:', error);
        return;
      }

      const rows = data || [];
      if (isStaffOrAdmin && rows.length > 0) {
        const studentIds = [...new Set(rows.map((r) => r.student_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds);

        const profileMap = new Map<string, { name: string; email: string }>();
        (profiles || []).forEach((p) => {
          profileMap.set(p.id, { name: p.full_name, email: p.email });
        });

        setVisaApplications(
          rows.map((row) => ({
            ...row,
            student_name: profileMap.get(row.student_id)?.name || 'Unknown Student',
            student_email: profileMap.get(row.student_id)?.email || '',
          })) as VisaApplication[]
        );
      } else {
        setVisaApplications(
          rows.map((row) => ({
            ...row,
            student_name: currentProfile.full_name,
            student_email: currentProfile.email,
          })) as VisaApplication[]
        );
      }
    };

    loadVisaApplications();
  }, [
    loading,
    currentProfile?.id,
    currentProfile?.account_type,
    currentProfile?.department,
    currentProfile?.is_admin,
  ]);

  useEffect(() => {
    if (loading || !currentProfile?.id || currentProfile.account_type === 'unassigned') {
      setCommunications([]);
      return;
    }

    let active = true;
    const loadCommunications = async () => {
      const { data, error } = await supabase
        .from('department_communications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading department communications:', error);
        return;
      }

      if (!active) return;
      setCommunications(
        (data || []).map((message) => ({
          id: message.id,
          type: message.type as CommunicationType,
          sender_id: message.sender_id,
          sender_name: message.sender_name,
          department: message.recipient_department as DepartmentType | 'all',
          title: message.title,
          body: message.body,
          priority: message.priority as PriorityLevel,
          is_read: message.is_read,
          created_at: message.created_at,
        })) as Communication[]
      );
    };

    void loadCommunications();
    const channel = supabase
      .channel(`department-communications-${currentProfile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'department_communications' },
        () => void loadCommunications()
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [loading, currentProfile?.id, currentProfile?.account_type]);

  // ─── HR MANAGEMENT SYSTEM LOADERS ───
  useEffect(() => {
    if (loading || !currentProfile?.id || currentProfile.account_type === 'unassigned') {
      setHrEmployeeRecords(initialHrEmployees);
      setHrInterviews(initialHrInterviews);
      setHrLeaveRequests(initialHrLeaves);
      return;
    }

    const isHrOrAdmin =
      currentProfile.is_admin ||
      currentProfile.department === 'human_resources' ||
      currentProfile.department === 'admin';

    if (!isHrOrAdmin) {
      return;
    }

    const loadHrData = async () => {
      // 1. Employee records
      try {
        const { data, error } = await supabase
          .from('hr_employee_records')
          .select('*')
          .is('deleted_at', null)
          .order('full_name', { ascending: true });
        if (!error && data && data.length > 0) {
          setHrEmployeeRecords(data as HrEmployeeRecord[]);
        }
      } catch (err) {
        console.warn('Failed to fetch hr_employee_records (table might not exist yet):', err);
      }

      // 2. Interviews
      try {
        const { data, error } = await supabase
          .from('hr_interviews')
          .select('*')
          .order('interview_date', { ascending: true });
        if (!error && data && data.length > 0) {
          setHrInterviews(data as HrInterview[]);
        }
      } catch (err) {
        console.warn('Failed to fetch hr_interviews (table might not exist yet):', err);
      }

      // 3. Leave Requests
      try {
        const { data, error } = await supabase
          .from('hr_leave_requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setHrLeaveRequests(data as HrLeaveRequest[]);
        }
      } catch (err) {
        console.warn('Failed to fetch hr_leave_requests (table might not exist yet):', err);
      }
    };

    void loadHrData();
  }, [
    loading,
    currentProfile?.id,
    currentProfile?.department,
    currentProfile?.is_admin
  ]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
        }}
      >
        Loading Globe Scholars Pathways, LLC...
      </div>
    );
  }


  // RLS Filtered Accessors
  const getScopedApplications = () => {
    return RLSSimulationEngine.filterApplications(
      applications,
      currentProfile.department,
      currentProfile.is_admin,
      ['United Kingdom'] // UK Director default assignment
    );
  };

  const getScopedCounselingSessions = () => {
    return RLSSimulationEngine.filterCounselingSessions(
      counselingSessions,
      currentProfile.department,
      currentProfile.is_admin
    );
  };

  const getScopedFinancialRecords = () => {
    return RLSSimulationEngine.filterFinancialRecords(
      financialRecords,
      currentProfile.department,
      currentProfile.is_admin
    );
  };

  const getScopedStudents = () => {
    return RLSSimulationEngine.filterStudents(
      students,
      currentProfile.department,
      currentProfile.is_admin,
      ['United Kingdom']
    );
  };

  // Helper for audit logging
  const logAudit = (
    action: string,
    entityType: string,
    entityId: string,
    beforeState?: unknown,
    afterState?: unknown
  ) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_name: currentProfile.full_name,
      department: currentProfile.department,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_state: beforeState,
      after_state: afterState,
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Update Status
  const updateApplicationStatus = (appId: string, newStatus: ApplicationStatus, note: string) => {
    const currentApplication = applications.find(
      (application) => application.id === appId
    );

    if (!currentApplication) return;

    const oldStatus = currentApplication.status;
    const updatedAt = new Date().toISOString();
    // Student profiles use an internal default department for access control;
    // submission is therefore recorded as intake rather than a staff sign-off.
    const actingDepartment =
      currentProfile.account_type === 'student'
        ? 'marketing'
        : currentProfile.department;
    const historyEntry: ApplicationStatusHistory = {
      id: `his-${Date.now()}`,
      application_id: appId,
      from_status: oldStatus,
      to_status: newStatus,
      changed_by_name: currentProfile.full_name,
      department: actingDepartment,
      note: note || `Status updated from ${oldStatus} to ${newStatus}`,
      created_at: updatedAt,
    };

    // Update the dashboard optimistically, then retain the same audit trail
    // in Supabase so the student's department journey survives a refresh.
    setApplications((previous) =>
      previous.map((application) =>
        application.id === appId
          ? { ...application, status: newStatus, updated_at: updatedAt }
          : application
      )
    );
    setStatusHistory((previous) => [historyEntry, ...previous]);
    logAudit(
      'UPDATE_APPLICATION_STATUS',
      'applications',
      appId,
      { status: oldStatus },
      { status: newStatus }
    );

    void (async () => {
      const { error: applicationError } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', appId);

      if (applicationError) {
        console.error('Unable to save application status:', applicationError);
        return;
      }

      const { error: historyError } = await supabase
        .from('application_status_history')
        .insert({
          application_id: appId,
          from_status: oldStatus,
          to_status: newStatus,
          changed_by_name: currentProfile.full_name,
          department: actingDepartment,
          note: historyEntry.note,
          created_at: updatedAt,
        });

      if (historyError) {
        console.error('Unable to save application status history:', historyError);
      }
    })();
  };

  // A handoff is persisted before it appears in the Admissions queue. This
  // avoids the old behaviour where a transfer disappeared after a refresh.
  const handoffToAdmissions = async (appId: string) => {
    const application = applications.find((app) => app.id === appId);
    if (!application) {
      throw new Error('The application could not be found for handoff.');
    }

    const nextStatus = application.status === 'draft' ? 'submitted' : application.status;
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('applications')
      .update({
        handed_off_to_admissions: true,
        status: nextStatus,
      })
      .eq('id', appId);

    if (error) {
      console.error('Unable to hand application to Admissions:', error);
      throw new Error(error.message);
    }

    setApplications((previous) =>
      previous.map((app) =>
        app.id === appId
          ? {
              ...app,
              handed_off_to_admissions: true,
              status: nextStatus,
              updated_at: updatedAt,
            }
          : app
      )
    );
    if (nextStatus !== application.status) {
      const actingDepartment =
        currentProfile.account_type === 'student'
          ? 'marketing'
          : currentProfile.department;
      const handoffHistory: ApplicationStatusHistory = {
        id: `his-${Date.now()}`,
        application_id: appId,
        from_status: application.status,
        to_status: nextStatus,
        changed_by_name: currentProfile.full_name,
        department: actingDepartment,
        note: 'Application submitted and routed to Admissions.',
        created_at: updatedAt,
      };
      setStatusHistory((previous) => [handoffHistory, ...previous]);
      const { error: historyError } = await supabase
        .from('application_status_history')
        .insert({
          application_id: appId,
          from_status: application.status,
          to_status: nextStatus,
          changed_by_name: currentProfile.full_name,
          department: actingDepartment,
          note: handoffHistory.note,
          created_at: updatedAt,
        });

      if (historyError) {
        console.error('Unable to save Admissions handoff history:', historyError);
      }
    }
    logAudit('HANDOFF_TO_ADMISSIONS', 'applications', appId, { handed_off: application.handed_off_to_admissions }, { handed_off: true });

    addCommunication(
      'notification',
      `Application ${application.application_number} ready for Admissions`,
      `${application.student_name}'s completed application has been routed to the Admissions review queue.`,
      'high',
      'admissions'
    );
  };

  // Add Document
  const addDocument = async (
    appId: string,
    docType: DocType,
    file: File
  ): Promise<ApplicationDocument> => {
    if (!file) {
      throw new Error('No document file selected.');
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${appId}/${timestamp}-${safeFileName}`;

    // 1. Upload the actual file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('application-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });

    if (uploadError) {
      console.error('Document upload failed:', uploadError);
      throw uploadError;
    }

    // 2. Create the database document record
    const { data: documentRow, error: documentError } = await supabase
      .from('application_documents')
      .insert({
        application_id: appId,
        document_type: docType,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        current_version: 1,
        is_missing: false,
        is_verified: false
      })
      .select()
      .single();

    if (documentError) {
      // Remove the Storage file if database insertion fails
      await supabase.storage
        .from('application-documents')
        .remove([storagePath]);

      console.error('Document database insert failed:', documentError);
      throw documentError;
    }

    // 3. Create the first version record
    const { data: versionRow, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentRow.id,
        version_number: 1,
        storage_path: storagePath,
        uploaded_by_name: currentProfile.full_name,
        change_summary: 'Initial document upload'
      })
      .select()
      .single();

    if (versionError) {
      // Clean up both database document and Storage file
      await supabase
        .from('application_documents')
        .delete()
        .eq('id', documentRow.id);

      await supabase.storage
        .from('application-documents')
        .remove([storagePath]);

      console.error('Document version insert failed:', versionError);
      throw versionError;
    }

    // 4. Generate a temporary signed URL
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from('application-documents')
        .createSignedUrl(storagePath, 60 * 60);

    if (signedUrlError) {
      console.warn('Signed URL generation failed:', signedUrlError);
    }

    // 5. Convert database records into the application's document object
    const newDoc: ApplicationDocument = {
      id: documentRow.id,
      application_id: documentRow.application_id,
      document_type: documentRow.document_type as DocType,
      file_name: documentRow.file_name,
      storage_path: documentRow.storage_path,
      file_size: Number(documentRow.file_size),
      mime_type: documentRow.mime_type,
      current_version: documentRow.current_version,
      is_missing: documentRow.is_missing,
      is_verified: documentRow.is_verified,
      verified_by_name: documentRow.verified_by_name || undefined,
      verified_at: documentRow.verified_at || undefined,
      notes: documentRow.notes || undefined,
      signed_url: signedUrlData?.signedUrl,
      versions: [
        {
          id: versionRow.id,
          document_id: versionRow.document_id,
          version_number: versionRow.version_number,
          storage_path: versionRow.storage_path,
          uploaded_by_name: versionRow.uploaded_by_name,
          uploaded_at: versionRow.uploaded_at,
          change_summary: versionRow.change_summary
        }
      ],
      created_at: documentRow.created_at
    };

    // 6. Update the UI immediately
    setDocuments(prev => [newDoc, ...prev]);

    // 7. Audit the upload
    logAudit(
      'UPLOAD_DOCUMENT',
      'application_documents',
      documentRow.id,
      null,
      {
        file_name: file.name,
        storage_path: storagePath
      }
    );

    return newDoc;
  };

  // Update Document Version
  const updateDocumentVersion = (docId: string, changeSummary: string) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          const nextVer = doc.current_version + 1;
          const newVersionObj = {
            id: `ver-${docId}-${nextVer}`,
            document_id: docId,
            version_number: nextVer,
            storage_path: `documents/${doc.application_id}/${doc.file_name}_v${nextVer}`,
            uploaded_by_name: currentProfile.full_name,
            uploaded_at: new Date().toISOString(),
            change_summary: changeSummary || `Uploaded version ${nextVer}`
          };

          logAudit('NEW_DOCUMENT_VERSION', 'application_documents', docId, { version: doc.current_version }, { version: nextVer });

          return {
            ...doc,
            current_version: nextVer,
            versions: [newVersionObj, ...doc.versions]
          };
        }
        return doc;
      })
    );
  };

  // Verify Document
  const verifyDocument = (docId: string, verified: boolean) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          logAudit('VERIFY_DOCUMENT', 'application_documents', docId, { is_verified: doc.is_verified }, { is_verified: verified });
          return {
            ...doc,
            is_verified: verified,
            verified_by_name: verified ? `${currentProfile.full_name} (${currentProfile.department})` : undefined,
            verified_at: verified ? new Date().toISOString() : undefined
          };
        }
        return doc;
      })
    );
  };

  // Toggle Missing Doc Flag
  const toggleMissingDocFlag = (docId: string, isMissing: boolean) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          // Adjust missing documents count on target application
          setApplications(apps =>
            apps.map(a => {
              if (a.id === doc.application_id) {
                const newCount = Math.max(0, a.missing_documents_count + (isMissing ? 1 : -1));
                return {
                  ...a,
                  missing_documents_count: newCount,
                  status: newCount > 0 ? 'documents_missing' : (a.status === 'documents_missing' ? 'under_review' : a.status)
                };
              }
              return a;
            })
          );
          return { ...doc, is_missing: isMissing };
        }
        return doc;
      })
    );
  };

  // Schedule Counseling Session
  const scheduleCounselingSession = (studentId: string, scheduledAt: string, meetLink: string, notes: string) => {
    const student = students.find(s => s.id === studentId);
    const newSession: CounselingSession = {
      id: `cs-${Date.now()}`,
      student_id: studentId,
      student_name: student ? `${student.first_name} ${student.last_name}` : 'Student',
      counselor_id: currentProfile.id,
      counselor_name: currentProfile.full_name,
      scheduled_at: scheduledAt,
      duration_minutes: 45,
      google_meet_link: meetLink || `https://meet.google.com/gsp-${Math.random().toString(36).substring(7)}`,
      status: 'scheduled',
      session_notes: notes || 'Initial academic advisory and scholarship eligibility consultation.',
      scholarship_recommendations: ['Global Excellence Grant', 'Merit Pathway Award'],
      created_at: new Date().toISOString()
    };

    setCounselingSessions(prev => [newSession, ...prev]);
    logAudit('SCHEDULE_COUNSELING_SESSION', 'counseling_sessions', newSession.id, null, { meet_link: newSession.google_meet_link });

    // Notify student
    addCommunication(
      'notification',
      'Google Meet Counseling Session Scheduled',
      `Your counseling session with ${currentProfile.full_name} is set for ${new Date(scheduledAt).toLocaleString()}. Meet link: ${newSession.google_meet_link}`,
      'high'
    );
  };

  // Create Institution Task
  const createInstitutionTask = (appId: string, title: string, description: string, assigneeName: string, deadline: string) => {
    const app = applications.find(a => a.id === appId);
    const newTask: InstitutionTask = {
      id: `tsk-${Date.now()}`,
      application_id: appId,
      application_number: app ? app.application_number : 'GS-TASK',
      title,
      description,
      assigned_to_name: assigneeName || 'Operations Specialist',
      status: 'pending',
      deadline: deadline || new Date(Date.now() + 86400000 * 7).toISOString(),
      created_at: new Date().toISOString()
    };

    setInstitutionTasks(prev => [newTask, ...prev]);
    logAudit('CREATE_INSTITUTION_TASK', 'institution_tasks', newTask.id, null, { title });
  };

  // Records a payment confirmation only. Card details stay with the payment
  // provider; Finance confirms the payment in its secure ledger.
  const processFeePayment = async (
    appId: string,
    amount: number,
    paymentRef: string,
    paymentType: 'registration_fee' | 'tuition_fee' | 'admission_fee' = 'registration_fee'
  ) => {
    const app = applications.find(a => a.id === appId);
    if (!app || !currentProfile || currentProfile.account_type !== 'student') {
      throw new Error('Only the student who owns this application can submit a payment confirmation.');
    }

    const { data, error } = await supabase
      .from('financial_records')
      .insert({
        application_id: appId,
        application_number: app.application_number,
        student_id: app.student_id,
        student_name: app.student_name,
        record_type: paymentType,
        amount,
        currency: 'USD',
        status: 'pending',
        payment_reference: paymentRef,
        notes: 'Payment confirmation submitted by the student. Finance verification is required.',
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Unable to submit payment confirmation:', error);
      throw new Error(error?.message || 'The payment confirmation could not be saved.');
    }

    const newRecord: FinancialRecord = {
      ...data,
      amount: Number(data.amount),
      status: data.status as FinancialRecord['status'],
      record_type: data.record_type as FinancialRecord['record_type'],
    };

    setFinancialRecords(prev => [newRecord, ...prev]);

    addCommunication(
      'notification',
      `Registration fee confirmation: ${app.application_number}`,
      `${app.student_name} submitted a $${amount.toFixed(2)} USD ${paymentType.replace(/_/g, ' ')} payment confirmation (${paymentRef}). Finance verification is required.`,
      'high',
      'finance'
    );
    addCommunication(
      'notification',
      `Payment status updated: ${app.application_number}`,
      `${app.student_name} submitted a ${paymentType.replace(/_/g, ' ')} payment confirmation. The application may proceed while Finance verifies it.`,
      'medium',
      'admissions'
    );
    logAudit('SUBMIT_REGISTRATION_FEE_CONFIRMATION', 'financial_records', newRecord.id, null, { amount, ref: paymentRef });
    return newRecord;
  };

  const normalizeReceipt = (receipt: PaymentReceipt): PaymentReceipt => ({
    ...receipt,
    amount: Number(receipt.amount),
    status: receipt.status as PaymentReceipt['status'],
  });

  const createPaymentReceiptFromRecord = async (
    record: FinancialRecord,
    notes = ''
  ): Promise<PaymentReceipt> => {
    if (!currentProfile || (!currentProfile.is_admin && currentProfile.department !== 'finance')) {
      throw new Error('Only Finance or an administrator can generate a receipt.');
    }

    const existingReceipt = paymentReceipts.find(
      (receipt) => receipt.financial_record_id === record.id
    );

    if (existingReceipt) {
      return existingReceipt;
    }

    if (!['paid', 'approved'].includes(record.status)) {
      throw new Error('A receipt can only be generated after Finance approves the payment.');
    }

    const now = new Date();
    const receiptNumber = `GSP-RCPT-${now.getFullYear()}-${String(Date.now()).slice(-6)}`;

    const { data, error } = await supabase
      .from('payment_receipts')
      .insert({
        receipt_number: receiptNumber,
        financial_record_id: record.id,
        application_id: record.application_id,
        application_number: record.application_number,
        student_id: record.student_id,
        student_name: record.student_name,
        amount: Number(record.amount),
        currency: record.currency,
        payment_reference: record.payment_reference || null,
        issued_by: currentProfile.id,
        issued_by_name: currentProfile.full_name,
        status: 'issued',
        notes: notes || `Receipt issued for ${record.record_type.replace(/_/g, ' ')}.`,
      })
      .select('*')
      .single();

    if (error || !data) {
      const { data: fallbackReceipt } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('financial_record_id', record.id)
        .maybeSingle();

      if (fallbackReceipt) {
        const existing = normalizeReceipt(fallbackReceipt as PaymentReceipt);
        setPaymentReceipts((previous) => [
          existing,
          ...previous.filter((receipt) => receipt.id !== existing.id),
        ]);
        return existing;
      }

      console.error('Unable to generate payment receipt:', error);
      throw new Error(error?.message || 'The payment receipt could not be generated.');
    }

    const receipt = normalizeReceipt(data as PaymentReceipt);
    setPaymentReceipts((previous) => [
      receipt,
      ...previous.filter((item) => item.id !== receipt.id),
    ]);
    logAudit('GENERATE_PAYMENT_RECEIPT', 'payment_receipts', receipt.id, null, {
      receipt_number: receipt.receipt_number,
      financial_record_id: record.id,
    });

    return receipt;
  };

  const generatePaymentReceipt = async (recordId: string): Promise<PaymentReceipt> => {
    const record = financialRecords.find((item) => item.id === recordId);
    if (!record) {
      throw new Error('The financial record could not be found.');
    }

    return createPaymentReceiptFromRecord(record);
  };

  const reviewRegistrationPayment = async (
    recordId: string,
    approved: boolean,
    note = ''
  ): Promise<FinancialRecord> => {
    if (!currentProfile || (!currentProfile.is_admin && currentProfile.department !== 'finance')) {
      throw new Error('Only Finance or an administrator can verify a payment.');
    }

    const existingRecord = financialRecords.find((record) => record.id === recordId);
    if (!existingRecord) {
      throw new Error('The payment record could not be found.');
    }

    const status = approved ? 'paid' : 'rejected';
    const verificationNote = note.trim() || (
      approved
        ? 'Finance verified the student payment confirmation.'
        : 'Finance could not verify the submitted payment confirmation.'
    );
    const { data, error } = await supabase
      .from('financial_records')
      .update({
        status,
        approved_by_name: currentProfile.full_name,
        notes: verificationNote,
        verified_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Unable to verify payment:', error);
      throw new Error(error?.message || 'The payment review could not be saved.');
    }

    const reviewedRecord: FinancialRecord = {
      ...data,
      amount: Number(data.amount),
      status: data.status as FinancialRecord['status'],
      record_type: data.record_type as FinancialRecord['record_type'],
    };
    setFinancialRecords((previous) =>
      previous.map((record) => record.id === recordId ? reviewedRecord : record)
    );
    setStudents((previous) => previous.map((student) =>
      reviewedRecord.record_type === 'registration_fee' &&
      student.id === reviewedRecord.student_id
        ? { ...student, registration_fee_paid: approved }
        : student
    ));
    const paymentLabel = reviewedRecord.record_type.replace(/_/g, ' ');
    addCommunication(
      'notification',
      `Finance ${approved ? 'verified' : 'rejected'} fee: ${reviewedRecord.application_number}`,
      `Finance ${approved ? 'verified' : 'rejected'} ${reviewedRecord.student_name}'s ${paymentLabel} payment. ${verificationNote}`,
      approved ? 'medium' : 'high',
      'admissions'
    );
    if (approved) {
      try {
        const receipt = await createPaymentReceiptFromRecord(
          reviewedRecord,
          verificationNote
        );
        await addCommunication(
          'notification',
          `Receipt issued: ${reviewedRecord.application_number}`,
          `Finance issued receipt ${receipt.receipt_number} for ${reviewedRecord.student_name}'s verified payment.`,
          'medium',
          'admissions'
        );
      } catch (receiptError) {
        console.error('Payment approved but receipt generation failed:', receiptError);
      }
    }
    logAudit('REVIEW_REGISTRATION_FEE', 'financial_records', recordId, { status: existingRecord.status }, { status });
    return reviewedRecord;
  };

  const createFinancialRecord = async (
    record: Omit<FinancialRecord, 'id' | 'created_at' | 'approved_by_name'>
  ): Promise<FinancialRecord> => {
    if (!currentProfile || (!currentProfile.is_admin && currentProfile.department !== 'finance')) {
      throw new Error('Only Finance or an administrator can add a financial record.');
    }

    const { data, error } = await supabase
      .from('financial_records')
      .insert({
        ...record,
        amount: Number(record.amount),
        approved_by_name: currentProfile.full_name,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Unable to create financial record:', error);
      throw new Error(error?.message || 'The financial record could not be created.');
    }

    const newRecord: FinancialRecord = {
      ...data,
      amount: Number(data.amount),
      status: data.status as FinancialRecord['status'],
      record_type: data.record_type as FinancialRecord['record_type'],
    };
    setFinancialRecords((previous) => [newRecord, ...previous]);
    logAudit('CREATE_FINANCIAL_RECORD', 'financial_records', newRecord.id, null, {
      application_id: newRecord.application_id,
      record_type: newRecord.record_type,
      amount: newRecord.amount,
    });
    return newRecord;
  };

  // Cross-department messages are stored in Supabase, so a recipient sees
  // the same inbox after refresh or when they sign in from another device.
  const addCommunication = async (
    type: CommunicationType,
    title: string,
    body: string,
    priority: PriorityLevel = 'medium',
    dept: DepartmentType | 'all' = 'admin'
  ): Promise<void> => {
    if (!currentProfile?.id) {
      throw new Error('Sign in before sending a department communication.');
    }

    const { data, error } = await supabase
      .from('department_communications')
      .insert({
        sender_id: currentProfile.id,
        sender_name: `${currentProfile.full_name} (${currentProfile.department})`,
        sender_department: currentProfile.department,
        recipient_department: dept,
        type,
        title: title.trim(),
        body: body.trim(),
        priority,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Unable to send department communication:', error);
      throw new Error(error?.message || 'The department communication could not be sent.');
    }

    const newComm: Communication = {
      id: data.id,
      type: data.type as CommunicationType,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      department: data.recipient_department as DepartmentType | 'all',
      title: data.title,
      body: data.body,
      priority: data.priority as PriorityLevel,
      is_read: data.is_read,
      created_at: data.created_at,
    };
    setCommunications((previous) => [
      newComm,
      ...previous.filter((communication) => communication.id !== newComm.id),
    ]);
  };

  const markCommunicationRead = async (communicationId: string) => {
    const { error } = await supabase.rpc('mark_department_communication_read', {
      p_communication_id: communicationId,
    });

    if (error) {
      console.error('Unable to mark department communication as read:', error);
      throw new Error(error.message);
    }

    setCommunications((previous) =>
      previous.map((communication) =>
        communication.id === communicationId
          ? { ...communication, is_read: true }
          : communication
      )
    );
  };

  const saveDepartmentKpi = async (
    record: DepartmentKpiInput,
    id?: string
  ): Promise<DepartmentKpiRecord> => {
    if (!currentProfile || currentProfile.department !== 'operations' || currentProfile.account_type !== 'staff') {
      throw new Error('Only Operations can enter or update department KPI records.');
    }

    const payload = {
      evaluation_period: record.evaluation_period,
      staff_name: record.staff_name.trim(),
      staff_email: record.staff_email?.trim() || null,
      department: record.department,
      role_title: record.role_title.trim(),
      kpi_lead_management: Number(record.kpi_lead_management),
      kpi_conversion: Number(record.kpi_conversion),
      kpi_communications: Number(record.kpi_communications),
      kpi_reporting: Number(record.kpi_reporting),
      kpi_teamwork: Number(record.kpi_teamwork),
      kpi_discipline: Number(record.kpi_discipline),
      daily_report_submitted: record.daily_report_submitted,
      weekly_report_submitted: record.weekly_report_submitted,
      monthly_report_submitted: record.monthly_report_submitted,
      consecutive_missed_reports: Number(record.consecutive_missed_reports),
      formal_review_required: record.formal_review_required,
      notes_actions: record.notes_actions?.trim() || null,
      created_by: currentProfile.id,
      created_by_name: currentProfile.full_name,
    };

    const query = id
      ? supabase
          .from('department_kpis')
          .update(payload)
          .eq('id', id)
          .select('*')
          .single()
      : supabase
          .from('department_kpis')
          .insert(payload)
          .select('*')
          .single();

    const { data, error } = await query;

    if (error || !data) {
      console.error('Unable to save KPI record:', error);
      throw new Error(error?.message || 'The KPI record could not be saved.');
    }

    const savedRecord: DepartmentKpiRecord = {
      ...data,
      department: data.department as DepartmentType,
      rating: data.rating as DepartmentKpiRecord['rating'],
      kpi_lead_management: Number(data.kpi_lead_management),
      kpi_conversion: Number(data.kpi_conversion),
      kpi_communications: Number(data.kpi_communications),
      kpi_reporting: Number(data.kpi_reporting),
      kpi_teamwork: Number(data.kpi_teamwork),
      kpi_discipline: Number(data.kpi_discipline),
      total_score: Number(data.total_score),
      consecutive_missed_reports: Number(data.consecutive_missed_reports),
    };

    setDepartmentKpis((previous) => [
      savedRecord,
      ...previous.filter((item) => item.id !== savedRecord.id),
    ]);
    logAudit(id ? 'UPDATE_DEPARTMENT_KPI' : 'CREATE_DEPARTMENT_KPI', 'department_kpis', savedRecord.id, null, {
      department: savedRecord.department,
      staff_name: savedRecord.staff_name,
      total_score: savedRecord.total_score,
    });

    return savedRecord;
  };

  const deleteDepartmentKpi = async (recordId: string): Promise<void> => {
    if (!currentProfile || currentProfile.department !== 'operations' || currentProfile.account_type !== 'staff') {
      throw new Error('Only Operations can delete department KPI records.');
    }

    const { error } = await supabase
      .from('department_kpis')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', recordId);

    if (error) {
      console.error('Unable to delete KPI record:', error);
      throw new Error(error.message);
    }

    setDepartmentKpis((previous) => previous.filter((item) => item.id !== recordId));
    logAudit('DELETE_DEPARTMENT_KPI', 'department_kpis', recordId);
  };

  // Admissions Decision
  const makeAdmissionsDecision = (appId: string, decision: 'conditional_offer' | 'unconditional_offer' | 'rejected', notes: string) => {
    setApplications(prev =>
      prev.map(app => {
        if (app.id === appId) {
          const newStatus: ApplicationStatus = decision === 'rejected' ? 'rejected' : 'approved';
          logAudit('MAKE_ADMISSIONS_DECISION', 'applications', appId, { decision: app.admissions_decision }, { decision, notes });
          
          updateApplicationStatus(appId, newStatus, `Admissions decision made: ${decision.toUpperCase()}. ${notes}`);

          // Notify Ops and Finance
          addCommunication(
            'notification',
            `Admissions Decision: ${app.application_number} (${decision.toUpperCase()})`,
            `Admissions has rendered decision "${decision}" for student ${app.student_name}. Application is now ${newStatus}.`,
            'high',
            'operations'
          );

          return {
            ...app,
            admissions_decision: decision,
            admissions_notes: notes,
            status: newStatus,
            updated_at: new Date().toISOString()
          };
        }
        return app;
      })
    );
  };

  // Add Student
  const addStudent = (studentData: Partial<Student>): Student => {
    const newId = `std-${Date.now()}`;
    const newStudent: Student = {
      id: newId,
      first_name: studentData.first_name || 'New',
      last_name: studentData.last_name || 'Lead',
      email: studentData.email || 'lead@example.com',
      phone: studentData.phone || '+1 555-0100',
      country_of_residence: studentData.country_of_residence || 'United States',
      gpa: studentData.gpa || 3.8,
      lead_source: studentData.lead_source || 'Marketing Campaign',
      assigned_counselor_id: 'usr-cns-01',
      assigned_counselor_name: 'Elena Rostova',
      registration_fee_paid: false,
      created_at: new Date().toISOString()
    };
    setStudents(prev => [newStudent, ...prev]);
    logAudit('CREATE_STUDENT_LEAD', 'students', newId, null, { email: newStudent.email });
    return newStudent;
  };


// Create Application - PERSISTED TO SUPABASE
const createApplication = async (
  appData: Partial<Application>
): Promise<Application> => {
  if (!currentProfile?.id) {
    throw new Error('Student profile is not available.');
  }

  const studentId = appData.student_id || currentProfile.id;
  const studentEmail = appData.student_email || currentProfile.email;
  const studentName = appData.student_name || currentProfile.full_name;

  if (!studentEmail) {
    throw new Error('Student email is required.');
  }

  if (!studentName) {
    throw new Error('Student name is required.');
  }

  const applicationNumber =
    appData.application_number ||
    `GS-2026-${Math.floor(100000 + Math.random() * 900000)}`;

  const now = new Date().toISOString();

  const applicationPayload = {
    application_number: applicationNumber,
    student_id: studentId,
    student_name: studentName,
    student_email: studentEmail,
    student_phone:
      appData.student_phone || currentProfile.phone || null,
    student_age:
      appData.student_age ?? currentProfile.age ?? null,
    student_gender:
      appData.student_gender || currentProfile.gender || null,
    student_current_address:
      appData.student_current_address || currentProfile.current_address || null,
    student_country:
      appData.student_country ||
      currentProfile.country_of_residence ||
      appData.target_country ||
      'United Kingdom',
    status: appData.status || 'draft',
    target_country: appData.target_country || 'United Kingdom',
    target_university:
      appData.target_university || 'University of Oxford',
    study_level: appData.study_level || 'postgraduate',
    degree_program:
      appData.degree_program || 'MSc Data Science',
    intake_period:
      appData.intake_period || 'Fall 2026',
    scholarship_requested:
      appData.scholarship_requested ||
      'GSP Excellence Scholarship',
    missing_documents_count:
      appData.missing_documents_count ?? 0,
    admissions_decision:
      appData.admissions_decision || null,
    admissions_notes:
      appData.admissions_notes || null,
    handed_off_to_admissions:
      appData.handed_off_to_admissions ?? false,
    created_at: now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from('applications')
    .insert(applicationPayload)
    .select('*')
    .single();

  if (error) {
    console.error(
      'SUPABASE APPLICATION INSERT ERROR:',
      error
    );

    throw new Error(
      `Failed to create application: ${error.message}`
    );
  }

  const newApplication: Application = {
    id: data.id,
    application_number: data.application_number,
    student_id: data.student_id,
    student_name: data.student_name,
    student_email: data.student_email,
    student_phone:
      data.student_phone || undefined,
    student_age:
      data.student_age ?? undefined,
    student_gender:
      data.student_gender || undefined,
    student_current_address:
      data.student_current_address || undefined,
    student_country:
      data.student_country || undefined,
    status: data.status as ApplicationStatus,
    target_country: data.target_country,
    target_university: data.target_university,
    study_level: data.study_level,
    degree_program: data.degree_program,
    intake_period: data.intake_period,
    scholarship_requested:
      data.scholarship_requested || undefined,
    missing_documents_count:
      data.missing_documents_count,
    admissions_decision:
      data.admissions_decision || undefined,
    admissions_notes:
      data.admissions_notes || undefined,
    handed_off_to_admissions:
      data.handed_off_to_admissions,
    created_at: data.created_at,
    updated_at: data.updated_at
  };

  // Update local React state
  setApplications(prev => [
    newApplication,
    ...prev.filter(app => app.id !== newApplication.id)
  ]);

  // Create status history
  const { error: historyError } = await supabase
    .from('application_status_history')
    .insert({
      application_id: newApplication.id,
      from_status: null,
      to_status: newApplication.status,
      changed_by_name: currentProfile.full_name,
      department: currentProfile.department || 'data_applications',
      note: 'Application draft created.',
      created_at: now
    });

  if (historyError) {
    console.warn(
      'Application created but status history failed:',
      historyError
    );
  }

  logAudit(
    'CREATE_APPLICATION_DRAFT',
    'applications',
    newApplication.id,
    null,
    {
      application_number:
        newApplication.application_number,
      student_id: newApplication.student_id
    }
  );

  return newApplication;
};


  // Add Partner University
  const addPartnerUniversity = async (
    partnerData: Omit<PartnerUniversity, 'id'>
  ): Promise<PartnerUniversity> => {
    const { data, error } = await supabase
      .from('partner_universities')
      .insert({
        name: partnerData.name,
        country: partnerData.country,
        contact_email: partnerData.contact_email,
        scholarships_offered: partnerData.scholarships_offered,
        active_agreement: partnerData.active_agreement
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding partner university:', error);
      throw new Error(error.message);
    }

    const newPartner: PartnerUniversity = {
      ...data,
      agreements: []
    };

    setPartnerUniversities(prev => [newPartner, ...prev]);

    logAudit(
      'CREATE_PARTNER_UNIVERSITY',
      'partner_universities',
      newPartner.id,
      null,
      newPartner
    );

    return newPartner;
  };

  const deletePartnerUniversity = async (partnerId: string) => {
    if (!currentProfile?.is_admin) {
      throw new Error('Only administrators can remove partner universities.');
    }

    const partner = partnerUniversities.find(
      (item) => item.id === partnerId
    );

    const storagePaths = (partner?.agreements || [])
      .map((agreement) => agreement.storage_path)
      .filter(Boolean);

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('partner-agreements')
        .remove(storagePaths);

      if (storageError) {
        // A missing historical file must not prevent the admin from removing
        // the partner record and its related agreement records.
        console.warn('Some agreement files could not be removed:', storageError);
      }
    }

    const { error } = await supabase
      .from('partner_universities')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', partnerId);

    if (error) {
      console.error('Error deleting partner university:', error);
      throw new Error(error.message);
    }

    setPartnerUniversities((previous) =>
      previous.filter((partnerUniversity) => partnerUniversity.id !== partnerId)
    );

    logAudit(
      'DELETE_PARTNER_UNIVERSITY',
      'partner_universities',
      partnerId,
      partner || null,
      null
    );
  };

  // Upload Partner Agreement
  const uploadPartnerAgreement = async (
    partnerId: string,
    file: File,
    expiryDate: string
  ): Promise<PartnerAgreement> => {
    if (!currentProfile) {
      throw new Error('You must be logged in to upload an agreement.');
    }

    const fileExtension = file.name.split('.').pop() || 'pdf';

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    const filePath = `${partnerId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('partner-agreements')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || `application/${fileExtension}`,
      });

    if (uploadError) {
      console.error('Error uploading partner agreement:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data, error: agreementError } = await supabase
      .from('partner_agreements')
      .insert({
        partner_id: partnerId,
        partner_name:
          partnerUniversities.find(partner => partner.id === partnerId)?.name ||
          'Unknown Partner',
        document_name: file.name,
        storage_path: filePath,
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: expiryDate,
        status: 'active',
      })
      .select()
      .single();

    if (agreementError) {
      await supabase.storage
        .from('partner-agreements')
        .remove([filePath]);

      console.error(
        'Error saving partner agreement:',
        agreementError
      );

      throw new Error(agreementError.message);
    }

    const agreement = data as PartnerAgreement;

    setPartnerUniversities(prev =>
      prev.map(partner =>
        partner.id === partnerId
          ? {
              ...partner,
              agreements: [
                ...(partner.agreements || []),
                agreement
              ]
            }
          : partner
      )
    );

    logAudit(
      'UPLOAD_PARTNER_AGREEMENT',
      'partner_agreements',
      agreement.id,
      null,
      {
        partner_id: partnerId,
        document_name: file.name,
      }
    );

    return agreement;
  };

  const submitDepartmentReport = async (
    report: DepartmentReportSubmission,
    file: File
  ): Promise<DepartmentReport> => {
    if (
      !currentProfile ||
      currentProfile.account_type !== 'staff' ||
      currentProfile.is_admin
    ) {
      throw new Error('Only department staff can submit a department report.');
    }

    if (!file || file.size === 0) {
      throw new Error('Attach the completed report file before submitting.');
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new Error('Report files must be 15 MB or smaller.');
    }

    // Create the report as a draft first. This permits exactly one initial
    // attachment to be associated before the trusted status function submits it.
    const { data: draftReport, error: draftError } = await supabase
      .from('department_reports')
      .insert({
        department: currentProfile.department,
        title: report.title.trim(),
        report_type: 'monthly',
        reporting_period_start: report.reporting_period_start,
        reporting_period_end: report.reporting_period_end,
        executive_summary: report.executive_summary.trim(),
        key_activities: report.key_activities.trim(),
        achievements: report.achievements.trim(),
        challenges: report.challenges.trim(),
        recommendations: report.recommendations.trim(),
        metrics: {},
        status: 'draft',
        submitted_by: currentProfile.id,
      })
      .select('*')
      .single();

    if (draftError || !draftReport) {
      console.error('Department report draft creation failed:', draftError);
      throw new Error(draftError?.message || 'The report draft could not be created.');
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${currentProfile.department}/${currentProfile.id}/${draftReport.id}/${Date.now()}-${safeFileName}`;

    const cleanUpDraft = async () => {
      await supabase.from('department_reports').delete().eq('id', draftReport.id);
    };

    const { error: uploadError } = await supabase.storage
      .from('department-reports')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      await cleanUpDraft();
      console.error('Department report upload failed:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: attachment, error: attachmentError } = await supabase
      .from('report_attachments')
      .insert({
        report_id: draftReport.id,
        uploaded_by: currentProfile.id,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
      })
      .select('*')
      .single();

    if (attachmentError || !attachment) {
      await supabase.storage.from('department-reports').remove([storagePath]);
      await cleanUpDraft();
      console.error('Department report attachment creation failed:', attachmentError);
      throw new Error(attachmentError?.message || 'The report attachment could not be saved.');
    }

    const { data: submittedReport, error: submissionError } = await supabase.rpc(
      'update_department_report_status',
      {
        p_report_id: draftReport.id,
        p_new_status: 'submitted',
        p_comment: 'Initial department report submitted with supporting file.',
      }
    );

    if (submissionError || !submittedReport) {
      console.error('Department report submission failed:', submissionError);
      throw new Error(submissionError?.message || 'The report could not be submitted for review.');
    }

    const newReport: DepartmentReport = {
      ...submittedReport,
      department: submittedReport.department as DepartmentReport['department'],
      status: submittedReport.status as DepartmentReportStatus,
      revision_count: Number(submittedReport.revision_count || 0),
      submitted_by_name: currentProfile.full_name,
      attachments: [{
        ...attachment,
        file_size: attachment.file_size == null
          ? undefined
          : Number(attachment.file_size),
      }],
    };

    setDepartmentReports((previous) => [newReport, ...previous]);
    logAudit('SUBMIT_DEPARTMENT_REPORT', 'department_reports', newReport.id, null, {
      department: newReport.department,
      title: newReport.title,
      file_name: file.name,
    });

    return newReport;
  };

  const reviewDepartmentReport = async (
    reportId: string,
    status: DepartmentReportStatus,
    adminNote: string
  ): Promise<DepartmentReport> => {
    if (!currentProfile?.is_admin) {
      throw new Error('Only administrators can review department reports.');
    }

    const { data, error } = await supabase.rpc(
      'update_department_report_status',
      {
        p_report_id: reportId,
        p_new_status: status,
        p_comment: adminNote.trim() || null,
      }
    );

    if (error) {
      console.error('Department report review failed:', error);
      throw new Error(error.message);
    }

    const priorReport = departmentReports.find((report) => report.id === reportId);
    const reviewedReport: DepartmentReport = {
      ...(priorReport || {}),
      ...data,
      department: data.department as DepartmentReport['department'],
      status: data.status as DepartmentReportStatus,
      revision_count: Number(data.revision_count || 0),
      reviewed_by_name: currentProfile.full_name,
      attachments: priorReport?.attachments || [],
    };

    setDepartmentReports((previous) =>
      previous.map((report) =>
        report.id === reportId ? reviewedReport : report
      )
    );
    logAudit('REVIEW_DEPARTMENT_REPORT', 'department_reports', reportId, null, {
      status,
    });

    return reviewedReport;
  };

  const getDepartmentReportDownloadUrl = async (
    report: DepartmentReport
  ): Promise<string> => {
    const attachment = report.attachments[0];

    if (!attachment) {
      throw new Error('This report does not have an attached file.');
    }

    const { data, error } = await supabase.storage
      .from('department-reports')
      .createSignedUrl(attachment.storage_path, 60 * 30);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || 'The report file could not be opened.');
    }

    return data.signedUrl;
  };

  // ===== Work Assignment CRUD =====

  const createWorkAssignment = async (
    title: string,
    description: string,
    assignedDepartment: DepartmentType,
    priority: WorkAssignmentPriority,
    dueDate?: string
  ): Promise<WorkAssignment> => {
    if (!currentProfile?.id) {
      throw new Error('Sign in before creating a work assignment.');
    }

    const { data, error } = await supabase
      .from('department_work_assignments')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        assigned_department: assignedDepartment,
        created_by: currentProfile.id,
        priority,
        status: 'assigned',
        due_date: dueDate || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to create work assignment:', error);
      throw new Error(error?.message || 'The work assignment could not be created.');
    }

    const newAssignment: WorkAssignment = {
      ...data,
      assigned_department: data.assigned_department as DepartmentType,
      priority: data.priority as WorkAssignmentPriority,
      status: data.status as WorkAssignmentStatus,
      creator_name: `${currentProfile.full_name} (${currentProfile.department})`,
    };

    setWorkAssignments((prev) => [newAssignment, ...prev]);
    logAudit('CREATE_WORK_ASSIGNMENT', 'department_work_assignments', newAssignment.id, null, {
      title,
      assigned_department: assignedDepartment,
      priority,
    });

    return newAssignment;
  };

  const updateWorkAssignmentStatus = async (
    assignmentId: string,
    status: WorkAssignmentStatus
  ): Promise<void> => {
    if (!currentProfile?.id) {
      throw new Error('Sign in before updating a work assignment.');
    }

    const updatePayload: Record<string, unknown> = { status };
    if (status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('department_work_assignments')
      .update(updatePayload)
      .eq('id', assignmentId);

    if (error) {
      console.error('Failed to update work assignment status:', error);
      throw new Error(error.message);
    }

    setWorkAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : a.completed_at,
              updated_at: new Date().toISOString(),
            }
          : a
      )
    );

    logAudit('UPDATE_WORK_ASSIGNMENT_STATUS', 'department_work_assignments', assignmentId, null, {
      status,
    });
  };

  const reviewWorkAssignment = async (
    assignmentId: string,
    reviewStatus: 'approved' | 'revision_requested',
    notes: string
  ): Promise<void> => {
    if (!currentProfile?.id) {
      throw new Error('Sign in before reviewing a work assignment.');
    }

    const isApprove = reviewStatus === 'approved';
    const updatePayload: Record<string, unknown> = {
      review_status: reviewStatus,
      review_notes: notes,
      reviewed_by: currentProfile.id,
      reviewed_at: new Date().toISOString(),
    };

    if (!isApprove) {
      updatePayload.status = 'in_progress';
      updatePayload.completed_at = null;
    }

    const { error } = await supabase
      .from('department_work_assignments')
      .update(updatePayload)
      .eq('id', assignmentId);

    if (error) {
      console.error('Failed to review work assignment:', error);
      throw new Error(error.message);
    }

    const commentPrefix = isApprove ? '[APPROVED]' : '[REVISION_REQUESTED]';
    await addWorkAssignmentComment(assignmentId, `${commentPrefix} ${notes}`);

    setWorkAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              review_status: reviewStatus,
              review_notes: notes,
              reviewed_by: currentProfile.id,
              reviewed_at: new Date().toISOString(),
              status: isApprove ? a.status : ('in_progress' as WorkAssignmentStatus),
              completed_at: isApprove ? a.completed_at : null,
              updated_at: new Date().toISOString(),
            }
          : a
      )
    );

    logAudit('REVIEW_WORK_ASSIGNMENT', 'department_work_assignments', assignmentId, null, {
      review_status: reviewStatus,
      status: isApprove ? 'completed' : 'in_progress',
    });
  };

  const addWorkAssignmentComment = async (
    assignmentId: string,
    comment: string
  ): Promise<WorkAssignmentComment> => {
    if (!currentProfile?.id) {
      throw new Error('Sign in before commenting on a work assignment.');
    }

    const { data, error } = await supabase
      .from('department_work_comments')
      .insert({
        assignment_id: assignmentId,
        user_id: currentProfile.id,
        comment: comment.trim(),
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to add work assignment comment:', error);
      throw new Error(error?.message || 'The comment could not be added.');
    }

    const newComment: WorkAssignmentComment = {
      ...data,
      user_name: currentProfile.full_name,
    };

    setWorkAssignmentComments((prev) => [...prev, newComment]);

    return newComment;
  };

  const applyForVisa = async (applicationId: string): Promise<VisaApplication> => {
    if (!currentProfile?.id) throw new Error('Sign in before applying for a visa.');

    const { data, error } = await supabase
      .from('student_visa_applications')
      .insert({
        student_id: currentProfile.id,
        application_id: applicationId,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to create visa application:', error);
      throw new Error(error.message);
    }

    const newVisaApp = {
      ...data,
      student_name: currentProfile.full_name,
      student_email: currentProfile.email,
    } as VisaApplication;

    setVisaApplications((prev) => [newVisaApp, ...prev]);
    return newVisaApp;
  };

  const loadVisaDocuments = async (visaApplicationId: string): Promise<VisaDocument[]> => {
    const { data, error } = await supabase
      .from('student_visa_documents')
      .select('*')
      .eq('visa_application_id', visaApplicationId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Failed to load visa documents:', error);
      throw error;
    }

    return data || [];
  };

  const uploadVisaDocument = async (
    visaApplicationId: string,
    documentType: string,
    file: File
  ): Promise<void> => {
    if (!currentProfile?.id) throw new Error('Sign in before uploading document.');

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `visa-applications/${currentProfile.id}/${documentType}/${timestamp}_${cleanFileName}`;

    const { error: uploadErr } = await supabase.storage
      .from('department-reports')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf',
      });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { error: dbErr } = await supabase.from('student_visa_documents').insert({
      visa_application_id: visaApplicationId,
      document_type: documentType,
      file_name: file.name,
      file_path: storagePath,
      file_size: file.size,
    });

    if (dbErr) throw new Error(`Failed to save document record: ${dbErr.message}`);
  };

  const deleteVisaDocument = async (documentId: string, filePath: string): Promise<void> => {
    const { error: storageErr } = await supabase.storage.from('department-reports').remove([filePath]);
    if (storageErr) {
      console.error('Failed to delete file from storage:', storageErr);
    }

    const { error: dbErr } = await supabase
      .from('student_visa_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentId);

    if (dbErr) throw dbErr;
  };

  const reviewVisaApplication = async (
    visaApplicationId: string,
    status: 'pending' | 'under_review' | 'approved' | 'rejected',
    instructions: string
  ): Promise<void> => {
    if (!currentProfile?.id) throw new Error('Sign in before reviewing.');

    const { error } = await supabase
      .from('student_visa_applications')
      .update({
        status,
        admissions_instructions: instructions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', visaApplicationId);

    if (error) throw error;

    setVisaApplications((prev) =>
      prev.map((app) =>
        app.id === visaApplicationId
          ? { ...app, status, admissions_instructions: instructions }
          : app
      )
    );

    const targetApp = visaApplications.find((a) => a.id === visaApplicationId);
    if (targetApp) {
      void addCommunication(
        'notification',
        `Visa Application Status Update: ${status.toUpperCase()}`,
        `Admissions updated ${targetApp.student_name || 'a student'}'s visa application status to ${status.toUpperCase()}. The student can view the latest status in their portal. Instructions: ${instructions || 'No additional instructions.'}`,
        status === 'approved' ? 'medium' : 'high',
        'data_applications'
      ).catch((notificationError) => {
        console.error('Failed to send visa status notification:', notificationError);
      });
    }
  };

  // ─── HR MANAGEMENT SYSTEM CRUD METHODS ───

  const addHrEmployeeRecord = async (record: Omit<HrEmployeeRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!currentProfile?.id) throw new Error('Not authenticated');
    
    const newRecord = {
      ...record,
      created_by: currentProfile.id,
    };

    try {
      const { data, error } = await supabase
        .from('hr_employee_records')
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      const savedRecord = data as HrEmployeeRecord;
      setHrEmployeeRecords(prev => [...prev.filter(r => r.id !== savedRecord.id), savedRecord].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      return savedRecord;
    } catch (err) {
      console.warn('Supabase insert failed, adding to local state only:', err);
      const fallbackData: HrEmployeeRecord = {
        id: `emp-fb-${Date.now()}`,
        ...newRecord,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setHrEmployeeRecords(prev => [...prev, fallbackData].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      return fallbackData;
    }
  };

  const updateHrEmployeeRecord = async (id: string, record: Partial<HrEmployeeRecord>) => {
    try {
      const { data, error } = await supabase
        .from('hr_employee_records')
        .update(record)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const savedRecord = data as HrEmployeeRecord;
      setHrEmployeeRecords(prev => prev.map(r => r.id === id ? savedRecord : r));
      return savedRecord;
    } catch (err) {
      console.warn('Supabase update failed, updating local state only:', err);
      let updatedRecord: HrEmployeeRecord | null = null;
      setHrEmployeeRecords(prev => prev.map(r => {
        if (r.id === id) {
          updatedRecord = { ...r, ...record, updated_at: new Date().toISOString() } as HrEmployeeRecord;
          return updatedRecord;
        }
        return r;
      }));
      if (!updatedRecord) throw new Error('Record not found');
      return updatedRecord;
    }
  };

  const deleteHrEmployeeRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hr_employee_records')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase delete failed, removing from local state only:', err);
    }
    setHrEmployeeRecords(prev => prev.filter(r => r.id !== id));
  };

  const scheduleHrInterview = async (interview: Omit<HrInterview, 'id' | 'created_at' | 'created_by'>) => {
    if (!currentProfile?.id) throw new Error('Not authenticated');
    
    const newInterview = {
      ...interview,
      created_by: currentProfile.id,
    };

    try {
      const { data, error } = await supabase
        .from('hr_interviews')
        .insert(newInterview)
        .select()
        .single();

      if (error) throw error;
      const savedInterview = data as HrInterview;
      setHrInterviews(prev => [...prev.filter(i => i.id !== savedInterview.id), savedInterview].sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime()));
      return savedInterview;
    } catch (err) {
      console.warn('Supabase insert failed, scheduling locally only:', err);
      const fallbackData: HrInterview = {
        id: `int-fb-${Date.now()}`,
        ...newInterview,
        created_at: new Date().toISOString(),
      };
      setHrInterviews(prev => [...prev, fallbackData].sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime()));
      return fallbackData;
    }
  };

  const updateHrInterview = async (id: string, interview: Partial<HrInterview>) => {
    try {
      const { data, error } = await supabase
        .from('hr_interviews')
        .update(interview)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const saved = data as HrInterview;
      setHrInterviews(prev => prev.map(item => item.id === id ? saved : item));
      return saved;
    } catch (err) {
      console.warn('Supabase update failed, updating local state only:', err);
      let updated: HrInterview | null = null;
      setHrInterviews(prev => prev.map(item => {
        if (item.id === id) {
          updated = { ...item, ...interview } as HrInterview;
          return updated;
        }
        return item;
      }));
      if (!updated) throw new Error('Interview not found');
      return updated;
    }
  };

  const submitHrLeaveRequest = async (request: Omit<HrLeaveRequest, 'id' | 'created_at' | 'created_by' | 'status'>) => {
    if (!currentProfile?.id) throw new Error('Not authenticated');
    
    const newRequest = {
      ...request,
      status: 'pending' as const,
      created_by: currentProfile.id,
    };

    try {
      const { data, error } = await supabase
        .from('hr_leave_requests')
        .insert(newRequest)
        .select()
        .single();

      if (error) throw error;
      const saved = data as HrLeaveRequest;
      setHrLeaveRequests(prev => [saved, ...prev]);
      return saved;
    } catch (err) {
      console.warn('Supabase insert failed, submitting locally only:', err);
      const fallbackData: HrLeaveRequest = {
        id: `lv-fb-${Date.now()}`,
        ...newRequest,
        created_at: new Date().toISOString(),
      };
      setHrLeaveRequests(prev => [fallbackData, ...prev]);
      return fallbackData;
    }
  };

  const reviewHrLeaveRequest = async (id: string, status: HrLeaveStatus, notes?: string | null) => {
    if (!currentProfile?.id) throw new Error('Not authenticated');

    const updateFields = {
      status,
      reviewed_by: currentProfile.id,
      reviewed_at: new Date().toISOString(),
      ...(notes ? { reason: notes } : {})
    };

    try {
      const { error } = await supabase
        .from('hr_leave_requests')
        .update(updateFields)
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase update failed, updating locally only:', err);
    }

    setHrLeaveRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          ...updateFields
        };
      }
      return req;
    }));
  };

  const fetchTrashItems = async (departmentKey: string): Promise<TrashItem[]> => {
    const items: TrashItem[] = [];
    const isAdmin = currentProfile?.is_admin || departmentKey === 'admin';

    // 1. KPI Records
    if (isAdmin || departmentKey === 'operations') {
      const { data } = await supabase
        .from('department_kpis')
        .select('id, department, evaluation_period, deleted_at')
        .not('deleted_at', 'is', null);
      if (data) {
        data.forEach(item => {
          if (isAdmin || item.department === departmentKey) {
            items.push({
              id: item.id,
              type: 'kpi',
              display_name: `${item.department.toUpperCase().replace(/_/g, ' ')} KPI (${item.evaluation_period})`,
              department: item.department,
              deleted_at: item.deleted_at,
              original_table: 'department_kpis'
            });
          }
        });
      }
    }

    // 2. Partner Universities
    if (isAdmin) {
      const { data } = await supabase
        .from('partner_universities')
        .select('id, name, deleted_at')
        .not('deleted_at', 'is', null);
      if (data) {
        data.forEach(item => {
          items.push({
            id: item.id,
            type: 'partner',
            display_name: `Partner University: ${item.name}`,
            department: 'admin',
            deleted_at: item.deleted_at,
            original_table: 'partner_universities'
          });
        });
      }
    }

    // 3. HR Employee Records
    if (isAdmin || departmentKey === 'human_resources') {
      const { data } = await supabase
        .from('hr_employee_records')
        .select('id, full_name, department, deleted_at')
        .not('deleted_at', 'is', null);
      if (data) {
        data.forEach(item => {
          if (isAdmin || item.department === departmentKey) {
            items.push({
              id: item.id,
              type: 'employee',
              display_name: `Employee Profile: ${item.full_name}`,
              department: item.department,
              deleted_at: item.deleted_at,
              original_table: 'hr_employee_records'
            });
          }
        });
      }
    }

    // 4. Visa Documents
    if (isAdmin || departmentKey === 'counseling' || departmentKey === 'admissions') {
      const { data } = await supabase
        .from('student_visa_documents')
        .select('id, document_type, deleted_at')
        .not('deleted_at', 'is', null);
      if (data) {
        data.forEach(item => {
          items.push({
            id: item.id,
            type: 'visa_document',
            display_name: `Visa Document: ${item.document_type.replace(/_/g, ' ')}`,
            department: departmentKey,
            deleted_at: item.deleted_at,
            original_table: 'student_visa_documents'
          });
        });
      }
    }

    // 5. Staff Members
    if (isAdmin) {
      const { data } = await supabase
        .from('department_members')
        .select('id, full_name, primary_department, deleted_at')
        .not('deleted_at', 'is', null);
      if (data) {
        data.forEach(item => {
          items.push({
            id: item.id,
            type: 'staff_member',
            display_name: `Staff Member: ${item.full_name}`,
            department: item.primary_department,
            deleted_at: item.deleted_at,
            original_table: 'department_members'
          });
        });
      }
    }

    // 6. Monthly Meetings
    if (isAdmin || ['admin', 'operations', 'management'].includes(departmentKey)) {
      const { data } = await supabase
        .from('monthly_meetings')
        .select('id, title, deleted_at')
        .not('deleted_at', 'is', null);
      if (data) {
        data.forEach(item => {
          items.push({
            id: item.id,
            type: 'monthly_meeting' as any,
            display_name: `Monthly Meeting: ${item.title}`,
            department: 'admin',
            deleted_at: item.deleted_at,
            original_table: 'monthly_meetings'
          });
        });
      }
    }

    return items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
  };

  const restoreTrashItem = async (type: string, id: string): Promise<void> => {
    let tableName = '';
    if (type === 'kpi') tableName = 'department_kpis';
    else if (type === 'partner') tableName = 'partner_universities';
    else if (type === 'employee') tableName = 'hr_employee_records';
    else if (type === 'visa_document') tableName = 'student_visa_documents';
    else if (type === 'staff_member') tableName = 'department_members';
    else if (type === 'monthly_meeting') tableName = 'monthly_meetings';

    if (!tableName) throw new Error('Unsupported item type for restore.');

    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) throw error;

    // Reload active states
    if (type === 'kpi') {
      const { data } = await supabase.from('department_kpis').select('*').is('deleted_at', null);
      if (data) setDepartmentKpis(data);
    } else if (type === 'partner') {
      const { data } = await supabase.from('partner_universities').select('*').is('deleted_at', null);
      if (data) setPartnerUniversities(data);
    } else if (type === 'employee') {
      const { data } = await supabase.from('hr_employee_records').select('*').is('deleted_at', null);
      if (data) setHrEmployeeRecords(data);
    } else if (type === 'monthly_meeting') {
      const { data } = await supabase.from('monthly_meetings').select('*').is('deleted_at', null).order('scheduled_at', { ascending: true });
      if (data) setMonthlyMeetings(data as MonthlyMeeting[]);
    }
  };

  const deleteTrashItemPermanently = async (type: string, id: string): Promise<void> => {
    let tableName = '';
    if (type === 'kpi') tableName = 'department_kpis';
    else if (type === 'partner') tableName = 'partner_universities';
    else if (type === 'employee') tableName = 'hr_employee_records';
    else if (type === 'visa_document') tableName = 'student_visa_documents';
    else if (type === 'staff_member') tableName = 'department_members';
    else if (type === 'monthly_meeting') tableName = 'monthly_meetings';

    if (!tableName) throw new Error('Unsupported item type for permanent delete.');

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const scheduleMonthlyMeeting = async (meeting: Omit<MonthlyMeeting, 'id' | 'created_at' | 'created_by' | 'deleted_at'>): Promise<MonthlyMeeting> => {
    if (!currentProfile?.id) throw new Error('Not authenticated.');
    
    const canSchedule = currentProfile.is_admin || ['admin', 'operations', 'management'].includes(currentProfile.department);
    if (!canSchedule) {
      throw new Error('Only Admin, Operations, or Management departments can schedule monthly meetings.');
    }

    const { data, error } = await supabase
      .from('monthly_meetings')
      .insert({
        ...meeting,
        created_by: currentProfile.id
      })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to create monthly meeting:', error);
      throw error;
    }

    const newMeeting = data as MonthlyMeeting;
    setMonthlyMeetings(prev => [...prev, newMeeting].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
    
    const depts: DepartmentType[] = [
      'admin',
      'marketing',
      'admissions',
      'counseling',
      'data_applications',
      'operations',
      'finance',
      'country_directors',
      'management'
    ];

    await Promise.all(
      depts.map(d =>
        addCommunication(
          'notification',
          `Monthly Meeting Scheduled: ${meeting.title}`,
          `A new monthly meeting has been scheduled for ${new Date(meeting.scheduled_at).toLocaleString()} on ${meeting.platform.toUpperCase().replace('_', ' ')}. agenda: ${meeting.agenda || 'No agenda provided.'}`,
          'medium',
          d
        ).catch(err => console.error(`Failed to send meeting notification to ${d}:`, err))
      )
    );

    return newMeeting;
  };

  const deleteMonthlyMeeting = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('monthly_meetings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setMonthlyMeetings(prev => prev.filter(m => m.id !== id));
  };

  const addUniversityCourse = async (course: Omit<UniversityCourse, 'id' | 'created_at' | 'deleted_at'>): Promise<UniversityCourse> => {
    const { data, error } = await supabase
      .from('university_courses')
      .insert({
        university_id: course.university_id,
        course_name: course.course_name,
        admission_fee: course.admission_fee,
        tuition_fee: course.tuition_fee
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to add university course:', error);
      throw new Error(error?.message || 'Failed to save course.');
    }

    const newCourse: UniversityCourse = {
      ...data,
      admission_fee: Number(data.admission_fee),
      tuition_fee: Number(data.tuition_fee)
    };
    setUniversityCourses(prev => [...prev, newCourse]);
    logAudit('ADD_UNIVERSITY_COURSE', 'university_courses', newCourse.id, null, { name: newCourse.course_name });
    return newCourse;
  };

  const deleteUniversityCourse = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('university_courses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to soft delete university course:', error);
      throw new Error(error.message);
    }

    setUniversityCourses(prev => prev.filter(c => c.id !== id));
    logAudit('DELETE_UNIVERSITY_COURSE', 'university_courses', id, null, null);
  };

  const addScholarship = async (scholarship: Omit<Scholarship, 'id' | 'created_at' | 'deleted_at'>): Promise<Scholarship> => {
    const { data, error } = await supabase
      .from('scholarships')
      .insert({
        university_id: scholarship.university_id,
        name: scholarship.name,
        description: scholarship.description,
        coverage_amount: scholarship.coverage_amount,
        coverage_percentage: scholarship.coverage_percentage,
        eligibility_criteria: scholarship.eligibility_criteria
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to add scholarship:', error);
      throw new Error(error?.message || 'Failed to save scholarship.');
    }

    const newScholarship: Scholarship = {
      ...data,
      coverage_amount: Number(data.coverage_amount),
      coverage_percentage: data.coverage_percentage ? Number(data.coverage_percentage) : null
    };
    setScholarships(prev => [...prev, newScholarship]);
    logAudit('ADD_SCHOLARSHIP', 'scholarships', newScholarship.id, null, { name: newScholarship.name });
    return newScholarship;
  };

  const deleteScholarship = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('scholarships')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to soft delete scholarship:', error);
      throw new Error(error.message);
    }

    setScholarships(prev => prev.filter(s => s.id !== id));
    logAudit('DELETE_SCHOLARSHIP', 'scholarships', id, null, null);
  };

  const uploadUniversityBrochure = async (title: string, description: string, file: File): Promise<UniversityBrochure> => {
    if (!currentProfile?.id) throw new Error('Not authenticated.');

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `brochures/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('department-reports')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('Brochure upload failed:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data, error } = await supabase
      .from('university_brochures')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        file_name: file.name,
        storage_path: storagePath,
        uploaded_by: currentProfile.id,
        uploaded_by_name: currentProfile.full_name || 'Admissions Staff'
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to create university brochure record:', error);
      throw new Error(error?.message || 'Failed to save brochure.');
    }

    const newBrochure = data as UniversityBrochure;
    setUniversityBrochures(prev => [newBrochure, ...prev]);
    logAudit('UPLOAD_UNIVERSITY_BROCHURE', 'university_brochures', newBrochure.id, null, { title: newBrochure.title });
    return newBrochure;
  };

  const deleteUniversityBrochure = async (id: string): Promise<void> => {
    const brochure = universityBrochures.find(b => b.id === id);
    if (!brochure) throw new Error('Brochure not found.');

    const { error } = await supabase
      .from('university_brochures')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to delete university brochure record:', error);
      throw new Error(error.message);
    }

    try {
      await supabase.storage.from('department-reports').remove([brochure.storage_path]);
    } catch (err) {
      console.warn('Failed to clean up brochure file from storage:', err);
    }

    setUniversityBrochures(prev => prev.filter(b => b.id !== id));
    logAudit('DELETE_UNIVERSITY_BROCHURE', 'university_brochures', id, null, null);
  };

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        students,
        documents,
        counselingSessions,
        institutionTasks,
        financialRecords,
        partnerUniversities,
        departmentReports,
        departmentKpis,
        paymentReceipts,
        communications,
        auditLogs,
        statusHistory,
        studentApplicationsLoading,
        getScopedApplications,
        getScopedCounselingSessions,
        getScopedFinancialRecords,
        getScopedStudents,
        updateApplicationStatus,
        handoffToAdmissions,
        addDocument,
        updateDocumentVersion,
        verifyDocument,
        toggleMissingDocFlag,
        scheduleCounselingSession,
        createInstitutionTask,
        processFeePayment,
        createFinancialRecord,
        reviewRegistrationPayment,
        generatePaymentReceipt,
        saveDepartmentKpi,
        deleteDepartmentKpi,
        addCommunication,
        markCommunicationRead,
        makeAdmissionsDecision,
        addStudent,
        createApplication,
        addPartnerUniversity,
        deletePartnerUniversity,
        uploadPartnerAgreement,
        submitDepartmentReport,
        reviewDepartmentReport,
        getDepartmentReportDownloadUrl,
        workAssignments,
        workAssignmentComments,
        createWorkAssignment,
        updateWorkAssignmentStatus,
        reviewWorkAssignment,
        addWorkAssignmentComment,
        visaApplications,
        applyForVisa,
        loadVisaDocuments,
        uploadVisaDocument,
        deleteVisaDocument,
        reviewVisaApplication,
        hrEmployeeRecords,
        addHrEmployeeRecord,
        updateHrEmployeeRecord,
        deleteHrEmployeeRecord,
        hrInterviews,
        scheduleHrInterview,
        updateHrInterview,
        hrLeaveRequests,
        submitHrLeaveRequest,
        reviewHrLeaveRequest,
        fetchTrashItems,
        restoreTrashItem,
        deleteTrashItemPermanently,
        monthlyMeetings,
        scheduleMonthlyMeeting,
        deleteMonthlyMeeting,
        universityCourses,
        addUniversityCourse,
        deleteUniversityCourse,
        scholarships,
        addScholarship,
        deleteScholarship,
        universityBrochures,
        uploadUniversityBrochure,
        deleteUniversityBrochure,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
};
