import React, { useState } from 'react';
import type {
  Application,
  DepartmentMember,
  DepartmentMemberInput,
  DepartmentType,
  PartnerUniversity,
  VisaApplication,
  VisaDocument,
} from '../../types/database';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { AdminDepartmentReports } from '../reports/AdminDepartmentReports';
import { CrmRegister } from '../shared/CrmRegister';
import { KpiPerformanceTracker } from '../shared/KpiPerformanceTracker';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import { TrashBin } from '../shared/TrashBin';
import {
  Building2,
  LayoutDashboard,
  Users2,
  GraduationCap,
  Briefcase,
  Users,
  FileCheck,
  TrendingUp,
  AlertOctagon,
  ShieldCheck,
  Award,
  Globe,
  Plus,
  ChevronRight,
  Send,
  FileText,
  X,
  Upload,
  Eye,
  Trash2,
  UserPlus,
  Pencil,
  BriefcaseBusiness,
  UserRoundCheck,
  KeyRound,
  EyeOff,
  ClipboardList,
} from 'lucide-react';

const DEPARTMENT_OPTIONS: Array<{ value: DepartmentType; label: string }> = [
  { value: 'admin', label: 'Administration' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'admissions', label: 'Admissions' },
  { value: 'counseling', label: 'Counseling' },
  { value: 'data_applications', label: 'Data & Applications' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'country_directors', label: 'Country Directors' },
  { value: 'management', label: 'Management' },
  { value: 'institutional_relations', label: 'Institutional Relations' },
  { value: 'human_resources', label: 'Human Resources' },
];

const RESPONSIBILITY_OPTIONS = [
  {
    label: 'Senior',
    value: false,
    description: 'Primary owner or senior staff member for the assigned department.',
  },
  {
    label: 'Assistant',
    value: true,
    description: 'Support member assisting senior staff with department tasks.',
  },
];

type AdminTab = 'kpis' | 'crm' | 'performance' | 'drilldown' | 'partnerships' | 'staff' | 'work_assignments' | 'visa_applications' | 'trash';

const ADMIN_TABS: Array<{ id: AdminTab; label: string }> = [
  { id: 'kpis', label: 'Executive Dashboard' },
  { id: 'crm', label: 'CRM Register' },
  { id: 'performance', label: 'KPI Performance Tracker' },
  { id: 'drilldown', label: 'Department Drill-Down' },
  { id: 'work_assignments', label: 'Work Assignments' },
  { id: 'partnerships', label: 'Partner Universities & Agreements' },
  { id: 'staff', label: 'Staff Accounts & RBAC' },
];

const emptyDepartmentMember: DepartmentMemberInput = {
  full_name: '',
  email: '',
  job_title: '',
  primary_department: 'admissions',
  departments: ['admissions'],
  is_assistant: false,
  employment_status: 'active',
  temporary_password: '',
};

const departmentLabel = (department: DepartmentType) =>
  DEPARTMENT_OPTIONS.find((option) => option.value === department)?.label || department;

