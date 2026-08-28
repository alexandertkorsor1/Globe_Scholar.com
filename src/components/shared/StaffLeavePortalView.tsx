import React, { useState } from 'react';
import {
  CalendarOff,
  Calendar,
  Clock,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  X,
  FileCheck,
  Send,
  Download,
  Info,
  ShieldCheck,
  User,
  Building2,
  Phone,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';
import { HrLeaveRequest, HrLeaveType } from '../../types/database';

const LEAVE_TYPE_OPTIONS: Array<{ value: HrLeaveType; label: string; description: string }> = [
  { value: 'annual', label: '🏖️ Annual Leave / Vacation', description: 'Standard paid annual vacation time' },
  { value: 'sick', label: '🏥 Sick / Medical Leave', description: 'Medical treatment, recovery or illness' },
  { value: 'personal', label: '👤 Personal / Casual Leave', description: 'Urgent personal matters' },
  { value: 'emergency', label: '🚨 Emergency Leave', description: 'Unforeseen urgent family or personal emergency' },
  { value: 'maternity', label: '👶 Maternity / Paternity Leave', description: 'Parental time-off for childbirth & care' },
  { value: 'compassionate', label: '🕊️ Compassionate / Bereavement', description: 'Family bereavement or critical illness' },
  { value: 'study', label: '📚 Study / Examination Leave', description: 'Academic exams, certifications or training' },
  { value: 'official_duty', label: '✈️ Official Duty / Travel', description: 'External assignment or university representation' },
  { value: 'unpaid', label: '💼 Unpaid Leave', description: 'Approved leave without salary entitlement' },
];

export const StaffLeavePortalView: React.FC = () => {
  const { currentProfile } = useAuth();
  const { hrLeaveRequests, submitHrLeaveRequest } = useApplication();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeaveDossier, setSelectedLeaveDossier] = useState<HrLeaveRequest | null>(null);
  const [viewingPdfDoc, setViewingPdfDoc] = useState<{ url: string; name: string } | null>(null);

  // Form State
  const [leaveType, setLeaveType] = useState<HrLeaveType>('annual');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [returnTime, setReturnTime] = useState('17:00');
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<{ url: string; name: string; size: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Filter State
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Filter leave requests for the logged-in employee
  const myLeaves = (hrLeaveRequests || []).filter(
    (req) => req.created_by === currentProfile.id || req.employee_email?.toLowerCase() === currentProfile.email?.toLowerCase()
  );

  const filteredLeaves = myLeaves.filter((req) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'rejected') return req.status === 'rejected' || req.status === 'denied';
    return req.status === statusFilter;
  });

  const pendingCount = myLeaves.filter((r) => r.status === 'pending').length;
  const approvedCount = myLeaves.filter((r) => r.status === 'approved').length;
  const rejectedCount = myLeaves.filter((r) => r.status === 'rejected' || r.status === 'denied').length;

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Please select a valid PDF document (e.g. doctor note, leave letter, or proof).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError('PDF file size exceeds 10 MB limit. Please upload a smaller file.');
      return;
    }

    setFormError('');
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      const sizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
      setPdfFile({
        url: base64Url,
        name: file.name,
        size: sizeFormatted
      });
    };
    reader.readAsDataURL(file);
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!startDate || !endDate) {
      setFormError('Please provide both leave departure and return dates.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setFormError('Return date cannot be earlier than leave start date.');
      return;
    }

    if (!reason.trim()) {
      setFormError('Please provide a clear reason or description for your leave request.');
      return;
    }

    setSubmitting(true);
    try {
      await submitHrLeaveRequest({
        employee_name: currentProfile.full_name || 'Staff Member',
        employee_email: currentProfile.email || '',
        department: currentProfile.department || 'admin',
        leave_type: leaveType,
        start_date: startDate,
        start_time: startTime || '09:00',
        end_date: endDate,
        return_time: returnTime || '17:00',
        reason: reason.trim(),
        pdf_url: pdfFile?.url || null,
        pdf_name: pdfFile?.name || null,
        emergency_contact: emergencyContact.trim() || null,
        handover_notes: handoverNotes.trim() || null,
      });

      setFormSuccess('Your leave application has been submitted successfully to Administration and HR.');
      setShowApplyModal(false);
      // Reset form
      setReason('');
      setStartDate('');
      setEndDate('');
      setPdfFile(null);
      setEmergencyContact('');
      setHandoverNotes('');
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit leave application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header Banner */}
      <div className="glass-panel" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
                <CalendarOff size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Staff Leave & Time-Off Management Portal
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '3px 0 0' }}>
                  Apply for scheduled or emergency leave, attach supporting PDF documents, and track approval feedback from Administration.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setShowApplyModal(true);
              }}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem'
              }}
            >
              <Plus size={16} /> Apply for Leave
            </button>
          </div>
        </div>

        {/* Live Stat Summary Cards */}
        <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginTop: '20px' }}>
          <div
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: statusFilter === 'all' ? '#eff6ff' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Total Applications</span>
            <strong style={{ fontSize: '1.6rem', color: '#1e293b', display: 'block', marginTop: '2px' }}>{myLeaves.length}</strong>
            <span style={{ fontSize: '0.68rem', color: '#2563eb' }}>All time submitted</span>
          </div>

          <div
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid #fde68a',
              background: statusFilter === 'pending' ? '#fef3c7' : '#fffbeb',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, display: 'block' }}>Pending Review</span>
            <strong style={{ fontSize: '1.6rem', color: '#d97706', display: 'block', marginTop: '2px' }}>{pendingCount}</strong>
            <span style={{ fontSize: '0.68rem', color: '#b45309' }}>Awaiting Admin decision</span>
          </div>

          <div
            onClick={() => setStatusFilter('approved')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid #bbf7d0',
              background: statusFilter === 'approved' ? '#dcfce7' : '#f0fdf4',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 700, display: 'block' }}>Approved Leaves</span>
            <strong style={{ fontSize: '1.6rem', color: '#16a34a', display: 'block', marginTop: '2px' }}>{approvedCount}</strong>
            <span style={{ fontSize: '0.68rem', color: '#15803d' }}>Confirmed by Admin</span>
          </div>

          <div
            onClick={() => setStatusFilter('rejected')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              background: statusFilter === 'rejected' ? '#fee2e2' : '#fef2f2',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 700, display: 'block' }}>Rejected / Declined</span>
            <strong style={{ fontSize: '1.6rem', color: '#dc2626', display: 'block', marginTop: '2px' }}>{rejectedCount}</strong>
            <span style={{ fontSize: '0.68rem', color: '#b91c1c' }}>View Admin feedback</span>
          </div>
        </div>

        {formSuccess && (
          <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: '#dcfce7', border: '1px solid #86efac', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> {formSuccess}
          </div>
        )}
      </div>

      {/* Main Leave Applications Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={18} color="#2563eb" /> My Leave History & Approval Tracker
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Showing {filteredLeaves.length} leave application(s) for {currentProfile.full_name} ({currentProfile.department?.toUpperCase()})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Filter by:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                fontSize: '0.8rem',
                color: '#1e293b',
                outline: 'none',
                fontWeight: 600
              }}
            >
              <option value="all">All Statuses ({myLeaves.length})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="approved">Approved ({approvedCount})</option>
              <option value="rejected">Rejected ({rejectedCount})</option>
            </select>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <CalendarOff size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
            <h4 style={{ margin: 0, color: '#475569', fontSize: '1rem', fontWeight: 700 }}>No leave applications found.</h4>
            <p style={{ margin: '6px 0 16px', color: '#64748b', fontSize: '0.82rem' }}>
              {statusFilter === 'all'
                ? "You haven't submitted any leave requests yet. Click below to submit your first leave application."
                : `No leave applications matching status "${statusFilter}".`}
            </p>
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setShowApplyModal(true);
              }}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Apply for Leave Now
            </button>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Leave Departure</th>
                  <th>Expected Return</th>
                  <th>Duration</th>
                  <th>Attached PDF</th>
                  <th>Status & Decision</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((req) => {
                  const days = calculateDays(req.start_date, req.end_date);
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected' || req.status === 'denied';

                  return (
                    <tr key={req.id}>
                      <td>
                        <strong style={{ color: '#1e293b', fontSize: '0.86rem', display: 'block', textTransform: 'capitalize' }}>
                          {LEAVE_TYPE_OPTIONS.find(o => o.value === req.leave_type)?.label || req.leave_type}
                        </strong>
                        <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Ref: {req.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#2563eb" />
                          <strong style={{ color: '#1e293b', fontSize: '0.82rem' }}>{req.start_date}</strong>
                        </div>
                        <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Clock size={11} /> {req.start_time || '09:00 AM'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#10b981" />
                          <strong style={{ color: '#1e293b', fontSize: '0.82rem' }}>{req.end_date}</strong>
                        </div>
                        <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Clock size={11} /> {req.return_time || '05:00 PM'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-submitted" style={{ fontWeight: 700 }}>
                          {days} Day{days === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td>
                        {req.pdf_url ? (
                          <button
                            type="button"
                            onClick={() => setViewingPdfDoc({ url: req.pdf_url!, name: req.pdf_name || 'Leave_Request_Document.pdf' })}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#dc2626',
                              borderColor: '#fca5a5',
                              background: '#fef2f2'
                            }}
                            title="View Attached PDF Document"
                          >
                            <FileText size={13} /> {req.pdf_name ? (req.pdf_name.length > 18 ? req.pdf_name.slice(0, 15) + '...' : req.pdf_name) : 'View PDF'}
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>No PDF attached</span>
                        )}
                      </td>
                      <td>
                        <div>
                          <span
                            className={`badge ${
                              isApproved
                                ? 'badge-documents_verified'
                                : isRejected
                                ? 'badge-rejected'
                                : 'badge-documents_missing'
                            }`}
                            style={{ fontWeight: 700 }}
                          >
                            {isApproved ? '✅ Approved' : isRejected ? '❌ Rejected' : '⏳ Pending Review'}
                          </span>
                          {req.admin_notes && (
                            <div style={{ marginTop: '4px', fontSize: '0.72rem', color: isApproved ? '#15803d' : '#b91c1c', maxWidth: '200px', lineHeight: 1.2 }}>
                              <strong>Note:</strong> {req.admin_notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLeaveDossier(req)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Eye size={13} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply for Leave Modal */}
      {showApplyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '640px', maxHeight: '92vh', overflowY: 'auto', padding: '26px', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <CalendarOff size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                    Official Leave Application Form
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Submit for approval to Executive Administration & HR
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Applicant Info Banner */}
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="#2563eb" />
                  <strong style={{ fontSize: '0.86rem', color: '#1e293b' }}>{currentProfile.full_name}</strong>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>({currentProfile.email})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={15} color="#7c3aed" />
                  <span className="badge badge-under_review" style={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700 }}>
                    {currentProfile.department?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Leave Type */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.82rem' }}>
                  Select Leave Category <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  className="form-input"
                  required
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as HrLeaveType)}
                  style={{ color: '#1e293b', background: '#fff' }}
                >
                  {LEAVE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Dates & Times Grid */}
              <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Departure Date & Time */}
                <div style={{ padding: '12px', borderRadius: '10px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} /> Leave Start / Departure Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ background: '#fff', color: '#0f172a', marginBottom: '8px' }}
                  />
                  <label className="form-label" style={{ fontSize: '0.74rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Time of Departure
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ background: '#fff', color: '#0f172a' }}
                  />
                </div>

                {/* Return Date & Time */}
                <div style={{ padding: '12px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#15803d', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} /> Expected Return Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ background: '#fff', color: '#0f172a', marginBottom: '8px' }}
                  />
                  <label className="form-label" style={{ fontSize: '0.74rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Time of Return / Resume Duty
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    style={{ background: '#fff', color: '#0f172a' }}
                  />
                </div>
              </div>

              {startDate && endDate && (
                <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, padding: '6px 12px', background: '#eff6ff', borderRadius: '8px' }}>
                  ⏱️ Total Requested Duration: <strong>{calculateDays(startDate, endDate)} Day(s)</strong>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.82rem' }}>
                  Reason & Purpose of Leave <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide details regarding your leave request, duties handover, or specific reasons..."
                  style={{ color: '#1e293b', background: '#fff', resize: 'vertical' }}
                />
              </div>

              {/* PDF Document Attachment (Requested by User) */}
              <div style={{ padding: '14px', borderRadius: '12px', background: '#fdf2f8', border: '1px dashed #f472b6' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#be185d', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> Supporting PDF Document (Leave Letter / Medical Doctor Note / Proof)
                </label>
                <p style={{ fontSize: '0.74rem', color: '#9d174d', margin: '0 0 10px' }}>
                  Upload a PDF copy of your formal leave letter, hospital/medical certificate, or official travel order.
                </p>

                {pdfFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={20} color="#db2777" />
                      <div>
                        <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>{pdfFile.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>PDF Document • {pdfFile.size}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setViewingPdfDoc(pdfFile)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#2563eb' }}
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                      >
                        <X size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px dashed #f472b6', cursor: 'pointer' }}>
                    <Upload size={22} color="#db2777" style={{ marginBottom: '6px' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#be185d' }}>
                      Click to choose PDF document (Max 10 MB)
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                      Supported format: .pdf
                    </span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              {/* Handover & Emergency Contact */}
              <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.78rem' }}>
                    Emergency Contact Number / Phone
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. +231 770 123 456"
                    style={{ background: '#fff', color: '#0f172a' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.78rem' }}>
                    Handover Colleague / Notes
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="e.g. Handing active queue to Sarah"
                    style={{ background: '#fff', color: '#0f172a' }}
                  />
                </div>
              </div>

              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none' }}
                >
                  <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Leave Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Details / Dossier Modal */}
      {selectedLeaveDossier && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#fff', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOff size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>
                  Leave Application Dossier
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeaveDossier(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Status Banner */}
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: selectedLeaveDossier.status === 'approved' ? '#dcfce7' : (selectedLeaveDossier.status === 'rejected' || selectedLeaveDossier.status === 'denied') ? '#fee2e2' : '#fef3c7',
                border: `1px solid ${selectedLeaveDossier.status === 'approved' ? '#86efac' : (selectedLeaveDossier.status === 'rejected' || selectedLeaveDossier.status === 'denied') ? '#fca5a5' : '#fde68a'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Approval Status</span>
                  <strong style={{ fontSize: '1rem', color: selectedLeaveDossier.status === 'approved' ? '#15803d' : (selectedLeaveDossier.status === 'rejected' || selectedLeaveDossier.status === 'denied') ? '#b91c1c' : '#b45309', textTransform: 'capitalize' }}>
                    {selectedLeaveDossier.status === 'approved' ? '✅ Approved' : (selectedLeaveDossier.status === 'rejected' || selectedLeaveDossier.status === 'denied') ? '❌ Rejected' : '⏳ Pending Review'}
                  </strong>
                </div>
                {selectedLeaveDossier.reviewed_at && (
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Decided on: {new Date(selectedLeaveDossier.reviewed_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {selectedLeaveDossier.admin_notes && (
                <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700, display: 'block' }}>Administrator Feedback / Notes:</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#0f172a' }}>{selectedLeaveDossier.admin_notes}</p>
                </div>
              )}

              {/* Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Leave Category</span>
                  <strong style={{ fontSize: '0.84rem', color: '#1e293b' }}>
                    {LEAVE_TYPE_OPTIONS.find(o => o.value === selectedLeaveDossier.leave_type)?.label || selectedLeaveDossier.leave_type}
                  </strong>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Total Duration</span>
                  <strong style={{ fontSize: '0.84rem', color: '#2563eb' }}>
                    {calculateDays(selectedLeaveDossier.start_date, selectedLeaveDossier.end_date)} Day(s)
                  </strong>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Departure Date & Time</span>
                  <strong style={{ fontSize: '0.84rem', color: '#1e293b' }}>
                    {selectedLeaveDossier.start_date} at {selectedLeaveDossier.start_time || '09:00 AM'}
                  </strong>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Expected Return Date & Time</span>
                  <strong style={{ fontSize: '0.84rem', color: '#1e293b' }}>
                    {selectedLeaveDossier.end_date} at {selectedLeaveDossier.return_time || '05:00 PM'}
                  </strong>
                </div>
              </div>

              {/* Reason */}
              <div style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Reason for Leave:</span>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.4 }}>
                  {selectedLeaveDossier.reason || 'No description provided.'}
                </p>
              </div>

              {/* Handover & Emergency */}
              {(selectedLeaveDossier.emergency_contact || selectedLeaveDossier.handover_notes) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {selectedLeaveDossier.emergency_contact && (
                    <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Emergency Phone:</span>
                      <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{selectedLeaveDossier.emergency_contact}</strong>
                    </div>
                  )}
                  {selectedLeaveDossier.handover_notes && (
                    <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Handover Colleague:</span>
                      <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{selectedLeaveDossier.handover_notes}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Attached PDF */}
              {selectedLeaveDossier.pdf_url && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#dc2626" />
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>
                        {selectedLeaveDossier.pdf_name || 'Leave_Attachment.pdf'}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>PDF Document</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingPdfDoc({ url: selectedLeaveDossier.pdf_url!, name: selectedLeaveDossier.pdf_name || 'Leave_Attachment.pdf' })}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Eye size={12} /> View PDF
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedLeaveDossier(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen In-App PDF Document Viewer */}
      {viewingPdfDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '850px', height: '90vh', display: 'flex', flexDirection: 'column', background: '#0f172a', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#f43f5e" />
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '0.94rem' }}>{viewingPdfDoc.name}</h4>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Supporting Leave Document Preview</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <a
                  href={viewingPdfDoc.url}
                  download={viewingPdfDoc.name}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#38bdf8' }}
                >
                  <Download size={13} /> Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => setViewingPdfDoc(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, background: '#334155' }}>
              <iframe
                src={viewingPdfDoc.url}
                title={viewingPdfDoc.name}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
