import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  DepartmentType,
  WorkAssignment,
  WorkAssignmentStatus,
  WorkAssignmentPriority,
} from '../../types/database';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Download,
  FileText,
  X,
  Sparkles,
  Plus,
} from 'lucide-react';
import {
  downloadAssignmentPdf,
  downloadSubmissionPdf,
} from '../../lib/work-assignment-pdf';

interface DepartmentTaskInboxProps {
  /** When true, shows assignments across ALL departments (admin view). */
  showAll?: boolean;
  /** Override the title displayed above the table. */
  title?: string;
  /** Override the description text below the title. */
  description?: string;
}

const DEPARTMENT_LABELS: Record<DepartmentType, string> = {
  admin: 'Administration',
  marketing: 'Marketing',
  admissions: 'Admissions',
  counseling: 'Counseling',
  data_applications: 'Data & Applications',
  operations: 'Operations',
  finance: 'Finance',
  country_directors: 'Country Directors',
  it_support: 'IT Support',
  legal_compliance: 'Legal & Compliance',
  alumni_success: 'Alumni Success',
  management: 'Executive Management',
  institutional_relations: 'Institutional Relations',
  human_resources: 'Human Resources',
};

const STATUS_CONFIG: Record<
  WorkAssignmentStatus,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  assigned: {
    label: 'Assigned',
    badgeClass: 'badge-submitted',
    icon: <ClipboardList style={{ width: 10, height: 10 }} />,
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'badge-under_review',
    icon: <PlayCircle style={{ width: 10, height: 10 }} />,
  },
  completed: {
    label: 'Completed',
    badgeClass: 'badge-approved',
    icon: <CheckCircle2 style={{ width: 10, height: 10 }} />,
  },
  overdue: {
    label: 'Overdue',
    badgeClass: 'badge-rejected',
    icon: <AlertTriangle style={{ width: 10, height: 10 }} />,
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'badge-draft',
    icon: <XCircle style={{ width: 10, height: 10 }} />,
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  high: { label: 'High', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  medium: { label: 'Medium', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
  low: { label: 'Low', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
};

export const DepartmentTaskInbox: React.FC<DepartmentTaskInboxProps> = ({
  showAll = false,
  title,
  description,
}) => {
  const {
    workAssignments,
    workAssignmentComments,
    updateWorkAssignmentStatus,
    reviewWorkAssignment,
    addWorkAssignmentComment,
    createWorkAssignment,
  } = useApplication();
  const { currentProfile } = useAuth();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | WorkAssignmentStatus>('all');

  // Work Submission modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitAssignment, setSubmitAssignment] = useState<WorkAssignment | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submittingWork, setSubmittingWork] = useState(false);

  // Work Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAssignment, setReviewAssignment] = useState<WorkAssignment | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'revision_requested'>('approved');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Assign Work modal state
  const [showAssignWorkModal, setShowAssignWorkModal] = useState(false);
  const [waTitle, setWaTitle] = useState('');
  const [waPdfFile, setWaPdfFile] = useState<File | null>(null);
  const [waDepartment, setWaDepartment] = useState<DepartmentType>('admissions');
  const [waPriority, setWaPriority] = useState<WorkAssignmentPriority>('medium');
  const [waDueDate, setWaDueDate] = useState('');
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waError, setWaError] = useState('');

  // Local attachments cache
  const [attachments, setAttachments] = useState<Record<string, any[]>>({});

  const loadAttachments = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('department_work_attachments')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments((prev) => ({ ...prev, [assignmentId]: data || [] }));
    } catch (err) {
      console.error('Failed to load attachments:', err);
    }
  };

  const openSubmitModal = (assignment: WorkAssignment) => {
    setSubmitAssignment(assignment);
    setSubmissionNotes('');
    setSelectedFile(null);
    setShowSubmitModal(true);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitAssignment) return;
    setSubmittingWork(true);
    try {
      const cleanNotes = submissionNotes.trim() || 'Work completed successfully.';

      // 1. Handle File Upload if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const timestamp = Date.now();
        const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = `${currentProfile.department}/${currentProfile.id}/work-assignments/${submitAssignment.id}/${timestamp}_${cleanFileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('department-reports')
          .upload(storagePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: selectedFile.type || 'application/pdf',
          });

        if (uploadErr) throw new Error(`File upload failed: ${uploadErr.message}`);

        const { error: attachErr } = await supabase
          .from('department_work_attachments')
          .insert({
            assignment_id: submitAssignment.id,
            uploaded_by: currentProfile.id,
            file_name: selectedFile.name,
            file_path: storagePath,
            file_type: selectedFile.type || 'application/pdf',
            file_size: selectedFile.size,
          });

        if (attachErr) throw new Error(`Failed to save attachment metadata: ${attachErr.message}`);
      }

      // 2. Add submission comment/notes
      await addWorkAssignmentComment(submitAssignment.id, `[SUBMISSION] ${cleanNotes}`);

      // 3. Update status to completed
      await updateWorkAssignmentStatus(submitAssignment.id, 'completed');

      // Reload attachments list
      await loadAttachments(submitAssignment.id);

      // Close modal
      setShowSubmitModal(false);
      setSubmitAssignment(null);
      setSubmissionNotes('');
      setSelectedFile(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit work.');
    } finally {
      setSubmittingWork(false);
    }
  };

  const openReviewModal = (assignment: WorkAssignment) => {
    setReviewAssignment(assignment);
    setReviewNotes('');
    setReviewDecision('approved');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAssignment) return;
    setSubmittingReview(true);
    try {
      const cleanNotes = reviewNotes.trim() || (reviewDecision === 'approved' ? 'Work approved by reviewer.' : 'Revision requested by reviewer.');
      await reviewWorkAssignment(reviewAssignment.id, reviewDecision, cleanNotes);
      setShowReviewModal(false);
      setReviewAssignment(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

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
      const newAssignment = await createWorkAssignment(
        waTitle,
        `[PDF Assignment Instructions] ${waPdfFile.name}`,
        waDepartment,
        waPriority,
        waDueDate || undefined
      );

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

  // Filter assignments based on department or showAll
  const filteredAssignments = workAssignments.filter((a) => {
    if (showAll) return true;
    return a.assigned_department === currentProfile.department;
  });

  const visibleAssignments = filteredAssignments.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const totalCount = filteredAssignments.length;
  const assignedCount = filteredAssignments.filter((a) => a.status === 'assigned').length;
  const inProgressCount = filteredAssignments.filter((a) => a.status === 'in_progress').length;
  const completedCount = filteredAssignments.filter((a) => a.status === 'completed').length;
  const overdueCount = filteredAssignments.filter((a) => a.status === 'overdue').length;

  const toggleExpand = (id: string) => {
    const nextExpanded = expandedId === id ? null : id;
    setExpandedId(nextExpanded);
    setCommentText('');
    if (nextExpanded) {
      loadAttachments(nextExpanded);
    }
  };

  const handleStatusUpdate = async (assignment: WorkAssignment, newStatus: WorkAssignmentStatus) => {
    setUpdatingStatus(assignment.id);
    try {
      await updateWorkAssignmentStatus(assignment.id, newStatus);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAddComment = async (assignmentId: string) => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      await addWorkAssignmentComment(assignmentId, commentText);
      setCommentText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add comment.');
    } finally {
      setSendingComment(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (a: WorkAssignment) => {
    if (!a.due_date || a.status === 'completed' || a.status === 'cancelled') return false;
    return new Date(a.due_date) < new Date();
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList style={{ width: 20, height: 20, color: '#4f46e5' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>
              {title || (showAll ? 'All Department Work Assignments' : 'Assigned Tasks from Operations')}
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
            {description ||
              (showAll
                ? 'Full oversight of all work assignments dispatched by Operations to departments.'
                : 'Tasks assigned to your department by the Operations team. Update status and add comments as you progress.')}
          </p>
        </div>
        {(currentProfile?.department === 'admin' ||
          currentProfile?.is_admin ||
          currentProfile?.department === 'operations' ||
          currentProfile?.department === 'management') && (
          <button
            onClick={() => setShowAssignWorkModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
          >
            <Plus style={{ width: '12px', height: '12px' }} />
            Assign Work
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: statusFilter === 'all' ? '2px solid #4f46e5' : '1px solid #e5e7eb',
            background: statusFilter === 'all' ? '#eef2ff' : '#fafafa',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>Total</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' }}>{totalCount}</span>
        </div>
        <div
          onClick={() => setStatusFilter('assigned')}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: statusFilter === 'assigned' ? '2px solid #2563eb' : '1px solid #e5e7eb',
            background: statusFilter === 'assigned' ? '#eff6ff' : '#fafafa',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>Assigned</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>{assignedCount}</span>
        </div>
        <div
          onClick={() => setStatusFilter('in_progress')}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: statusFilter === 'in_progress' ? '2px solid #7c3aed' : '1px solid #e5e7eb',
            background: statusFilter === 'in_progress' ? '#faf5ff' : '#fafafa',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>In Progress</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed' }}>{inProgressCount}</span>
        </div>
        <div
          onClick={() => setStatusFilter('completed')}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: statusFilter === 'completed' ? '2px solid #047857' : '1px solid #e5e7eb',
            background: statusFilter === 'completed' ? '#ecfdf5' : '#fafafa',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>Completed</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>{completedCount}</span>
        </div>
        {overdueCount > 0 && (
          <div
            onClick={() => setStatusFilter('overdue')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              border: statusFilter === 'overdue' ? '2px solid #dc2626' : '1px solid #e5e7eb',
              background: statusFilter === 'overdue' ? '#fef2f2' : '#fafafa',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>Overdue</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{overdueCount}</span>
          </div>
        )}
      </div>

      {/* Table */}
      {visibleAssignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
          <ClipboardList style={{ width: 32, height: 32, marginBottom: '8px', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {statusFilter !== 'all'
              ? `No ${STATUS_CONFIG[statusFilter]?.label?.toLowerCase()} tasks.`
              : 'No work assignments yet.'}
          </p>
        </div>
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Assignment #</th>
                <th>Title</th>
                {showAll && <th>Department</th>}
                <th>From</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {visibleAssignments.map((assignment) => {
                const expanded = expandedId === assignment.id;
                const statusCfg = STATUS_CONFIG[assignment.status];
                const priorityCfg = PRIORITY_CONFIG[assignment.priority] || PRIORITY_CONFIG.medium;
                const overdue = isOverdue(assignment);
                const assignmentComments = workAssignmentComments.filter(
                  (c) => c.assignment_id === assignment.id
                );

                return (
                  <React.Fragment key={assignment.id}>
                    <tr
                      onClick={() => toggleExpand(assignment.id)}
                      style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                    >
                      <td>
                        <strong style={{ color: '#4f46e5', fontSize: '0.8rem' }}>
                          {assignment.assignment_number}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{assignment.title}</div>
                        {assignment.description && (
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'block', marginTop: '2px' }}>
                            {assignment.description.length > 80
                              ? assignment.description.slice(0, 80) + '…'
                              : assignment.description}
                          </span>
                        )}
                      </td>
                      {showAll && (
                        <td>
                          <span className={`badge dept-badge-${assignment.assigned_department}`} style={{ fontSize: '0.65rem' }}>
                            {DEPARTMENT_LABELS[assignment.assigned_department] || assignment.assigned_department}
                          </span>
                        </td>
                      )}
                      <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        {assignment.creator_name || 'Operations'}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.63rem',
                            color: priorityCfg.color,
                            background: priorityCfg.bg,
                            border: `1px solid ${priorityCfg.border}`,
                          }}
                        >
                          {priorityCfg.label.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: overdue ? '#dc2626' : '#6b7280',
                            fontWeight: overdue ? 700 : 400,
                          }}
                        >
                          <Clock style={{ width: 12, height: 12 }} />
                          {formatDate(assignment.due_date)}
                          {overdue && (
                            <AlertTriangle
                              style={{ width: 12, height: 12, color: '#dc2626' }}
                            />
                          )}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const isCompletedPending = assignment.status === 'completed' && assignment.review_status !== 'approved';
                          const isCompletedApproved = assignment.status === 'completed' && assignment.review_status === 'approved';
                          return (
                            <span
                              className={`badge ${statusCfg.badgeClass}`}
                              style={{
                                fontSize: '0.63rem',
                                ...(isCompletedPending ? { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' } : {})
                              }}
                            >
                              {isCompletedPending ? (
                                <Clock style={{ width: 10, height: 10 }} />
                              ) : (
                                statusCfg.icon
                              )}{' '}
                              {isCompletedPending
                                ? 'PENDING REVIEW'
                                : (isCompletedApproved ? 'APPROVED' : statusCfg.label.toUpperCase())}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        {expanded ? (
                          <ChevronUp style={{ width: 16, height: 16, color: '#9ca3af' }} />
                        ) : (
                          <ChevronDown style={{ width: 16, height: 16, color: '#9ca3af' }} />
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {expanded && (
                      <tr>
                        <td colSpan={showAll ? 8 : 7} style={{ padding: 0 }}>
                          <div
                            style={{
                              padding: '16px 20px',
                              background: '#f9fafb',
                              borderTop: '1px solid #e5e7eb',
                              borderBottom: '2px solid #e5e7eb',
                            }}
                          >
                            {/* Full Description */}
                            {assignment.description && (
                              <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Full Description
                                </label>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151', lineHeight: 1.6 }}>
                                  {assignment.description}
                                </p>
                              </div>
                            )}

                            {/* Meta Info */}
                            <div style={{ display: 'flex', gap: '24px', marginBottom: '14px', flexWrap: 'wrap' }}>
                              <div>
                                <label style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                                  Created
                                </label>
                                <span style={{ fontSize: '0.78rem', color: '#374151' }}>
                                  {formatDate(assignment.created_at)}
                                </span>
                              </div>
                              {assignment.completed_at && (
                                <div>
                                  <label style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Completed
                                  </label>
                                  <span style={{ fontSize: '0.78rem', color: '#047857' }}>
                                    {formatDate(assignment.completed_at)}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Deliverables Section */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const instAttachment = attachments[assignment.id]?.find(a => 
                                    a.file_path.includes('/instructions_')
                                  );
                                  if (instAttachment) {
                                    try {
                                      const { data: signData, error: signErr } = await supabase.storage
                                        .from('department-reports')
                                        .createSignedUrl(instAttachment.file_path, 60 * 30);
                                      if (signErr) throw signErr;
                                      if (signData?.signedUrl) {
                                        window.open(signData.signedUrl, '_blank');
                                      }
                                    } catch (err) {
                                      alert('Failed to open assignment file: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                    }
                                  } else {
                                    downloadAssignmentPdf(assignment);
                                  }
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}
                              >
                                <FileText style={{ width: 14, height: 14 }} />
                                Download Assignment PDF
                              </button>
                              {assignment.status === 'completed' &&
                               (currentProfile.department === 'admin' ||
                                 currentProfile.is_admin ||
                                 currentProfile.department === 'operations' ||
                                 currentProfile.department === 'management') && (
                                 <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       const subComment = assignmentComments.find(c => c.comment.startsWith('[SUBMISSION]'));
                                       const notes = subComment ? subComment.comment.replace('[SUBMISSION]', '').trim() : 'Work completed successfully.';
                                       const author = subComment?.user_name || 'Department Staff';
                                       const date = subComment ? subComment.created_at : assignment.completed_at || assignment.updated_at || new Date().toISOString();
                                       downloadSubmissionPdf(assignment, notes, author, date);
                                     }}
                                     className="btn btn-sm"
                                     style={{
                                       display: 'inline-flex',
                                       alignItems: 'center',
                                       gap: '6px',
                                       fontSize: '0.72rem',
                                       background: '#ecfdf5',
                                       color: '#047857',
                                       border: '1px solid #86efac'
                                     }}
                                   >
                                     <CheckCircle2 style={{ width: 14, height: 14 }} />
                                     Open Submission PDF
                                   </button>

                                   {assignment.review_status !== 'approved' && (
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         openReviewModal(assignment);
                                       }}
                                       className="btn btn-sm"
                                       style={{
                                         display: 'inline-flex',
                                         alignItems: 'center',
                                         gap: '6px',
                                         fontSize: '0.72rem',
                                         background: '#eff6ff',
                                         color: '#2563eb',
                                         border: '1px solid #bfdbfe'
                                       }}
                                     >
                                       <Sparkles style={{ width: 14, height: 14 }} />
                                       Review Work
                                     </button>
                                   )}
                                 </div>
                               )}
                            </div>

                            {assignment.review_status && assignment.review_status !== 'pending' && (
                              <div
                                style={{
                                  marginTop: '12px',
                                  background: assignment.review_status === 'approved' ? '#f0fdf4' : '#fff1f2',
                                  padding: '12px 16px',
                                  borderRadius: '8px',
                                  border: assignment.review_status === 'approved' ? '1px solid #bbf7d0' : '1px solid #fecdd3',
                                  marginBottom: '14px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                  {assignment.review_status === 'approved' ? (
                                    <CheckCircle2 style={{ width: 14, height: 14, color: '#16a34a' }} />
                                  ) : (
                                    <AlertTriangle style={{ width: 14, height: 14, color: '#dc2626' }} />
                                  )}
                                  <strong style={{ fontSize: '0.78rem', color: assignment.review_status === 'approved' ? '#15803d' : '#9f1239' }}>
                                    {assignment.review_status === 'approved' ? 'Approved & Closed' : 'Revision Requested'}
                                  </strong>
                                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    at {formatDate(assignment.reviewed_at || assignment.updated_at)}
                                  </span>
                                </div>
                                {assignment.review_notes && (
                                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', fontStyle: 'italic', marginTop: '4px' }}>
                                    &ldquo;{assignment.review_notes}&rdquo;
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Submitted Attachments list */}
                            {(() => {
                              const submissionAttachments = attachments[assignment.id]?.filter(a => 
                                !a.file_path.includes('/instructions_')
                              ) || [];
                              if (submissionAttachments.length === 0) return null;
                              if (currentProfile.department !== 'admin' && 
                                  !currentProfile.is_admin && 
                                  currentProfile.department !== 'operations' &&
                                  currentProfile.department !== 'management') return null;

                              return (
                                <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Uploaded Submissions & Supporting Files
                                  </label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {submissionAttachments.map((fileRecord) => (
                                      <div
                                        key={fileRecord.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '8px 12px',
                                          background: '#ffffff',
                                          borderRadius: '6px',
                                          border: '1px solid #e2e8f0',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <FileText style={{ width: 14, height: 14, color: '#047857' }} />
                                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                                            {fileRecord.file_name}
                                          </span>
                                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                            ({(fileRecord.file_size / 1024).toFixed(1)} KB)
                                          </span>
                                        </div>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const { data: signData, error: signErr } = await supabase.storage
                                                .from('department-reports')
                                                .createSignedUrl(fileRecord.file_path, 60 * 30);
                                              if (signErr) throw signErr;
                                              if (signData?.signedUrl) {
                                                window.open(signData.signedUrl, '_blank');
                                              }
                                            } catch (err) {
                                              alert('Failed to open file: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                            }
                                          }}
                                          className="btn btn-secondary btn-sm"
                                          style={{ fontSize: '0.7rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        >
                                          <Download style={{ width: 12, height: 12 }} />
                                          Download/Open File
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Status Update Buttons */}
                            {assignment.status !== 'completed' &&
                             assignment.status !== 'cancelled' &&
                             currentProfile.department !== 'admin' &&
                             !currentProfile.is_admin &&
                             currentProfile.department !== 'operations' &&
                             currentProfile.department !== 'management' && (
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                {assignment.status === 'assigned' && (
                                  <button
                                    onClick={() => handleStatusUpdate(assignment, 'in_progress')}
                                    disabled={updatingStatus === assignment.id}
                                    className="btn btn-primary btn-sm"
                                    style={{ fontSize: '0.72rem' }}
                                  >
                                    {updatingStatus === assignment.id ? (
                                      <Loader2 style={{ width: 12, height: 12, animation: 'spin 0.8s linear infinite' }} />
                                    ) : (
                                      <PlayCircle style={{ width: 12, height: 12 }} />
                                    )}
                                    Start Working
                                  </button>
                                )}
                                <button
                                  onClick={() => openSubmitModal(assignment)}
                                  className="btn btn-sm"
                                  style={{
                                    fontSize: '0.72rem',
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    border: '1px solid #86efac',
                                  }}
                                >
                                  <CheckCircle2 style={{ width: 12, height: 12 }} />
                                  Submit Completed Work
                                </button>
                              </div>
                            )}

                            {/* Comments Thread */}
                            <div>
                              <label style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Comments ({assignmentComments.length})
                              </label>

                              {assignmentComments.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                                  {assignmentComments.map((c) => (
                                    <div
                                      key={c.id}
                                      style={{
                                        padding: '8px 12px',
                                        background: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151' }}>
                                          {c.user_name || 'Staff'}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
                                          {formatDate(c.created_at)}
                                        </span>
                                      </div>
                                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.5 }}>
                                        {c.comment}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add Comment */}
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                <textarea
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="Add a comment or update…"
                                  rows={2}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '0.8rem',
                                    resize: 'vertical',
                                    background: '#ffffff',
                                    color: '#111827',
                                  }}
                                />
                                <button
                                  onClick={() => handleAddComment(assignment.id)}
                                  disabled={!commentText.trim() || sendingComment}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.72rem', height: '36px' }}
                                >
                                  {sendingComment ? (
                                    <Loader2 style={{ width: 12, height: 12, animation: 'spin 0.8s linear infinite' }} />
                                  ) : (
                                    <Send style={{ width: 12, height: 12 }} />
                                  )}
                                  Send
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Submit Completed Work */}
      {showSubmitModal && submitAssignment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '480px', padding: '24px', position: 'relative', background: '#fff' }}>
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <CheckCircle2 style={{ width: 20, height: 20, color: '#047857' }} />
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#0f172a' }}>Submit Assignment</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px', marginBottom: '16px' }}>
              Submit completed work for <strong>{submitAssignment.assignment_number}</strong>. Summarize your findings or results.
            </p>

            <form onSubmit={handleSubmitWork} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Completion Summary / Notes *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the work performed, resolutions, or details to show Operations and Admin..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    background: '#fff',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Supporting PDF Document (Optional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.85rem',
                    background: '#fff',
                    color: '#111827'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn btn-secondary btn-sm" disabled={submittingWork}>Cancel</button>
                <button type="submit" className="btn btn-sm" style={{ background: '#047857', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={submittingWork}>
                  {submittingWork ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <CheckCircle2 style={{ width: 14, height: 14 }} />
                  )}
                  {submittingWork ? 'Submitting…' : 'Submit Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review Assignment */}
      {showReviewModal && reviewAssignment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '480px', padding: '24px', position: 'relative', background: '#fff' }}>
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles style={{ width: 20, height: 20, color: '#2563eb' }} />
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#0f172a' }}>Review Assignment Submission</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px', marginBottom: '16px' }}>
              Review completion deliverables for <strong>{reviewAssignment.assignment_number}</strong>. Select whether to approve the work or request revision.
            </p>

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Decision *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="reviewDecision"
                      value="approved"
                      checked={reviewDecision === 'approved'}
                      onChange={() => setReviewDecision('approved')}
                    />
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Approve & Close</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="reviewDecision"
                      value="revision_requested"
                      checked={reviewDecision === 'revision_requested'}
                      onChange={() => setReviewDecision('revision_requested')}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>Request Revision</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Review Notes / Feedback *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide details about your review decision or guidance on required corrections..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    background: '#fff',
                    color: '#111827'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowReviewModal(false)} className="btn btn-secondary btn-sm" disabled={submittingReview}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={submittingReview}>
                  {submittingReview ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <CheckCircle2 style={{ width: 14, height: 14 }} />
                  )}
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Work to Department */}
      {showAssignWorkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '480px', padding: '24px', position: 'relative', background: '#fff' }}>
            <button
              type="button"
              onClick={() => setShowAssignWorkModal(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ClipboardList style={{ width: 20, height: 20, color: '#4f46e5' }} />
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#0f172a' }}>Assign Work to Department</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px', marginBottom: '16px' }}>
              Assign a professional directive to another department. The instructions document must be uploaded in PDF format only.
            </p>

            <form onSubmit={handleCreateWorkAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {waError && (
                <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>
                  {waError}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit admissions documents for Spring 2026 intake"
                  value={waTitle}
                  onChange={(e) => setWaTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.85rem',
                    background: '#fff',
                    color: '#111827'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Target Department *</label>
                  <select
                    value={waDepartment}
                    onChange={(e) => setWaDepartment(e.target.value as DepartmentType)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.85rem',
                      background: '#fff',
                      color: '#111827'
                    }}
                  >
                    {Object.entries(DEPARTMENT_LABELS)
                      .filter(([key]) =>
                        ![
                          'admin',
                          'operations',
                          'management',
                          'it_support',
                          'legal_compliance',
                          'alumni_success',
                        ].includes(key)
                      )
                      .map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Priority *</label>
                  <select
                    value={waPriority}
                    onChange={(e) => setWaPriority(e.target.value as WorkAssignmentPriority)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.85rem',
                      background: '#fff',
                      color: '#111827'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Due Date (Optional)</label>
                  <input
                    type="date"
                    value={waDueDate}
                    onChange={(e) => setWaDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.85rem',
                      background: '#fff',
                      color: '#111827'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Instructions PDF File *</label>
                  <input
                    type="file"
                    required
                    accept="application/pdf"
                    onChange={(e) => setWaPdfFile(e.target.files?.[0] || null)}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.82rem',
                      background: '#fff',
                      color: '#111827'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAssignWorkModal(false)} className="btn btn-secondary btn-sm" disabled={waSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={waSubmitting}>
                  {waSubmitting ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <ClipboardList style={{ width: 14, height: 14 }} />
                  )}
                  {waSubmitting ? 'Assigning…' : 'Assign Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