export const AdminWorkspace: React.FC = () => {
  const {
    currentProfile,
    logout,
    departmentMembers,
    createDepartmentMember,
    updateDepartmentMember,
    deleteDepartmentMember,
  } = useAuth();
  const {
  applications,
  students,
  toggleMissingDocFlag,
  verifyDocument,
  documents,
  financialRecords,
  departmentKpis,
  partnerUniversities,
  addPartnerUniversity,
  deletePartnerUniversity,
  uploadPartnerAgreement,
  departmentReports,
  getDepartmentReportDownloadUrl,
  reviewDepartmentReport,
  addCommunication,
  updateApplicationStatus,
  statusHistory,
  visaApplications,
  loadVisaDocuments
} = useApplication();

  const [activeTab, setActiveTab] = useState<AdminTab>('kpis');
  const [selectedDeptDrill, setSelectedDeptDrill] = useState<DepartmentType>('admissions');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showGlobalNotifyModal, setShowGlobalNotifyModal] = useState(false);
  const [partnerPendingDelete, setPartnerPendingDelete] =
    useState<PartnerUniversity | null>(null);
  const [deletingPartner, setDeletingPartner] = useState(false);
  const [departmentMemberPendingDelete, setDepartmentMemberPendingDelete] =
    useState<DepartmentMember | null>(null);
  const [deletingDepartmentMember, setDeletingDepartmentMember] = useState(false);
  const [departmentMemberDeleteError, setDepartmentMemberDeleteError] = useState('');
  const [showDepartmentMemberModal, setShowDepartmentMemberModal] = useState(false);
  const [selectedAdminVisaApp, setSelectedAdminVisaApp] = useState<VisaApplication | null>(null);
  const [adminVisaDocs, setAdminVisaDocs] = useState<VisaDocument[]>([]);
  const [loadingAdminVisaDocs, setLoadingAdminVisaDocs] = useState(false);

  React.useEffect(() => {
    if (selectedAdminVisaApp?.id) {
      setLoadingAdminVisaDocs(true);
      loadVisaDocuments(selectedAdminVisaApp.id)
        .then(setAdminVisaDocs)
        .catch(err => console.error(err))
        .finally(() => setLoadingAdminVisaDocs(false));
    }
  }, [selectedAdminVisaApp?.id]);
  const [editingDepartmentMember, setEditingDepartmentMember] =
    useState<DepartmentMember | null>(null);
  const [departmentMemberForm, setDepartmentMemberForm] =
    useState<DepartmentMemberInput>(emptyDepartmentMember);
  const [departmentMemberPasswordConfirm, setDepartmentMemberPasswordConfirm] =
    useState('');
  const [showDepartmentMemberPassword, setShowDepartmentMemberPassword] =
    useState(false);
  const [showDepartmentMemberPasswordConfirm, setShowDepartmentMemberPasswordConfirm] =
    useState(false);
  const [savingDepartmentMember, setSavingDepartmentMember] = useState(false);
  const [departmentMemberError, setDepartmentMemberError] = useState('');
  const [departmentMemberNotice, setDepartmentMemberNotice] = useState('');

  // New partner state
  const [pName, setPName] = useState('');
  const [pCountry, setPCountry] = useState('United Kingdom');
  const [pEmail, setPEmail] = useState('');
  const [pScholarships, setPScholarships] = useState(10);

  // Partner agreement upload state
  const [uploadingPartnerId, setUploadingPartnerId] = useState<string | null>(null);
  const [agreementExpiry, setAgreementExpiry] = useState<Record<string, string>>({});

  // Global notice state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  // Key KPI Calculations
  const totalApps = applications.length;
  const activeStudents = students.length;
  const pendingApps = applications.filter(a => ['submitted', 'under_review', 'documents_missing', 'admissions_review'].includes(a.status)).length;
  const missingDocsCount = applications.reduce((acc, a) => acc + a.missing_documents_count, 0);
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;
  const selectedDepartmentReports = departmentReports.filter(
    (report) => report.department === selectedDeptDrill
  );
  const selectedDepartmentStaff = departmentMembers.filter(
    (member) =>
      member.departments.includes(selectedDeptDrill) &&
      member.employment_status !== 'inactive'
  );

  const urgentItems = [
    ...applications.filter(a => a.missing_documents_count > 0).map(a => `Application ${a.application_number} (${a.student_name}) has ${a.missing_documents_count} missing document(s)`),
    ...financialRecords.filter(f => f.status === 'pending').map(f => `Pending financial disbursement approval: ${f.application_number} ($${f.amount})`)
  ];

  const handleSaveApplicationReview = () => {
    if (!selectedApplication) return;

    const note =
      reviewNote.trim() ||
      selectedApplication.admissions_notes ||
      'Admin review updated.';

    try {
      updateApplicationStatus(
        selectedApplication.id,
        selectedApplication.status,
        note
      );

      setSelectedApplication(prev =>
        prev
          ? {
              ...prev,
              admissions_notes: note,
              updated_at: new Date().toISOString()
            }
          : null
      );

      setReviewNote(note);
      alert('Application review saved successfully.');
    } catch (error) {
      console.error('Failed to save application review:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save application review.'
      );
    }
  };


    const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pName.trim() || !pCountry.trim() || !pEmail.trim()) {
      return;
    }

    try {
      await addPartnerUniversity({
        name: pName.trim(),
        country: pCountry.trim(),
        contact_email: pEmail.trim(),
        scholarships_offered: pScholarships,
        active_agreement: true,
        agreements: []
      });

      setShowAddPartnerModal(false);
      setPName('');
      setPCountry('United Kingdom');
      setPEmail('');
      setPScholarships(10);
    } catch (error) {
      console.error('Failed to add partner university:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to add partner university.'
      );
    }
  };


  const handleUploadAgreement = async (
    partnerId: string,
    file: File
  ) => {
    const expiryDate = agreementExpiry[partnerId];

    if (!expiryDate) {
      alert('Please select an agreement expiry date first.');
      return;
    }

    try {
      setUploadingPartnerId(partnerId);

      await uploadPartnerAgreement(
        partnerId,
        file,
        expiryDate
      );

      setAgreementExpiry(prev => ({
        ...prev,
        [partnerId]: ''
      }));

      alert('Agreement uploaded successfully.');
    } catch (error) {
      console.error('Agreement upload failed:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to upload agreement.'
      );
    } finally {
      setUploadingPartnerId(null);
    }
  };

  const handleGlobalNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeBody) return;
    try {
      await addCommunication('alert', noticeTitle, noticeBody, 'high', 'all');
      setShowGlobalNotifyModal(false);
      setNoticeTitle('');
      setNoticeBody('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'The global notice could not be sent.');
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerPendingDelete) return;

    try {
      setDeletingPartner(true);
      await deletePartnerUniversity(partnerPendingDelete.id);
      setPartnerPendingDelete(null);
    } catch (error) {
      console.error('Failed to remove partner university:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to remove the partner university.'
      );
    } finally {
      setDeletingPartner(false);
    }
  };

  const handleDeleteDepartmentMember = async () => {
    if (!departmentMemberPendingDelete) return;

    try {
      setDeletingDepartmentMember(true);
      setDepartmentMemberDeleteError('');
      await deleteDepartmentMember(departmentMemberPendingDelete.id);
      setDepartmentMemberNotice(
        `${departmentMemberPendingDelete.full_name} has been removed from the staff directory and their department access has been revoked.`
      );
      setDepartmentMemberPendingDelete(null);
    } catch (error) {
      setDepartmentMemberDeleteError(
        error instanceof Error
          ? error.message
          : 'The staff member could not be deleted.'
      );
    } finally {
      setDeletingDepartmentMember(false);
    }
  };

  const openAddDepartmentMember = () => {
    setEditingDepartmentMember(null);
    setDepartmentMemberForm(emptyDepartmentMember);
    setDepartmentMemberPasswordConfirm('');
    setShowDepartmentMemberPassword(false);
    setShowDepartmentMemberPasswordConfirm(false);
    setDepartmentMemberError('');
    setDepartmentMemberNotice('');
    setShowDepartmentMemberModal(true);
  };

  const openEditDepartmentMember = (member: DepartmentMember) => {
    setEditingDepartmentMember(member);
    setDepartmentMemberForm({
      full_name: member.full_name,
      email: member.email,
      job_title: member.job_title,
      primary_department: member.primary_department,
      departments: member.departments,
      is_assistant: member.is_assistant,
      employment_status: member.employment_status,
      temporary_password: '',
    });
    setDepartmentMemberPasswordConfirm('');
    setShowDepartmentMemberPassword(false);
    setShowDepartmentMemberPasswordConfirm(false);
    setDepartmentMemberError('');
    setDepartmentMemberNotice('');
    setShowDepartmentMemberModal(true);
  };

  const toggleMemberDepartment = (department: DepartmentType) => {
    setDepartmentMemberForm((current) => {
      const departments = current.departments.includes(department)
        ? current.departments.filter((item) => item !== department)
        : [...current.departments, department];

      return {
        ...current,
        departments,
        primary_department: departments.includes(current.primary_department)
          ? current.primary_department
          : departments[0] || current.primary_department,
      };
    });
  };

  const handleSaveDepartmentMember = async (event: React.FormEvent) => {
    event.preventDefault();
    setDepartmentMemberError('');

    if (!departmentMemberForm.full_name.trim() || !departmentMemberForm.email.trim() || !departmentMemberForm.job_title.trim()) {
      setDepartmentMemberError('Enter the member name, work email, and assigned job title.');
      return;
    }

    if (!departmentMemberForm.departments.length) {
      setDepartmentMemberError('Assign this member to at least one department.');
      return;
    }

    if (!departmentMemberForm.departments.includes(departmentMemberForm.primary_department)) {
      setDepartmentMemberError('The primary department must be one of the selected department assignments.');
      return;
    }

    const temporaryPassword = departmentMemberForm.temporary_password?.trim() || '';

    if (!editingDepartmentMember) {
      if (!temporaryPassword) {
        setDepartmentMemberError('Create the first login password for this department user.');
        return;
      }

      if (temporaryPassword.length < 8) {
        setDepartmentMemberError('Temporary password must be at least 8 characters.');
        return;
      }

      if (temporaryPassword !== departmentMemberPasswordConfirm) {
        setDepartmentMemberError('Temporary passwords do not match.');
        return;
      }
    }

    try {
      setSavingDepartmentMember(true);
      if (editingDepartmentMember) {
        await updateDepartmentMember(editingDepartmentMember.id, departmentMemberForm);
        setDepartmentMemberNotice(`${departmentMemberForm.full_name.trim()} has been updated.`);
      } else {
        const result = await createDepartmentMember({
          ...departmentMemberForm,
          temporary_password: temporaryPassword,
        });

        setDepartmentMemberNotice(
          result.loginStatus === 'created'
            ? `${result.member.full_name} can now sign in with the temporary password and change it from Profile Settings.`
            : result.loginStatus === 'existing'
              ? `${result.member.full_name} was added. This email already has a login account, so they should use their existing password or Forgot Password.`
              : `${result.member.full_name} was added to the directory. Create their login account before they need department access.`
        );
      }
      setShowDepartmentMemberModal(false);
      setEditingDepartmentMember(null);
      setDepartmentMemberForm(emptyDepartmentMember);
      setDepartmentMemberPasswordConfirm('');
    } catch (error) {
      setDepartmentMemberError(
        error instanceof Error ? error.message : 'The staff directory record could not be saved.'
      );
    } finally {
      setSavingDepartmentMember(false);
    }
  };

  const sidebarNav = [
    { label: 'Overview', icon: <LayoutDashboard style={{ width: 18, height: 18 }} />, active: activeTab === 'kpis', onClick: () => setActiveTab('kpis') },
    { label: 'CRM', icon: <BriefcaseBusiness style={{ width: 18, height: 18 }} />, active: activeTab === 'crm', onClick: () => setActiveTab('crm') },
    { label: 'KPI Tracker', icon: <TrendingUp style={{ width: 18, height: 18 }} />, active: activeTab === 'performance', onClick: () => setActiveTab('performance') },
    { label: 'Departments', icon: <Building2 style={{ width: 18, height: 18 }} />, active: activeTab === 'drilldown', onClick: () => setActiveTab('drilldown') },
    { label: 'Work Assignments', icon: <ClipboardList style={{ width: 18, height: 18 }} />, active: activeTab === 'work_assignments', onClick: () => setActiveTab('work_assignments') },
    { label: 'Partnerships', icon: <GraduationCap style={{ width: 18, height: 18 }} />, active: activeTab === 'partnerships', onClick: () => setActiveTab('partnerships') },
    { label: 'Staff & RBAC', icon: <Users2 style={{ width: 18, height: 18 }} />, active: activeTab === 'staff', onClick: () => setActiveTab('staff') },
    { label: 'Visa Applications', icon: <ShieldCheck style={{ width: 18, height: 18 }} />, active: activeTab === 'visa_applications', onClick: () => setActiveTab('visa_applications') },
    { label: 'Recycle Bin', icon: <Trash2 style={{ width: 18, height: 18 }} />, active: activeTab === 'trash', onClick: () => setActiveTab('trash') },
  ];

  return (
    <DashboardLayout
      department="Admin"
      title="Dashboard"
      subtitle="Full cross-department oversight and executive analytics"
      userName={currentProfile.full_name}
      userRole="Admin"
      notificationCount={urgentItems.length}
      navigation={sidebarNav}
      onLogout={logout}
    >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 style={{ color: '#3366FF' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>Admin System Oversight & Executive Platform</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              Full cross-department oversight, performance analytics, partner university listings, and global staff communications.
            </p>
          </div>

		
		<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  <button
    onClick={() => setShowGlobalNotifyModal(true)}
    className="btn btn-secondary btn-sm"
    style={{
      color: '#dc2626',
      borderColor: '#fecaca'
    }}
  >
    <Send style={{ width: '14px', height: '14px' }} />
    Broadcast Global Staff Notice
  </button>

  <button
    onClick={() => setShowAddPartnerModal(true)}
    className="btn btn-primary btn-sm"
  >
    <Plus style={{ width: '14px', height: '14px' }} />
    Add Partner University
  </button>

</div>

        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Executive KPI Dashboard */}
      {activeTab === 'kpis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Executive Stat Grid */}
          <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Applications</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>{totalApps}</div>
              <span style={{ fontSize: '0.7rem', color: '#34d399' }}>Across 8 departments</span>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Active Students</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>{activeStudents}</div>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Registered on Portal</span>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Pending Reviews</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{pendingApps}</div>
              <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Requires Department Action</span>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Approved / Rejected</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {approvedCount} <span style={{ fontSize: '1rem', color: '#f43f5e' }}>/ {rejectedCount}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Final Decisions Rendered</span>
            </div>
          </div>

          {/* Open Applications */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px'
            }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', color: '#fff', margin: 0 }}>
                  Open Applications
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Applications currently requiring departmental action
                </span>
              </div>

              <span className="badge badge-documents_verified">
                {pendingApps} Open
              </span>
            </div>

            {applications.filter(app =>
              ['submitted', 'under_review', 'documents_missing', 'admissions_review']
                .includes(app.status)
            ).length === 0 ? (
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                color: '#64748b',
                fontSize: '0.8rem'
              }}>
                No open applications at the moment.
              </div>
            ) : (
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Application #</th>
                      <th>Student</th>
                      <th>Institution</th>
                      <th>Status</th>
                      <th>Country</th>
                    </tr>
                  </thead>

                  <tbody>
                    {applications
                      .filter(app =>
                        ['submitted', 'under_review', 'documents_missing', 'admissions_review']
                          .includes(app.status)
                      )
                      .map(app => (
                        <tr key={app.id}>
                          <td>
                            <strong style={{ color: '#6366f1' }}>
                              {app.application_number}
                            </strong>
                          </td>

                          <td>{app.student_name}</td>

                          <td>{app.target_university}</td>

                          <td>
                            <span className={`badge badge-${app.status}`}>
                              {app.status.replace('_', ' ')}
                            </span>
                          </td>

                          <td>{app.target_country}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Urgent Items & Operational Alert Panel */}
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertOctagon style={{ width: '18px', height: '18px' }} />
              Admin Urgent Attention Items ({urgentItems.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {urgentItems.map((item, idx) => (
                <div key={idx} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>•</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'crm' && (
        <CrmRegister
          applications={applications}
          students={students}
          financialRecords={financialRecords}
          title="Admin CRM Register"
          description="Executive CRM sheet showing the full student journey across intake, payment, department owner, and next required action."
        />
      )}

      {activeTab === 'performance' && (
        <KpiPerformanceTracker
          records={departmentKpis}
          currentProfile={currentProfile}
          departmentMembers={departmentMembers}
        />
      )}

      {/* Tab 2: Department Drill-Down */}
      {activeTab === 'drilldown' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>
            Department Performance & Report Review
          </h3>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto' }}>
            {([
              'marketing',
              'counseling',
              'admissions',
              'data_applications',
              'operations',
              'finance',
              'country_directors',
              'management',
              'institutional_relations',
              'human_resources',
            ] as DepartmentType[]).map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDeptDrill(dept)}
                className={`btn btn-sm ${selectedDeptDrill === dept ? 'btn-primary' : 'btn-secondary'}`}
              >
                {dept.toUpperCase().replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <AdminDepartmentReports
            department={selectedDeptDrill}
            reports={selectedDepartmentReports}
            staffCount={selectedDepartmentStaff.length}
            onOpenFile={getDepartmentReportDownloadUrl}
            onReview={reviewDepartmentReport}
          />

        </div>
      )}

      {/* Open Application Detail */}
      {selectedApplication && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            inset: '0',
            zIndex: 1000,
            background: 'rgba(5, 10, 20, 0.96)',
            padding: '30px',
            overflowY: 'auto'
          }}
        >
          <div style={{
            maxWidth: '1100px',
            margin: '0 auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ color: '#fff', marginBottom: '6px' }}>
                  Application Details
                </h2>
                <span style={{ color: '#94a3b8' }}>
                  {selectedApplication.application_number}
                </span>
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px'
            }}>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <h3 style={{ color: '#6366f1', marginBottom: '12px' }}>
                  Student Information
                </h3>
                <p><strong>Name:</strong> {selectedApplication.student_name}</p>
                <p><strong>Email:</strong> {selectedApplication.student_email}</p>
                <p><strong>Student ID:</strong> {selectedApplication.student_id}</p>
              </div>

              <div className="glass-panel" style={{ padding: '18px' }}>
                <h3 style={{ color: '#06b6d4', marginBottom: '12px' }}>
                  Application Information
                </h3>
                <p><strong>Status:</strong> {selectedApplication.status}</p>
                <p><strong>Country:</strong> {selectedApplication.target_country}</p>
                <p><strong>University:</strong> {selectedApplication.target_university}</p>
                <p><strong>Program:</strong> {selectedApplication.degree_program}</p>
                <p><strong>Intake:</strong> {selectedApplication.intake_period}</p>
                <p>
                  <strong>Scholarship:</strong>{' '}
                  {selectedApplication.scholarship_requested || 'Not specified'}
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '18px' }}>
                <h3 style={{ color: '#f59e0b', marginBottom: '12px' }}>
                  Documents
                </h3>
                <p>
                  <strong>Missing Documents:</strong>{' '}
                  {selectedApplication.missing_documents_count}
                </p>
                <p>
                  <strong>Handed to Admissions:</strong>{' '}
                  {selectedApplication.handed_off_to_admissions ? 'Yes' : 'No'}
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '18px' }}>
                <h3 style={{ color: '#10b981', marginBottom: '12px' }}>
                  Admissions
                </h3>
                <p>
                  <strong>Decision:</strong>{' '}
                  {selectedApplication.admissions_decision || 'Pending'}
                </p>
                <p>
                  <strong>Notes:</strong>{' '}
                  {selectedApplication.admissions_notes || 'No admissions notes yet.'}
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px', marginTop: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px', marginTop: '16px' }}>
          <div className="glass-panel" style={{ padding: '18px', marginTop: '16px' }}>
            <h3 style={{ color: '#f59e0b', marginBottom: '14px' }}>
              Documents
            </h3>

            {(() => {
              const applicationDocuments = documents.filter(
                doc => doc.application_id === selectedApplication.id
              );

              if (applicationDocuments.length === 0) {
                return (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(148, 163, 184, 0.08)',
                    color: '#94a3b8'
                  }}>
                    No documents have been uploaded for this application.
                  </div>
                );
              }

              return (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {applicationDocuments.map(doc => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: '#fff',
                          fontWeight: 700,
                          marginBottom: '4px'
                        }}>
                          {doc.file_name}
                        </div>

                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8'
                        }}>
                          Type: {String(doc.document_type).replace(/_/g, ' ')}
                          {' • '}
                          Version: {doc.current_version}
                        </div>

                        <div style={{
                          marginTop: '6px',
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span className={`badge ${doc.is_verified ? 'badge-approved' : 'badge-pending'}`}>
                            {doc.is_verified ? 'Verified' : 'Not Verified'}
                          </span>

                          {doc.is_missing && (
                            <span className="badge badge-rejected">
                              Missing
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        {doc.signed_url && (
                          <a
                            href={doc.signed_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            <Eye style={{ width: '14px', height: '14px' }} />
                            View
                          </a>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            toggleMissingDocFlag(doc.id, !doc.is_missing)
                          }
                        >
                          {doc.is_missing ? 'Mark Complete' : 'Mark Missing'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            verifyDocument(doc.id, !doc.is_verified)
                          }
                        >
                          {doc.is_verified ? 'Unverify' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

              <h3 style={{ color: '#fff', marginBottom: '16px' }}>
                Application Review
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    marginBottom: '6px'
                  }}>
                    Application Status
                  </label>

                  <select
                    value={selectedApplication.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as Application['status'];

                      setSelectedApplication(prev =>
                        prev
                          ? {
                              ...prev,
                              status: newStatus
                            }
                          : null
                      );
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: '#111827',
                      color: '#fff'
                    }}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="documents_missing">Documents Missing</option>
                    <option value="admissions_review">Admissions Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    marginBottom: '6px'
                  }}>
                    Review Note
                  </label>

                  <textarea
                    value={reviewNote || selectedApplication.admissions_notes || ''}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter an administrative review note..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: '#111827',
                      color: '#fff',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '14px'
              }}>
                <button
                  onClick={handleSaveApplicationReview}
                  className="btn btn-primary"
                >
                  Save Review
                </button>
              </div>
            </div>

            <h3 style={{ color: '#fff', marginBottom: '12px' }}>
                Application Timeline
              </h3>
              <p style={{ color: '#94a3b8' }}>
                Created: {new Date(selectedApplication.created_at).toLocaleString()}
              </p>
              <p style={{ color: '#94a3b8' }}>
                Last Updated: {new Date(selectedApplication.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Partner Universities & Agreements File */}
      {activeTab === 'partnerships' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff' }}>Partner Universities & Agreement Files Directory</h3>
            <button onClick={() => setShowAddPartnerModal(true)} className="btn btn-primary btn-sm">
              <Plus style={{ width: '14px', height: '14px' }} />
              Add Partner
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {partnerUniversities.map(p => (
              <div key={p.id} className="glass-panel" style={{ padding: '16px', background: 'rgba(18, 26, 43, 0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>{p.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#06b6d4' }}>{p.country} • {p.contact_email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-documents_verified">{p.scholarships_offered} Scholarships</span>
                    <button
                      type="button"
                      onClick={() => setPartnerPendingDelete(p)}
                      className="btn btn-secondary btn-sm"
                      title={`Remove ${p.name}`}
                      style={{ color: '#fecaca', borderColor: 'rgba(248, 113, 113, 0.45)' }}
                    >
                      <Trash2 style={{ width: '13px', height: '13px' }} />
                      Remove
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                    Agreement Files:
                  </span>

                  {p.agreements.length === 0 ? (
                    <div style={{
                      padding: '10px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#64748b',
                      fontSize: '0.75rem',
                      marginBottom: '10px'
                    }}>
                      No agreement files uploaded yet.
                    </div>
                  ) : (
                    p.agreements.map(a => (
                      <div
                        key={a.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          marginBottom: '6px'
                        }}
                      >
                        <span style={{
                          color: '#cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <FileText style={{
                            width: '12px',
                            height: '12px',
                            color: '#6366f1'
                          }} />
                          {a.document_name}
                        </span>

                        <span style={{
                          color: '#34d399',
                          fontWeight: 600
                        }}>
                          Expires: {a.expiry_date}
                        </span>
                      </div>
                    ))
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    marginTop: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <input
                      type="date"
                      value={agreementExpiry[p.id] || ''}
                      onChange={e =>
                        setAgreementExpiry(prev => ({
                          ...prev,
                          [p.id]: e.target.value
                        }))
                      }
                      style={{
                        padding: '7px 9px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.75rem'
                      }}
                    />

                    <label
                      className="btn btn-primary btn-sm"
                      style={{
                        cursor: uploadingPartnerId === p.id
                          ? 'not-allowed'
                          : 'pointer',
                        opacity: uploadingPartnerId === p.id
                          ? 0.6
                          : 1
                      }}
                    >
                      <FileText style={{
                        width: '14px',
                        height: '14px'
                      }} />

                      {uploadingPartnerId === p.id
                        ? 'Uploading...'
                        : 'Upload Agreement'}

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        disabled={uploadingPartnerId === p.id}
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];

                          if (file) {
                            handleUploadAgreement(
                              p.id,
                              file
                            );
                          }

                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Work Assignments */}
      {activeTab === 'work_assignments' && (
        <DepartmentTaskInbox
          showAll
          title="Cross-Department Work Assignments"
          description="Full administrative oversight of all work assignments dispatched by Operations to departments. Monitor progress, review status updates, and ensure accountability."
        />
      )}

      {/* Tab 4: Staff Accounts & RBAC Matrix */}
      {activeTab === 'staff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <div className="admin-team-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users2 size={20} color="#2563eb" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Team directory & department assignments</h3>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Add team members, assign their primary and supporting departments, define their role, and choose either Senior or Assistant before access is activated.
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={openAddDepartmentMember}>
                <UserPlus size={16} />
                Add team member
              </button>
            </div>

            <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginTop: '18px' }}>
              <div style={{ padding: '13px', border: '1px solid #dbe5f3', borderRadius: '11px', background: '#f8fbff' }}>
                <span style={{ display: 'block', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>Directory members</span>
                <strong style={{ display: 'block', marginTop: '3px', color: '#163d8f', fontSize: '22px' }}>{departmentMembers.length}</strong>
              </div>
              <div style={{ padding: '13px', border: '1px solid #bbf7d0', borderRadius: '11px', background: '#f0fdf4' }}>
                <span style={{ display: 'block', color: '#166534', fontSize: '12px', fontWeight: 700 }}>Active members</span>
                <strong style={{ display: 'block', marginTop: '3px', color: '#15803d', fontSize: '22px' }}>{departmentMembers.filter((member) => member.employment_status === 'active').length}</strong>
              </div>
              <div style={{ padding: '13px', border: '1px solid #fde68a', borderRadius: '11px', background: '#fffbeb' }}>
                <span style={{ display: 'block', color: '#a16207', fontSize: '12px', fontWeight: 700 }}>Awaiting activation</span>
                <strong style={{ display: 'block', marginTop: '3px', color: '#b45309', fontSize: '22px' }}>{departmentMembers.filter((member) => member.employment_status === 'pending_activation').length}</strong>
              </div>
            </div>

            {departmentMemberNotice && (
              <div className="department-member-form-success" role="status">
                {departmentMemberNotice}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <BriefcaseBusiness size={18} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '0.98rem' }}>Staff roles and department coverage</h3>
            </div>
            {departmentMembers.length === 0 ? (
              <div style={{ padding: '34px 20px', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc', textAlign: 'center' }}>
                <UserRoundCheck size={30} color="#94a3b8" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, color: '#475569', fontWeight: 700 }}>Your staff directory is ready.</p>
                <p style={{ margin: '5px 0 14px', color: '#64748b', fontSize: '13px' }}>Add the first team member to record their department assignments and role.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={openAddDepartmentMember}><UserPlus size={14} /> Add team member</button>
              </div>
            ) : (
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Team member</th>
                      <th>Primary department</th>
                      <th>Additional coverage</th>
                      <th>Role</th>
                      <th>Responsibility</th>
                      <th>Onboarding status</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {departmentMembers.map((member) => {
                      const additionalDepartments = member.departments.filter(
                        (department) => department !== member.primary_department
                      );
                      const status = member.employment_status === 'active'
                        ? { label: 'Active', className: 'badge-documents_verified' }
                        : member.employment_status === 'inactive'
                          ? { label: 'Inactive', className: 'badge-rejected' }
                          : { label: 'Pending activation', className: 'badge-documents_missing' };

                      return (
                        <tr key={member.id}>
                          <td>
                            <strong style={{ display: 'block', color: '#0f172a' }}>{member.full_name}</strong>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>{member.email}</span>
                          </td>
                          <td><span className="badge badge-under_review">{departmentLabel(member.primary_department)}</span></td>
                          <td style={{ maxWidth: '205px' }}>
                            {additionalDepartments.length ? (
                              <span style={{ color: '#475569', fontSize: '12px', lineHeight: 1.45 }}>{additionalDepartments.map(departmentLabel).join(' · ')}</span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Primary only</span>
                            )}
                          </td>
                          <td style={{ color: '#334155', fontWeight: 650 }}>{member.job_title}</td>
                          <td>
                            <span className={`badge ${member.is_assistant ? 'badge-submitted' : 'badge-draft'}`}>
                              {member.is_assistant ? 'Assistant' : 'Senior'}
                            </span>
                          </td>
                          <td><span className={`badge ${status.className}`}>{status.label}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditDepartmentMember(member)}>
                                <Pencil size={14} /> Edit
                              </button>
                              <button type="button" className="btn btn-secondary btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca' }} onClick={() => {
                                setDepartmentMemberPendingDelete(member);
                                setDepartmentMemberDeleteError('');
                              }}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'visa_applications' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck style={{ color: '#00D8FF66' }} /> Student Visa Application Dossiers
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                Executive view of all student visa compliance submissions and Admissions status.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
              {visaApplications.length} Submissions
            </span>
          </div>

          {visaApplications.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
              No student visa applications have been initialized yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visaApplications.map((visaApp) => (
                <div
                  key={visaApp.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{visaApp.student_name}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>({visaApp.student_email})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span>Application ID: {visaApp.application_id ? visaApp.application_id.substring(0, 8) + '...' : 'N/A'}</span>
                      <span>Created: {new Date(visaApp.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      className={`dept-badge ${
                        visaApp.status === 'approved'
                          ? 'dept-badge-active'
                          : visaApp.status === 'rejected'
                          ? 'dept-badge-inactive'
                          : 'dept-badge-pending'
                      }`}
                      style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}
                    >
                      {visaApp.status.replace('_', ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedAdminVisaApp(visaApp)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye style={{ width: 12, height: 12 }} /> View Dossier Files
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trash' && (
        <TrashBin departmentKey="admin" />
      )}

      {showDepartmentMemberModal && (
        <div className="modal-overlay" role="presentation">
          <section className="modal-content department-member-modal" role="dialog" aria-modal="true" aria-labelledby="department-member-modal-title" style={{ maxWidth: '650px', padding: 0 }}>
            <header className="department-member-modal-header">
              <div>
                <span className="settings-eyebrow">Globe Scholars Pathways, LLC.</span>
                <h2 id="department-member-modal-title">{editingDepartmentMember ? 'Update team member' : 'Add team member'}</h2>
                <p>Record the member’s work identity, department coverage, and access readiness.</p>
              </div>
              <button type="button" className="settings-close-button" onClick={() => setShowDepartmentMemberModal(false)} aria-label="Close staff member form"><X size={20} /></button>
            </header>

            <form onSubmit={handleSaveDepartmentMember}>
              <div className="department-member-modal-body">
                <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="form-label" htmlFor="member-full-name">Full name</label>
                    <input id="member-full-name" className="form-input" required value={departmentMemberForm.full_name} onChange={(event) => setDepartmentMemberForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="e.g. Amina Bello" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="member-email">Work email</label>
                    <input id="member-email" className="form-input" type="email" required value={departmentMemberForm.email} onChange={(event) => setDepartmentMemberForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@organisation.com" />
                  </div>
                </div>

                <label className="form-label" htmlFor="member-job-title">Job title / assigned role</label>
                <input id="member-job-title" className="form-input" required value={departmentMemberForm.job_title} onChange={(event) => setDepartmentMemberForm((current) => ({ ...current, job_title: event.target.value }))} placeholder="e.g. Senior Admissions Officer" />

                {!editingDepartmentMember && (
                  <section className="department-member-credentials">
                    <div className="department-member-credentials-header">
                      <KeyRound size={18} color="#1d4ed8" />
                      <div>
                        <h3>Initial login password</h3>
                        <p>This temporary password lets the department user sign in. They can change it later from Profile Settings.</p>
                      </div>
                    </div>
                    <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label className="form-label" htmlFor="member-temporary-password">Temporary password</label>
                        <div className="department-member-password-field">
                          <input
                            id="member-temporary-password"
                            className="form-input"
                            type={showDepartmentMemberPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={departmentMemberForm.temporary_password || ''}
                            onChange={(event) => setDepartmentMemberForm((current) => ({ ...current, temporary_password: event.target.value }))}
                            placeholder="Minimum 8 characters"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDepartmentMemberPassword((visible) => !visible)}
                            aria-label={showDepartmentMemberPassword ? 'Hide temporary password' : 'Show temporary password'}
                          >
                            {showDepartmentMemberPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="form-label" htmlFor="member-temporary-password-confirm">Confirm password</label>
                        <div className="department-member-password-field">
                          <input
                            id="member-temporary-password-confirm"
                            className="form-input"
                            type={showDepartmentMemberPasswordConfirm ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={departmentMemberPasswordConfirm}
                            onChange={(event) => setDepartmentMemberPasswordConfirm(event.target.value)}
                            placeholder="Re-enter password"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDepartmentMemberPasswordConfirm((visible) => !visible)}
                            aria-label={showDepartmentMemberPasswordConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                          >
                            {showDepartmentMemberPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="form-label" htmlFor="member-primary-department">Primary department</label>
                    <select id="member-primary-department" className="form-input" value={departmentMemberForm.primary_department} onChange={(event) => {
                      const primaryDepartment = event.target.value as DepartmentType;
                      setDepartmentMemberForm((current) => ({
                        ...current,
                        primary_department: primaryDepartment,
                        departments: current.departments.includes(primaryDepartment) ? current.departments : [...current.departments, primaryDepartment],
                      }));
                    }}>
                      {DEPARTMENT_OPTIONS.map((department) => <option key={department.value} value={department.value}>{department.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="member-status">Onboarding status</label>
                    <select id="member-status" className="form-input" value={departmentMemberForm.employment_status} onChange={(event) => setDepartmentMemberForm((current) => ({ ...current, employment_status: event.target.value as DepartmentMemberInput['employment_status'] }))}>
                      <option value="pending_activation">Pending activation</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <fieldset className="department-member-assignments">
                  <legend>Department assignments</legend>
                  <p>Choose every department this person supports. The primary department determines their principal workspace.</p>
                  <div className="department-member-checkboxes">
                    {DEPARTMENT_OPTIONS.map((department) => (
                      <label key={department.value} className="department-member-checkbox">
                        <input type="checkbox" checked={departmentMemberForm.departments.includes(department.value)} onChange={() => toggleMemberDepartment(department.value)} />
                        <span>{department.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="department-member-responsibility">
                  <legend>Responsibility level</legend>
                  <p>Choose how this member should appear in the department directory.</p>
                  <div className="department-member-role-options">
                    {RESPONSIBILITY_OPTIONS.map((option) => {
                      const selected = departmentMemberForm.is_assistant === option.value;

                      return (
                        <button
                          key={option.label}
                          type="button"
                          className={selected ? 'is-selected' : ''}
                          aria-pressed={selected}
                          onClick={() =>
                            setDepartmentMemberForm((current) => ({
                              ...current,
                              is_assistant: option.value,
                            }))
                          }
                        >
                          <strong>{option.label}</strong>
                          <span>{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {departmentMemberError && <p className="department-member-form-error" role="alert">{departmentMemberError}</p>}
              </div>
              <footer className="department-member-modal-actions">
                <button type="button" className="btn btn-secondary" disabled={savingDepartmentMember} onClick={() => setShowDepartmentMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingDepartmentMember}><UserPlus size={16} />{savingDepartmentMember ? 'Saving…' : editingDepartmentMember ? 'Save changes' : 'Add team member'}</button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* Modal: Confirm Staff Member Removal */}
      {departmentMemberPendingDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 330, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '24px', background: '#0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', marginBottom: '12px' }}>
              <Trash2 style={{ width: '20px', height: '20px' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Delete department member</h3>
            </div>
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.55, fontSize: '0.88rem' }}>
              Remove <strong style={{ color: '#fff' }}>{departmentMemberPendingDelete.full_name}</strong> from the staff directory? Their department access will be revoked from their profile.
            </p>
            <p style={{ margin: '10px 0 0', color: '#fbbf24', fontSize: '0.78rem' }}>
              Their authentication login is not destroyed, but they will no longer enter a department workspace.
            </p>
            {departmentMemberDeleteError && (
              <p className="department-member-form-error" role="alert" style={{ marginTop: '14px' }}>
                {departmentMemberDeleteError}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setDepartmentMemberPendingDelete(null)} disabled={deletingDepartmentMember} className="btn btn-secondary btn-sm">Cancel</button>
              <button type="button" onClick={handleDeleteDepartmentMember} disabled={deletingDepartmentMember} className="btn btn-primary btn-sm" style={{ background: '#dc2626' }}>
                <Trash2 style={{ width: '14px', height: '14px' }} />
                {deletingDepartmentMember ? 'Deleting...' : 'Delete member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Partner Removal */}
      {partnerPendingDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '24px', background: '#0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', marginBottom: '12px' }}>
              <Trash2 style={{ width: '20px', height: '20px' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Remove partner university</h3>
            </div>
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.55, fontSize: '0.88rem' }}>
              Remove <strong style={{ color: '#fff' }}>{partnerPendingDelete.name}</strong> from the partnership directory? Its agreement records and stored agreement files will also be removed.
            </p>
            <p style={{ margin: '10px 0 0', color: '#fbbf24', fontSize: '0.78rem' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setPartnerPendingDelete(null)} disabled={deletingPartner} className="btn btn-secondary btn-sm">Cancel</button>
              <button type="button" onClick={handleDeletePartner} disabled={deletingPartner} className="btn btn-primary btn-sm" style={{ background: '#dc2626' }}>
                <Trash2 style={{ width: '14px', height: '14px' }} />
                {deletingPartner ? 'Removing…' : 'Remove partner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Partner University */}
      {showAddPartnerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '440px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Add New Partner University</h3>
            <form onSubmit={handleAddPartner} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>University Name</label>
                <input type="text" required placeholder="e.g. Stanford University" value={pName} onChange={e => setPName(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Country</label>
                <input type="text" required value={pCountry} onChange={e => setPCountry(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Contact Email</label>
                <input type="email" required placeholder="admissions@stanford.edu" value={pEmail} onChange={e => setPEmail(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Scholarships Available</label>
                <input type="number" min="0" required value={pScholarships} onChange={e => setPScholarships(Math.max(0, Number(e.target.value)))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddPartnerModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Add Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin View Visa Dossier */}
      {selectedAdminVisaApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '540px', padding: '24px', background: '#0f172a', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                Visa Dossier Details: {selectedAdminVisaApp.student_name}
              </h3>
              <button type="button" onClick={() => setSelectedAdminVisaApp(null)} className="btn btn-secondary btn-sm">Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Status:</span>
                  <span
                    className={`dept-badge ${
                      selectedAdminVisaApp.status === 'approved'
                        ? 'dept-badge-active'
                        : selectedAdminVisaApp.status === 'rejected'
                        ? 'dept-badge-inactive'
                        : 'dept-badge-pending'
                    }`}
                    style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}
                  >
                    {selectedAdminVisaApp.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '12px' }}>
                  <strong>Admissions Feedback & Guidance:</strong>
                  <p style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', marginTop: '6px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    {selectedAdminVisaApp.admissions_instructions || 'No feedback or instructions recorded yet.'}
                  </p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>Uploaded Dossier Files (PDFs)</h4>
                {loadingAdminVisaDocs ? (
                  <p style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Loading dossier files...</p>
                ) : adminVisaDocs.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: '#ef4444' }}>No files uploaded by the student yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {adminVisaDocs.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-color)',
                          padding: '10px 14px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: '#fff', textTransform: 'capitalize' }}>
                            {doc.document_type.replace('_', ' ')}:
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginLeft: '6px', display: 'inline-block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.file_name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const { data } = supabase.storage
                              .from('department-reports')
                              .getPublicUrl(doc.file_path);
                            if (data?.publicUrl) {
                              window.open(data.publicUrl, '_blank');
                            }
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye style={{ width: 12, height: 12 }} /> View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Global Staff Notice */}
      {showGlobalNotifyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '460px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Broadcast Global Staff Notice</h3>
            <form onSubmit={handleGlobalNotify} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Subject</label>
                <input type="text" required placeholder="e.g. Q3 Admission Deadline Policy Update" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Message Body</label>
                <textarea required rows={4} placeholder="Announcement text for all department staff..." value={noticeBody} onChange={e => setNoticeBody(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowGlobalNotifyModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Broadcast Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </DashboardLayout>
  );
};
