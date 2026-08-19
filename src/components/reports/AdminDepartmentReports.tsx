import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Download,
  FileSearch,
  FileText,
  MessageSquareText,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  DepartmentReport,
  DepartmentReportStatus,
  DepartmentType,
} from '../../types/database';

interface AdminDepartmentReportsProps {
  department: DepartmentType;
  reports: DepartmentReport[];
  staffCount: number;
  onOpenFile: (report: DepartmentReport) => Promise<string>;
  onReview: (
    reportId: string,
    status: DepartmentReportStatus,
    adminNote: string
  ) => Promise<DepartmentReport>;
}

const departmentLabel = (department: DepartmentType) =>
  department.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const reportStatus = (status: DepartmentReportStatus) => {
  if (status === 'approved') {
    return { label: 'Reviewed', color: '#047857', background: '#ecfdf5' };
  }

  if (status === 'needs_revision') {
    return { label: 'Follow-up requested', color: '#b45309', background: '#fffbeb' };
  }

  if (status === 'under_review') {
    return { label: 'Under review', color: '#6d28d9', background: '#f5f3ff' };
  }

  if (status === 'resubmitted') {
    return { label: 'Resubmitted', color: '#0369a1', background: '#f0f9ff' };
  }

  return { label: 'Awaiting review', color: '#1d4ed8', background: '#eff6ff' };
};

const fileSize = (size: number) =>
  size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;

