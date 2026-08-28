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
import { ProfileAvatar } from '../common/ProfileAvatar';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
import { checkPasswordStrength } from '../../lib/password-utils';
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
  BookOpen,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Sparkles,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Check,
  Radio,
  Video,
  CreditCard,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle,
  ExternalLink,
  Layers,
  Activity
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

type AdminTab = 'kpis' | 'crm' | 'performance' | 'drilldown' | 'partnerships' | 'staff' | 'work_assignments' | 'visa_applications' | 'student_documents' | 'trash';

const ADMIN_TABS: Array<{ id: AdminTab; label: string }> = [
  { id: 'kpis', label: 'Executive Dashboard' },
  { id: 'crm', label: 'CRM Register' },
  { id: 'performance', label: 'KPI Performance Tracker' },
  { id: 'drilldown', label: 'Department Drill-Down' },
  { id: 'work_assignments', label: 'Work Assignments' },
  { id: 'partnerships', label: 'Partner Universities & Agreements' },
  { id: 'staff', label: 'Staff Accounts & Department Members' },
  { id: 'student_documents', label: 'Student Documents' },
];

const emptyDepartmentMember: DepartmentMemberInput = {
  full_name: '',
  email: '',
  job_title: '',
  primary_department: 'admissions',
  departments: ['admissions'],
  is_assistant: false,
  employment_status: 'active',
  working_country: '',
  temporary_password: '',
};

const departmentLabel = (department: DepartmentType) =>
  DEPARTMENT_OPTIONS.find((option) => option.value === department)?.label || department;

const hasDepartment = (member?: DepartmentMember | null, dept?: DepartmentType): boolean => {
  if (!member || !dept) return false;
  if (member.primary_department === dept) return true;
  if (Array.isArray(member.departments) && member.departments.includes(dept)) return true;
  return false;
};

const getMemberDepartments = (member?: DepartmentMember | null): DepartmentType[] => {
  if (!member) return [];
  if (Array.isArray(member.departments) && member.departments.length > 0) {
    return member.departments;
  }
  return member.primary_department ? [member.primary_department] : [];
};

