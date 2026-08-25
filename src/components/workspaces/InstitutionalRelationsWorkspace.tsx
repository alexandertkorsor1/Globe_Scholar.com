import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import {
  Globe2,
  FileText,
  Clock,
  Briefcase,
  Users,
  CheckCircle2,
  GraduationCap,
  Building,
  Award,
  ChevronRight,
} from 'lucide-react';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';

export const InstitutionalRelationsWorkspace: React.FC = () => {
  const {
    applications,
    workAssignments,
  } = useApplication();
  const { currentProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'funnel' | 'partners'>('funnel');

  // Filter application files for handoff review
  const handoffApplications = applications.filter(a => 
    a.status === 'ready_for_processing' || 
    a.status === 'submitted_to_institution' ||
    a.status === 'decision_pending'
  );

  // Partners mockup database
  const partnerUniversities = [
    { name: 'University of Oxford', country: 'United Kingdom', activeAgreements: 2, status: 'Active', quota: 'Unlimited' },
    { name: 'Harvard University', country: 'United States', activeAgreements: 1, status: 'Active', quota: 5 },
    { name: 'University of Melbourne', country: 'Australia', activeAgreements: 1, status: 'Active', quota: 15 },
    { name: 'University of Toronto', country: 'Canada', activeAgreements: 2, status: 'Active', quota: 25 },
    { name: 'Imperial College London', country: 'United Kingdom', activeAgreements: 1, status: 'Active', quota: 10 },
    { name: 'Stanford University', country: 'United States', activeAgreements: 1, status: 'Under Review', quota: 2 },
  ];

  // Stats calculations
  const totalPartners = partnerUniversities.length;
  const activeHandoffs = handoffApplications.length;
  const pendingReviews = partnerUniversities.filter(p => p.status === 'Under Review').length;

  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const sidebarNav = [
    { label: 'Oversight Panel', icon: <Building style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('relations-oversight') },
    { label: 'Directives Inbox', icon: <FileText style={{ width: 18, height: 18 }} />, onClick: () => goTo('relations-tasks') },
    { label: 'University Handoffs', icon: <Users style={{ width: 18, height: 18 }} />, onClick: () => goTo('relations-handoffs') },
    { label: 'Partnership Directory', icon: <Globe2 style={{ width: 18, height: 18 }} />, onClick: () => goTo('relations-partners') },
  ];

  return (
    <DashboardLayout
      department="Institutional Relations"
      title="Partner Operations Portal"
      subtitle="Manage global university partnerships, coordinate student applications handoffs, and audit agreements."
      navigation={sidebarNav}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* BANNER */}
        <div 
          id="relations-oversight" 
          className="glass-panel" 
          style={{ 
            padding: '24px', 
            background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', 
            borderLeft: '5px solid #10b981' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.15)', color: '#fff', padding: '4px 8px', borderRadius: '12px', width: 'fit-content', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            <Building style={{ width: 12, height: 12 }} />
            Global Partners Management
          </div>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>Relations Coordination Board</h2>
          <p style={{ fontSize: '0.8rem', color: '#e0f2fe', marginTop: '4px', maxWidth: '650px', lineHeight: 1.5 }}>
            Audit active agreements, process handoffs to partner institutions, and update admissions decision values in cooperation with international offices.
          </p>
        </div>

        {/* METRICS GRID */}
        <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Building style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Partner Institutions</span>
              <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '2px' }}>{totalPartners}</strong>
              <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{pendingReviews} Pending Review</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <GraduationCap style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Active Student Handoffs</span>
              <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '2px' }}>{activeHandoffs}</strong>
              <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 600 }}>University Files Dispatched</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Award style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Partnership Agreements</span>
              <strong style={{ fontSize: '1.25rem', color: '#fff', display: 'block', marginTop: '2px' }}>{totalPartners * 2}</strong>
              <span style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 600 }}>Global SLA Compliance</span>
            </div>
          </div>

        </div>

        {/* TASK INBOX (RESTRICTED TO SENDER) */}
        <div id="relations-tasks">
          <DepartmentTaskInbox />
        </div>

        {/* APPLICATION HANDOFF WORKBOARD */}
        <div id="relations-handoffs" className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '14px', fontWeight: 700 }}>University Application Handoff Board</h3>
          
          {handoffApplications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
              <CheckCircle2 style={{ width: '24px', height: '24px', color: '#10b981', margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>All student handoffs processed successfully.</p>
            </div>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student File</th>
                    <th>Destination University</th>
                    <th>Degree Program</th>
                    <th>Intake</th>
                    <th>Handoff Status</th>
                  </tr>
                </thead>
                <tbody>
                  {handoffApplications.map(app => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{app.student_name}</div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{app.application_number}</span>
                      </td>
                      <td style={{ color: '#fbbf24', fontWeight: 600 }}>{app.target_university}</td>
                      <td style={{ color: '#cbd5e1' }}>{app.degree_program}</td>
                      <td>{app.intake_period}</td>
                      <td>
                        <span className={`badge ${app.status === 'submitted_to_institution' ? 'badge-approved' : 'badge-under_review'}`} style={{ fontSize: '0.65rem' }}>
                          {app.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PARTNERS DIRECTORY REGISTER */}
        <div id="relations-partners" className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '14px', fontWeight: 700 }}>Institutional Partnerships Directory</h3>
          
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Partner University</th>
                  <th>Region</th>
                  <th>Active SLAS</th>
                  <th>Annual Quota</th>
                  <th>SLA Status</th>
                </tr>
              </thead>
              <tbody>
                {partnerUniversities.map((partner, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{partner.name}</div>
                    </td>
                    <td style={{ color: '#38bdf8' }}>{partner.country}</td>
                    <td>{partner.activeAgreements} Contracts</td>
                    <td>
                      <span className="badge badge-normal" style={{ fontSize: '0.65rem' }}>
                        {partner.quota} Students
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${partner.status === 'Active' ? 'badge-approved' : 'badge-under_review'}`} style={{ fontSize: '0.65rem' }}>
                        {partner.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
