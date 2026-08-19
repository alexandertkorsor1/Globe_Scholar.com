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
  DepartmentType
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
  INITIAL_STATUS_HISTORY
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
  communications: Communication[];
  auditLogs: AuditLog[];
  statusHistory: ApplicationStatusHistory[];
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
  processFeePayment: (appId: string, amount: number, paymentRef: string) => Promise<FinancialRecord>;
  createFinancialRecord: (
    record: Omit<FinancialRecord, 'id' | 'created_at' | 'approved_by_name'>
  ) => Promise<FinancialRecord>;
  reviewRegistrationPayment: (
    recordId: string,
    approved: boolean,
    note?: string
  ) => Promise<FinancialRecord>;
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
) => Promise<any>;
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

  const [communications, setCommunications] =
    useState<Communication[]>(INITIAL_COMMUNICATIONS);

  const [auditLogs, setAuditLogs] =
    useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const [statusHistory, setStatusHistory] =
    useState<ApplicationStatusHistory[]>(INITIAL_STATUS_HISTORY);

  const [studentApplicationsLoading, setStudentApplicationsLoading] =
    useState(false);

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

    loadApplications();
    loadFinancialRecords();

    const loadPartnerUniversities = async () => {
      const { data: universities, error: universitiesError } = await supabase
        .from('partner_universities')
        .select('*')
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

    loadPartnerUniversities();
    loadDepartmentReports();
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
        Loading Globe Scholar Pathways...
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
  const logAudit = (action: string, entityType: string, entityId: string, beforeState?: any, afterState?: any) => {
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
  const processFeePayment = async (appId: string, amount: number, paymentRef: string) => {
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
        record_type: 'registration_fee',
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
      record_type: 'registration_fee',
    };

    setFinancialRecords(prev => [newRecord, ...prev]);

    addCommunication(
      'notification',
      `Registration fee confirmation: ${app.application_number}`,
      `${app.student_name} submitted a $${amount.toFixed(2)} USD registration-fee payment confirmation (${paymentRef}). Finance verification is required.`,
      'high',
      'finance'
    );
    addCommunication(
      'notification',
      `Payment status updated: ${app.application_number}`,
      `${app.student_name} submitted a registration-fee payment confirmation. The application may proceed while Finance verifies it.`,
      'medium',
      'admissions'
    );
    logAudit('SUBMIT_REGISTRATION_FEE_CONFIRMATION', 'financial_records', newRecord.id, null, { amount, ref: paymentRef });
    return newRecord;
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
      student.id === reviewedRecord.student_id
        ? { ...student, registration_fee_paid: approved }
        : student
    ));
    addCommunication(
      'notification',
      `Finance ${approved ? 'verified' : 'rejected'} fee: ${reviewedRecord.application_number}`,
      `Finance ${approved ? 'verified' : 'rejected'} ${reviewedRecord.student_name}'s registration-fee payment. ${verificationNote}`,
      approved ? 'medium' : 'high',
      'admissions'
    );
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

  console.log(
    'CREATING APPLICATION IN SUPABASE:',
    applicationPayload
  );

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
      .delete()
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
  ) => {
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

    setPartnerUniversities(prev =>
      prev.map(partner =>
        partner.id === partnerId
          ? {
              ...partner,
              agreements: [
                ...(partner.agreements || []),
                data
              ]
            }
          : partner
      )
    );

    logAudit(
      'UPLOAD_PARTNER_AGREEMENT',
      'partner_agreements',
      data.id,
      null,
      {
        partner_id: partnerId,
        document_name: file.name,
      }
    );

    return data;
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