export const AdminDepartmentReports: React.FC<AdminDepartmentReportsProps> = ({
  department,
  reports,
  staffCount,
  onOpenFile,
  onReview,
}) => {
  const [selectedReport, setSelectedReport] = useState<DepartmentReport | null>(null);
  const [reviewStatus, setReviewStatus] = useState<DepartmentReportStatus>('approved');
  const [adminNote, setAdminNote] = useState('');
  const [openingFile, setOpeningFile] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [actionError, setActionError] = useState('');

  const awaitingReview = useMemo(
    () => reports.filter((report) => ['submitted', 'resubmitted'].includes(report.status)).length,
    [reports]
  );
  const mostRecentReport = reports[0];

  const openReport = (report: DepartmentReport) => {
    setSelectedReport(report);
    setReviewStatus(
      ['submitted', 'resubmitted', 'under_review'].includes(report.status)
        ? 'approved'
        : report.status
    );
    setAdminNote(report.review_comment || '');
    setActionError('');
  };

  const handleOpenFile = async (report: DepartmentReport) => {
    setActionError('');
    setOpeningFile(true);

    try {
      const url = await onOpenFile(report);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'The attached report file could not be opened.'
      );
    } finally {
      setOpeningFile(false);
    }
  };

  const handleReview = async () => {
    if (!selectedReport) return;

    setActionError('');
    setSavingReview(true);

    try {
      const reviewedReport = await onReview(
        selectedReport.id,
        reviewStatus,
        adminNote
      );
      setSelectedReport(reviewedReport);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'The report review could not be saved.'
      );
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <>
      <section
        style={{
          marginBottom: '22px',
          padding: '18px',
          borderRadius: '14px',
          border: '1px solid #dbe5f3',
          background: 'linear-gradient(135deg, #f8fbff, #ffffff)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8' }}>
              <FileSearch size={19} />
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em' }}>DEPARTMENT REPORT CENTRE</span>
            </div>
            <h4 style={{ margin: '7px 0 0', color: '#17223b', fontSize: '18px' }}>
              {departmentLabel(department)} reports
            </h4>
            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px' }}>
              Official reports, supporting files, and the administrative review trail.
            </p>
          </div>
          <span style={{ padding: '7px 10px', borderRadius: '999px', background: awaitingReview ? '#fff7ed' : '#ecfdf5', color: awaitingReview ? '#c2410c' : '#047857', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
            {awaitingReview ? `${awaitingReview} awaiting review` : 'Review queue clear'}
          </span>
        </div>

        <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Reports received', value: reports.length, accent: '#1d4ed8' },
            { label: 'Active staff', value: staffCount, accent: '#7c3aed' },
            { label: 'Latest submission', value: mostRecentReport ? new Date(mostRecentReport.created_at).toLocaleDateString() : '—', accent: '#0f766e' },
          ].map((metric) => (
            <div key={metric.label} style={{ borderRadius: '10px', border: '1px solid #e5eaf3', background: '#ffffff', padding: '12px' }}>
              <span style={{ display: 'block', color: '#64748b', fontSize: '12px' }}>{metric.label}</span>
              <strong style={{ display: 'block', marginTop: '5px', color: metric.accent, fontSize: '18px' }}>{metric.value}</strong>
            </div>
          ))}
        </div>

        {reports.length === 0 ? (
          <div style={{ padding: '24px', borderRadius: '10px', border: '1px dashed #cbd5e1', background: '#ffffff', textAlign: 'center' }}>
            <FileText size={22} color="#94a3b8" />
            <p style={{ margin: '8px 0 0', color: '#475569', fontWeight: 700 }}>No report submitted yet</p>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>Reports submitted by this department will appear here immediately.</p>
          </div>
        ) : (
          <div className="custom-table-container" style={{ background: '#ffffff', border: '1px solid #e5eaf3', borderRadius: '10px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Reporting period</th>
                  <th>Submitted by</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const status = reportStatus(report.status);
                  const attachment = report.attachments[0];
                  return (
                    <tr key={report.id}>
                      <td>
                        <strong style={{ display: 'block', color: '#1d2a44' }}>{report.title}</strong>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>
                          {attachment
                            ? `${attachment.file_name} · ${fileSize(attachment.file_size || 0)}`
                            : 'No supporting file attached'}
                        </span>
                      </td>
                      <td style={{ color: '#475569', fontSize: '13px' }}>
                        {new Date(`${report.reporting_period_start}T00:00:00`).toLocaleDateString()} – {new Date(`${report.reporting_period_end}T00:00:00`).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{ display: 'block', color: '#334155', fontSize: '13px' }}>{report.submitted_by_name}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(report.created_at).toLocaleString()}</span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', padding: '5px 8px', borderRadius: '999px', color: status.color, background: status.background, fontSize: '12px', fontWeight: 800 }}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <button type="button" onClick={() => openReport(report)} className="btn btn-secondary btn-sm">
                          <FileSearch size={14} />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedReport && (
        <div role="dialog" aria-modal="true" aria-labelledby="admin-report-detail-title" style={{ position: 'fixed', inset: 0, zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(15, 23, 42, 0.62)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '850px', margin: 'auto', borderRadius: '18px', background: '#f8fafc', border: '1px solid #dbe5f3', boxShadow: '0 24px 64px rgba(15,23,42,.35)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '21px 24px', background: '#102a5c', color: '#ffffff' }}>
              <div>
                <span style={{ color: '#bfdbfe', fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em' }}>{departmentLabel(selectedReport.department)} · ADMIN REVIEW</span>
                <h2 id="admin-report-detail-title" style={{ margin: '6px 0 0', fontSize: '20px' }}>{selectedReport.title}</h2>
                <p style={{ margin: '5px 0 0', color: '#dbeafe', fontSize: '13px' }}>Submitted by {selectedReport.submitted_by_name} on {new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => setSelectedReport(null)} aria-label="Close report review" style={{ border: 0, borderRadius: '8px', padding: '7px', color: '#ffffff', background: 'rgba(255,255,255,.12)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', maxHeight: '72vh', overflowY: 'auto' }}>
              {actionError && <div role="alert" style={{ padding: '10px 12px', marginBottom: '16px', borderRadius: '10px', background: '#fff1f2', color: '#b42318', fontSize: '13px' }}>{actionError}</div>}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #dbe5f3', marginBottom: '18px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}><FileText size={18} color="#1d4ed8" />{selectedReport.attachments[0] ? `${selectedReport.attachments[0].file_name} · ${fileSize(selectedReport.attachments[0].file_size || 0)}` : 'No supporting file attached'}</span>
                <button type="button" onClick={() => handleOpenFile(selectedReport)} disabled={openingFile || selectedReport.attachments.length === 0} className="btn btn-primary btn-sm"><Download size={14} />{openingFile ? 'Opening…' : 'Open file'}</button>
              </div>

              <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '16px' }}>
                {[
                  ['Executive summary', selectedReport.executive_summary || 'No executive summary was recorded.'],
                  ['Key activities', selectedReport.key_activities || 'No key activities were recorded.'],
                  ['Key achievements', selectedReport.achievements || 'No achievements were recorded.'],
                  ['Risks or blockers', selectedReport.challenges || 'No risks or blockers were recorded.'],
                  ['Next steps', selectedReport.recommendations || 'No next steps were recorded.'],
                ].map(([label, content]) => (
                  <div key={label} style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e4eaf4', background: '#ffffff' }}>
                    <h3 style={{ margin: 0, color: '#315aab', fontSize: '13px' }}>{label}</h3>
                    <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '13px', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{content}</p>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', marginBottom: '12px' }}><MessageSquareText size={18} /><strong>Administrative review</strong></div>
                <div className="dashboard-responsive-grid department-report-review-grid" style={{ display: 'grid', gridTemplateColumns: '190px minmax(0, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#34415a', fontSize: '12px', fontWeight: 800 }}>Review outcome</label>
                    <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value as DepartmentReportStatus)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #bcd0ee', background: '#ffffff', color: '#1e293b' }}>
                      <option value="approved">Reviewed and approved</option>
                      <option value="needs_revision">Request follow-up</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#34415a', fontSize: '12px', fontWeight: 800 }}>Response to department</label>
                    <textarea rows={3} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Add feedback, approvals, or requested actions…" style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #bcd0ee', background: '#ffffff', color: '#1e293b', resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="button" onClick={handleReview} disabled={savingReview} className="btn btn-primary btn-sm"><CheckCircle2 size={14} />{savingReview ? 'Saving…' : 'Save review'}</button>
                </div>
              </div>

              {selectedReport.reviewed_at && <p style={{ margin: '13px 0 0', color: '#64748b', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}><Clock3 size={14} />Last reviewed by {selectedReport.reviewed_by_name || 'an administrator'} on {new Date(selectedReport.reviewed_at).toLocaleString()}.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
