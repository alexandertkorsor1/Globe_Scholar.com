import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Layers, FileCheck, AlertTriangle, Eye, CheckCircle2, RefreshCw, Kanban } from 'lucide-react';
import { DocumentManager } from '../documents/DocumentManager';
import { ApplicationStatus, Application } from '../../types/database';

export const DataApplicationsWorkspace: React.FC = () => {
  const { applications, updateApplicationStatus } = useApplication();
  const { currentProfile, logout } = useAuth();

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const kanbanColumns: { status: ApplicationStatus; title: string; color: string }[] = [
    { status: 'draft', title: 'Draft Applications', color: '#cbd5e1' },
    { status: 'submitted', title: 'Submitted & Ingested', color: '#38bdf8' },
    { status: 'documents_missing', title: 'Missing Documents Flagged', color: '#fbbf24' },
    { status: 'documents_verified', title: 'Documents Verified', color: '#34d399' },
    { status: 'admissions_review', title: 'Under Admissions Review', color: '#c084fc' },
    { status: 'approved', title: 'Approved & Finalized', color: '#4ade80' }
  ];

  const sidebarNav = [
    { label: 'Pipeline', icon: <Layers style={{ width: 18, height: 18 }} />, active: true, onClick: () => { setViewMode('table'); goTo('data-pipeline'); } },
    { label: 'Kanban', icon: <Kanban style={{ width: 18, height: 18 }} />, onClick: () => { setViewMode('kanban'); goTo('data-pipeline'); } },
  ];

  return (
    <DashboardLayout
      department="Data & Applications"
      title="Data & Applications Pipeline"
      subtitle="Application processing, document verification, and status tracking"
      userName={currentProfile.full_name}
      userRole="Data & Applications"
      navigation={sidebarNav}
      onLogout={logout}
    >
    <div id="data-pipeline" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers style={{ color: '#3366FF' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>Data & Applications Processing Pipeline</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              Application tracking backbone, document collection, verification hub, Kanban lifecycle, and volume analytics.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Grid Analytics View
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
          {kanbanColumns.map(col => {
            const colApps = applications.filter(a => a.status === col.status);
            return (
              <div
                key={col.status}
                className="glass-panel"
                style={{
                  padding: '12px',
                  background: 'rgba(11, 15, 25, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '200px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: col.color }}>{col.title}</span>
                  <span className="badge badge-submitted" style={{ fontSize: '0.6rem' }}>{colApps.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: '300px' }}>
                  {colApps.map(app => (
                    <div
                      key={app.id}
                      className="glass-panel glass-panel-interactive"
                      style={{ padding: '12px', background: 'rgba(18, 26, 43, 0.9)', cursor: 'pointer' }}
                      onClick={() => setSelectedApp(app)}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1' }}>{app.application_number}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', margin: '4px 0' }}>{app.student_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{app.target_university}</div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        {app.missing_documents_count > 0 ? (
                          <span style={{ fontSize: '0.65rem', color: '#fbbf24' }}>⚠️ {app.missing_documents_count} Missing</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#34d399' }}>✓ Clear</span>
                        )}

                        <select
                          value={app.status}
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus, 'Status shifted via Data & Apps Kanban board')}
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid var(--border-color)' }}
                        >
                          <option value="submitted">Move → Submitted</option>
                          <option value="documents_missing">Move → Missing Docs</option>
                          <option value="documents_verified">Move → Docs Verified</option>
                          <option value="admissions_review">Move → Admissions</option>
                          <option value="approved">Move → Approved</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'table' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>Data Volume & Verification Status Grid</h3>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>App #</th>
                  <th>Student Name</th>
                  <th>Target University</th>
                  <th>Degree Program</th>
                  <th>Missing Docs Count</th>
                  <th>Current Status</th>
                  <th>Inspect & Verify</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td><strong style={{ color: '#06b6d4' }}>{app.application_number}</strong></td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{app.student_name}</td>
                    <td>{app.target_university}</td>
                    <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{app.degree_program}</td>
                    <td>
                      {app.missing_documents_count > 0 ? (
                        <span className="badge badge-documents_missing">{app.missing_documents_count} Flagged</span>
                      ) : (
                        <span className="badge badge-documents_verified">0 Flagged</span>
                      )}
                    </td>
                    <td><span className={`badge badge-${app.status}`}>{app.status}</span></td>
                    <td>
                      <button onClick={() => setSelectedApp(app)} className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem' }}>
                        <Eye style={{ width: '12px', height: '12px' }} />
                        Verify Documents
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Verification Drawer */}
      {selectedApp && (
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff' }}>
              Verification Center for {selectedApp.student_name} ({selectedApp.application_number})
            </h3>
            <button onClick={() => setSelectedApp(null)} className="btn btn-secondary btn-sm">Close Verification Hub</button>
          </div>

          <DocumentManager applicationId={selectedApp.id} />
        </div>
      )}

    </div>
    </DashboardLayout>
  );
};
