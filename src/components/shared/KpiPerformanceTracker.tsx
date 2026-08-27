import React, { useMemo, useState } from 'react';
import {
  DepartmentKpiInput,
  DepartmentKpiRecord,
  DepartmentMember,
  DepartmentType,
  Profile,
} from '../../types/database';

const KPI_DEPARTMENTS: Array<{ value: DepartmentType; label: string }> = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'counseling', label: 'Counseling' },
  { value: 'admissions', label: 'Admissions' },
  { value: 'data_applications', label: 'Data & Applications' },
  { value: 'operations', label: 'Operations' },
  { value: 'country_directors', label: 'Country Directors' },
  { value: 'finance', label: 'Finance' },
  { value: 'management', label: 'Management' },
  { value: 'institutional_relations', label: 'Institutional Relations' },
  { value: 'human_resources', label: 'Human Resources' },
];

const emptyKpiInput: DepartmentKpiInput = {
  evaluation_period: new Date().toISOString().slice(0, 7),
  staff_name: '',
  staff_email: '',
  department: 'data_applications',
  role_title: '',
  kpi_lead_management: 0,
  kpi_conversion: 0,
  kpi_communications: 0,
  kpi_reporting: 0,
  kpi_teamwork: 0,
  kpi_discipline: 0,
  daily_report_submitted: false,
  weekly_report_submitted: false,
  monthly_report_submitted: false,
  consecutive_missed_reports: 0,
  formal_review_required: false,
  notes_actions: '',
};

const departmentLabel = (department: DepartmentType) =>
  KPI_DEPARTMENTS.find((item) => item.value === department)?.label ||
  department.replace(/_/g, ' ');

const ratingTone = (rating: string) => {
  if (rating === 'Excellent' || rating === 'Very Good') return 'approved';
  if (rating === 'Good') return 'submitted';
  if (rating === 'Needs Improvement') return 'documents_missing';
  return 'rejected';
};

interface KpiPerformanceTrackerProps {
  records: DepartmentKpiRecord[];
  currentProfile: Profile;
  departmentMembers?: DepartmentMember[];
  onSave?: (input: DepartmentKpiInput, id?: string) => Promise<DepartmentKpiRecord>;
  onDelete?: (id: string) => Promise<void>;
}

