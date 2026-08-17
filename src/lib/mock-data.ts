import {
  Profile,
  Student,
  Application,
  ApplicationDocument,
  CounselingSession,
  AdmissionWindow,
  InstitutionTask,
  FinancialRecord,
  PartnerUniversity,
  Communication,
  AuditLog,
  ApplicationStatusHistory,
  CountryDirectorAssignment
} from '../types/database';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@globescholar.org',
    full_name: 'Dr. Evelyn Vance',
    department: 'admin',
    is_admin: true,
    account_type: 'staff',
    phone: '+1 (555) 019-2831',
    created_at: '2025-01-10T08:00:00Z'
  },
  {
    id: 'usr-mkt-01',
    email: 'sarah.marketing@globescholar.org',
    full_name: 'Sarah Connor',
    department: 'marketing',
    is_admin: false,
    account_type: 'staff',
    phone: '+1 (555) 014-9922',
    created_at: '2025-02-01T09:15:00Z'
  },
  {
    id: 'usr-adm-01',
    email: 'marcus.admissions@globescholar.org',
    full_name: 'Marcus Brody',
    department: 'admissions',
    is_admin: false,
    account_type: 'staff',
    phone: '+44 20 7946 0912',
    created_at: '2025-02-05T10:30:00Z'
  },
  {
    id: 'usr-cns-01',
    email: 'elena.counseling@globescholar.org',
    full_name: 'Elena Rostova',
    department: 'counseling',
    is_admin: false,
    account_type: 'staff',
    phone: '+1 (555) 018-4455',
    created_at: '2025-02-10T11:00:00Z'
  },
  {
    id: 'usr-data-01',
    email: 'david.data@globescholar.org',
    full_name: 'David Chen',
    department: 'data_applications',
    is_admin: false,
    account_type: 'staff',
    phone: '+1 (555) 017-3321',
    created_at: '2025-02-12T09:00:00Z'
  },
  {
    id: 'usr-ops-01',
    email: 'olivia.ops@globescholar.org',
    full_name: 'Olivia Martinez',
    department: 'operations',
    is_admin: false,
    account_type: 'staff',
    phone: '+1 (555) 012-7788',
    created_at: '2025-02-15T14:20:00Z'
  },
  {
    id: 'usr-cd-uk',
    email: 'arthur.ukdirector@globescholar.org',
    full_name: 'Arthur Pendelton',
    department: 'country_directors',
    is_admin: false,
    account_type: 'staff',
    phone: '+44 20 7123 4567',
    created_at: '2025-01-20T12:00:00Z'
  },
  {
    id: 'usr-fin-01',
    email: 'fiona.finance@globescholar.org',
    full_name: 'Fiona Gallagher',
    department: 'finance',
    is_admin: false,
    account_type: 'staff',
    phone: '+1 (555) 016-5544',
    created_at: '2025-01-15T08:45:00Z'
  },
  {
    id: 'usr-student-01',
    email: 'arjun.patel@student.com',
    full_name: 'Arjun Patel',
    department: 'marketing', // Default role representation for student
    is_admin: false,
    account_type: 'student',
    phone: '+91 98765 43210',
    created_at: '2026-03-01T10:00:00Z'
  }
];

