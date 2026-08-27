import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import {
  Users,
  Award,
  CheckCircle2,
  Sliders,
  Sparkles,
  Shield,
  Clock,
  UserCheck,
  UserX,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Briefcase,
  FileSpreadsheet,
  Calendar,
  Search,
  Video,
  ExternalLink,
  Copy,
  Trash2,
  Edit2,
  Plus,
  X,
  Check,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';
import { TrashBin } from '../shared/TrashBin';
import {
  HrEmployeeRecord,
  HrEmploymentType,
  HrEmployeeStatus,
  HrInterview,
  HrInterviewPlatform,
  HrInterviewStatus,
  HrLeaveRequest,
  HrLeaveType,
  DepartmentType
} from '../../types/database';
import * as XLSX from 'xlsx';

const DEPARTMENT_LABELS: Record<DepartmentType, string> = {
  admin: 'Administration',
  marketing: 'Marketing',
  admissions: 'Admissions',
  counseling: 'Counseling',
  data_applications: 'Data & Applications',
  operations: 'Operations',
  finance: 'Finance',
  country_directors: 'Country Directors',
  management: 'Executive Management',
  institutional_relations: 'Institutional Relations',
  human_resources: 'Human Resources',
};

export const HrWorkspace: React.FC = () => {
  const {
    departmentKpis,
    hrEmployeeRecords,
    addHrEmployeeRecord,
    updateHrEmployeeRecord,
    deleteHrEmployeeRecord,
    hrInterviews,
    scheduleHrInterview,
    updateHrInterview,
    hrLeaveRequests,
    submitHrLeaveRequest,
    reviewHrLeaveRequest
  } = useApplication();
  
  const { currentProfile, logout } = useAuth();

  // Navigation Scrolling helper
  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // State Management
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'interviews' | 'leaves'>('employees');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<HrEmployeeRecord | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: 'human_resources' as DepartmentType,
    employment_type: 'full_time' as HrEmploymentType,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    status: 'active' as HrEmployeeStatus,
    notes: ''
  });

  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    candidate_name: '',
    candidate_email: '',
    position: '',
    department: 'marketing' as DepartmentType,
    interview_date: new Date().toISOString().slice(0, 10),
    interview_time: '10:00',
    platform: 'google_meet' as HrInterviewPlatform,
    meeting_link: '',
    interviewer_name: '',
    notes: ''
  });

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee_name: '',
    employee_email: '',
    department: 'human_resources' as DepartmentType,
    leave_type: 'annual' as HrLeaveType,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    reason: ''
  });

  const [reviewLeaveNotes, setReviewLeaveNotes] = useState<Record<string, string>>({});

  // Calculations
  const activeCount = hrEmployeeRecords.filter(e => e.status === 'active').length;
  const onLeaveCount = hrEmployeeRecords.filter(e => e.status === 'on_leave').length;
  const pendingInterviews = hrInterviews.filter(i => i.status === 'scheduled').length;
  const pendingLeaves = hrLeaveRequests.filter(l => l.status === 'pending').length;

  const avgKpiScore = departmentKpis.length > 0
    ? Math.round(departmentKpis.reduce((acc, curr) => acc + curr.total_score, 0) / departmentKpis.length)
    : 82;

  // Filter Employees
  const filteredEmployees = hrEmployeeRecords.filter(emp => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.job_title.toLowerCase().includes(employeeSearch.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Export Roster to Excel
  const exportToExcel = () => {
    const dataToExport = hrEmployeeRecords.map(emp => ({
      'Employee Name': emp.full_name,
      'Email': emp.email,
      'Phone': emp.phone || '—',
      'Job Title': emp.job_title,
      'Department': DEPARTMENT_LABELS[emp.department] || emp.department,
      'Employment Type': emp.employment_type.replace(/_/g, ' ').toUpperCase(),
      'Start Date': emp.start_date,
      'End Date': emp.end_date || 'Active Member',
      'Status': emp.status.toUpperCase(),
      'Notes': emp.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Globe Scholars Staff');
    XLSX.writeFile(wb, `GSP_Staff_Roster_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Autocomplete meeting link helper based on platform selection
  const handlePlatformChange = (platform: HrInterviewPlatform) => {
    let link = '';
    if (platform === 'google_meet') {
      link = `https://meet.google.com/gsp-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    } else if (platform === 'zoom') {
      link = `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`;
    }
    setInterviewForm(prev => ({ ...prev, platform, meeting_link: link }));
  };

  // Submit Handlers
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanForm = {
        ...employeeForm,
        phone: employeeForm.phone.trim() || null,
        end_date: employeeForm.end_date ? employeeForm.end_date : null,
        notes: employeeForm.notes.trim() || null
      };

      if (editingEmployee) {
        await updateHrEmployeeRecord(editingEmployee.id, cleanForm);
      } else {
        await addHrEmployeeRecord(cleanForm);
      }
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      // Reset form
      setEmployeeForm({
        full_name: '',
        email: '',
        phone: '',
        job_title: '',
        department: 'human_resources',
        employment_type: 'full_time',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
        status: 'active',
        notes: ''
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleHrInterview({
        ...interviewForm,
        meeting_link: interviewForm.meeting_link.trim() || null,
        interviewer_name: interviewForm.interviewer_name.trim() || null,
        notes: interviewForm.notes.trim() || null,
        status: 'scheduled'
      });
      setShowInterviewModal(false);
      setInterviewForm({
        candidate_name: '',
        candidate_email: '',
        position: '',
        department: 'marketing',
        interview_date: new Date().toISOString().slice(0, 10),
        interview_time: '10:00',
        platform: 'google_meet',
        meeting_link: '',
        interviewer_name: '',
        notes: ''
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to schedule');
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitHrLeaveRequest({
        ...leaveForm,
        reason: leaveForm.reason.trim() || null
      });
      setShowLeaveModal(false);
      setLeaveForm({
        employee_name: '',
        employee_email: '',
        department: 'human_resources',
        leave_type: 'annual',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date().toISOString().slice(0, 10),
        reason: ''
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit leave request');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Meeting link copied to clipboard!');
  };

  const sidebarNav = [
    { label: 'Executive Board', icon: <Sparkles style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('hr-oversight') },
    { label: 'HR Workspace', icon: <Sliders style={{ width: 18, height: 18 }} />, onClick: () => goTo('hr-workspace-tabs') },
    { label: 'Directives Inbox', icon: <Briefcase style={{ width: 18, height: 18 }} />, onClick: () => goTo('hr-tasks') },
    { label: 'KPI Performance audits', icon: <Award style={{ width: 18, height: 18 }} />, onClick: () => goTo('hr-kpi-audits') },
    { label: 'Recycle Bin', icon: <Trash2 style={{ width: 18, height: 18 }} />, onClick: () => goTo('hr-trash') },
  ];

  return (
    <DashboardLayout
      department="Human Resources"
      title="HR Executive Management Suite"
      subtitle="Corporate employee roster auditing, leave schedules dashboard, and candidate interview pipeline."
      navigation={sidebarNav}
      onLogout={logout}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* BANNER */}
        <div 
          id="hr-oversight" 
          className="glass-panel" 
          style={{ 
            padding: '24px', 
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
            borderLeft: '5px solid #3b82f6',
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.15)', color: '#fff', padding: '4px 8px', borderRadius: '12px', width: 'fit-content', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            <Shield style={{ width: 12, height: 12 }} />
            Corporate HR Governance Panel
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, fontWeight: 700 }}>Human Resources Director Dashboard</h2>
          <p style={{ fontSize: '0.85rem', color: '#e0f2fe', marginTop: '4px', maxWidth: '650px', lineHeight: 1.5 }}>
            Audit employee records, coordinate organizational onboarding queues, verify active/leave statistics, and run structural Excel exports from a centralized panel.
          </p>
        </div>

        {/* METRICS GRID */}
        <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Users style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Active Employees</span>
              <strong style={{ fontSize: '1.25rem', color: '#1f2937', display: 'block', marginTop: '2px' }}>{activeCount}</strong>
              <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{hrEmployeeRecords.length} Total Roster</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Video style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Interviews Pending</span>
              <strong style={{ fontSize: '1.25rem', color: '#1f2937', display: 'block', marginTop: '2px' }}>{pendingInterviews}</strong>
              <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Active Pipelines</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Clock style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Pending Leave Requests</span>
              <strong style={{ fontSize: '1.25rem', color: '#1f2937', display: 'block', marginTop: '2px' }}>{pendingLeaves}</strong>
              <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600 }}>Needs Approval</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <UserX style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Employees On Leave</span>
              <strong style={{ fontSize: '1.25rem', color: '#1f2937', display: 'block', marginTop: '2px' }}>{onLeaveCount}</strong>
              <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>Temporarily Out</span>
            </div>
          </div>

        </div>

        {/* MAIN WORKSPACE TABS */}
        <div id="hr-workspace-tabs" className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
          
          {/* Subtabs bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '20px', gap: '20px' }}>
            <button
              onClick={() => setActiveSubTab('employees')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeSubTab === 'employees' ? '2px solid #2563eb' : '2px solid transparent',
                color: activeSubTab === 'employees' ? '#2563eb' : '#4b5563',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={16} />
              Employee Roster & Date Tracking
            </button>
            <button
              onClick={() => setActiveSubTab('interviews')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeSubTab === 'interviews' ? '2px solid #2563eb' : '2px solid transparent',
                color: activeSubTab === 'interviews' ? '#2563eb' : '#4b5563',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Calendar size={16} />
              Interview Pipelines (Google Meet/Zoom)
            </button>
            <button
              onClick={() => setActiveSubTab('leaves')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeSubTab === 'leaves' ? '2px solid #2563eb' : '2px solid transparent',
                color: activeSubTab === 'leaves' ? '#2563eb' : '#4b5563',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={16} />
              Leave Requests & Work Absences
            </button>
          </div>

          {/* TAB 1: EMPLOYEE ROSTER & DATE TRACKING */}
          {activeSubTab === 'employees' && (
            <div>
              {/* Header Filters & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '300px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} />
                    <input
                      type="text"
                      placeholder="Search name, position..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        background: '#fff'
                      }}
                    />
                  </div>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      background: '#fff'
                    }}
                  >
                    <option value="all">All Departments</option>
                    {Object.keys(DEPARTMENT_LABELS).map(key => (
                      <option key={key} value={key}>{DEPARTMENT_LABELS[key as DepartmentType]}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      background: '#fff'
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={exportToExcel}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                  >
                    <FileSpreadsheet size={16} />
                    Export to Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmployee(null);
                      setEmployeeForm({
                        full_name: '',
                        email: '',
                        phone: '',
                        job_title: '',
                        department: 'human_resources',
                        employment_type: 'full_time',
                        start_date: new Date().toISOString().slice(0, 10),
                        end_date: '',
                        status: 'active',
                        notes: ''
                      });
                      setShowEmployeeModal(true);
                    }}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                  >
                    <UserPlus size={16} />
                    Add Employee Record
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee Details</th>
                      <th>Department & Title</th>
                      <th>Contract Type</th>
                      <th>Employment Period</th>
                      <th>Status</th>
                      <th style={{ width: '80px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                          <AlertCircle size={24} style={{ display: 'block', margin: '0 auto 6px', opacity: 0.5 }} />
                          No employees found matching the filters.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map(emp => (
                        <tr key={emp.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{emp.full_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Mail size={12} /> {emp.email}
                            </div>
                            {emp.phone && (
                              <div style={{ fontSize: '0.72rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                                <Phone size={12} /> {emp.phone}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 650, fontSize: '0.8rem', color: '#374151' }}>{emp.job_title}</div>
                            <span className={`badge dept-badge-${emp.department}`} style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                              {DEPARTMENT_LABELS[emp.department] || emp.department}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-normal" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                              {emp.employment_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#4b5563' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span><strong>Start:</strong> {emp.start_date}</span>
                              <span><strong>End:</strong> {emp.end_date || <span style={{ color: '#10b981' }}>Active / Indefinite</span>}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              emp.status === 'active'
                                ? 'badge-approved'
                                : emp.status === 'on_leave'
                                ? 'badge-under_review'
                                : 'badge-rejected'
                            }`} style={{ fontSize: '0.63rem' }}>
                              {emp.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setEmployeeForm({
                                    full_name: emp.full_name,
                                    email: emp.email,
                                    phone: emp.phone || '',
                                    job_title: emp.job_title,
                                    department: emp.department,
                                    employment_type: emp.employment_type,
                                    start_date: emp.start_date,
                                    end_date: emp.end_date || '',
                                    status: emp.status,
                                    notes: emp.notes || ''
                                  });
                                  setShowEmployeeModal(true);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px' }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to remove ${emp.full_name}'s record?`)) {
                                    await deleteHrEmployeeRecord(emp.id);
                                  }
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px', color: '#ef4444', borderColor: '#fecaca' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: INTERVIEW PIPELINE */}
          {activeSubTab === 'interviews' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#374151' }}>Scheduled Recruitment Interviews</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6b7280' }}>
                    Send meeting invitations, record candidate details, and launch Google Meet or Zoom streams.
                  </p>
                </div>
                <button
                  onClick={() => setShowInterviewModal(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                >
                  <Plus size={14} />
                  Schedule Interview
                </button>
              </div>

              {/* Interviews list */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {hrInterviews.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '8px' }}>
                    <Calendar size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                    No interviews scheduled at this time.
                  </div>
                ) : (
                  hrInterviews.map(int => (
                    <div
                      key={int.id}
                      style={{
                        padding: '16px',
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: '#111827', display: 'block' }}>{int.candidate_name}</strong>
                            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{int.candidate_email}</span>
                          </div>
                          <span className={`badge ${
                            int.status === 'scheduled'
                              ? 'badge-submitted'
                              : int.status === 'completed'
                              ? 'badge-approved'
                              : 'badge-rejected'
                          }`} style={{ fontSize: '0.62rem' }}>
                            {int.status.toUpperCase()}
                          </span>
                        </div>

                        <div style={{ marginTop: '10px', display: 'flex', gap: '4px', flexDirection: 'column', fontSize: '0.78rem', color: '#4b5563' }}>
                          <span><strong>Position:</strong> {int.position}</span>
                          <span>
                            <strong>Department:</strong> {DEPARTMENT_LABELS[int.department] || int.department}
                          </span>
                          <span><strong>Schedule:</strong> {int.interview_date} at {int.interview_time}</span>
                        </div>
                      </div>

                      {int.meeting_link && (
                        <div style={{ padding: '8px 10px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 650, color: int.platform === 'zoom' ? '#2d8cff' : '#0f9d58' }}>
                            <Video size={12} />
                            {int.platform === 'google_meet' ? 'Google Meet' : int.platform === 'zoom' ? 'Zoom Meeting' : 'Platform Link'}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => copyToClipboard(int.meeting_link!)}
                              title="Copy Link"
                              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }}
                            >
                              <Copy size={13} />
                            </button>
                            <a
                              href={int.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              title="Launch stream"
                              style={{ display: 'flex', alignItems: 'center', padding: '4px', color: '#2563eb' }}
                            >
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        </div>
                      )}

                      {int.status === 'scheduled' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            onClick={async () => {
                              await updateHrInterview(int.id, { status: 'completed' });
                            }}
                            className="btn btn-sm"
                            style={{ flex: 1, fontSize: '0.7rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={async () => {
                              await updateHrInterview(int.id, { status: 'cancelled' });
                            }}
                            className="btn btn-sm"
                            style={{ flex: 1, fontSize: '0.7rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LEAVE MANAGEMENT & ABSENCES */}
          {activeSubTab === 'leaves' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#374151' }}>Leave Requests & Work Absence Registry</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6b7280' }}>
                    Process employee leave requests. Approve or deny with administrative review notes.
                  </p>
                </div>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                >
                  <Plus size={14} />
                  Submit Leave Request
                </button>
              </div>

              {/* Leave Requests Table */}
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Absence Type</th>
                      <th>Dates Requested</th>
                      <th>Reason / Explanation</th>
                      <th>Status</th>
                      <th>Actions & Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hrLeaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                          No leave requests logged in system.
                        </td>
                      </tr>
                    ) : (
                      hrLeaveRequests.map(req => (
                        <tr key={req.id}>
                          <td>
                            <strong style={{ color: '#111827' }}>{req.employee_name}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{req.employee_email}</div>
                            <span className="badge badge-normal" style={{ fontSize: '0.62rem', marginTop: '4px' }}>
                              {DEPARTMENT_LABELS[req.department] || req.department}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-normal" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                              {req.leave_type} Leave
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#374151' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span><strong>From:</strong> {req.start_date}</span>
                              <span><strong>To:</strong> {req.end_date}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#4b5563', maxWidth: '220px' }}>
                            <div style={{ fontStyle: req.reason ? 'normal' : 'italic' }}>
                              {req.reason || 'No explanation provided.'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              req.status === 'approved'
                                ? 'badge-approved'
                                : req.status === 'denied'
                                ? 'badge-rejected'
                                : 'badge-under_review'
                            }`} style={{ fontSize: '0.63rem' }}>
                              {req.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {req.status === 'pending' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <input
                                  type="text"
                                  placeholder="Review note (optional)..."
                                  value={reviewLeaveNotes[req.id] || ''}
                                  onChange={(e) => setReviewLeaveNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                                  style={{
                                    padding: '4px 8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    width: '150px'
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={async () => {
                                      await reviewHrLeaveRequest(req.id, 'approved', reviewLeaveNotes[req.id]);
                                    }}
                                    className="btn btn-sm"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '0.65rem',
                                      padding: '4px 8px',
                                      background: '#ecfdf5',
                                      color: '#047857',
                                      borderColor: '#86efac'
                                    }}
                                  >
                                    <Check size={12} /> Approve
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await reviewHrLeaveRequest(req.id, 'denied', reviewLeaveNotes[req.id]);
                                    }}
                                    className="btn btn-sm"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '0.65rem',
                                      padding: '4px 8px',
                                      background: '#fef2f2',
                                      color: '#b91c1c',
                                      borderColor: '#fecaca'
                                    }}
                                  >
                                    <X size={12} /> Deny
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                                <div>Reviewed by {req.reviewed_by ? 'HR Manager' : 'Admin'}</div>
                                {req.reason && <div style={{ fontStyle: 'italic', marginTop: '2px' }}>&ldquo;{req.reason}&rdquo;</div>}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* TASK DIRECTIVES INBOX */}
        <div id="hr-tasks">
          <DepartmentTaskInbox />
        </div>

        {/* KPI EVALUATION AUDITS */}
        <div id="hr-kpi-audits" className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#1f2937', marginBottom: '14px', fontWeight: 700 }}>Audit KPI Evaluations</h3>
          
          {departmentKpis.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', border: '1px dashed #e5e7eb', borderRadius: '8px' }}>
              <Award style={{ width: '24px', height: '24px', color: '#3b82f6', margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>No KPI evaluations registered yet.</p>
            </div>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Staff Evaluated</th>
                    <th>Department</th>
                    <th>Role Title</th>
                    <th>Evaluation Period</th>
                    <th>KPI Rating</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentKpis.map(kpi => {
                    const ratingColor = kpi.rating === 'Excellent' || kpi.rating === 'Very Good' ? '#10b981' : kpi.rating === 'Good' ? '#3b82f6' : '#f59e0b';
                    return (
                      <tr key={kpi.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{kpi.staff_name}</div>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{kpi.staff_email}</span>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{kpi.department.replace(/_/g, ' ')}</td>
                        <td>{kpi.role_title}</td>
                        <td>{kpi.evaluation_period}</td>
                        <td style={{ color: ratingColor, fontWeight: 700 }}>{kpi.rating}</td>
                        <td>
                          <span className="badge badge-normal" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                            {kpi.total_score}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div id="hr-trash" style={{ marginTop: '20px' }}>
          <TrashBin departmentKey="human_resources" />
        </div>

      </div>

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {showEmployeeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>
                {editingEmployee ? 'Edit Employee Record' : 'Add Employee Record'}
              </h3>
              <button onClick={() => setShowEmployeeModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={employeeForm.full_name}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, full_name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Email *</label>
                  <input
                    type="email"
                    required
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Phone</label>
                  <input
                    type="text"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Job Title *</label>
                  <input
                    type="text"
                    required
                    value={employeeForm.job_title}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, job_title: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Department *</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value as DepartmentType }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
                  >
                    {Object.keys(DEPARTMENT_LABELS).map(key => (
                      <option key={key} value={key}>{DEPARTMENT_LABELS[key as DepartmentType]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Contract Type *</label>
                  <select
                    value={employeeForm.employment_type}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, employment_type: e.target.value as HrEmploymentType }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Start Date *</label>
                  <input
                    type="date"
                    required
                    value={employeeForm.start_date}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, start_date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>End Date</label>
                  <input
                    type="date"
                    value={employeeForm.end_date}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, end_date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Status *</label>
                  <select
                    value={employeeForm.status}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, status: e.target.value as HrEmployeeStatus }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Notes</label>
                <textarea
                  rows={3}
                  value={employeeForm.notes}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmployeeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE INTERVIEW */}
      {showInterviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>Schedule Candidate Interview</h3>
              <button onClick={() => setShowInterviewModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInterviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={interviewForm.candidate_name}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, candidate_name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Candidate Email *</label>
                <input
                  type="email"
                  required
                  value={interviewForm.candidate_email}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, candidate_email: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Position Applied For *</label>
                  <input
                    type="text"
                    required
                    value={interviewForm.position}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, position: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Target Department *</label>
                  <select
                    value={interviewForm.department}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, department: e.target.value as DepartmentType }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
                  >
                    {Object.keys(DEPARTMENT_LABELS).map(key => (
                      <option key={key} value={key}>{DEPARTMENT_LABELS[key as DepartmentType]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Date *</label>
                  <input
                    type="date"
                    required
                    value={interviewForm.interview_date}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, interview_date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Time *</label>
                  <input
                    type="time"
                    required
                    value={interviewForm.interview_time}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, interview_time: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Meeting Platform *</label>
                  <select
                    value={interviewForm.platform}
                    onChange={(e) => handlePlatformChange(e.target.value as HrInterviewPlatform)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom Stream</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Meeting Link</label>
                  <input
                    type="text"
                    placeholder="Auto-generated or custom URL"
                    value={interviewForm.meeting_link}
                    onChange={(e) => setInterviewForm(prev => ({ ...prev, meeting_link: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Assigned Interviewer</label>
                <input
                  type="text"
                  placeholder="e.g. Elena R. (HR Specialist)"
                  value={interviewForm.interviewer_name}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, interviewer_name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Notes</label>
                <textarea
                  rows={2}
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInterviewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT LEAVE REQUEST */}
      {showLeaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>Log Employee Leave Request</h3>
              <button onClick={() => setShowLeaveModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Employee Name *</label>
                <input
                  type="text"
                  required
                  value={leaveForm.employee_name}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, employee_name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Employee Email *</label>
                <input
                  type="email"
                  required
                  value={leaveForm.employee_email}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, employee_email: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Department *</label>
                  <select
                    value={leaveForm.department}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, department: e.target.value as DepartmentType }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
                  >
                    {Object.keys(DEPARTMENT_LABELS).map(key => (
                      <option key={key} value={key}>{DEPARTMENT_LABELS[key as DepartmentType]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Leave Type *</label>
                  <select
                    value={leaveForm.leave_type}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, leave_type: e.target.value as HrLeaveType }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', background: '#fff' }}
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Reason / Details</label>
                <textarea
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};