export const KpiPerformanceTracker: React.FC<KpiPerformanceTrackerProps> = ({
  records,
  currentProfile,
  departmentMembers = [],
  onSave,
  onDelete,
}) => {
  const canManage = currentProfile.department === 'operations' && currentProfile.account_type === 'staff';
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<DepartmentKpiInput>(emptyKpiInput);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const visibleRecords = useMemo(() => {
    if (currentProfile.is_admin || currentProfile.department === 'operations') {
      return records;
    }

    return records.filter((record) => record.department === currentProfile.department);
  }, [currentProfile.department, currentProfile.is_admin, records]);

  const staffSuggestions = useMemo(
    () =>
      departmentMembers
        .filter((member) =>
          member.employment_status !== 'inactive' &&
          member.departments.includes(form.department)
        )
        .map((member) => `${member.full_name} — ${member.job_title}`),
    [departmentMembers, form.department]
  );

  const openCreateForm = () => {
    setEditingId(undefined);
    setForm({
      ...emptyKpiInput,
      evaluation_period: new Date().toISOString().slice(0, 7),
    });
    setMessage('');
    setShowForm(true);
  };

  const openEditForm = (record: DepartmentKpiRecord) => {
    setEditingId(record.id);
    setForm({
      evaluation_period: record.evaluation_period,
      staff_name: record.staff_name,
      staff_email: record.staff_email || '',
      department: record.department,
      role_title: record.role_title,
      kpi_lead_management: record.kpi_lead_management,
      kpi_conversion: record.kpi_conversion,
      kpi_communications: record.kpi_communications,
      kpi_reporting: record.kpi_reporting,
      kpi_teamwork: record.kpi_teamwork,
      kpi_discipline: record.kpi_discipline,
      daily_report_submitted: record.daily_report_submitted,
      weekly_report_submitted: record.weekly_report_submitted,
      monthly_report_submitted: record.monthly_report_submitted,
      consecutive_missed_reports: record.consecutive_missed_reports,
      formal_review_required: record.formal_review_required,
      notes_actions: record.notes_actions || '',
    });
    setMessage('');
    setShowForm(true);
  };

  const updateNumber = (field: keyof DepartmentKpiInput, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: Number(value),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onSave) return;

    setSaving(true);
    setMessage('');
    try {
      await onSave(form, editingId);
      setShowForm(false);
      setMessage(editingId ? 'KPI record updated.' : 'KPI record added.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The KPI record could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: DepartmentKpiRecord) => {
    if (!onDelete) return;
    if (!window.confirm(`Delete KPI record for ${record.staff_name}?`)) return;

    try {
      await onDelete(record.id);
      setMessage('KPI record deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The KPI record could not be deleted.');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: '1rem', color: '#fff' }}>
            GlobeScholars Pathways, LLC — KPI Performance Tracker
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Evaluation sheet scored by Operations. Departments see only their own KPI records; Admin can view every department.
          </p>
        </div>
        {canManage && (
          <button type="button" onClick={openCreateForm} className="btn btn-primary btn-sm">
            Add KPI Record
          </button>
        )}
      </div>

      {message && (
        <div role="status" style={{ marginBottom: '12px', color: message.includes('could not') || message.includes('Only') ? '#dc2626' : '#059669', fontSize: '0.82rem', fontWeight: 700 }}>
          {message}
        </div>
      )}

      {showForm && canManage && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '16px', marginBottom: '16px', display: 'grid', gap: '12px', background: 'rgba(15, 23, 42, 0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
            <label>
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Evaluation Period</span>
              <input type="month" value={form.evaluation_period} onChange={(event) => setForm({ ...form, evaluation_period: event.target.value })} required style={{ width: '100%', marginTop: '4px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </label>
            <label>
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Department</span>
              <select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value as DepartmentType })} style={{ width: '100%', marginTop: '4px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                {KPI_DEPARTMENTS.map((department) => (
                  <option key={department.value} value={department.value}>{department.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Staff Name</span>
              <input list="kpi-staff-suggestions" value={form.staff_name} onChange={(event) => setForm({ ...form, staff_name: event.target.value })} required placeholder="Staff full name" style={{ width: '100%', marginTop: '4px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <datalist id="kpi-staff-suggestions">
                {staffSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion.split(' — ')[0]} />
                ))}
              </datalist>
            </label>
            <label>
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Role / Title</span>
              <input value={form.role_title} onChange={(event) => setForm({ ...form, role_title: event.target.value })} required placeholder="Role or title" style={{ width: '100%', marginTop: '4px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '10px' }}>
            {[
              ['kpi_lead_management', 'Lead Mgmt', 20],
              ['kpi_conversion', 'Conversion', 25],
              ['kpi_communications', 'Comms', 15],
              ['kpi_reporting', 'Reporting', 15],
              ['kpi_teamwork', 'Teamwork', 10],
              ['kpi_discipline', 'Discipline', 15],
            ].map(([field, label, max]) => (
              <label key={field}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{label} / {max}</span>
                <input type="number" min={0} max={Number(max)} value={form[field as keyof DepartmentKpiInput] as number} onChange={(event) => updateNumber(field as keyof DepartmentKpiInput, event.target.value)} style={{ width: '100%', marginTop: '4px', padding: '8px 9px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </label>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', alignItems: 'center' }}>
            {[
              ['daily_report_submitted', 'Daily report submitted'],
              ['weekly_report_submitted', 'Weekly report submitted'],
              ['monthly_report_submitted', 'Monthly report submitted'],
              ['formal_review_required', 'Formal review required'],
            ].map(([field, label]) => (
              <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                <input type="checkbox" checked={Boolean(form[field as keyof DepartmentKpiInput])} onChange={(event) => setForm({ ...form, [field]: event.target.checked })} />
                {label}
              </label>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px' }}>
            <label>
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Missed Reports</span>
              <input type="number" min={0} value={form.consecutive_missed_reports} onChange={(event) => setForm({ ...form, consecutive_missed_reports: Number(event.target.value) })} style={{ width: '100%', marginTop: '4px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </label>
            <label>
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Notes / Actions</span>
              <input value={form.notes_actions || ''} onChange={(event) => setForm({ ...form, notes_actions: event.target.value })} placeholder="Improvement actions, praise, reminders, or review notes" style={{ width: '100%', marginTop: '4px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Saving...' : editingId ? 'Update KPI' : 'Save KPI'}
            </button>
          </div>
        </form>
      )}

      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Staff Name</th>
              <th>Department</th>
              <th>Role / Title</th>
              <th>KPI 1 Lead Mgmt (20 pts)</th>
              <th>KPI 2 Conversion (25 pts)</th>
              <th>KPI 3 Comms (15 pts)</th>
              <th>KPI 4 Reporting (15 pts)</th>
              <th>KPI 5 Teamwork (10 pts)</th>
              <th>KPI 6 Discipline (15 pts)</th>
              <th>Total Score</th>
              <th>Rating</th>
              <th>Daily Report Submitted?</th>
              <th>Weekly Report Submitted?</th>
              <th>Monthly Report Submitted?</th>
              <th>Consecutive Missed Reports</th>
              <th>Formal Review Required?</th>
              <th>Notes / Actions</th>
              <th>Last Updated</th>
              {canManage && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((record, index) => (
              <tr key={record.id}>
                <td>{index + 1}</td>
                <td style={{ fontWeight: 700 }}>{record.staff_name}</td>
                <td>{departmentLabel(record.department)}</td>
                <td>{record.role_title}</td>
                <td>{record.kpi_lead_management}</td>
                <td>{record.kpi_conversion}</td>
                <td>{record.kpi_communications}</td>
                <td>{record.kpi_reporting}</td>
                <td>{record.kpi_teamwork}</td>
                <td>{record.kpi_discipline}</td>
                <td><strong>{record.total_score}</strong></td>
                <td><span className={`badge badge-${ratingTone(record.rating)}`}>{record.rating}</span></td>
                <td>{record.daily_report_submitted ? 'Yes' : 'No'}</td>
                <td>{record.weekly_report_submitted ? 'Yes' : 'No'}</td>
                <td>{record.monthly_report_submitted ? 'Yes' : 'No'}</td>
                <td>{record.consecutive_missed_reports}</td>
                <td>{record.formal_review_required ? 'Yes' : 'No'}</td>
                <td style={{ minWidth: '240px' }}>{record.notes_actions || '—'}</td>
                <td>{new Date(record.updated_at).toLocaleDateString()}</td>
                {canManage && (
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => openEditForm(record)} className="btn btn-secondary btn-sm">Edit</button>
                      <button type="button" onClick={() => void handleDelete(record)} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {visibleRecords.length === 0 && (
              <tr>
                <td colSpan={canManage ? 20 : 19} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                  No KPI records are available for this view yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