export const INITIAL_COUNTRY_DIRECTOR_ASSIGNMENTS: CountryDirectorAssignment[] = [
  {
    id: 'cda-01',
    director_id: 'usr-cd-uk',
    country_code: 'GBR',
    country_name: 'United Kingdom'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-001',
    profile_id: 'usr-student-01',
    first_name: 'Arjun',
    last_name: 'Patel',
    email: 'arjun.patel@student.com',
    phone: '+91 98765 43210',
    country_of_residence: 'India',
    passport_number: 'L9823411',
    gpa: 3.85,
    lead_source: 'Global STEM Webinar 2026',
    assigned_counselor_id: 'usr-cns-01',
    assigned_counselor_name: 'Elena Rostova',
    registration_fee_paid: true,
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'std-002',
    first_name: 'Amara',
    last_name: 'Okonkwo',
    email: 'amara.o@student.org',
    phone: '+234 803 123 4567',
    country_of_residence: 'Nigeria',
    passport_number: 'A4410928',
    gpa: 3.92,
    lead_source: 'Lagos Education Fair',
    assigned_counselor_id: 'usr-cns-01',
    assigned_counselor_name: 'Elena Rostova',
    registration_fee_paid: true,
    created_at: '2026-03-02T11:30:00Z'
  },
  {
    id: 'std-003',
    first_name: 'Mateo',
    last_name: 'Silva',
    email: 'mateo.silva@student.br',
    phone: '+55 11 98765-1234',
    country_of_residence: 'Brazil',
    passport_number: 'BR881920',
    gpa: 3.70,
    lead_source: 'Instagram Campaign',
    assigned_counselor_id: 'usr-cns-01',
    assigned_counselor_name: 'Elena Rostova',
    registration_fee_paid: false,
    created_at: '2026-03-05T14:15:00Z'
  },
  {
    id: 'std-004',
    first_name: 'Sofia',
    last_name: 'Rossi',
    email: 'sofia.rossi@student.it',
    phone: '+39 06 698765',
    country_of_residence: 'Italy',
    passport_number: 'IT102938',
    gpa: 3.96,
    lead_source: 'Direct Portal Registration',
    assigned_counselor_id: 'usr-cns-01',
    assigned_counselor_name: 'Elena Rostova',
    registration_fee_paid: true,
    created_at: '2026-03-10T09:20:00Z'
  }
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    application_number: 'GS-2026-1023',
    student_id: 'std-001',
    student_name: 'Arjun Patel',
    student_email: 'arjun.patel@student.com',
    status: 'admissions_review',
    target_country: 'United Kingdom',
    target_university: 'University of Oxford',
    degree_program: 'MSc Computer Science & AI',
    intake_period: 'Fall 2026',
    scholarship_requested: 'Rhodes STEM Excellence Fellowship (100% Tuition + Stipend)',
    missing_documents_count: 0,
    admissions_decision: 'pending',
    handed_off_to_admissions: true,
    created_at: '2026-03-01T10:30:00Z',
    updated_at: '2026-03-12T14:00:00Z'
  },
  {
    id: 'app-002',
    application_number: 'GS-2026-1024',
    student_id: 'std-002',
    student_name: 'Amara Okonkwo',
    student_email: 'amara.o@student.org',
    status: 'documents_missing',
    target_country: 'United Kingdom',
    target_university: 'University of Cambridge',
    degree_program: 'MPhil Public Health & Epidemiology',
    intake_period: 'Fall 2026',
    scholarship_requested: 'Gates Cambridge Scholarship',
    missing_documents_count: 1,
    handed_off_to_admissions: false,
    created_at: '2026-03-02T12:00:00Z',
    updated_at: '2026-03-11T16:30:00Z'
  },
  {
    id: 'app-003',
    application_number: 'GS-2026-1025',
    student_id: 'std-003',
    student_name: 'Mateo Silva',
    student_email: 'mateo.silva@student.br',
    status: 'draft',
    target_country: 'United States',
    target_university: 'Harvard University',
    degree_program: 'Master of Public Policy (MPP)',
    intake_period: 'Fall 2026',
    scholarship_requested: 'Americas Leaders Grant',
    missing_documents_count: 3,
    handed_off_to_admissions: false,
    created_at: '2026-03-05T14:30:00Z',
    updated_at: '2026-03-05T14:30:00Z'
  },
  {
    id: 'app-004',
    application_number: 'GS-2026-1026',
    student_id: 'std-004',
    student_name: 'Sofia Rossi',
    student_email: 'sofia.rossi@student.it',
    status: 'approved',
    target_country: 'Australia',
    target_university: 'University of Melbourne',
    degree_program: 'Master of Environmental Science',
    intake_period: 'Spring 2027',
    scholarship_requested: 'Australia Global Leaders Award',
    missing_documents_count: 0,
    admissions_decision: 'unconditional_offer',
    handed_off_to_admissions: true,
    created_at: '2026-03-10T10:00:00Z',
    updated_at: '2026-03-13T11:00:00Z'
  }
];

