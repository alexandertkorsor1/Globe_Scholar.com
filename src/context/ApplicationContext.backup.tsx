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
  PriorityLevel
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
  communications: Communication[];
  auditLogs: AuditLog[];
  statusHistory: ApplicationStatusHistory[];
  
  // RLS-scoped getters
  getScopedApplications: () => RLSPermissionResult<Application>;
  getScopedCounselingSessions: () => RLSPermissionResult<CounselingSession>;
  getScopedFinancialRecords: () => RLSPermissionResult<FinancialRecord>;
  getScopedStudents: () => RLSPermissionResult<Student>;

  // Action methods
  updateApplicationStatus: (appId: string, newStatus: ApplicationStatus, note: string) => void;
  handoffToAdmissions: (appId: string) => void;
  addDocument: (appId: string, docType: DocType, file: File) => Promise<ApplicationDocument>;
  updateDocumentVersion: (docId: string, changeSummary: string) => void;
  verifyDocument: (docId: string, verified: boolean) => void;
  toggleMissingDocFlag: (docId: string, isMissing: boolean) => void;
  scheduleCounselingSession: (studentId: string, scheduledAt: string, meetLink: string, notes: string) => void;
  createInstitutionTask: (appId: string, title: string, description: string, assigneeName: string, deadline: string) => void;
  processFeePayment: (appId: string, amount: number, paymentRef: string) => void;
  addCommunication: (type: CommunicationType, title: string, body: string, priority?: PriorityLevel, dept?: any) => void;
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

  const [communications, setCommunications] =
    useState<Communication[]>(INITIAL_COMMUNICATIONS);

  const [auditLogs, setAuditLogs] =
    useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const [statusHistory, setStatusHistory] =
    useState<ApplicationStatusHistory[]>(INITIAL_STATUS_HISTORY);

  useEffect(() => {
    if (loading) return;

    const loadStudentApplications = async () => {
      if (currentProfile?.account_type !== 'student' || !currentProfile?.id) {
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', currentProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading student applications:', error);
        return;
      }

      setApplications((data || []) as Application[]);
    };

    loadStudentApplications();

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

    loadPartnerUniversities();
  }, [loading]);

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
    setApplications(prev =>
      prev.map(app => {
        if (app.id === appId) {
          const oldStatus = app.status;
          
          // Add status history entry
          const historyEntry: ApplicationStatusHistory = {
            id: `his-${Date.now()}`,
            application_id: appId,
            from_status: oldStatus,
            to_status: newStatus,
            changed_by_name: currentProfile.full_name,
            department: currentProfile.department,
            note: note || `Status updated from ${oldStatus} to ${newStatus}`,
            created_at: new Date().toISOString()
          };
          setStatusHistory(h => [historyEntry, ...h]);

          // Audit log
          logAudit('UPDATE_APPLICATION_STATUS', 'applications', appId, { status: oldStatus }, { status: newStatus });

          return {
            ...app,
            status: newStatus,
            updated_at: new Date().toISOString()
          };
        }
        return app;
      })
    );
  };

  // Hand off Lead/Draft Application from Marketing to Admissions
  const handoffToAdmissions = (appId: string) => {
    setApplications(prev =>
      prev.map(app => {
        if (app.id === appId) {
          logAudit('HANDOFF_TO_ADMISSIONS', 'applications', appId, { handed_off: false }, { handed_off: true });

          // Broadcast notification to Admissions
          addCommunication(
            'notification',
            `Application ${app.application_number} Handed Off`,
            `Marketing has transferred ${app.student_name}'s application for ${app.degree_program} at ${app.target_university} to Admissions.`,
            'medium',
            'admissions'
          );

          return {
            ...app,
            handed_off_to_admissions: true,
            status: app.status === 'draft' ? 'submitted' : app.status,
            updated_at: new Date().toISOString()
          };
        }
        return app;
      })
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

  // Process Fee Payment
  const processFeePayment = (appId: string, amount: number, paymentRef: string) => {
    const app = applications.find(a => a.id === appId);
    const newRecord: FinancialRecord = {
      id: `fin-${Date.now()}`,
      application_id: appId,
      application_number: app ? app.application_number : 'GS-FEE',
      student_id: app ? app.student_id : 'std-001',
      student_name: app ? app.student_name : 'Student',
      record_type: 'registration_fee',
      amount,
      currency: 'USD',
      status: 'paid',
      payment_reference: paymentRef,
      approved_by_name: 'Stripe Gateway (Verified)',
      notes: 'Registration fee successfully processed via Student Portal.',
      created_at: new Date().toISOString()
    };

    setFinancialRecords(prev => [newRecord, ...prev]);

    // Mark student fee paid
    if (app) {
      setStudents(stds =>
        stds.map(s => (s.id === app.student_id ? { ...s, registration_fee_paid: true } : s))
      );
    }

    logAudit('PROCESS_REGISTRATION_FEE', 'financial_records', newRecord.id, null, { amount, ref: paymentRef });
  };

  // Communication
  const addCommunication = (
    type: CommunicationType,
    title: string,
    body: string,
    priority: PriorityLevel = 'medium',
    dept?: any
  ) => {
    const newComm: Communication = {
      id: `com-${Date.now()}`,
      type,
      sender_name: `${currentProfile.full_name} (${currentProfile.department})`,
      department: dept,
      title,
      body,
      priority,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setCommunications(prev => [newComm, ...prev]);
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

  // Create Application - persisted in Supabase
  const createApplication = async (
    appData: Partial<Application>
  ): Promise<Application> => {
    if (!currentProfile?.id) {
      throw new Error('No authenticated user profile found.');
    }

    const applicationNumber =
      appData.application_number ||
      `GS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const applicationToInsert = {
      application_number: applicationNumber,
      student_id: currentProfile.id,
      student_name: appData.student_name || currentProfile.full_name,
      student_email: appData.student_email || currentProfile.email,
      status: appData.status || 'draft',
      target_country: appData.target_country || 'United Kingdom',
      target_university:
        appData.target_university || 'University of Oxford',
      degree_program:
        appData.degree_program || 'MSc Data Science',
      intake_period:
        appData.intake_period || 'Fall 2026',
      scholarship_requested:
        appData.scholarship_requested || 'GSP Excellence Scholarship',
      missing_documents_count:
        appData.missing_documents_count ?? 0,
      admissions_decision:
        appData.admissions_decision ?? null,
      admissions_notes:
        appData.admissions_notes ?? null,
      handed_off_to_admissions:
        appData.handed_off_to_admissions ?? false
    };

    const { data, error } = await supabase
      .from('applications')
      .insert(applicationToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating application in Supabase:', error);
      throw error;
    }

    const newApplication = data as Application;

    setApplications(prev => [
      newApplication,
      ...prev.filter(app => app.id !== newApplication.id)
    ]);

    const historyEntry: ApplicationStatusHistory = {
      id: `his-${Date.now()}`,
      application_id: newApplication.id,
      from_status: null,
      to_status: newApplication.status,
      changed_by_name: currentProfile.full_name,
      department: currentProfile.department,
      note: 'Application draft created.',
      created_at: new Date().toISOString()
    };

    setStatusHistory(prev => [historyEntry, ...prev]);

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

    const { data: agreement, error: agreementError } = await supabase
      .from('partner_agreements')
      .insert({
        partner_id: data.id,
        partner_name: data.name,
        document_name: `${data.name.replace(/\s+/g, '_')}_MOU_2026.pdf`,
        storage_path: `agreements/${data.name.replace(/\s+/g, '_')}_MOU_2026.pdf`,
        effective_date: '2026-01-01',
        expiry_date: '2029-12-31',
        status: 'active'
      })
      .select()
      .single();

    if (agreementError) {
      console.error('Error adding partner agreement:', agreementError);

      // Remove the university if its agreement could not be created.
      await supabase
        .from('partner_universities')
        .delete()
        .eq('id', data.id);

      throw new Error(agreementError.message);
    }

    const newPartner: PartnerUniversity = {
      ...data,
      agreements: [agreement]
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
        communications,
        auditLogs,
        statusHistory,
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
        addCommunication,
        makeAdmissionsDecision,
        addStudent,
        createApplication,
	addPartnerUniversity,
   	uploadPartnerAgreement  
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

