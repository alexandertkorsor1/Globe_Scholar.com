import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Layers, FileCheck, AlertTriangle, Eye, CheckCircle2, RefreshCw, Kanban, ClipboardList } from 'lucide-react';
import { DocumentManager } from '../documents/DocumentManager';
import { ApplicationStatus, Application } from '../../types/database';
import { getApplicationIntake } from '../../lib/department-registers';
import { CrmRegister } from '../shared/CrmRegister';
import { KpiPerformanceTracker } from '../shared/KpiPerformanceTracker';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import { TrashBin } from '../shared/TrashBin';

export const DataApplicationsWorkspace: React.FC = () => {
  const {
    applications,
    students,
    financialRecords,
    departmentKpis,
    updateApplicationStatus,
  } = useApplication();
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
    { label: 'CRM', icon: <FileCheck style={{ width: 18, height: 18 }} />, onClick: () => goTo('data-crm') },
    { label: 'KPI', icon: <CheckCircle2 style={{ width: 18, height: 18 }} />, onClick: () => goTo('data-kpi') },
    { label: 'Assigned Tasks', icon: <ClipboardList style={{ width: 18, height: 18 }} />, onClick: () => goTo('data-assigned-tasks') },
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

      <div id="data-assigned-tasks">
        <DepartmentTaskInbox />
      </div>

      <div id="data-crm">
        <CrmRegister
          applications={applications}
          students={students}
          financialRecords={financialRecords}
          title="Data & Applications CRM Register"
          description="Student relationship register for intake, document status, data readiness, payment signal, owner department, and next action."
        />
      </div>

      <div id="data-kpi">
        <KpiPerformanceTracker
          records={departmentKpis}
          currentProfile={currentProfile}
        />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '1rem', color: '#fff' }}>Data & Applications Intake Register</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                Every new student account appears here first for data capture, document verification, and application readiness tracking.
              </p>
            </div>
            <span className="badge badge-submitted">{applications.length} Records</span>
          </div>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>App #</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Date of Application</th>
                  <th>Country</th>
                  <th>Target Institution</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Missing Docs</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => {
                  const intake = getApplicationIntake(app, students);

                  return (
                    <tr key={app.id}>
                      <td><strong style={{ color: '#06b6d4' }}>{app.application_number}</strong></td>
                      <td style={{ minWidth: '210px' }}>{intake.email}</td>
                      <td style={{ fontWeight: 600 }}>{intake.name}</td>
                      <td>{intake.age}</td>
                      <td>{intake.gender}</td>
                      <td>{intake.applicationDate}</td>
                      <td>{intake.country}</td>
                      <td>{app.target_university}</td>
                      <td style={{ fontSize: '0.8rem' }}>{app.degree_program}</td>
                      <td><span className={`badge badge-${app.status}`}>{app.status}</span></td>
                      <td>
                        {app.missing_documents_count > 0 ? (
                          <span className="badge badge-documents_missing">{app.missing_documents_count} Flagged</span>
                        ) : (
                          <span className="badge badge-documents_verified">0 Flagged</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => setSelectedApp(app)} className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem' }}>
                          <Eye style={{ width: '12px', height: '12px' }} />
                          Verify Documents
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

      {/* Data Applications Recycle Bin */}
      <div id="data-apps-trash">
        <TrashBin departmentKey="data_applications" />
      </div>

    </div>
    </DashboardLayout>
  );
};