export const AdminWorkspace: React.FC = () => {
  const {
    currentProfile,
    logout,
    departmentMembers,
    createDepartmentMember,
    updateDepartmentMember,
    deleteDepartmentMember,
    availableProfiles,
    deleteUserProfileAccount,
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
  universityCourses,
  addUniversityCourse,
  deleteUniversityCourse,
  scholarships,
  addScholarship,
  deleteScholarship,
  departmentReports,
  getDepartmentReportDownloadUrl,
  reviewDepartmentReport,
  addCommunication,
  updateApplicationStatus,
  statusHistory,
  visaApplications,
  loadVisaDocuments,
  reviewVisaApplication,
  sendStudentEmail,
  deleteApplication,
  workAssignments,
  updateWorkAssignmentStatus,
  marketingPosts,
  deleteMarketingPost,
  counselingSessions,
  hrLeaveRequests,
  hrEmployeeRecords,
  monthlyMeetings
} = useApplication();

  const [activeTab, setActiveTab] = useState<AdminTab>('kpis');
  const [crmFilter, setCrmFilter] = useState<'all' | 'students' | 'pending' | 'decided'>('all');
  const [selectedDeptDrill, setSelectedDeptDrill] = useState<DepartmentType>('admissions');
  const [deptDrillSubTab, setDeptDrillSubTab] = useState<'live_work' | 'tasks' | 'staff' | 'formal_reports'>('live_work');
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

  // Admin Visa Review states
  const [adminVisaStatusChoice, setAdminVisaStatusChoice] = useState<'pending' | 'under_review' | 'approved' | 'rejected'>('under_review');
  const [adminVisaInstructions, setAdminVisaInstructions] = useState('');
  const [reviewingAdminVisa, setReviewingAdminVisa] = useState(false);

  const handleAdminReviewVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminVisaApp) return;
    setReviewingAdminVisa(true);
    try {
      await reviewVisaApplication(selectedAdminVisaApp.id, adminVisaStatusChoice, adminVisaInstructions);

      // Dispatch simulated direct email invitation
      const emailSubject = `Visa Application Status Update (Admin Review): ${adminVisaStatusChoice.toUpperCase()}`;
      const emailBody = `Dear ${selectedAdminVisaApp.student_name},\n\nYour visa application dossier status has been updated by the Executive Admin to: ${adminVisaStatusChoice.replace('_', ' ').toUpperCase()}.\n\nFeedback / Action required:\n${adminVisaInstructions}\n\nBest regards,\nGlobe Scholars Executive Administration`;
      try {
        await sendStudentEmail(selectedAdminVisaApp.student_id || '', selectedAdminVisaApp.student_email || '', emailSubject, emailBody, 'Executive Administration');
      } catch (err) {
        console.error('Failed to send visa email notification:', err);
      }

      setSelectedAdminVisaApp(null);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewingAdminVisa(false);
    }
  };

  // Review documents modal state
  const [selectedReviewApp, setSelectedReviewApp] = useState<Application | null>(null);
  const [revisionSubject, setRevisionSubject] = useState('');
  const [revisionBody, setRevisionBody] = useState('');
  const [sendingRevision, setSendingRevision] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedAdminVisaApp?.id) {
      setLoadingAdminVisaDocs(true);
      loadVisaDocuments(selectedAdminVisaApp.id)
        .then(setAdminVisaDocs)
        .catch(err => console.error(err))
        .finally(() => setLoadingAdminVisaDocs(false));

      setAdminVisaStatusChoice(selectedAdminVisaApp.status);
      setAdminVisaInstructions(selectedAdminVisaApp.admissions_instructions || '');
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

  // Staff Directory & RBAC Interactive State
  const [staffTabSection, setStaffTabSection] = useState<'roster' | 'table' | 'accounts'>('roster');
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffDepartmentFilter, setStaffDepartmentFilter] = useState<string>('all');
  const [staffStatusFilter, setStaffStatusFilter] = useState<string>('all');
  const [selectedStaffDossier, setSelectedStaffDossier] = useState<DepartmentMember | null>(null);
  const [showRbacMatrixModal, setShowRbacMatrixModal] = useState(false);
  const [togglingStaffId, setTogglingStaffId] = useState<string | null>(null);

  // New partner state with initial courses builder
  const [pName, setPName] = useState('');
  const [pCountry, setPCountry] = useState('United Kingdom');
  const [pEmail, setPEmail] = useState('');
  const [pScholarships, setPScholarships] = useState(10);
  const [pCourses, setPCourses] = useState<Array<{ id: string; course_name: string; admission_fee: string; tuition_fee: string }>>([
    { id: 'c-1', course_name: '', admission_fee: '150.00', tuition_fee: '3000.00' }
  ]);
  const [addingPartner, setAddingPartner] = useState(false);
  const [addPartnerError, setAddPartnerError] = useState('');

  // Partner agreement upload state
  const [uploadingPartnerId, setUploadingPartnerId] = useState<string | null>(null);
  const [agreementExpiry, setAgreementExpiry] = useState<Record<string, string>>({});

  // Global notice state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  // Course and Scholarship management state
  const [selectedPartnerForCourses, setSelectedPartnerForCourses] = useState<PartnerUniversity | null>(null);
  const [courseName, setCourseName] = useState('');
  const [admissionFee, setAdmissionFee] = useState('150.00');
  const [tuitionFee, setTuitionFee] = useState('3000.00');
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [courseError, setCourseError] = useState('');

  const [selectedPartnerForScholarships, setSelectedPartnerForScholarships] = useState<PartnerUniversity | null>(null);
  const [scholarshipName, setScholarshipName] = useState('');
  const [scholarshipDesc, setScholarshipDesc] = useState('');
  const [scholarshipCoverage, setScholarshipCoverage] = useState('1000.00');
  const [scholarshipPercent, setScholarshipPercent] = useState('50');
  const [scholarshipCriteria, setScholarshipCriteria] = useState('');
  const [submittingScholarship, setSubmittingScholarship] = useState(false);
  const [scholarshipError, setScholarshipError] = useState('');

  // Key KPI Calculations
  const totalApps = applications.length;
  const activeStudents = students.length;
  const pendingApps = applications.filter(a => ['submitted', 'under_review', 'documents_missing', 'admissions_review'].includes(a.status)).length;
  const missingDocsCount = applications.reduce((acc, a) => acc + a.missing_documents_count, 0);
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;
  const selectedDepartmentReports = (departmentReports || []).filter(
    (report) => report.department === selectedDeptDrill
  );
  const selectedDepartmentStaff = (departmentMembers || []).filter(
    (member) =>
      hasDepartment(member, selectedDeptDrill) &&
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
      setAddPartnerError('Please complete university name, country, and contact email.');
      return;
    }

    try {
      setAddingPartner(true);
      setAddPartnerError('');

      const newPartner = await addPartnerUniversity({
        name: pName.trim(),
        country: pCountry.trim(),
        contact_email: pEmail.trim(),
        scholarships_offered: pScholarships,
        active_agreement: true,
        agreements: []
      });

      // Add all courses entered in the form
      let coursesAddedCount = 0;
      for (const c of pCourses) {
        if (c.course_name.trim()) {
          try {
            await addUniversityCourse({
              university_id: newPartner.id,
              course_name: c.course_name.trim(),
              admission_fee: Number(c.admission_fee) || 0,
              tuition_fee: Number(c.tuition_fee) || 0
            });
            coursesAddedCount++;
          } catch (courseErr) {
            console.error('Failed to add initial course:', courseErr);
          }
        }
      }

      setShowAddPartnerModal(false);
      setPName('');
      setPCountry('United Kingdom');
      setPEmail('');
      setPScholarships(10);
      setPCourses([
        { id: `c-${Date.now()}`, course_name: '', admission_fee: '150.00', tuition_fee: '3000.00' }
      ]);
      alert(`Partner University "${newPartner.name}" added successfully${coursesAddedCount > 0 ? ` with ${coursesAddedCount} course offering(s)` : ''}!`);
    } catch (error) {
      console.error('Failed to add partner university:', error);
      setAddPartnerError(
        error instanceof Error
          ? error.message
          : 'Failed to add partner university.'
      );
    } finally {
      setAddingPartner(false);
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

  const openAddDepartmentMember = (preselectedDepartment?: DepartmentType) => {
    setEditingDepartmentMember(null);
    const targetDept = preselectedDepartment || 'admissions';
    setDepartmentMemberForm({
      ...emptyDepartmentMember,
      primary_department: targetDept,
      departments: [targetDept],
    });
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
      departments: getMemberDepartments(member),
      is_assistant: member.is_assistant,
      employment_status: member.employment_status,
      working_country: member.working_country || '',
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
      const curDepts = current.departments || [];
      const departments = curDepts.includes(department)
        ? curDepts.filter((item) => item !== department)
        : [...curDepts, department];

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

    if (!(departmentMemberForm.departments || []).length) {
      setDepartmentMemberError('Assign this member to at least one department.');
      return;
    }

    if (!(departmentMemberForm.departments || []).includes(departmentMemberForm.primary_department)) {
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

      const strength = checkPasswordStrength(temporaryPassword);
      if (strength.isWeak) {
        setDepartmentMemberError(
          strength.warning ||
            'Temporary password is weak. Please choose a stronger password with a mix of uppercase letters, numbers, and symbols.'
        );
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

  const handleToggleStaffStatus = async (member: DepartmentMember) => {
    try {
      setTogglingStaffId(member.id);
      const nextStatus = member.employment_status === 'active' ? 'inactive' : 'active';
      await updateDepartmentMember(member.id, {
        full_name: member.full_name,
        email: member.email,
        job_title: member.job_title,
        primary_department: member.primary_department,
        departments: member.departments,
        is_assistant: member.is_assistant,
        employment_status: nextStatus,
        working_country: member.working_country || ''
      });
      setDepartmentMemberNotice(`Status for ${member.full_name} updated to ${nextStatus.toUpperCase()}.`);
    } catch (err) {
      console.error('Failed to toggle staff status:', err);
      alert('Failed to update staff status.');
    } finally {
      setTogglingStaffId(null);
    }
  };

  const sidebarNav = [
    { label: 'Overview', icon: <LayoutDashboard style={{ width: 18, height: 18 }} />, active: activeTab === 'kpis', onClick: () => setActiveTab('kpis') },
    { label: 'CRM', icon: <BriefcaseBusiness style={{ width: 18, height: 18 }} />, active: activeTab === 'crm', onClick: () => setActiveTab('crm') },
    { label: 'KPI Tracker', icon: <TrendingUp style={{ width: 18, height: 18 }} />, active: activeTab === 'performance', onClick: () => setActiveTab('performance') },
    { label: 'Departments', icon: <Building2 style={{ width: 18, height: 18 }} />, active: activeTab === 'drilldown', onClick: () => setActiveTab('drilldown') },
    { label: 'Work Assignments', icon: <ClipboardList style={{ width: 18, height: 18 }} />, active: activeTab === 'work_assignments', onClick: () => setActiveTab('work_assignments') },
    { label: 'Partnerships', icon: <GraduationCap style={{ width: 18, height: 18 }} />, active: activeTab === 'partnerships', onClick: () => setActiveTab('partnerships') },
    { label: 'Staff & Members', icon: <Users2 style={{ width: 18, height: 18 }} />, active: activeTab === 'staff', onClick: () => setActiveTab('staff') },
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 style={{ color: '#3366FF' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>Admin System Oversight & Executive Platform</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              Full cross-department oversight, performance analytics, partner university listings, and global staff communications.
            </p>
          </div>

		<div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
  <button
    onClick={() => openAddDepartmentMember()}
    className="btn btn-primary btn-sm"
    style={{
      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    }}
  >
    <UserPlus style={{ width: '14px', height: '14px' }} />
    Add Department Member
  </button>

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
          <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
            <div
              className="glass-panel glass-panel-interactive animate-scale-up"
              style={{ padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
              onClick={() => {
                setActiveTab('crm');
                setCrmFilter('all');
              }}
            >
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Total Applications</span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>{totalApps}</div>
              <span style={{ fontSize: '0.68rem', color: '#34d399' }}>Across 8 departments</span>
            </div>

            <div
              className="glass-panel glass-panel-interactive animate-scale-up"
              style={{ padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
              onClick={() => {
                setActiveTab('crm');
                setCrmFilter('students');
              }}
            >
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Active Students</span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>{activeStudents}</div>
              <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>Registered on Portal</span>
            </div>

            <div
              className="glass-panel glass-panel-interactive animate-scale-up"
              style={{ padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
              onClick={() => {
                setActiveTab('crm');
                setCrmFilter('pending');
              }}
            >
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Pending Reviews</span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{pendingApps}</div>
              <span style={{ fontSize: '0.68rem', color: '#fbbf24' }}>Requires Action</span>
            </div>

            <div
              className="glass-panel glass-panel-interactive animate-scale-up"
              style={{ padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
              onClick={() => {
                setActiveTab('crm');
                setCrmFilter('decided');
              }}
            >
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Decisions Rendered</span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {approvedCount} <span style={{ fontSize: '0.9rem', color: '#f43f5e' }}>/ {rejectedCount}</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Approved / Rejected</span>
            </div>

            <div
              className="glass-panel glass-panel-interactive animate-scale-up"
              style={{ padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease-in-out', border: '1px solid rgba(168, 85, 247, 0.3)', background: 'rgba(168, 85, 247, 0.06)' }}
              onClick={() => {
                setActiveTab('staff');
                setStaffTabSection('roster');
                setStaffDepartmentFilter('all');
                setStaffStatusFilter('all');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.74rem', color: '#c084fc', display: 'block', fontWeight: 600 }}>Staff Directory & RBAC</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAddDepartmentMember();
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.68rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none' }}
                  title="Add New Department Member"
                >
                  <UserPlus size={11} /> + Add
                </button>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
                {departmentMembers.length}
                <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, marginLeft: '6px' }}>
                  ({departmentMembers.filter(m => m.employment_status === 'active').length} Active)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ fontSize: '0.68rem', color: '#d8b4fe' }}>Manage Roles & RBAC →</span>
                <span style={{ fontSize: '0.66rem', color: '#a855f7', fontWeight: 600 }}>View All Staff</span>
              </div>
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
                      <th>Action</th>
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
                          <td>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete application ${app.application_number}?`)) {
                                  deleteApplication(app.id);
                                }
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.08)' }}
                            >
                              Delete App
                            </button>
                          </td>
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
          filterType={crmFilter}
          onFilterChange={setCrmFilter}
          onDeleteApplication={deleteApplication}
        />
      )}

      {activeTab === 'performance' && (
        <KpiPerformanceTracker
          records={departmentKpis}
          currentProfile={currentProfile}
          departmentMembers={departmentMembers}
        />
      )}

      {/* Tab 2: Interactive Department Zoom & Deep-Dive Command Center */}
      {activeTab === 'drilldown' && (() => {
        const safeMembers = departmentMembers || [];
        const safeAssignments = workAssignments || [];
        const safeReports = departmentReports || [];
        const safeApps = applications || [];
        const safeFinances = financialRecords || [];
        const safePosts = marketingPosts || [];
        const safeSessions = counselingSessions || [];
        const safeHrLeaves = hrLeaveRequests || [];
        const safePartners = partnerUniversities || [];
        const safeCourses = universityCourses || [];

        const currentDeptStaff = safeMembers.filter(
          m => hasDepartment(m, selectedDeptDrill)
        );
        const deptTasks = safeAssignments.filter(
          t => t.assigned_department === selectedDeptDrill
        );
        const deptReports = safeReports.filter(
          r => r.department === selectedDeptDrill
        );
        const admissionsApps = safeApps.filter(
          a => ['submitted', 'under_review', 'documents_missing', 'admissions_review', 'approved'].includes(a.status)
        );
        const financeApprovedTotal = safeFinances
          .filter(f => f.status === 'approved')
          .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const financePendingTotal = safeFinances
          .filter(f => f.status === 'pending')
          .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const countryDirectorStaff = safeMembers.filter(
          m => hasDepartment(m, 'country_directors')
        );

        const getDeptIcon = (dept: DepartmentType) => {
          switch (dept) {
            case 'admissions': return <GraduationCap size={18} color="#60a5fa" />;
            case 'counseling': return <Video size={18} color="#34d399" />;
            case 'marketing': return <Radio size={18} color="#f472b6" />;
            case 'finance': return <CreditCard size={18} color="#fbbf24" />;
            case 'country_directors': return <Globe size={18} color="#38bdf8" />;
            case 'data_applications': return <FileCheck size={18} color="#a78bfa" />;
            case 'operations': return <ClipboardList size={18} color="#f97316" />;
            case 'human_resources': return <Users2 size={18} color="#ec4899" />;
            case 'institutional_relations': return <Building2 size={18} color="#2dd4bf" />;
            default: return <ShieldCheck size={18} color="#c084fc" />;
          }
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Top Department Switcher Bar with Live Badges */}
            <div className="glass-panel" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#3b82f6" />
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 700 }}>
                    Cross-Department Zoom & Live Activity Hub
                  </h3>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Select any department to inspect its live operations, team queue, dispatched tasks, and staff.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%', flexWrap: 'wrap' }}>
                {DEPARTMENT_OPTIONS.map(opt => {
                  const isSelected = selectedDeptDrill === opt.value;
                  const staffCount = safeMembers.filter(m => hasDepartment(m, opt.value)).length;
                  
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedDeptDrill(opt.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(30, 64, 175, 0.35))' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none'
                      }}
                    >
                      {getDeptIcon(opt.value)}
                      <span>{opt.label}</span>
                      <span style={{
                        fontSize: '0.66rem',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                        color: isSelected ? '#fff' : '#64748b',
                        fontWeight: 700
                      }}>
                        {staffCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department Zoom Header & KPI Dashboard */}
            <div className="glass-panel" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                    {getDeptIcon(selectedDeptDrill)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                      {departmentLabel(selectedDeptDrill)} Department Live Command Center
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                      Real-time visibility into active pipelines, student interactions, task progress, and team member assignments.
                    </p>
                  </div>
                </div>

                {/* Sub-Tab Navigation Bar */}
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    type="button"
                    onClick={() => setDeptDrillSubTab('live_work')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: deptDrillSubTab === 'live_work' ? '#2563eb' : 'transparent',
                      color: deptDrillSubTab === 'live_work' ? '#fff' : '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Activity size={13} />
                    Live Work & Pipeline
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeptDrillSubTab('tasks')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: deptDrillSubTab === 'tasks' ? '#2563eb' : 'transparent',
                      color: deptDrillSubTab === 'tasks' ? '#fff' : '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <ClipboardList size={13} />
                    Tasks ({deptTasks.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeptDrillSubTab('staff')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: deptDrillSubTab === 'staff' ? '#2563eb' : 'transparent',
                      color: deptDrillSubTab === 'staff' ? '#fff' : '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Users2 size={13} />
                    Staff ({currentDeptStaff.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeptDrillSubTab('formal_reports')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: deptDrillSubTab === 'formal_reports' ? '#2563eb' : 'transparent',
                      color: deptDrillSubTab === 'formal_reports' ? '#fff' : '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <FileText size={13} />
                    Executive Reports ({deptReports.length})
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards for Selected Department */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Department Staff</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                    {currentDeptStaff.length} <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>({currentDeptStaff.filter(s => s.employment_status === 'active').length} active)</span>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    {selectedDeptDrill === 'marketing' ? 'Marketing Posts' :
                     selectedDeptDrill === 'counseling' ? 'Counseling Sessions' :
                     selectedDeptDrill === 'finance' ? 'Total Disbursed' :
                     selectedDeptDrill === 'country_directors' ? 'Assigned Countries' :
                     selectedDeptDrill === 'human_resources' ? 'Leave Requests' :
                     selectedDeptDrill === 'institutional_relations' ? 'Partner Institutions' :
                     'Active Applications'}
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                    {selectedDeptDrill === 'marketing' ? marketingPosts.length :
                     selectedDeptDrill === 'counseling' ? counselingSessions.length :
                     selectedDeptDrill === 'finance' ? `$${financeApprovedTotal.toLocaleString()}` :
                     selectedDeptDrill === 'country_directors' ? countryDirectorStaff.length :
                     selectedDeptDrill === 'human_resources' ? hrLeaveRequests.length :
                     selectedDeptDrill === 'institutional_relations' ? partnerUniversities.length :
                     admissionsApps.length}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Work Directives</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                    {deptTasks.length} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>({deptTasks.filter(t => t.status === 'completed').length} done)</span>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Formal Reports</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa', marginTop: '2px' }}>
                    {deptReports.length} <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 500 }}>({deptReports.filter(r => r.status === 'approved').length} reviewed)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Tab 1: Live Department Work & Pipeline */}
            {deptDrillSubTab === 'live_work' && (
              <div className="glass-panel" style={{ padding: '20px' }}>
                
                {/* 1. MARKETING DEPARTMENT VIEW */}
                {selectedDeptDrill === 'marketing' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Radio size={16} color="#f472b6" />
                        Marketing Announcements, Campaigns & Broadcasts ({marketingPosts.length})
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Published posts visible to Admissions, Counseling, and global staff.
                      </span>
                    </div>

                    {marketingPosts.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        No marketing announcements posted yet.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                        {marketingPosts.map(post => (
                          <div key={post.id} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <h5 style={{ margin: 0, fontSize: '0.88rem', color: '#fff', fontWeight: 700 }}>{post.title}</h5>
                              <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', textTransform: 'uppercase', fontWeight: 700 }}>
                                {post.category || 'General'}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5, maxHeight: '80px', overflowY: 'auto' }}>
                              {post.content}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                              <span>By: <strong style={{ color: '#94a3b8' }}>{post.author_name || 'Marketing Team'}</strong></span>
                              <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. COUNSELING DEPARTMENT VIEW */}
                {selectedDeptDrill === 'counseling' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Video size={16} color="#34d399" />
                        Scheduled Advisory & Counseling Sessions ({safeSessions.length})
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Live student meetings and counseling video conferences.
                      </span>
                    </div>

                    {safeSessions.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        No counseling sessions currently scheduled.
                      </div>
                    ) : (
                      <div className="custom-table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Student Candidate</th>
                              <th>Scheduled Time</th>
                              <th>Meeting Link</th>
                              <th>Session Notes</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {safeSessions.map(s => (
                              <tr key={s.id}>
                                <td style={{ fontWeight: 600, color: '#fff' }}>
                                  {s.student_name || 'Student Candidate'}
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    Counselor: {s.counselor_name || 'Assigned Staff'}
                                  </div>
                                </td>
                                <td style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                                  {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                </td>
                                <td>
                                  {s.google_meet_link ? (
                                    <a
                                      href={s.google_meet_link.startsWith('http') ? s.google_meet_link : `https://${s.google_meet_link}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#38bdf8', fontSize: '0.74rem', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                    >
                                      Join Video Call <ExternalLink size={11} />
                                    </a>
                                  ) : (
                                    <span style={{ color: '#64748b', fontSize: '0.74rem' }}>In-Person</span>
                                  )}
                                </td>
                                <td style={{ fontSize: '0.74rem', color: '#94a3b8', maxWidth: '240px' }}>
                                  {s.session_notes || 'Routine academic counseling'}
                                </td>
                                <td>
                                  <span className={`badge ${s.status === 'completed' ? 'badge-documents_verified' : 'badge-under_review'}`}>
                                    {s.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. ADMISSIONS DEPARTMENT VIEW */}
                {selectedDeptDrill === 'admissions' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <GraduationCap size={16} color="#60a5fa" />
                        Admissions Applications & Dossier Queue ({admissionsApps.length})
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Active student candidate applications undergoing admissions review.
                      </span>
                    </div>

                    <div className="custom-table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Student & App #</th>
                            <th>Target Course</th>
                            <th>Missing Docs</th>
                            <th>Status</th>
                            <th>Admissions Notes</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admissionsApps.slice(0, 10).map(app => (
                            <tr key={app.id}>
                              <td>
                                <strong style={{ color: '#fff', display: 'block', fontSize: '0.84rem' }}>{app.student_name}</strong>
                                <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{app.application_number} • {app.student_country || 'Global'}</span>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                                {app.degree_program || 'Degree Program'}
                                <div style={{ fontSize: '0.7rem', color: '#06b6d4' }}>{app.target_university || 'Partner University'}</div>
                              </td>
                              <td>
                                {app.missing_documents_count > 0 ? (
                                  <span className="badge badge-documents_missing">{app.missing_documents_count} missing</span>
                                ) : (
                                  <span className="badge badge-documents_verified">Complete</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge badge-${app.status}`}>
                                  {app.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.74rem', color: '#94a3b8', maxWidth: '200px' }}>
                                {app.admissions_notes || 'Pending review note'}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedApplication(app)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                                >
                                  <Eye size={12} /> Dossier
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. FINANCE DEPARTMENT VIEW */}
                {selectedDeptDrill === 'finance' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={16} color="#fbbf24" />
                        Financial Disbursements & Fee Collections Register ({safeFinances.length})
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Registration fees, tuition collections, and commission records.
                      </span>
                    </div>

                    <div className="custom-table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Student & App #</th>
                            <th>Payment Type</th>
                            <th>Amount (USD)</th>
                            <th>Payment Ref</th>
                            <th>Approval Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {safeFinances.map(f => (
                            <tr key={f.id}>
                              <td style={{ fontWeight: 600, color: '#fff' }}>
                                {f.student_name}
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{f.application_number}</div>
                              </td>
                              <td style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'capitalize' }}>
                                {(f.record_type || 'registration_fee').replace(/_/g, ' ')}
                              </td>
                              <td style={{ fontWeight: 700, color: '#10b981', fontSize: '0.86rem' }}>
                                ${Number(f.amount).toFixed(2)}
                              </td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#94a3b8' }}>
                                {f.payment_reference || 'REF-N/A'}
                              </td>
                              <td>
                                <span className={`badge ${f.status === 'approved' ? 'badge-documents_verified' : 'badge-under_review'}`}>
                                  {f.status.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                                {f.created_at ? new Date(f.created_at).toLocaleDateString() : 'Recent'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. DATA APPLICATIONS VIEW */}
                {selectedDeptDrill === 'data_applications' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileCheck size={16} color="#a78bfa" />
                        Data & Ingestion Verification Pipeline ({applications.length})
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Document upload verification and missing document audits.
                      </span>
                    </div>

                    <div className="custom-table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Student & App #</th>
                            <th>Territory Country</th>
                            <th>Documents Ingested</th>
                            <th>Missing Docs Alert</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.slice(0, 10).map(app => (
                            <tr key={app.id}>
                              <td style={{ fontWeight: 600, color: '#fff' }}>
                                {app.student_name}
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{app.application_number}</div>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                                🌍 {app.student_country || 'Global'}
                              </td>
                              <td style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                                {documents.filter(d => d.application_id === app.id).length} Files Attached
                              </td>
                              <td>
                                {app.missing_documents_count > 0 ? (
                                  <span className="badge badge-documents_missing">{app.missing_documents_count} Missing</span>
                                ) : (
                                  <span className="badge badge-documents_verified">All Verified</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge badge-${app.status}`}>
                                  {app.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. COUNTRY DIRECTORS VIEW */}
                {selectedDeptDrill === 'country_directors' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={16} color="#38bdf8" />
                        Regional Country Directors & Territories ({countryDirectorStaff.length})
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Regional representatives and local territory reporting hubs.
                      </span>
                    </div>

                    <div className="custom-table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Director Representative</th>
                            <th>Assigned Country</th>
                            <th>Email Contact</th>
                            <th>Territory Applications</th>
                            <th>Employment Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {countryDirectorStaff.map(dir => {
                            const territoryApps = applications.filter(a => a.student_country?.toLowerCase() === dir.working_country?.toLowerCase());

                            return (
                              <tr key={dir.id}>
                                <td style={{ fontWeight: 600, color: '#fff' }}>
                                  {dir.full_name}
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{dir.job_title}</div>
                                </td>
                                <td>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)', fontWeight: 700 }}>
                                    🌍 {dir.working_country || 'Global'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{dir.email}</td>
                                <td style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                                  {territoryApps.length} Candidates
                                </td>
                                <td>
                                  <span className={`badge ${dir.employment_status === 'active' ? 'badge-documents_verified' : 'badge-rejected'}`}>
                                    {dir.employment_status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 7. HUMAN RESOURCES VIEW */}
                {selectedDeptDrill === 'human_resources' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users2 size={16} color="#ec4899" />
                        HR Leave Requests & Staff Oversight ({hrLeaveRequests.length})
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Employee time-off requests and human resources operations.
                      </span>
                    </div>

                    {hrLeaveRequests.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        No pending staff leave requests.
                      </div>
                    ) : (
                      <div className="custom-table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Staff Member</th>
                              <th>Leave Type</th>
                              <th>Duration</th>
                              <th>Reason / Notes</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hrLeaveRequests.map(l => (
                              <tr key={l.id}>
                                <td style={{ fontWeight: 600, color: '#fff' }}>{l.employee_name}</td>
                                <td style={{ fontSize: '0.76rem', color: '#cbd5e1', textTransform: 'capitalize' }}>{l.leave_type}</td>
                                <td style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{l.start_date} to {l.end_date}</td>
                                <td style={{ fontSize: '0.74rem', color: '#94a3b8', maxWidth: '200px' }}>{l.reason}</td>
                                <td>
                                  <span className={`badge ${l.status === 'approved' ? 'badge-documents_verified' : l.status === 'denied' ? 'badge-rejected' : 'badge-under_review'}`}>
                                    {l.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 8. INSTITUTIONAL RELATIONS & OTHER DEPARTMENTS */}
                {['institutional_relations', 'operations', 'management', 'admin'].includes(selectedDeptDrill) && (
                  <div>
                    <h4 style={{ margin: '0 0 14px 0', fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={16} color="#2dd4bf" />
                      Partner Universities & Institutional Catalog ({partnerUniversities.length})
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {partnerUniversities.map(p => (
                        <div key={p.id} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <h5 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>{p.name}</h5>
                          <span style={{ fontSize: '0.72rem', color: '#06b6d4', display: 'block', margin: '2px 0 8px 0' }}>{p.country} • {p.contact_email}</span>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            Courses Offered: <strong style={{ color: '#fff' }}>{universityCourses.filter(c => c.university_id === p.id).length}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Sub-Tab 2: Dispatched Work Assignments */}
            {deptDrillSubTab === 'tasks' && (
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClipboardList size={16} color="#3b82f6" />
                    Work Directives Dispatched to {departmentLabel(selectedDeptDrill)} ({deptTasks.length})
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Tasks assigned by Operations or Admin to this department team.
                  </span>
                </div>

                {deptTasks.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    No work assignments currently dispatched to this department.
                  </div>
                ) : (
                  <div className="custom-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Task Title & Scope</th>
                          <th>Priority</th>
                          <th>Due Date</th>
                          <th>Dispatched By</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptTasks.map(t => (
                          <tr key={t.id}>
                            <td>
                              <strong style={{ color: '#fff', display: 'block', fontSize: '0.84rem' }}>{t.title}</strong>
                              <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{t.description}</span>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.66rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: t.priority === 'urgent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: t.priority === 'urgent' ? '#f87171' : '#60a5fa',
                                fontWeight: 700,
                                textTransform: 'uppercase'
                              }}>
                                {t.priority}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                              {t.due_date || 'Ongoing'}
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                              {t.creator_name || 'Operations'}
                            </td>
                            <td>
                              <span className={`badge ${t.status === 'completed' ? 'badge-documents_verified' : t.status === 'in_progress' ? 'badge-under_review' : 'badge-documents_missing'}`}>
                                {t.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <select
                                value={t.status}
                                onChange={async (e) => {
                                  try {
                                    await updateWorkAssignmentStatus(t.id, e.target.value as any);
                                  } catch (err) {
                                    alert('Failed to update task status.');
                                  }
                                }}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: 'rgba(255,255,255,0.05)',
                                  color: '#fff',
                                  border: '1px solid var(--border-color)',
                                  fontSize: '0.72rem'
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 3: Assigned Staff Directory */}
            {deptDrillSubTab === 'staff' && (
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users2 size={16} color="#a855f7" />
                    Team Members Deployed in {departmentLabel(selectedDeptDrill)} ({currentDeptStaff.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => openAddDepartmentMember(selectedDeptDrill)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <UserPlus size={13} /> Add Member to {departmentLabel(selectedDeptDrill)}
                  </button>
                </div>

                {currentDeptStaff.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    No staff members currently assigned to {departmentLabel(selectedDeptDrill)}.
                  </div>
                ) : (
                  <div className="custom-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Staff Member</th>
                          <th>Role Title</th>
                          <th>Assigned Country</th>
                          <th>Responsibility</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDeptStaff.map(member => {
                          const memberProfile = (availableProfiles || []).find(
                            p => p.email?.toLowerCase() === member.email?.toLowerCase()
                          );

                          return (
                            <tr key={member.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <ProfileAvatar
                                    avatarUrl={memberProfile?.avatar_url}
                                    name={member.full_name}
                                    size={32}
                                    editable={false}
                                  />
                                  <div>
                                    <strong style={{ color: '#fff', display: 'block', fontSize: '0.84rem' }}>{member.full_name}</strong>
                                    <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{member.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{member.job_title}</td>
                              <td>
                                {member.working_country ? (
                                  <span style={{ fontSize: '0.74rem', color: '#38bdf8' }}>🌍 {member.working_country}</span>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Global</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${member.is_assistant ? 'badge-submitted' : 'badge-draft'}`}>
                                  {member.is_assistant ? 'Assistant' : 'Senior Lead'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${member.employment_status === 'active' ? 'badge-documents_verified' : 'badge-rejected'}`}>
                                  {member.employment_status.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStaffDossier(member)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                                  >
                                    <Eye size={12} /> Dossier
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditDepartmentMember(member)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.72rem', padding: '4px 8px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                                  >
                                    <Pencil size={12} /> Edit
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
            )}

            {/* Sub-Tab 4: Formal Executive Reports */}
            {deptDrillSubTab === 'formal_reports' && (
              <div className="glass-panel" style={{ padding: '20px' }}>
                <AdminDepartmentReports
                  department={selectedDeptDrill}
                  reports={deptReports}
                  staffCount={currentDeptStaff.length}
                  onOpenFile={getDepartmentReportDownloadUrl}
                  onReview={reviewDepartmentReport}
                />
              </div>
            )}

          </div>
        );
      })()}

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

                  {/* Course & Scholarship Management Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartnerForCourses(p);
                        setCourseName('');
                        setAdmissionFee('150.00');
                        setTuitionFee('3000.00');
                        setCourseError('');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.74rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <BookOpen style={{ width: '13px', height: '13px', marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                      Courses ({universityCourses.filter(c => c.university_id === p.id).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartnerForScholarships(p);
                        setScholarshipName('');
                        setScholarshipDesc('');
                        setScholarshipCoverage('1000.00');
                        setScholarshipPercent('50');
                        setScholarshipCriteria('');
                        setScholarshipError('');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.74rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <Award style={{ width: '13px', height: '13px', marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                      Scholarships ({scholarships.filter(s => s.university_id === p.id).length})
                    </button>
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

      {/* Tab 4: Staff Accounts & Department Members Overview */}
      {activeTab === 'staff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Header & Quick Action Banner */}
          <div className="glass-panel" style={{ padding: '22px 24px' }}>
            <div className="admin-team-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                    <Users2 size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                      Department Members & Staff Oversight Platform
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                      Comprehensive roster of all department teams, regional country directors, assigned permissions, and portal accounts.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowRbacMatrixModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.4)' }}
                >
                  <ShieldCheck size={15} />
                  RBAC Permissions Matrix
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openAddDepartmentMember()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none' }}
                >
                  <UserPlus size={15} />
                  Add Department Member
                </button>
              </div>
            </div>

            {/* Interactive Stats Grid */}
            <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginTop: '18px' }}>
              <div
                onClick={() => { setStaffTabSection('roster'); setStaffDepartmentFilter('all'); setStaffStatusFilter('all'); }}
                style={{ padding: '13px', border: '1px solid #dbe5f3', borderRadius: '11px', background: staffTabSection === 'roster' && staffDepartmentFilter === 'all' ? 'rgba(59, 130, 246, 0.15)' : '#f8fbff', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <span style={{ display: 'block', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>Total Department Members</span>
                <strong style={{ display: 'block', marginTop: '3px', color: '#163d8f', fontSize: '22px' }}>{(departmentMembers || []).length}</strong>
                <span style={{ fontSize: '0.68rem', color: '#2563eb' }}>Click to view department roster</span>
              </div>
              <div
                onClick={() => { setStaffTabSection('table'); setStaffStatusFilter('active'); }}
                style={{ padding: '13px', border: '1px solid #bbf7d0', borderRadius: '11px', background: staffStatusFilter === 'active' && staffTabSection === 'table' ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <span style={{ display: 'block', color: '#166534', fontSize: '12px', fontWeight: 700 }}>Active Staff Members</span>
                <strong style={{ display: 'block', marginTop: '3px', color: '#15803d', fontSize: '22px' }}>{(departmentMembers || []).filter((m) => m?.employment_status === 'active').length}</strong>
                <span style={{ fontSize: '0.68rem', color: '#16a34a' }}>With active login permissions</span>
              </div>
              <div
                onClick={() => { setStaffTabSection('roster'); setStaffDepartmentFilter('country_directors'); }}
                style={{ padding: '13px', border: '1px solid #bae6fd', borderRadius: '11px', background: staffDepartmentFilter === 'country_directors' ? 'rgba(14, 165, 233, 0.15)' : '#f0f9ff', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <span style={{ display: 'block', color: '#0369a1', fontSize: '12px', fontWeight: 700 }}>Country Directors</span>
                <strong style={{ display: 'block', marginTop: '3px', color: '#0284c7', fontSize: '22px' }}>
                  {(departmentMembers || []).filter(m => hasDepartment(m, 'country_directors')).length}
                </strong>
                <span style={{ fontSize: '0.68rem', color: '#0284c7' }}>Regional branch heads</span>
              </div>
              <div
                onClick={() => setStaffTabSection('accounts')}
                style={{ padding: '13px', border: '1px solid #e9d5ff', borderRadius: '11px', background: staffTabSection === 'accounts' ? 'rgba(168, 85, 247, 0.15)' : '#faf5ff', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <span style={{ display: 'block', color: '#7e22ce', fontSize: '12px', fontWeight: 700 }}>Registered User Logins</span>
                <strong style={{ display: 'block', marginTop: '3px', color: '#9333ea', fontSize: '22px' }}>{(availableProfiles || []).length}</strong>
                <span style={{ fontSize: '0.68rem', color: '#a855f7' }}>Manage system auth accounts</span>
              </div>
            </div>

            {/* View Mode Toggle Bar */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStaffTabSection('roster')}
                className={`btn btn-sm ${staffTabSection === 'roster' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <Building2 size={15} /> 🏢 All Departments Roster
              </button>
              <button
                type="button"
                onClick={() => setStaffTabSection('table')}
                className={`btn btn-sm ${staffTabSection === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <ClipboardList size={15} /> 📋 Searchable Staff Table & Filter Matrix
              </button>
              <button
                type="button"
                onClick={() => setStaffTabSection('accounts')}
                className={`btn btn-sm ${staffTabSection === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <Users size={15} /> 👤 Registered System Logins ({(availableProfiles || []).length})
              </button>
            </div>

            {departmentMemberNotice && (
              <div className="department-member-form-success" role="status" style={{ marginTop: '14px' }}>
                {departmentMemberNotice}
              </div>
            )}
          </div>

          {/* Section 1: Department-by-Department Roster Cards */}
          {staffTabSection === 'roster' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={18} color="#3b82f6" /> Department Teams & Deployed Members
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Review all departments across Globe Scholars, view who is actively stationed in each branch, and add new members.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddDepartmentMember()}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                >
                  <UserPlus size={14} /> Add Team Member
                </button>
              </div>

              {/* Department Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                {DEPARTMENT_OPTIONS.map((dept) => {
                  const deptStaff = (departmentMembers || []).filter(m => hasDepartment(m, dept.value));
                  const isCountryDirectors = dept.value === 'country_directors';

                  // Department color accents
                  const deptThemeMap: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
                    admissions: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)', icon: <GraduationCap size={18} color="#3b82f6" /> },
                    marketing: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', icon: <TrendingUp size={18} color="#f59e0b" /> },
                    counseling: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', icon: <Briefcase size={18} color="#10b981" /> },
                    finance: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', icon: <DollarSign size={18} color="#10b981" /> },
                    operations: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.25)', icon: <Layers size={18} color="#8b5cf6" /> },
                    country_directors: { color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.25)', icon: <Globe size={18} color="#0ea5e9" /> },
                    human_resources: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)', icon: <Users size={18} color="#ec4899" /> },
                    data_applications: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.25)', icon: <FileCheck size={18} color="#6366f1" /> },
                    management: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)', icon: <BriefcaseBusiness size={18} color="#f97316" /> },
                    institutional_relations: { color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.25)', icon: <Building2 size={18} color="#14b8a6" /> },
                    admin: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', icon: <ShieldCheck size={18} color="#ef4444" /> },
                  };
                  const deptTheme = deptThemeMap[dept.value] || { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)', icon: <Building2 size={18} color="#3b82f6" /> };

                  return (
                    <div
                      key={dept.value}
                      className="glass-panel"
                      style={{
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: `1px solid ${deptTheme.border}`,
                        background: 'rgba(15, 23, 42, 0.65)',
                        borderRadius: '14px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                    >
                      <div>
                        {/* Department Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: deptTheme.bg, border: `1px solid ${deptTheme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {deptTheme.icon}
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                                {dept.label}
                              </h4>
                              <span style={{ fontSize: '0.72rem', color: deptTheme.color, fontWeight: 600 }}>
                                {deptStaff.length} Deployed Member{deptStaff.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openAddDepartmentMember(dept.value)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.68rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: deptTheme.color, border: 'none' }}
                            title={`Add member to ${dept.label}`}
                          >
                            <UserPlus size={11} /> + Add
                          </button>
                        </div>

                        {/* Department Members List */}
                        {deptStaff.length === 0 ? (
                          <div style={{ padding: '20px 14px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.08)', marginBottom: '14px' }}>
                            <UserRoundCheck size={24} color="#64748b" style={{ marginBottom: '6px' }} />
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>No staff members deployed yet in {dept.label}.</p>
                            <button
                              type="button"
                              onClick={() => openAddDepartmentMember(dept.value)}
                              className="btn btn-secondary btn-sm"
                              style={{ marginTop: '8px', fontSize: '0.72rem', padding: '3px 10px' }}
                            >
                              <UserPlus size={11} /> Onboard First Member
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                            {deptStaff.map((member) => {
                              const memberProfile = (availableProfiles || []).find(
                                p => p?.email?.toLowerCase() === member?.email?.toLowerCase()
                              );
                              const isPrimary = member.primary_department === dept.value;

                              return (
                                <div
                                  key={member.id}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '10px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <ProfileAvatar
                                      avatarUrl={memberProfile?.avatar_url}
                                      name={member.full_name || 'Staff'}
                                      size={32}
                                      editable={false}
                                    />
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <strong style={{ color: '#fff', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {member.full_name || 'Unnamed Staff'}
                                        </strong>
                                        {isPrimary && (
                                          <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontWeight: 600 }}>
                                            Primary
                                          </span>
                                        )}
                                      </div>
                                      <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>
                                        {member.job_title || 'Assigned Officer'}
                                      </span>
                                      {(member.working_country || isCountryDirectors) && (
                                        <span style={{ color: '#38bdf8', fontSize: '0.68rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                          🌍 {member.working_country || 'Global'}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick Member Actions */}
                                  <div style={{ display: 'inline-flex', gap: '4px', flexShrink: 0 }}>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedStaffDossier(member)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.68rem', padding: '3px 6px' }}
                                      title="Inspect Dossier"
                                    >
                                      <Eye size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEditDepartmentMember(member)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.68rem', padding: '3px 6px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                                      title="Edit Member"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Zoom into Department */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Status: <span style={{ color: '#34d399', fontWeight: 600 }}>Active</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeptDrill(dept.value);
                            setActiveTab('drilldown');
                            setDeptDrillSubTab('live_work');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '3px 10px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                        >
                          Open {dept.label} Queue →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Searchable Staff Table & Filter Matrix */}
          {staffTabSection === 'table' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Interactive Staff Search & Filter Control Bar */}
              <div className="glass-panel" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  
                  {/* Department Filter Pills */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Filter size={13} /> Dept:
                    </span>
                    <button
                      type="button"
                      onClick={() => setStaffDepartmentFilter('all')}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: staffDepartmentFilter === 'all' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                        background: staffDepartmentFilter === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                        color: staffDepartmentFilter === 'all' ? '#93c5fd' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      All Staff ({(departmentMembers || []).length})
                    </button>

                    {DEPARTMENT_OPTIONS.map(opt => {
                      const count = (departmentMembers || []).filter(m => hasDepartment(m, opt.value)).length;
                      const isSelected = staffDepartmentFilter === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStaffDepartmentFilter(opt.value)}
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: isSelected ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                            background: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                            color: isSelected ? '#d8b4fe' : '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {opt.label} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Status Filter */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={staffStatusFilter}
                      onChange={e => setStaffStatusFilter(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#1e293b',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.75rem',
                        outline: 'none'
                      }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="pending_activation">Pending Activation</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Live Search Input */}
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={staffSearchTerm}
                    onChange={e => setStaffSearchTerm(e.target.value)}
                    placeholder="Search staff by full name, email, job title, or country of assignment..."
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Interactive Staff Directory Table */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BriefcaseBusiness size={18} color="#2563eb" />
                    <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#fff' }}>Staff Roles, Department Coverage & Country Oversight</h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Showing {(departmentMembers || []).filter(member => {
                      const matchDept = staffDepartmentFilter === 'all' || hasDepartment(member, staffDepartmentFilter as DepartmentType);
                      const matchStatus = staffStatusFilter === 'all' || member?.employment_status === staffStatusFilter;
                      const matchSearch = staffSearchTerm === '' ||
                        (member?.full_name || '').toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                        (member?.email || '').toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                        (member?.job_title || '').toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                        (member?.working_country && member.working_country.toLowerCase().includes(staffSearchTerm.toLowerCase()));
                      return matchDept && matchStatus && matchSearch;
                    }).length} staff member(s)
                  </span>
                </div>

                {(departmentMembers || []).length === 0 ? (
                  <div style={{ padding: '34px 20px', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc', textAlign: 'center' }}>
                    <UserRoundCheck size={30} color="#94a3b8" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, color: '#475569', fontWeight: 700 }}>Your staff directory is ready.</p>
                    <p style={{ margin: '5px 0 14px', color: '#64748b', fontSize: '13px' }}>Add the first team member to record their department assignments and role.</p>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => openAddDepartmentMember()}><UserPlus size={14} /> Add team member</button>
                  </div>
                ) : (
                  <div className="custom-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Team Member</th>
                          <th>Primary Dept</th>
                          <th>Additional Coverage</th>
                          <th>Job Title</th>
                          <th>Assigned Country</th>
                          <th>Responsibility</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Interactive Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(departmentMembers || [])
                          .filter(member => {
                            const matchDept = staffDepartmentFilter === 'all' || hasDepartment(member, staffDepartmentFilter as DepartmentType);
                            const matchStatus = staffStatusFilter === 'all' || member?.employment_status === staffStatusFilter;
                            const matchSearch = staffSearchTerm === '' ||
                              (member?.full_name || '').toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                              (member?.email || '').toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                              (member?.job_title || '').toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                              (member?.working_country && member.working_country.toLowerCase().includes(staffSearchTerm.toLowerCase()));
                            return matchDept && matchStatus && matchSearch;
                          })
                          .map((member) => {
                            const memberDepts = getMemberDepartments(member);
                            const additionalDepartments = memberDepts.filter(
                              (department) => department !== member.primary_department
                            );
                            const isCountryDirector = member.primary_department === 'country_directors';
                            const status = member?.employment_status === 'active'
                              ? { label: 'Active', className: 'badge-documents_verified' }
                              : member?.employment_status === 'inactive'
                                ? { label: 'Inactive', className: 'badge-rejected' }
                                : { label: 'Pending activation', className: 'badge-documents_missing' };

                            const memberProfile = (availableProfiles || []).find(
                              p => p?.email?.toLowerCase() === member?.email?.toLowerCase()
                            );

                            return (
                              <tr key={member.id} style={{ transition: 'background 0.15s' }}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ProfileAvatar
                                      avatarUrl={memberProfile?.avatar_url}
                                      name={member.full_name || 'Staff'}
                                      size={34}
                                      editable={false}
                                    />
                                    <div>
                                      <strong style={{ display: 'block', color: '#fff', fontSize: '0.86rem' }}>
                                        {member.full_name || 'Unnamed Staff'}
                                      </strong>
                                      <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{member.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge badge-under_review" style={{ fontWeight: 600 }}>
                                    {departmentLabel(member.primary_department)}
                                  </span>
                                </td>
                                <td style={{ maxWidth: '205px' }}>
                                  {additionalDepartments.length ? (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                      {additionalDepartments.map(d => (
                                        <span key={d} style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                                          {departmentLabel(d)}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Primary only</span>
                                  )}
                                </td>
                                <td style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.8rem' }}>
                                  {member.job_title}
                                </td>
                                <td>
                                  {member.working_country ? (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontSize: '0.76rem',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      background: isCountryDirector ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.05)',
                                      color: isCountryDirector ? '#38bdf8' : '#cbd5e1',
                                      border: isCountryDirector ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                                      fontWeight: isCountryDirector ? 700 : 500
                                    }}>
                                      🌍 {member.working_country}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#64748b', fontSize: '0.74rem' }}>—</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge ${member.is_assistant ? 'badge-submitted' : 'badge-draft'}`}>
                                    {member.is_assistant ? 'Assistant' : 'Senior'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className={`badge ${status.className}`}>{status.label}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStaffStatus(member)}
                                      disabled={togglingStaffId === member.id}
                                      title={`Click to mark as ${member.employment_status === 'active' ? 'Inactive' : 'Active'}`}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: member.employment_status === 'active' ? '#34d399' : '#f87171',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        display: 'inline-flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      {member.employment_status === 'active' ? <UserCheck size={14} /> : <UserX size={14} />}
                                    </button>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                                      onClick={() => {
                                        setSelectedDeptDrill(member.primary_department);
                                        setActiveTab('drilldown');
                                        setDeptDrillSubTab('live_work');
                                      }}
                                      title={`Zoom into ${departmentLabel(member.primary_department)} department live work`}
                                    >
                                      <Layers size={13} /> Zoom Dept
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => setSelectedStaffDossier(member)}
                                      title="Inspect full RBAC dossier"
                                    >
                                      <Eye size={13} /> Dossier
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => openEditDepartmentMember(member)}
                                      title="Edit member role & country"
                                    >
                                      <Pencil size={13} /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm"
                                      style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                      onClick={() => {
                                        setDepartmentMemberPendingDelete(member);
                                        setDepartmentMemberDeleteError('');
                                      }}
                                      title="Revoke department access"
                                    >
                                      <Trash2 size={13} /> Revoke
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

          {/* Section 3: Registered User Accounts Panel */}
          {staffTabSection === 'accounts' && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#2563eb" />
                  <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#fff' }}>Registered User Profiles & Portal Login Credentials</h3>
                </div>
                <span className="badge badge-submitted">{(availableProfiles || []).length} Total Registered Accounts</span>
              </div>

              <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: '#94a3b8' }}>
                Below is the comprehensive list of all registered profile accounts in Globe Scholars Pathways. Administrators can inspect authentication roles and revoke login credentials at any time.
              </p>

              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>User Profile</th>
                      <th>Department Assignment</th>
                      <th>Account Type</th>
                      <th>Administrative Privileges</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(availableProfiles || []).map((p) => {
                      const isSelf = p?.id === currentProfile?.id;
                      const userInitial = (p?.full_name || 'U').slice(0, 1).toUpperCase();
                      const deptName = (p?.department || 'Unassigned').replace(/_/g, ' ');

                      return (
                        <tr key={p?.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: p?.is_admin ? '#dc2626' : p?.account_type === 'staff' ? '#2563eb' : '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                                {userInitial}
                              </div>
                              <div>
                                <strong style={{ display: 'block', color: '#fff', fontSize: '0.84rem' }}>{p?.full_name || 'Unnamed User'}</strong>
                                <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{p?.email || '—'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-under_review" style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>
                              {deptName}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${p?.account_type === 'staff' ? 'badge-submitted' : p?.account_type === 'student' ? 'badge-documents_verified' : 'badge-draft'}`} style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>
                              {p?.account_type || 'unassigned'}
                            </span>
                          </td>
                          <td>
                            {p?.is_admin ? (
                              <span className="badge badge-approved" style={{ fontWeight: 700, fontSize: '0.7rem' }}>Super Administrator</span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Standard Member</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={isSelf}
                              style={{
                                fontSize: '0.72rem',
                                padding: '4px 10px',
                                background: isSelf ? 'rgba(255,255,255,0.03)' : 'rgba(239, 68, 68, 0.12)',
                                borderColor: isSelf ? 'transparent' : 'rgba(239, 68, 68, 0.3)',
                                color: isSelf ? '#64748b' : '#f87171',
                                cursor: isSelf ? 'not-allowed' : 'pointer'
                              }}
                              onClick={async () => {
                                if (confirm(`Are you absolutely sure you want to permanently delete the account for ${p?.full_name || 'this user'} (${p?.email || ''})? This action is irreversible.`)) {
                                  try {
                                    await deleteUserProfileAccount(p.id);
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : 'Failed to delete user account.');
                                  }
                                }
                              }}
                            >
                              <Trash2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                              Delete Account
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Interactive Staff RBAC Dossier */}
      {selectedStaffDossier && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {(() => {
                  const dossierProfile = (availableProfiles || []).find(
                    p => p.email?.toLowerCase() === selectedStaffDossier.email?.toLowerCase()
                  );
                  return (
                    <ProfileAvatar
                      avatarUrl={dossierProfile?.avatar_url}
                      name={selectedStaffDossier.full_name}
                      size={48}
                      editable={false}
                    />
                  );
                })()}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                    {selectedStaffDossier.full_name}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {selectedStaffDossier.email} • {selectedStaffDossier.job_title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffDossier(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Profile Meta Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Primary Department</span>
                  <strong style={{ fontSize: '0.86rem', color: '#60a5fa' }}>{departmentLabel(selectedStaffDossier.primary_department)}</strong>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Assigned Country</span>
                  <strong style={{ fontSize: '0.86rem', color: '#38bdf8' }}>{selectedStaffDossier.working_country ? `🌍 ${selectedStaffDossier.working_country}` : 'Global / Not Specified'}</strong>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Responsibility Level</span>
                  <strong style={{ fontSize: '0.86rem', color: selectedStaffDossier.is_assistant ? '#fbbf24' : '#34d399' }}>
                    {selectedStaffDossier.is_assistant ? 'Assistant Staff' : 'Senior Staff Owner'}
                  </strong>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Employment Status</span>
                  <strong style={{ fontSize: '0.86rem', color: selectedStaffDossier.employment_status === 'active' ? '#34d399' : '#f87171', textTransform: 'capitalize' }}>
                    {selectedStaffDossier.employment_status.replace('_', ' ')}
                  </strong>
                </div>
              </div>

              {/* Accessible Workspaces & Tools */}
              <div>
                <h4 style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={15} color="#3b82f6" /> Accessible Department Workspaces
                </h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {getMemberDepartments(selectedStaffDossier).map(dept => (
                    <span
                      key={dept}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: dept === selectedStaffDossier.primary_department ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: dept === selectedStaffDossier.primary_department ? '#93c5fd' : '#cbd5e1',
                        border: dept === selectedStaffDossier.primary_department ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.74rem',
                        fontWeight: 600
                      }}
                    >
                      {departmentLabel(dept)} {dept === selectedStaffDossier.primary_department ? '★ Primary' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons inside Dossier */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedStaffDossier(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close Dossier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedStaffDossier) return;
                    const targetDept = selectedStaffDossier.primary_department;
                    setSelectedStaffDossier(null);
                    setSelectedDeptDrill(targetDept);
                    setActiveTab('drilldown');
                    setDeptDrillSubTab('live_work');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                >
                  <Layers size={14} /> Zoom into {departmentLabel(selectedStaffDossier.primary_department)} Work
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const member = selectedStaffDossier;
                    setSelectedStaffDossier(null);
                    openEditDepartmentMember(member);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Pencil size={14} /> Edit Role & Country
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: RBAC Permissions Matrix Overview */}
      {showRbacMatrixModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                    Role-Based Access Control (RBAC) Matrix
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Department workspaces and permission coverage across Globe Scholars Pathways.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRbacMatrixModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { dept: 'Admissions', icon: '🎓', tools: 'Application Review, Formal Offer Decisions, Document Audits, Fee Catalog, Task Inbox' },
                { dept: 'Counseling', icon: '💬', tools: 'Student Intake Register, Google Meet & Zoom Scheduling, Scholarship Advisory, Fee Catalog' },
                { dept: 'Marketing', icon: '📢', tools: 'Social Media Hub (FB, WhatsApp, IG, TikTok), Broadcast Bulletins, Lead Capture, Fee Catalog' },
                { dept: 'Human Resources', icon: '👥', tools: 'Staff Directory, Staff CV Library (PDF Preview & Storage), Performance Records, Recycle Bin' },
                { dept: 'Finance', icon: '💰', tools: 'Registration Fees, Scholarship Disbursements, Payment Receipts, Account Ledger, Recycle Bin' },
                { dept: 'Country Directors', icon: '🌍', tools: 'Regional Student Intake, Country Workspace, Country-Specific Operations' },
                { dept: 'Operations & Management', icon: '⚙️', tools: 'Department KPIs, Cross-Department Work Assignments, Monthly Meetings, Reports' },
                { dept: 'Administration', icon: '🛡️', tools: 'Full Superuser Oversight, Staff Directory & RBAC, Partner Universities, Global Bulletins' },
              ].map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{row.icon}</span>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>{row.dept}</strong>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{row.tools}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Authorized
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={() => setShowRbacMatrixModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Close Matrix
              </button>
            </div>
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

      {activeTab === 'student_documents' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText style={{ color: '#3366FF' }} /> Student Documents Management & Verification (Admin Control)
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                Audit, flag, and verify student-uploaded documents. If any required file is missing or contains errors, flag the document and dispatch email instructions to the student.
              </p>
            </div>
          </div>

          {applications.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
              No student files are currently available.
            </p>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Email</th>
                    <th>Student Name</th>
                    <th>Target University</th>
                    <th>Course Choice</th>
                    <th>Missing Count</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => {
                    const studentDocs = documents.filter(d => d.application_id === app.id);
                    const missingDocs = studentDocs.filter(d => d.is_missing);
                    return (
                      <tr key={app.id}>
                        <td style={{ fontWeight: 600 }}>{app.student_email}</td>
                        <td>{app.student_name}</td>
                        <td>{app.target_university}</td>
                        <td>{app.degree_program}</td>
                        <td>
                          <span className={`badge badge-${missingDocs.length > 0 ? 'inactive' : 'active'}`}>
                            {missingDocs.length} Flagged Missing
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReviewApp(app);
                              setRevisionSubject(`Action Required: Document Review for Application ${app.application_number}`);
                              setRevisionBody(`Dear ${app.student_name},\n\nWe have reviewed the documents uploaded for your application (${app.application_number}) and noticed some discrepancies. Please check the feedback below and upload correct versions in your student portal:\n\n- [Specify details of incorrect or missing documents]\n\nBest regards,\nGlobe Scholars Executive Administration`);
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            <Eye size={12} style={{ marginRight: '4px' }} /> Review Files
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Review Student Documents (Admin) */}
      {selectedReviewApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '600px', padding: '24px', background: '#0f172a', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.02rem', color: '#fff', fontWeight: 700 }}>
                Review Documents: {selectedReviewApp.student_name} ({selectedReviewApp.application_number})
              </h3>
              <button type="button" onClick={() => setSelectedReviewApp(null)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Documents List */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>Uploaded Files</h4>
                {(() => {
                  const appDocs = documents.filter(d => d.application_id === selectedReviewApp.id);
                  if (appDocs.length === 0) {
                    return (
                      <p style={{ fontSize: '0.78rem', color: '#f43f5e' }}>No documents uploaded by the student yet.</p>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {appDocs.map(doc => {
                        const { data: urlData } = supabase.storage.from('department-reports').getPublicUrl(doc.storage_path);
                        const publicUrl = urlData?.publicUrl || '';
                        const isPreviewOpen = previewDocUrl === publicUrl;
                        return (
                          <div key={doc.id} style={{ borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                            {/* Doc Header Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px' }}>
                              <div>
                                <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>{doc.document_type.replace(/_/g, ' ').toUpperCase()}</span>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>📄 {doc.file_name}</span>
                                {doc.is_missing && <span style={{ color: '#fca5a5', fontSize: '0.7rem', fontWeight: 700, display: 'block', marginTop: '4px' }}>⚠️ FLAGGED AS INCOMPLETE / MISTAKE</span>}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {/* View PDF button */}
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocUrl(isPreviewOpen ? null : publicUrl)}
                                  style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: isPreviewOpen ? '#1e293b' : '#0ea5e9', color: '#fff', fontWeight: 600 }}
                                >
                                  {isPreviewOpen ? '▲ Close' : '📄 View PDF'}
                                </button>
                                {/* Download button */}
                                {publicUrl && (
                                  <a
                                    href={publicUrl}
                                    download={doc.file_name}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '5px', background: '#059669', color: '#fff', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    ⬇ Download
                                  </a>
                                )}
                                {/* Flag button */}
                                <button
                                  type="button"
                                  onClick={() => toggleMissingDocFlag(doc.id, !doc.is_missing)}
                                  style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: doc.is_missing ? '#34d399' : '#fca5a5', fontWeight: 600 }}
                                >
                                  {doc.is_missing ? '✓ Resolve Flag' : '⚑ Flag Incomplete'}
                                </button>
                              </div>
                            </div>
                            {/* Inline PDF Viewer */}
                            {isPreviewOpen && publicUrl && (
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0f172a' }}>
                                <iframe
                                  src={publicUrl}
                                  title={doc.file_name}
                                  style={{ width: '100%', height: '520px', border: 'none', display: 'block' }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Email Notification Form */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '8px' }}>Send Direct Email Notification</h4>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!revisionBody.trim()) return;
                  setSendingRevision(true);
                  try {
                    await sendStudentEmail(
                      selectedReviewApp.student_id,
                      selectedReviewApp.student_email,
                      revisionSubject,
                      revisionBody,
                      `${currentProfile.full_name} (Admin)`
                    );
                    alert(`Email notification sent successfully to ${selectedReviewApp.student_email}!`);
                  } catch (err) {
                    alert('Failed to send email notification.');
                  } finally {
                    setSendingRevision(false);
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Subject</label>
                    <input type="text" required value={revisionSubject} onChange={e => setRevisionSubject(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Email Content</label>
                    <textarea rows={6} required value={revisionBody} onChange={e => setRevisionBody(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem', lineHeight: 1.45 }} />
                  </div>
                  <button type="submit" disabled={sendingRevision} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} />
                    {sendingRevision ? 'Sending...' : 'Send Email Notification'}
                  </button>
                </form>
              </div>
            </div>
          </div>
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

                    {(departmentMemberForm.temporary_password || '').length > 0 && (
                      <PasswordStrengthMeter password={departmentMemberForm.temporary_password || ''} />
                    )}
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
                        departments: (current.departments || []).includes(primaryDepartment) ? current.departments : [...(current.departments || []), primaryDepartment],
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

                {/* Country of Work field */}
                <div>
                  <label className="form-label" htmlFor="member-working-country">
                    {departmentMemberForm.primary_department === 'country_directors'
                      ? '🌍 Country of assignment (required for Country Directors)'
                      : '🌍 Country of work'}
                  </label>
                  <input
                    id="member-working-country"
                    className="form-input"
                    type="text"
                    value={departmentMemberForm.working_country || ''}
                    onChange={(event) => setDepartmentMemberForm((current) => ({ ...current, working_country: event.target.value }))}
                    placeholder="e.g. Ghana, Kenya, Nigeria, Liberia, Sierra Leone"
                    required={departmentMemberForm.primary_department === 'country_directors'}
                  />
                </div>

                <fieldset className="department-member-assignments">
                  <legend>Department assignments</legend>
                  <p>Choose every department this person supports. The primary department determines their principal workspace.</p>
                  <div className="department-member-checkboxes">
                    {DEPARTMENT_OPTIONS.map((department) => (
                      <label key={department.value} className="department-member-checkbox">
                        <input type="checkbox" checked={(departmentMemberForm.departments || []).includes(department.value)} onChange={() => toggleMemberDepartment(department.value)} />
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

      {/* Modal: Add Partner University & Courses Offered Builder */}
      {showAddPartnerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.08rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                    Add New Partner University & Courses Offered
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Register the university profile and define the degree programs and tuition fees it offers.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddPartnerModal(false);
                  setAddPartnerError('');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {addPartnerError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.78rem', marginBottom: '16px' }}>
                {addPartnerError}
              </div>
            )}

            <form onSubmit={handleAddPartner} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* University Basic Information */}
              <div>
                <h4 style={{ fontSize: '0.84rem', color: '#38bdf8', margin: '0 0 10px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  1. University Profile Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      University Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. University of Manchester"
                      value={pName}
                      onChange={e => setPName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. United Kingdom, Canada, USA..."
                      value={pCountry}
                      onChange={e => setPCountry(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Admissions Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. admissions@manchester.ac.uk"
                      value={pEmail}
                      onChange={e => setPEmail(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Scholarships / Waivers Available
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={pScholarships}
                      onChange={e => setPScholarships(Math.max(0, Number(e.target.value)))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Course Offerings Builder */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.84rem', color: '#34d399', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={15} color="#34d399" />
                      2. Degree Programs & Courses Offered
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Add the courses and tuition fee structures that will be visible to Marketing, Admissions, and Counseling.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPCourses(prev => [
                        ...prev,
                        { id: `c-${Date.now()}`, course_name: '', admission_fee: '150.00', tuition_fee: '3000.00' }
                      ]);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#6ee7b7',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={13} /> Add Another Course
                  </button>
                </div>

                {/* Quick Suggestion Pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', alignSelf: 'center', whiteSpace: 'nowrap' }}>Quick Add:</span>
                  {[
                    'BSc Computer Science & AI',
                    'MBA International Business',
                    'MSc Data Science',
                    'BEng Software Engineering',
                    'LLB International Law',
                    'MSc Public Health'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        // If last course is empty, fill it; otherwise append
                        setPCourses(prev => {
                          const last = prev[prev.length - 1];
                          if (last && !last.course_name.trim()) {
                            return prev.map((item, idx) => idx === prev.length - 1 ? { ...item, course_name: preset } : item);
                          }
                          return [...prev, { id: `c-${Date.now()}`, course_name: preset, admission_fee: '200.00', tuition_fee: '4500.00' }];
                        });
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Dynamic Course Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pCourses.map((c, index) => {
                    const totalFee = (Number(c.admission_fee) || 0) + (Number(c.tuition_fee) || 0);

                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          display: 'grid',
                          gridTemplateColumns: '3fr 1.5fr 1.5fr auto',
                          gap: '10px',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                            Course #{index + 1} Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. B.Sc. Computer Science"
                            value={c.course_name}
                            onChange={e => {
                              const val = e.target.value;
                              setPCourses(prev => prev.map(item => item.id === c.id ? { ...item, course_name: val } : item));
                            }}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.68rem', color: '#06b6d4', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                            Admission Fee ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={c.admission_fee}
                            onChange={e => {
                              const val = e.target.value;
                              setPCourses(prev => prev.map(item => item.id === c.id ? { ...item, admission_fee: val } : item));
                            }}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.68rem', color: '#10b981', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                            Tuition Fee ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={c.tuition_fee}
                            onChange={e => {
                              const val = e.target.value;
                              setPCourses(prev => prev.map(item => item.id === c.id ? { ...item, tuition_fee: val } : item));
                            }}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: '#38bdf8', marginBottom: '2px', whiteSpace: 'nowrap' }}>
                            Total: ${totalFee.toFixed(0)}
                          </span>
                          {pCourses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setPCourses(prev => prev.filter(item => item.id !== c.id))}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                              title="Remove course row"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPartnerModal(false);
                    setAddPartnerError('');
                  }}
                  disabled={addingPartner}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPartner}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                >
                  <Building2 size={14} />
                  {addingPartner ? 'Registering University & Courses...' : 'Register University & Courses'}
                </button>
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

              <form onSubmit={handleAdminReviewVisa} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Dossier Verdict</label>
                  <select
                    value={adminVisaStatusChoice}
                    onChange={(e) => setAdminVisaStatusChoice(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    <option value="pending">Pending Document Submission</option>
                    <option value="under_review">Mark Under Review</option>
                    <option value="approved">Approve Visa Dossier</option>
                    <option value="rejected">Request Revisions / Reject Dossier</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Feedback & Revision Instructions (Dispatched to Email)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter instructions on what changes are needed or why changes are requested..."
                    value={adminVisaInstructions}
                    onChange={(e) => setAdminVisaInstructions(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setSelectedAdminVisaApp(null)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" disabled={reviewingAdminVisa} className="btn btn-primary btn-sm">
                    {reviewingAdminVisa ? 'Saving...' : 'Save & Notify Student'}
                  </button>
                </div>
              </form>
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

      {/* Modal: Manage Courses */}
      {selectedPartnerForCourses && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '650px', padding: '24px', background: '#0e1726', border: '1px solid rgba(59, 130, 246, 0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.02rem', color: '#fff', margin: 0, fontWeight: 800 }}>Manage Courses - {selectedPartnerForCourses.name}</h3>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Define available courses and specify exact admission and tuition fees.</span>
              </div>
              <button onClick={() => setSelectedPartnerForCourses(null)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Existing Courses List */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px', fontWeight: 700 }}>Active Courses</h4>
              {universityCourses.filter(c => c.university_id === selectedPartnerForCourses.id).length === 0 ? (
                <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: '#64748b', fontSize: '0.78rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.06)' }}>
                  No courses added to this university yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {universityCourses.filter(c => c.university_id === selectedPartnerForCourses.id).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{c.course_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          Admission Fee: <span style={{ color: '#06b6d4', fontWeight: 700 }}>USD {c.admission_fee.toFixed(2)}</span> • Tuition Fee: <span style={{ color: '#10b981', fontWeight: 700 }}>USD {c.tuition_fee.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete the course "${c.course_name}"?`)) {
                            try {
                              await deleteUniversityCourse(c.id);
                            } catch (err) {
                              alert('Failed to delete course');
                            }
                          }
                        }}
                        style={{ border: 'none', background: 'none', color: '#fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Delete Course"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Course Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingCourse(true);
                setCourseError('');
                try {
                  await addUniversityCourse({
                    university_id: selectedPartnerForCourses.id,
                    course_name: courseName.trim(),
                    admission_fee: Number(admissionFee),
                    tuition_fee: Number(tuitionFee)
                  });
                  setCourseName('');
                  setAdmissionFee('150.00');
                  setTuitionFee('3000.00');
                } catch (err) {
                  setCourseError(err instanceof Error ? err.message : 'Failed to add course.');
                } finally {
                  setSubmittingCourse(false);
                }
              }}
              style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <h5 style={{ fontSize: '0.8rem', color: '#fff', margin: '0 0 12px 0', fontWeight: 700 }}>Add New Course</h5>
              {courseError && <div style={{ color: '#fca5a5', fontSize: '0.75rem', marginBottom: '8px' }}>{courseError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Course Name</label>
                  <input type="text" required placeholder="e.g. B.Sc. Computer Science" value={courseName} onChange={e => setCourseName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Admission Fee ($)</label>
                  <input type="number" min="0" step="0.01" required value={admissionFee} onChange={e => setAdmissionFee(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Tuition Fee ($)</label>
                  <input type="number" min="0" step="0.01" required value={tuitionFee} onChange={e => setTuitionFee(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={submittingCourse} className="btn btn-primary btn-sm">
                  {submittingCourse ? 'Adding...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Scholarships */}
      {selectedPartnerForScholarships && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '650px', padding: '24px', background: '#0e1726', border: '1px solid rgba(59, 130, 246, 0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.02rem', color: '#fff', margin: 0, fontWeight: 800 }}>Manage Scholarships - {selectedPartnerForScholarships.name}</h3>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Establish custom scholarships for applicants targeting this institution.</span>
              </div>
              <button onClick={() => setSelectedPartnerForScholarships(null)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Existing Scholarships List */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px', fontWeight: 700 }}>Active Scholarships</h4>
              {scholarships.filter(s => s.university_id === selectedPartnerForScholarships.id).length === 0 ? (
                <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: '#64748b', fontSize: '0.78rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.06)' }}>
                  No custom scholarships added to this university yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {scholarships.filter(s => s.university_id === selectedPartnerForScholarships.id).map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{s.name}</strong>
                        {s.description && <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>{s.description}</div>}
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                          Value: <span style={{ color: '#06b6d4', fontWeight: 700 }}>USD {s.coverage_amount.toFixed(2)}</span>
                          {s.coverage_percentage ? ` (${s.coverage_percentage}% tuition coverage)` : ''}
                          {s.eligibility_criteria && ` • Criteria: ${s.eligibility_criteria}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete the scholarship "${s.name}"?`)) {
                            try {
                              await deleteScholarship(s.id);
                            } catch (err) {
                              alert('Failed to delete scholarship');
                            }
                          }
                        }}
                        style={{ border: 'none', background: 'none', color: '#fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Delete Scholarship"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Scholarship Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingScholarship(true);
                setScholarshipError('');
                try {
                  await addScholarship({
                    university_id: selectedPartnerForScholarships.id,
                    name: scholarshipName.trim(),
                    description: scholarshipDesc.trim() || null,
                    coverage_amount: Number(scholarshipCoverage),
                    coverage_percentage: scholarshipPercent ? Number(scholarshipPercent) : null,
                    eligibility_criteria: scholarshipCriteria.trim() || null
                  });
                  setScholarshipName('');
                  setScholarshipDesc('');
                  setScholarshipCoverage('1000.00');
                  setScholarshipPercent('50');
                  setScholarshipCriteria('');
                } catch (err) {
                  setScholarshipError(err instanceof Error ? err.message : 'Failed to add scholarship.');
                } finally {
                  setSubmittingScholarship(false);
                }
              }}
              style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <h5 style={{ fontSize: '0.8rem', color: '#fff', margin: '0 0 12px 0', fontWeight: 700 }}>Add Custom Scholarship</h5>
              {scholarshipError && <div style={{ color: '#fca5a5', fontSize: '0.75rem', marginBottom: '8px' }}>{scholarshipError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Scholarship Name</label>
                  <input type="text" required placeholder="e.g. Dean's Academic Merit Scholarship" value={scholarshipName} onChange={e => setScholarshipName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Coverage Amount ($)</label>
                  <input type="number" min="0" step="0.01" required value={scholarshipCoverage} onChange={e => setScholarshipCoverage(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Tuition Coverage (%)</label>
                  <input type="number" min="0" max="100" placeholder="e.g. 50" value={scholarshipPercent} onChange={e => setScholarshipPercent(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Description</label>
                  <input type="text" placeholder="Short description of the scholarship coverage details" value={scholarshipDesc} onChange={e => setScholarshipDesc(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Eligibility Criteria</label>
                  <input type="text" placeholder="e.g. GPA > 3.8, IELTS > 7.5" value={scholarshipCriteria} onChange={e => setScholarshipCriteria(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={submittingScholarship} className="btn btn-primary btn-sm">
                  {submittingScholarship ? 'Adding...' : 'Add Scholarship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </DashboardLayout>
  );
};
