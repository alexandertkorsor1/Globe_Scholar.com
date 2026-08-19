import React, { useMemo, useState } from 'react';
import { FileText, Paperclip, Send, ShieldCheck, X } from 'lucide-react';
import {
  DepartmentReport,
  DepartmentReportSubmission,
  DepartmentType,
} from '../../types/database';

interface DepartmentReportModalProps {
  department: DepartmentType;
  onClose: () => void;
  onSubmit: (
    report: DepartmentReportSubmission,
    file: File
  ) => Promise<DepartmentReport>;
}

const departmentLabel = (department: DepartmentType) =>
  department.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export const DepartmentReportModal: React.FC<DepartmentReportModalProps> = ({
  department,
  onClose,
  onSubmit,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayValue = today.toISOString().slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const reportMonth = today.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const [draft, setDraft] = useState<DepartmentReportSubmission>({
    title: `${departmentLabel(department)} department report — ${reportMonth}`,
    reporting_period_start: monthStart,
    reporting_period_end: todayValue,
    executive_summary: '',
    key_activities: '',
    achievements: '',
    challenges: '',
    recommendations: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateDraft = (key: keyof DepartmentReportSubmission, value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const handleFile = (nextFile?: File) => {
    setError('');

    if (!nextFile) {
      setFile(null);
      return;
    }

    const permittedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'];
    const extension = nextFile.name.split('.').pop()?.toLowerCase();

    if (!extension || !permittedExtensions.includes(extension)) {
      setError('Attach a PDF, Word, Excel, or CSV report file.');
      setFile(null);
      return;
    }

    if (nextFile.size > 15 * 1024 * 1024) {
      setError('The report file must be 15 MB or smaller.');
      setFile(null);
      return;
    }

    setFile(nextFile);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!file) {
      setError('Attach the completed report file before submitting.');
      return;
    }

    if (draft.reporting_period_end < draft.reporting_period_start) {
      setError('The reporting period end date cannot be earlier than its start date.');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(draft, file);
      setSubmitted(true);
      window.setTimeout(onClose, 1100);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'The report could not be submitted. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d8e0ef',
    borderRadius: '10px',
    background: '#ffffff',
    color: '#16213a',
    padding: '10px 12px',
    font: 'inherit',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    color: '#34415a',
    fontSize: '13px',
    fontWeight: 700,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="department-report-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        background: 'rgba(15, 23, 42, 0.58)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          borderRadius: '18px',
          background: '#f8fafc',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.3)',
          border: '1px solid #d8e0ef',
          overflow: 'hidden',
          margin: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '22px 24px',
            background: 'linear-gradient(135deg, #102a5c, #1e40af)',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(255,255,255,0.15)',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: '#bfdbfe' }}>
                ADMIN REPORTING
              </p>
              <h2 id="department-report-title" style={{ margin: '4px 0 0', fontSize: '20px' }}>
                Submit {departmentLabel(department)} report
              </h2>
              <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#dbeafe' }}>
                Provide a clear operational update and attach the completed report file.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report submission"
            style={{
              border: 0,
              borderRadius: '8px',
              padding: '7px',
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              marginBottom: '20px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#166534',
              fontSize: '13px',
            }}
          >
            <ShieldCheck size={17} />
            Submitted reports are retained as an official record for admin review.
          </div>

          {error && (
            <div role="alert" style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '10px', background: '#fff1f2', color: '#b42318', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {submitted && (
            <div role="status" style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '10px', background: '#ecfdf5', color: '#166534', fontSize: '13px', fontWeight: 700 }}>
              Report submitted successfully. The admin review queue has been updated.
            </div>
          )}

          <div className="dashboard-responsive-grid department-report-form-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 160px 160px', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle} htmlFor="report-title">Report title</label>
              <input id="report-title" required maxLength={160} value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="period-start">Period start</label>
              <input id="period-start" type="date" required value={draft.reporting_period_start} onChange={(event) => updateDraft('reporting_period_start', event.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="period-end">Period end</label>
              <input id="period-end" type="date" required value={draft.reporting_period_end} onChange={(event) => updateDraft('reporting_period_end', event.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle} htmlFor="executive-summary">Executive summary</label>
            <textarea id="executive-summary" required minLength={10} rows={4} maxLength={3000} value={draft.executive_summary} onChange={(event) => updateDraft('executive_summary', event.target.value)} placeholder="What should the administrator know about department performance this period?" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle} htmlFor="key-activities">Key activities</label>
            <textarea id="key-activities" rows={3} maxLength={3000} value={draft.key_activities} onChange={(event) => updateDraft('key_activities', event.target.value)} placeholder="Major work completed, meetings held, cases processed, or partner activity…" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label style={labelStyle} htmlFor="achievements">Key achievements</label>
              <textarea id="achievements" rows={4} maxLength={3000} value={draft.achievements} onChange={(event) => updateDraft('achievements', event.target.value)} placeholder="Outcomes delivered, targets achieved…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="risks">Risks or blockers</label>
              <textarea id="risks" rows={4} maxLength={3000} value={draft.challenges} onChange={(event) => updateDraft('challenges', event.target.value)} placeholder="Escalations, dependencies, decisions needed…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="next-steps">Next steps</label>
              <textarea id="next-steps" rows={4} maxLength={3000} value={draft.recommendations} onChange={(event) => updateDraft('recommendations', event.target.value)} placeholder="Priorities and timing for the next period…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px',
              border: `1px dashed ${file ? '#22c55e' : '#9fb2d1'}`,
              borderRadius: '12px',
              background: file ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            <Paperclip size={20} color={file ? '#15803d' : '#315aab'} />
            <span style={{ flex: 1 }}>
              <strong style={{ display: 'block', color: '#1d2a44', fontSize: '14px' }}>
                {file ? file.name : 'Attach the completed report file'}
              </strong>
              <span style={{ color: '#64748b', fontSize: '12px' }}>
                {file ? `${formatBytes(file.size)} ready to submit` : 'PDF, Word, Excel, or CSV · Maximum 15 MB'}
              </span>
            </span>
            <span style={{ color: '#315aab', fontWeight: 800, fontSize: '13px' }}>
              {file ? 'Replace' : 'Choose file'}
            </span>
            <input type="file" required={!file} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" onChange={(event) => handleFile(event.target.files?.[0])} style={{ display: 'none' }} />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting || submitted} className="btn btn-primary">
              <Send size={16} />
              {submitting ? 'Submitting…' : 'Submit to admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
