import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Briefcase, CheckSquare, Clock, Plus, AlertTriangle, Send, ListTodo, ClipboardList, Loader2, X, Trash2 } from 'lucide-react';
import { CrmRegister } from '../shared/CrmRegister';
import { KpiPerformanceTracker } from '../shared/KpiPerformanceTracker';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import { TrashBin } from '../shared/TrashBin';
import { DepartmentType, WorkAssignmentPriority } from '../../types/database';

export const OperationsWorkspace: React.FC = () => {
  const {
    institutionTasks,
    applications,
    students,
    financialRecords,
    departmentKpis,
    createInstitutionTask,
    saveDepartmentKpi,
    deleteDepartmentKpi,
    addCommunication,
    createWorkAssignment
  } = useApplication();
  const { currentProfile, logout, departmentMembers } = useAuth();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskAppId, setTaskAppId] = useState(applications[0]?.id || '');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Olivia Martinez (Ops)');
  const [taskDeadline, setTaskDeadline] = useState('2026-03-30');

  // Work Assignment modal state
  const [showAssignWorkModal, setShowAssignWorkModal] = useState(false);
  const [waTitle, setWaTitle] = useState('');
  const [waPdfFile, setWaPdfFile] = useState<File | null>(null);
  const [waDepartment, setWaDepartment] = useState<DepartmentType>('admissions');
  const [waPriority, setWaPriority] = useState<WorkAssignmentPriority>('medium');
  const [waDueDate, setWaDueDate] = useState('');
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waError, setWaError] = useState('');

  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    createInstitutionTask(taskAppId, taskTitle, taskDesc, taskAssignee, taskDeadline);
    setShowTaskModal(false);
    setTaskTitle('');
    setTaskDesc('');
  };

  const handleTaskEscalate = (taskTitleStr: string) => {
    addCommunication('escalation', `Operations Escalation: ${taskTitleStr}`, `Operations task "${taskTitleStr}" is approaching critical deadline. Country Director intervention requested.`, 'critical');
    alert(`Escalation raised for task: ${taskTitleStr}`);
  };

  const handleCreateWorkAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waTitle.trim()) return;
    if (!waPdfFile) {
      setWaError('Please select a PDF file containing assignment instructions.');
      return;
    }
    if (!currentProfile?.id) {
      setWaError('Session profile not found. Please log in again.');
      return;
    }
    setWaSubmitting(true);
    setWaError('');
    try {
      // 1. Create the work assignment row (with PDF filename as placeholder description)
      const newAssignment = await createWorkAssignment(
        waTitle,
        `[PDF Assignment Instructions] ${waPdfFile.name}`,
        waDepartment,
        waPriority,
        waDueDate || undefined
      );

      // 2. Upload the assignment instructions PDF
      const timestamp = Date.now();
      const cleanFileName = waPdfFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `operations/${currentProfile.id}/work-assignments/${newAssignment.id}/instructions_${timestamp}_${cleanFileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('department-reports')
        .upload(storagePath, waPdfFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        });

      if (uploadErr) throw new Error(`File upload failed: ${uploadErr.message}`);

      // 3. Register as a department work attachment (instruction file)
      const { error: attachErr } = await supabase
        .from('department_work_attachments')
        .insert({
          assignment_id: newAssignment.id,
          uploaded_by: currentProfile.id,
          file_name: waPdfFile.name,
          file_path: storagePath,
          file_type: 'application/pdf',
          file_size: waPdfFile.size,
        });

      if (attachErr) throw new Error(`Failed to save attachment metadata: ${attachErr.message}`);

      setShowAssignWorkModal(false);
      setWaTitle('');
      setWaPdfFile(null);
      setWaDepartment('admissions');
      setWaPriority('medium');
      setWaDueDate('');
    } catch (err) {
      setWaError(err instanceof Error ? err.message : 'Failed to create work assignment.');
    } finally {
      setWaSubmitting(false);
    }
  };

  const ASSIGNABLE_DEPARTMENTS: Array<{ value: DepartmentType; label: string }> = [
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

  const sidebarNav = [
    { label: 'Assign Work', icon: <ClipboardList style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('operations-assign-work') },
    { label: 'Tasks', icon: <ListTodo style={{ width: 18, height: 18 }} />, onClick: () => goTo('operations-tasks') },
    { label: 'CRM', icon: <Briefcase style={{ width: 18, height: 18 }} />, onClick: () => goTo('operations-crm') },
    { label: 'KPI Tracker', icon: <CheckSquare style={{ width: 18, height: 18 }} />, onClick: () => goTo('operations-kpi') },
    { label: 'Submissions', icon: <Send style={{ width: 18, height: 18 }} />, onClick: () => goTo('operations-submissions') },
    { label: 'Recycle Bin', icon: <Trash2 style={{ width: 18, height: 18 }} />, onClick: () => goTo('operations-trash') },
  ];

  return (
    <DashboardLayout
      department="Operations"
      title="Operations & Institution Submissions"
      subtitle="Task management, deadline tracking, and institution coordination"
      userName={currentProfile.full_name}
      userRole="Operations"
      navigation={sidebarNav}
      onLogout={logout}
    >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 26, 43, 0.9) 100%)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase style={{ color: '#fbbf24' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>Operations & Institution Dispatch Platform</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
              Institution application coordination, processing task delegation, deadline enforcement, and escalation workflow.
            </p>
          </div>

          <button onClick={() => setShowTaskModal(true)} className="btn btn-secondary btn-sm">
            <Plus style={{ width: '14px', height: '14px' }} />
            Create Institution Task
          </button>
          <button onClick={() => setShowAssignWorkModal(true)} className="btn btn-primary btn-sm">
            <ClipboardList style={{ width: '14px', height: '14px' }} />
            Assign Work to Department
          </button>
        </div>
      </div>

      {/* Assign Work Section */}
      <div id="operations-assign-work">
        <DepartmentTaskInbox
          showAll
          title="Work Assignments Dispatched by Operations"
          description="All work assignments created and dispatched to departments. Track progress, view status updates, and manage cross-department coordination."
        />
      </div>

      <div id="operations-crm">
        <CrmRegister
          applications={applications}
          students={students}
          financialRecords={financialRecords}
          title="Operations CRM & Institution Readiness Register"
          description="Operations view of all student relationships, ownership stages, payment readiness, and next institution-submission actions."
        />
      </div>

      <div id="operations-kpi">
        <KpiPerformanceTracker
          records={departmentKpis}
          currentProfile={currentProfile}
          departmentMembers={departmentMembers}
          onSave={saveDepartmentKpi}
          onDelete={deleteDepartmentKpi}
        />
      </div>

      {/* Task Board */}
      <div id="operations-tasks" className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>Active Institution Coordination Tasks</h3>
        
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>App Number</th>
                <th>Task Description</th>
                <th>Assignee</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Escalate</th>
              </tr>
            </thead>
            <tbody>
              {institutionTasks.map(tsk => (
                <tr key={tsk.id}>
                  <td><strong style={{ color: '#fbbf24' }}>{tsk.application_number}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{tsk.title}</div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tsk.description}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{tsk.assigned_to_name}</td>
                  <td>
                    <span className="badge badge-documents_missing" style={{ fontSize: '0.65rem' }}>
                      <Clock style={{ width: '10px', height: '10px' }} />
                      {new Date(tsk.deadline).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${tsk.status === 'completed' ? 'badge-approved' : 'badge-under_review'}`}>
                      {tsk.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleTaskEscalate(tsk.title)} className="btn btn-danger btn-sm" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                      <AlertTriangle style={{ width: '12px', height: '12px' }} />
                      Escalate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="operations-submissions" className="glass-panel" style={{ padding: '18px 20px' }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '8px' }}>Institution submission readiness</h3>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>Create and track an institution task for each application before external submission. Escalations and next actions are shared through the team inbox.</p>
      </div>
      <div id="operations-trash" style={{ marginTop: '20px' }}>
        <TrashBin departmentKey="operations" />
      </div>
      {/* Modal: Create Task */}
      {showTaskModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '460px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Create Institution Processing Task</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target Application</label>
                <select value={taskAppId} onChange={e => setTaskAppId(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}>
                  {applications.map(a => (
                    <option key={a.id} value={a.id}>{a.application_number} - {a.student_name} ({a.target_university})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Task Title</label>
                <input type="text" required placeholder="e.g. Dispatch Official Transcript Package" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Detailed Instructions</label>
                <textarea rows={3} value={taskDesc} onChange={e => setTaskDesc(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Work to Department */}
      {showAssignWorkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '520px', padding: '28px', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAssignWorkModal(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ClipboardList style={{ width: 20, height: 20, color: '#4f46e5' }} />
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Assign Work to Department</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px', marginBottom: '18px' }}>
              Create a work assignment that will be sent to the selected department. They will see it in their task inbox.
            </p>

            {waError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.78rem', marginBottom: '14px' }}>
                {waError}
              </div>
            )}

            <form onSubmit={handleCreateWorkAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare enrollment documents for Q3 intake"
                  value={waTitle}
                  onChange={(e) => setWaTitle(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#fff', color: '#111827' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Assignment Instructions PDF *</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={(e) => setWaPdfFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#fff', color: '#111827' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Target Department *</label>
                  <select
                    value={waDepartment}
                    onChange={(e) => setWaDepartment(e.target.value as DepartmentType)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#fff', color: '#111827' }}
                  >
                    {ASSIGNABLE_DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Priority</label>
                  <select
                    value={waPriority}
                    onChange={(e) => setWaPriority(e.target.value as WorkAssignmentPriority)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#fff', color: '#111827' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Due Date</label>
                <input
                  type="date"
                  value={waDueDate}
                  onChange={(e) => setWaDueDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#fff', color: '#111827' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAssignWorkModal(false)} className="btn btn-secondary btn-sm" disabled={waSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={waSubmitting}>
                  {waSubmitting ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <Send style={{ width: 14, height: 14 }} />
                  )}
                  {waSubmitting ? 'Assigning…' : 'Assign Work'}
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
