import React from 'react';
import { Application, FinancialRecord, Student } from '../../types/database';
import {
  formatRegisterDate,
  getApplicationIntake,
  getRegistrationFeeSummary,
} from '../../lib/department-registers';

interface CrmRegisterProps {
  applications: Application[];
  students: Student[];
  financialRecords: FinancialRecord[];
  title?: string;
  description?: string;
  filterType?: 'all' | 'students' | 'pending' | 'decided';
  onFilterChange?: (filter: 'all' | 'students' | 'pending' | 'decided') => void;
  onDeleteApplication?: (appId: string) => void;
}

const ownerForStatus = (status: Application['status']) => {
  if (['admissions_review', 'decision_pending', 'approved', 'rejected'].includes(status)) {
    return 'Admissions';
  }

  if (['ready_for_processing', 'submitted_to_institution'].includes(status)) {
    return 'Operations';
  }

  if (['documents_missing', 'documents_verified', 'under_review', 'submitted'].includes(status)) {
    return 'Data & Applications';
  }

  return 'Counseling / Data Intake';
};

const nextActionForApplication = (application: Application, feeStatus: string) => {
  if (application.missing_documents_count > 0) {
    return `Collect ${application.missing_documents_count} missing document(s)`;
  }

  if (!application.handed_off_to_admissions && feeStatus === 'not_submitted') {
    return 'Confirm fee and route when ready';
  }

  if (feeStatus === 'pending') {
    return 'Finance payment verification';
  }

  if (application.status === 'admissions_review') {
    return 'Admissions decision follow-up';
  }

  if (application.status === 'approved') {
    return 'Prepare final onboarding';
  }

  return 'Continue student follow-up';
};

export const CrmRegister: React.FC<CrmRegisterProps> = ({
  applications,
  students,
  financialRecords,
  title = 'CRM Student Pipeline Register',
  description = 'Central relationship view for every student lead, application status, payment signal, department owner, and next action.',
  filterType = 'all',
  onFilterChange,
  onDeleteApplication,
}) => {
  // Build the filtered list first, then deduplicate by student_id so each
  // student appears exactly once — keeping their most recently touched application.
  const preFiltered = applications.filter((app) => {
    if (filterType === 'all') return true;
    const intake = getApplicationIntake(app, students);

    if (filterType === 'students') return !!intake.student;
    if (filterType === 'pending') return !['approved', 'rejected'].includes(app.status);
    if (filterType === 'decided') return ['approved', 'rejected'].includes(app.status);
    return true;
  });

  // One row per student_id — keep the application with the latest timestamp.
  const seenStudents = new Map<string, Application>();
  for (const app of preFiltered) {
    const key = app.student_id || app.id; // fallback to app id when student_id absent
    const existing = seenStudents.get(key);
    if (!existing) {
      seenStudents.set(key, app);
    } else {
      // Replace if this app was touched more recently
      const existingTs = new Date(existing.updated_at || existing.created_at || 0).getTime();
      const appTs = new Date(app.updated_at || app.created_at || 0).getTime();
      if (appTs > existingTs) seenStudents.set(key, app);
    }
  }
  const filteredApps = Array.from(seenStudents.values());

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: '1rem', color: '#fff' }}>{title}</h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', marginBottom: 0 }}>{description}</p>
        </div>
        <span className="badge badge-submitted">{filteredApps.length} CRM Records</span>
      </div>

      {/* Filter Selector Tabs */}
      {onFilterChange && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '8px', width: 'fit-content' }}>
          {[
            { id: 'all', label: 'All Applications' },
            { id: 'students', label: 'Active Students' },
            { id: 'pending', label: 'Pending Reviews' },
            { id: 'decided', label: 'Approved / Rejected' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id as any)}
              className="btn btn-sm"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                background: filterType === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                borderColor: filterType === tab.id ? '#60a5fa' : 'transparent',
                color: filterType === tab.id ? '#60a5fa' : '#94a3b8',
                fontWeight: filterType === tab.id ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>CRM / App #</th>
              <th>Student</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Country</th>
              <th>Target Institution</th>
              <th>Stage</th>
              <th>Payment</th>
              <th>Department Owner</th>
              <th>Last Touch</th>
              <th>Next Action</th>
              {onDeleteApplication && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredApps.map((application) => {
              const intake = getApplicationIntake(application, students);
              const fee = getRegistrationFeeSummary(application.id, financialRecords);
              const owner = ownerForStatus(application.status);

              return (
                <tr key={application.id}>
                  <td><strong style={{ color: '#2563eb' }}>{application.application_number}</strong></td>
                  <td style={{ fontWeight: 700 }}>{intake.name}</td>
                  <td style={{ minWidth: '210px' }}>{intake.email}</td>
                  <td>{intake.phone}</td>
                  <td>{intake.country}</td>
                  <td>{application.target_university}</td>
                  <td><span className={`badge badge-${application.status}`}>{application.status.replace(/_/g, ' ')}</span></td>
                  <td>
                    <span className={`badge badge-${fee.isCleared ? 'approved' : fee.status === 'pending' ? 'under_review' : 'draft'}`}>
                      {fee.isCleared ? 'paid' : fee.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{owner}</td>
                  <td>{formatRegisterDate(application.updated_at || application.created_at)}</td>
                  <td style={{ minWidth: '220px' }}>{nextActionForApplication(application, fee.status)}</td>
                  {onDeleteApplication && (
                    <td>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete application ${application.application_number}?`)) {
                            onDeleteApplication(application.id);
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {filteredApps.length === 0 && (
              <tr>
                <td colSpan={onDeleteApplication ? 12 : 11} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                  No CRM records match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