export const INITIAL_APPLICATION_DOCUMENTS: ApplicationDocument[] = [
  {
    id: 'doc-101',
    application_id: 'app-001',
    document_type: 'passport',
    file_name: 'Arjun_Patel_Passport_Valid2031.pdf',
    storage_path: 'documents/app-001/passport_v2.pdf',
    file_size: 2450100,
    mime_type: 'application/pdf',
    current_version: 2,
    is_missing: false,
    is_verified: true,
    verified_by_name: 'David Chen (Data & Apps)',
    verified_at: '2026-03-11T10:15:00Z',
    notes: 'Biometric page clear and expiration date checked.',
    signed_url: 'https://supabase.storage/v1/signed/doc-101-token',
    versions: [
      {
        id: 'ver-101-1',
        document_id: 'doc-101',
        version_number: 1,
        storage_path: 'documents/app-001/passport_v1.pdf',
        uploaded_by_name: 'Arjun Patel',
        uploaded_at: '2026-03-01T10:45:00Z',
        change_summary: 'Initial draft upload - low resolution scan'
      },
      {
        id: 'ver-101-2',
        document_id: 'doc-101',
        version_number: 2,
        storage_path: 'documents/app-001/passport_v2.pdf',
        uploaded_by_name: 'Arjun Patel',
        uploaded_at: '2026-03-05T12:00:00Z',
        change_summary: 'Re-uploaded HD high resolution scan upon request'
      }
    ],
    created_at: '2026-03-01T10:45:00Z'
  },
  {
    id: 'doc-102',
    application_id: 'app-001',
    document_type: 'academic_transcript',
    file_name: 'Official_BTech_Transcript_IIT.pdf',
    storage_path: 'documents/app-001/transcript_v1.pdf',
    file_size: 4120000,
    mime_type: 'application/pdf',
    current_version: 1,
    is_missing: false,
    is_verified: true,
    verified_by_name: 'David Chen (Data & Apps)',
    verified_at: '2026-03-11T10:20:00Z',
    notes: 'Verified against university registrar seal.',
    signed_url: 'https://supabase.storage/v1/signed/doc-102-token',
    versions: [
      {
        id: 'ver-102-1',
        document_id: 'doc-102',
        version_number: 1,
        storage_path: 'documents/app-001/transcript_v1.pdf',
        uploaded_by_name: 'Arjun Patel',
        uploaded_at: '2026-03-01T11:00:00Z',
        change_summary: 'Original official transcript upload'
      }
    ],
    created_at: '2026-03-01T11:00:00Z'
  },
  {
    id: 'doc-201',
    application_id: 'app-002',
    document_type: 'financial_statement',
    file_name: 'Bank_Proof_of_Funds_Missing.pdf',
    storage_path: 'documents/app-002/financial.pdf',
    file_size: 0,
    mime_type: 'application/pdf',
    current_version: 0,
    is_missing: true,
    is_verified: false,
    notes: 'Awaiting updated bank statement covering 6 months.',
    versions: [],
    created_at: '2026-03-02T12:00:00Z'
  }
];

export const INITIAL_COUNSELING_SESSIONS: CounselingSession[] = [
  {
    id: 'cs-001',
    student_id: 'std-001',
    student_name: 'Arjun Patel',
    counselor_id: 'usr-cns-01',
    counselor_name: 'Elena Rostova',
    scheduled_at: '2026-03-04T15:00:00Z',
    duration_minutes: 45,
    google_meet_link: 'https://meet.google.com/gsp-cns-oxf1',
    status: 'completed',
    session_notes: 'Discussed scholarship fit for Oxford MSc. Student has 2 publication preprints in IEEE. Recommended applying for Rhodes STEM Grant.',
    scholarship_recommendations: ['Rhodes STEM Excellence Grant', 'Clarendon Fund Scholarship'],
    created_at: '2026-03-02T09:00:00Z'
  },
  {
    id: 'cs-002',
    student_id: 'std-002',
    student_name: 'Amara Okonkwo',
    counselor_id: 'usr-cns-01',
    counselor_name: 'Elena Rostova',
    scheduled_at: '2026-03-15T14:00:00Z',
    duration_minutes: 45,
    google_meet_link: 'https://meet.google.com/gsp-cns-cam2',
    status: 'scheduled',
    session_notes: 'Upcoming interview prep for Cambridge Gates Scholarship panel.',
    scholarship_recommendations: ['Gates Cambridge Scholarship'],
    created_at: '2026-03-10T11:00:00Z'
  }
];

