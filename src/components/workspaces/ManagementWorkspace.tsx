import React, { useState, useEffect } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertOctagon,
  FileText,
  Plus,
  Send,
  Loader2,
  CheckCircle2,
  ListFilter,
  BarChart3,
  Globe2,
  Sliders,
  Sparkles,
  X,
  ClipboardList,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import { DepartmentType, WorkAssignmentPriority } from '../../types/database';

export const ManagementWorkspace: React.FC = () => {
  const {
    workAssignments,
    communications,
    applications,
    financialRecords,
    departmentKpis,
    createWorkAssignment,
  } = useApplication();
  const { currentProfile, logout } = useAuth();

  // Navigation Scrolling helper
  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Dispatch work modal state
  const [showAssignWorkModal, setShowAssignWorkModal] = useState(false);
  const [waTitle, setWaTitle] = useState('');
  const [waPdfFile, setWaPdfFile] = useState<File | null>(null);
  const [waDepartment, setWaDepartment] = useState<DepartmentType>('admissions');
  const [waPriority, setWaPriority] = useState<WorkAssignmentPriority>('medium');
  const [waDueDate, setWaDueDate] = useState('');
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waError, setWaError] = useState('');

  // Performance summaries
  const totalApps = applications.length;
  const approvedApps = applications.filter(a => a.status === 'approved').length;
  const pendingApps = applications.filter(a => a.status === 'decision_pending' || a.status === 'under_review').length;
  const conversionRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

  const totalDisbursements = financialRecords
    .filter(r => r.record_type === 'scholarship_disbursement' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const activeEscalations = communications.filter(c => c.type === 'escalation');
  const criticalAlertsCount = communications.filter(c => c.priority === 'critical').length;

  const handleCreateWorkAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waTitle.trim()) return;
    if (!waPdfFile) {
      setWaError('Please select a PDF file containing assignment instructions.');
      return;
    }
    if (!currentProfile?.id || !currentProfile?.department) {
      setWaError('Session profile not found. Please log in again.');
      return;
    }
    setWaSubmitting(true);
    setWaError('');
    try {
      // 1. Create the work assignment row
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
      const storagePath = `${currentProfile.department}/${currentProfile.id}/work-assignments/${newAssignment.id}/instructions_${timestamp}_${cleanFileName}`;

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
      setWaError(err instanceof Error ? err.message : 'Failed to assign work.');
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
    { label: 'Executive Board', icon: <Sparkles style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('executive-dashboard') },
    { label: 'Assigned Directives', icon: <Send style={{ width: 18, height: 18 }} />, onClick: () => goTo('management-task-inbox') },
    { label: 'Escalations & Alerts', icon: <AlertOctagon style={{ width: 18, height: 18 }} />, onClick: () => goTo('management-escalations') },
    { label: 'Department Analytics', icon: <BarChart3 style={{ width: 18, height: 18 }} />, onClick: () => goTo('management-kpi-grid') },
  ];

  // Get department specific stats
  const getDepartmentStats = (dept: string) => {
    const kpis = departmentKpis.filter(k => k.department === dept);
    const avgScore = kpis.length > 0 ? Math.round(kpis.reduce((acc, curr) => acc + curr.total_score, 0) / kpis.length) : 80;
    const tasksCount = workAssignments.filter(w => w.assigned_department === dept).length;
    const completedTasksCount = workAssignments.filter(w => w.assigned_department === dept && w.status === 'completed').length;
    const pendingTasksCount = tasksCount - completedTasksCount;

    return {
      avgScore,
      tasksCount,
      completedTasksCount,
      pendingTasksCount,
      kpiStatus: avgScore >= 85 ? 'High' : avgScore >= 65 ? 'Normal' : avgScore >= 50 ? 'Low' : 'Critical'
    };
  };

  return (
    <DashboardLayout
      department="Executive Management"
      title="Executive Overview"
      subtitle="Corporate Oversight, Strategic Performance Analytics, and Cross-Department Directives"
      navigation={sidebarNav}
      onLogout={logout}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* EXECUTIVE HEADER BANNER */}
        <div 
          id="executive-dashboard" 
          className="glass-panel" 
          style={{ 
            padding: '24px 28px', 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', 
            borderLeft: '5px solid #d97706',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle light effect */}
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(217, 119, 6, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(217, 119, 6, 0.1)', color: '#fbbf24', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                <Globe2 style={{ width: 12, height: 12 }} />
                Globe Scholars Pathways LLC.
              </div>
              <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, fontWeight: 700 }}>Managing Director Command Suite</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', maxWidth: '650px', lineHeight: 1.5 }}>
                Review real-time conversion rates, approve strategic budgets, and dispatch PDF directives to department directors from a unified executive interface.
              </p>
            </div>
            
            <button 
              onClick={() => setShowAssignWorkModal(true)} 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#d97706', borderColor: '#d97706', color: '#fff' }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Dispatch Executive Directive
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(51, 102, 255, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#3366FF' }}>
              <Users style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Active Applications</span>
              <strong style={{ fontSize: '1.4rem', color: '#fff', display: 'block', marginTop: '2px' }}>{totalApps}</strong>
              <span style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 600 }}>{pendingApps} Files Processing</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
              <TrendingUp style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Enrollment Conversion</span>
              <strong style={{ fontSize: '1.4rem', color: '#fff', display: 'block', marginTop: '2px' }}>{conversionRate}%</strong>
              <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{approvedApps} Final Placements</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <DollarSign style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Disbursements Cleared</span>
              <strong style={{ fontSize: '1.4rem', color: '#fff', display: 'block', marginTop: '2px' }}>${totalDisbursements.toLocaleString()}</strong>
              <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 600 }}>University Invoices Paid</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertOctagon style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Active Escalations</span>
              <strong style={{ fontSize: '1.4rem', color: '#fff', display: 'block', marginTop: '2px' }}>{activeEscalations.length}</strong>
              <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 600 }}>{criticalAlertsCount} Critical Alerts</span>
            </div>
          </div>

        </div>

        {/* WORK ASSIGNMENTS INBOX */}
        <div id="management-task-inbox">
          <DepartmentTaskInbox showAll={true} />
        </div>

        {/* HEALTH GRID AND ESCALATIONS SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', alignItems: 'start' }}>
          
          {/* DEPARTMENT PERFORMANCE MATRIX */}
          <div id="management-kpi-grid" className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', color: '#fff', margin: 0, fontWeight: 700 }}>Department Operational Performance</h3>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Dynamic weights from Audited KPIs</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'operations', name: 'Operations Division', color: '#6366f1' },
                { key: 'admissions', name: 'Admissions Office', color: '#10b981' },
                { key: 'marketing', name: 'Marketing & Outreach', color: '#3b82f6' },
                { key: 'counseling', name: 'Counseling & Placements', color: '#ec4899' },
                { key: 'finance', name: 'Finance & Accounts', color: '#f59e0b' },
                { key: 'country_directors', name: 'Country Oversight', color: '#14b8a6' },
                { key: 'institutional_relations', name: 'Institutional Relations', color: '#10b981' },
                { key: 'human_resources', name: 'Human Resources', color: '#f43f5e' },
              ].map((d) => {
                const stats = getDepartmentStats(d.key);
                const scoreColor = stats.kpiStatus === 'High' ? '#10b981' : stats.kpiStatus === 'Normal' ? '#3b82f6' : stats.kpiStatus === 'Low' ? '#f59e0b' : '#ef4444';
                return (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{d.name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor }}>{stats.kpiStatus} ({stats.avgScore}%)</span>
                      </div>
                      
                      {/* Simple progress bar */}
                      <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${stats.avgScore}%`, height: '100%', background: scoreColor, transition: 'width 0.5s ease-in-out' }} />
                      </div>
                    </div>

                    <div style={{ width: '80px', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Directives</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{stats.completedTasksCount} / {stats.tasksCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CRITICAL ESCALATIONS PANEL */}
          <div id="management-escalations" className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '14px', fontWeight: 700 }}>Executive Escalations Board</h3>
            
            {activeEscalations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <CheckCircle2 style={{ width: '28px', height: '28px', color: '#10b981', margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>No pending critical escalations flagged.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '315px', overflowY: 'auto' }}>
                {activeEscalations.map((esc) => (
                  <div 
                    key={esc.id} 
                    style={{ 
                      padding: '12px', 
                      background: 'rgba(239, 68, 68, 0.05)', 
                      borderLeft: '3px solid #ef4444', 
                      borderRadius: '4px',
                      borderTopRightRadius: '8px',
                      borderBottomRightRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.1)',
                      borderLeftWidth: '3px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>{esc.title}</span>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(esc.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {esc.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* DISPATCH WORK MODAL */}
      {showAssignWorkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '520px', padding: '28px', position: 'relative', background: '#fff' }}>
            <button
              type="button"
              onClick={() => setShowAssignWorkModal(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ClipboardList style={{ width: 20, height: 20, color: '#d97706' }} />
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#0f172a' }}>Dispatch Executive Directive</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px', marginBottom: '18px' }}>
              Create an official directive PDF assignment that will be dispatched to the selected department head.
            </p>

            {waError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.78rem', marginBottom: '14px' }}>
                {waError}
              </div>
            )}

            <form onSubmit={handleCreateWorkAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Directive Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit student registrations for Australian Universities Q4"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAssignWorkModal(false)} className="btn btn-secondary btn-sm" disabled={waSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#d97706', borderColor: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={waSubmitting}>
                  {waSubmitting ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <Send style={{ width: 14, height: 14 }} />
                  )}
                  {waSubmitting ? 'Dispatching…' : 'Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};
