import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
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
} from 'lucide-react';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';

export const HrWorkspace: React.FC = () => {
  const { departmentKpis } = useApplication();
  const { currentProfile, departmentMembers } = useAuth();

  const activeStaff = departmentMembers.filter(m => m.employment_status === 'active');
  const pendingStaff = departmentMembers.filter(m => m.employment_status === 'pending_activation');
  const inactiveStaff = departmentMembers.filter(m => m.employment_status === 'inactive');

  // KPI summaries
  const avgKpiScore = departmentKpis.length > 0
    ? Math.round(departmentKpis.reduce((acc, curr) => acc + curr.total_score, 0) / departmentKpis.length)
    : 82;

  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const sidebarNav = [
    { label: 'Executive Board', icon: <Sparkles style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('hr-oversight') },
    { label: 'Directives Inbox', icon: <Briefcase style={{ width: 18, height: 18 }} />, onClick: () => goTo('hr-tasks') },
    { label: 'Staff Directory', icon: <Users style={{ width: 18, height: 18 }} />, onClick: () => goTo('hr-directory') },
    { label: 'KPI Performance audits', icon: <Award style={{ width: 18, height: 18 }} />, onClick: () => goTo('hr-kpi-audits') },
  ];

  return (
    <DashboardLayout
      department="Human Resources"
      title="HR Management Portal"
      subtitle="Oversee corporate staff directory, manage onboarding lists, and audit department KPI evaluations."
      navigation={sidebarNav}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* BANNER */}
        <div 
          id="hr-oversight" 
          className="glass-panel" 
          style={{ 
            padding: '24px', 
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
            borderLeft: '5px solid #3b82f6' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.15)', color: '#fff', padding: '4px 8px', borderRadius: '12px', width: 'fit-content', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            <Shield style={{ width: 12, height: 12 }} />
            Corporate HR Oversight
          </div>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>Human Resources Director Dashboard</h2>
          <p style={{ fontSize: '0.8rem', color: '#e0f2fe', marginTop: '4px', maxWidth: '650px', lineHeight: 1.5 }}>
            Audit employee records, coordinate organizational onboarding queues, and analyze staff ratings from a centralized executive panel.
          </p>
        </div>

        {/* METRICS GRID */}
        <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Users style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Active Staff</span>
              <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '2px' }}>{activeStaff.length}</strong>
              <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{departmentMembers.length} Registered</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <UserPlus style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Pending Onboarding</span>
              <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '2px' }}>{pendingStaff.length}</strong>
              <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600 }}>Profiles Awaiting Onboarding</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <TrendingUp style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Company KPI Avg</span>
              <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '2px' }}>{avgKpiScore}%</strong>
              <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Consistent Progress</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <UserX style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Inactive Staff</span>
              <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '2px' }}>{inactiveStaff.length}</strong>
              <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>Revoked Permissions</span>
            </div>
          </div>

        </div>

        {/* TASK DIRECTIVES INBOX */}
        <div id="hr-tasks">
          <DepartmentTaskInbox />
        </div>

        {/* STAFF DIRECTORY TABLE */}
        <div id="hr-directory" className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '14px', fontWeight: 700 }}>Corporate Staff Directory</h3>
          
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Primary Department</th>
                  <th>Job Title</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {departmentMembers.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{member.full_name}</div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{member.email}</span>
                    </td>
                    <td style={{ color: '#38bdf8', textTransform: 'capitalize' }}>
                      {member.primary_department.replace(/_/g, ' ')}
                    </td>
                    <td style={{ color: '#cbd5e1' }}>{member.job_title}</td>
                    <td>
                      <span className={`badge ${
                        member.employment_status === 'active' 
                          ? 'badge-approved' 
                          : member.employment_status === 'pending_activation' 
                          ? 'badge-under_review' 
                          : 'badge-rejected'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {member.employment_status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KPI EVALUATION AUDITS */}
        <div id="hr-kpi-audits" className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '14px', fontWeight: 700 }}>Audit KPI Evaluations</h3>
          
          {departmentKpis.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
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
                          <div style={{ fontWeight: 600, color: '#fff' }}>{kpi.staff_name}</div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{kpi.staff_email}</span>
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

      </div>
    </DashboardLayout>
  );
};