export const INITIAL_INSTITUTION_TASKS: InstitutionTask[] = [
  {
    id: 'tsk-001',
    application_id: 'app-001',
    application_number: 'GS-2026-1023',
    title: 'Dispatch Certified Application Package to Oxford Admissions Office',
    description: 'Ensure official transcripts, verified passport, and scholarship recommendation sheet are submitted via portal link.',
    assigned_to_name: 'Olivia Martinez (Ops)',
    status: 'in_progress',
    deadline: '2026-03-20T17:00:00Z',
    created_at: '2026-03-12T15:00:00Z'
  },
  {
    id: 'tsk-002',
    application_id: 'app-004',
    application_number: 'GS-2026-1026',
    title: 'Confirm Scholarship Acceptance with Melbourne International Office',
    description: 'Verify receipt of signed acceptance agreement and initiate CAS issuance.',
    assigned_to_name: 'Olivia Martinez (Ops)',
    status: 'completed',
    deadline: '2026-03-13T12:00:00Z',
    created_at: '2026-03-11T09:00:00Z'
  }
];

export const INITIAL_FINANCIAL_RECORDS: FinancialRecord[] = [
  {
    id: 'fin-001',
    application_id: 'app-001',
    application_number: 'GS-2026-1023',
    student_id: 'std-001',
    student_name: 'Arjun Patel',
    record_type: 'registration_fee',
    amount: 150.00,
    currency: 'USD',
    status: 'paid',
    payment_reference: 'PAY-STRIPE-8912039',
    approved_by_name: 'Fiona Gallagher (Finance)',
    notes: 'Online student application portal fee cleared via Stripe.',
    created_at: '2026-03-01T10:40:00Z'
  },
  {
    id: 'fin-002',
    application_id: 'app-004',
    application_number: 'GS-2026-1026',
    student_id: 'std-004',
    student_name: 'Sofia Rossi',
    record_type: 'scholarship_disbursement',
    amount: 12500.00,
    currency: 'USD',
    status: 'approved',
    payment_reference: 'SCH-MELB-2026-004',
    approved_by_name: 'Fiona Gallagher (Finance)',
    notes: 'First tranche scholarship grant disbursement approved by Finance.',
    created_at: '2026-03-12T16:00:00Z'
  }
];

export const INITIAL_PARTNER_UNIVERSITIES: PartnerUniversity[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'University of Oxford',
    country: 'United Kingdom',
    contact_email: 'admissions@oxford.ac.uk',
    scholarships_offered: 15,
    active_agreement: true,
    agreements: [
      {
        id: 'agr-001',
        partner_id: 'a0000000-0000-0000-0000-000000000001',
        partner_name: 'University of Oxford',
        document_name: 'Oxford_GSP_Master_Partnership_2025-2028.pdf',
        storage_path: 'agreements/oxford_2025.pdf',
        effective_date: '2025-01-01',
        expiry_date: '2028-12-31',
        status: 'active'
      }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'University of Cambridge',
    country: 'United Kingdom',
    contact_email: 'int-scholarships@cam.ac.uk',
    scholarships_offered: 12,
    active_agreement: true,
    agreements: [
      {
        id: 'agr-002',
        partner_id: 'a0000000-0000-0000-0000-000000000002',
        partner_name: 'University of Cambridge',
        document_name: 'Cambridge_GSP_MOU_2024-2027.pdf',
        storage_path: 'agreements/cambridge_2024.pdf',
        effective_date: '2024-09-01',
        expiry_date: '2027-08-31',
        status: 'active'
      }
    ]
  }
];

