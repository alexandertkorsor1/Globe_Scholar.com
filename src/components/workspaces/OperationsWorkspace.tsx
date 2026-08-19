import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Briefcase, CheckSquare, Clock, Plus, AlertTriangle, Send, ListTodo } from 'lucide-react';

export const OperationsWorkspace: React.FC = () => {
  const {
    institutionTasks,
    applications,
    createInstitutionTask,
    addCommunication
  } = useApplication();
  const { currentProfile, logout } = useAuth();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskAppId, setTaskAppId] = useState(applications[0]?.id || '');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Olivia Martinez (Ops)');
  const [taskDeadline, setTaskDeadline] = useState('2026-03-30');
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

  const sidebarNav = [
    { label: 'Tasks', icon: <ListTodo style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('operations-tasks') },
    { label: 'Submissions', icon: <Send style={{ width: 18, height: 18 }} />, onClick: () => goTo('operations-submissions') },
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

          <button onClick={() => setShowTaskModal(true)} className="btn btn-primary btn-sm">
            <Plus style={{ width: '14px', height: '14px' }} />
            Create Institution Task
          </button>
        </div>
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

    </div>
    </DashboardLayout>
  );
};