export const INITIAL_COMMUNICATIONS: Communication[] = [
  {
    id: 'com-001',
    type: 'alert',
    sender_name: 'Data & Applications Department',
    department: 'admissions',
    related_student_name: 'Arjun Patel',
    related_application_number: 'GS-2026-1023',
    title: 'Documents Verified - Application Ready for Admissions Decision',
    body: 'All required documents (passport & transcript) for Arjun Patel have been verified. Application handed off to Admissions.',
    priority: 'high',
    is_read: false,
    created_at: '2026-03-12T14:05:00Z'
  },
  {
    id: 'com-002',
    type: 'escalation',
    sender_name: 'Counseling Department',
    department: 'data_applications',
    related_student_name: 'Amara Okonkwo',
    related_application_number: 'GS-2026-1024',
    title: 'Missing Bank Statement Flag - Application Delayed 7 Days',
    body: 'Applicant Amara Okonkwo has not uploaded bank proof of funds for Cambridge application. Follow-up required before deadline.',
    priority: 'critical',
    is_read: false,
    created_at: '2026-03-11T16:40:00Z'
  },
  {
    id: 'com-003',
    type: 'notification',
    sender_name: 'Finance Department',
    recipient_name: 'Arjun Patel',
    related_student_name: 'Arjun Patel',
    title: 'Registration Fee Payment Received',
    body: 'Your payment of $150.00 USD for GS-2026-1023 registration fee has been successfully processed.',
    priority: 'low',
    is_read: true,
    created_at: '2026-03-01T10:41:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    actor_name: 'David Chen',
    department: 'data_applications',
    action: 'VERIFY_DOCUMENT',
    entity_type: 'application_documents',
    entity_id: 'doc-101',
    before_state: { is_verified: false },
    after_state: { is_verified: true, verified_by: 'David Chen' },
    created_at: '2026-03-11T10:15:00Z'
  },
  {
    id: 'aud-002',
    actor_name: 'Elena Rostova',
    department: 'counseling',
    action: 'SCHEDULE_COUNSELING_SESSION',
    entity_type: 'counseling_sessions',
    entity_id: 'cs-001',
    before_state: null,
    after_state: { student: 'Arjun Patel', meet_link: 'https://meet.google.com/gsp-cns-oxf1' },
    created_at: '2026-03-02T09:00:00Z'
  },
  {
    id: 'aud-003',
    actor_name: 'Fiona Gallagher',
    department: 'finance',
    action: 'APPROVE_SCHOLARSHIP_DISBURSEMENT',
    entity_type: 'financial_records',
    entity_id: 'fin-002',
    before_state: { status: 'pending' },
    after_state: { status: 'approved', amount: 12500.00 },
    created_at: '2026-03-12T16:00:00Z'
  }
];

export const INITIAL_STATUS_HISTORY: ApplicationStatusHistory[] = [
  {
    id: 'his-001',
    application_id: 'app-001',
    from_status: 'draft',
    to_status: 'submitted',
    changed_by_name: 'Arjun Patel (Student)',
    department: 'marketing',
    note: 'Application submitted via student portal wizard.',
    created_at: '2026-03-01T10:30:00Z'
  },
  {
    id: 'his-002',
    application_id: 'app-001',
    from_status: 'submitted',
    to_status: 'documents_verified',
    changed_by_name: 'David Chen',
    department: 'data_applications',
    note: 'All transcripts and passport pages verified clear.',
    created_at: '2026-03-11T10:20:00Z'
  },
  {
    id: 'his-003',
    application_id: 'app-001',
    from_status: 'documents_verified',
    to_status: 'admissions_review',
    changed_by_name: 'Marcus Brody',
    department: 'admissions',
    note: 'Handoff confirmed. Under review by Oxford Admissions Committee.',
    created_at: '2026-03-12T14:00:00Z'
  }
];
