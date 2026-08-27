import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Video, Calendar, Clock, Plus, Award, AlertTriangle, FileText, CheckCircle, Users, ClipboardList, Trash2, Mail, X, Eye, GraduationCap, Radio, Check, Search, UserCheck, UserPlus, Globe } from 'lucide-react';
import { TrashBin } from '../shared/TrashBin';
import { Student, Application, ApplicationDocument, StudentEmail } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { formatRegisterDate, formatRegisterTime, getApplicationIntake } from '../../lib/department-registers';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import { MarketingPostsFeed } from '../shared/MarketingPostsFeed';
import { InstitutionFeeDirectory } from '../shared/InstitutionFeeDirectory';

export const CounselingWorkspace: React.FC = () => {
  const {
    applications,
    students,
    counselingSessions,
    scheduleCounselingSession,
    addCommunication,
    getScopedCounselingSessions,
    documents,
    toggleMissingDocFlag,
    verifyDocument,
    sendStudentEmail
  } = useApplication();
  const { currentProfile, logout } = useAuth();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Multi-student / Specific student selection states
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [meetingType, setMeetingType] = useState<'individual' | 'group'>('individual');
  const [schedulingInProgress, setSchedulingInProgress] = useState(false);

  // Meet form state
  const [scheduledAt, setScheduledAt] = useState('2026-03-25T14:00');
  const [meetLink, setMeetLink] = useState('https://meet.google.com/gsp-advisory-2026');
  const [sessionNotes, setSessionNotes] = useState('');
  const [platform, setPlatform] = useState<'google_meet' | 'zoom'>('google_meet');

  // Review documents modal state
  const [selectedReviewApp, setSelectedReviewApp] = useState<Application | null>(null);
  const [revisionSubject, setRevisionSubject] = useState('');
  const [revisionBody, setRevisionBody] = useState('');
  const [sendingRevision, setSendingRevision] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const scopedSessionsResult = getScopedCounselingSessions();
  const visibleSessions = scopedSessionsResult.data || [];
  const scheduledSessionsByTime = [...visibleSessions].sort(
    (first, second) =>
      new Date(first.scheduled_at).getTime() -
      new Date(second.scheduled_at).getTime()
  );
  const counselingRegisterRows = applications.map((application) => {
    const intake = getApplicationIntake(application, students);
    const session = scheduledSessionsByTime.find(
      (item) =>
        item.student_id === application.student_id ||
        item.student_name.toLowerCase() === application.student_name.toLowerCase()
    );

    return {
      application,
      intake,
      session,
      date: session ? formatRegisterDate(session.scheduled_at) : intake.applicationDate,
      time: session ? formatRegisterTime(session.scheduled_at) : 'Not scheduled',
    };
  });

  const handleToggleStudentSelection = (studentId: string) => {
    if (meetingType === 'individual') {
      setSelectedStudentIds([studentId]);
    } else {
      setSelectedStudentIds(prev =>
        prev.includes(studentId)
          ? prev.filter(id => id !== studentId)
          : [...prev, studentId]
      );
    }
  };

  const handleSelectAllFilteredStudents = (filtered: Student[]) => {
    const ids = filtered.map(s => s.id);
    setSelectedStudentIds(prev => [...new Set([...prev, ...ids])]);
  };

  const handleClearStudentSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student for this counseling session.');
      return;
    }

    setSchedulingInProgress(true);
    try {
      const selectedStudentObjects = students.filter(s => selectedStudentIds.includes(s.id));
      
      // Schedule session for each selected student
      for (const student of selectedStudentObjects) {
        await scheduleCounselingSession(student.id, scheduledAt, meetLink, sessionNotes);
      }

      setShowScheduleModal(false);
      setSessionNotes('');
      setSelectedStudentIds([]);
      
      const studentNames = selectedStudentObjects.map(s => `${s.first_name} ${s.last_name}`).join(', ');
      alert(`🎉 Successfully scheduled counseling session for ${selectedStudentObjects.length} student(s) (${studentNames})!\nCalendar invites and email notifications dispatched.`);
    } catch (err) {
      console.error(err);
      alert('Failed to schedule counseling session.');
    } finally {
      setSchedulingInProgress(false);
    }
  };

  const triggerEscalation = (stdName: string) => {
    addCommunication(
      'escalation',
      `Counseling Escalation: Student ${stdName}`,
      `Counseling department has raised an escalation regarding document submission delays for ${stdName}. Immediate Data/Ops follow-up required.`,
      'critical',
      'operations'
    );
    alert(`Escalation triggered for ${stdName}. Communication dispatched to Operations & Admin.`);
  };

  const sidebarNav = [
    { label: 'Sessions', icon: <Video style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('counseling-sessions') },
    { label: 'Marketing Updates', icon: <Radio style={{ width: 18, height: 18 }} />, onClick: () => goTo('counseling-marketing-updates') },
    { label: 'Fee Structures & Courses', icon: <GraduationCap style={{ width: 18, height: 18 }} />, onClick: () => goTo('counseling-fee-directory') },
    { label: 'Students', icon: <Users style={{ width: 18, height: 18 }} />, onClick: () => goTo('counseling-students') },
    { label: 'Assigned Tasks', icon: <ClipboardList style={{ width: 18, height: 18 }} />, onClick: () => goTo('counseling-assigned-tasks') },
    { label: 'Student Documents', icon: <FileText style={{ width: 18, height: 18 }} />, onClick: () => goTo('counseling-student-documents') },
    { label: 'Recycle Bin', icon: <Trash2 style={{ width: 18, height: 18 }} />, onClick: () => goTo('counseling-trash') },
  ];

  return (
    <DashboardLayout
      department="Counseling"
      title="Student Counseling & Advising"
      subtitle="Session scheduling, academic advising, and scholarship tracking"
      userName={currentProfile.full_name}
      userRole="Counseling"
      navigation={sidebarNav}
      onLogout={logout}
    >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Banner */}
      <div id="counseling-sessions" className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video style={{ color: '#3366FF' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>Student Counseling & Advising Platform</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              Academic advising, Google Meet session scheduling, meeting timelines per student, and scholarship recommendation tracking.
            </p>
          </div>
          <button
            onClick={() => {
              if (students.length > 0) {
                setSelectedStudentIds([students[0].id]);
                setMeetingType('individual');
              }
              setShowScheduleModal(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Video style={{ width: '14px', height: '14px' }} />
            Schedule Meet Session
          </button>
        </div>
      </div>

      {/* ── LIVE MARKETING UPDATES & CAMPAIGNS ─────────────────────────── */}
      <div id="counseling-marketing-updates">
        <MarketingPostsFeed allowCreate={false} departmentTitle="Counseling" />
      </div>

      {/* ── INSTITUTION FEE STRUCTURES & COURSES DIRECTORY ──────────────── */}
      <div id="counseling-fee-directory">
        <InstitutionFeeDirectory departmentTitle="Counseling" />
      </div>

      <div id="counseling-assigned-tasks">
        <DepartmentTaskInbox />
      </div>

      {/* Counseling Intake Register */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#fff' }}>Counseling Intake & Session Register</h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              New student accounts land here immediately so Counseling can schedule advisory sessions and track appointment status.
            </p>
          </div>
          <span className="badge badge-submitted">{counselingRegisterRows.length} Students</span>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Country</th>
                <th>Date</th>
                <th>Time</th>
                <th>Phone</th>
                <th>Counselor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {counselingRegisterRows.map(({ application, intake, session, date, time }) => (
                <tr key={application.id}>
                  <td style={{ minWidth: '210px' }}>{intake.email}</td>
                  <td style={{ fontWeight: 600 }}>{intake.name}</td>
                  <td>{intake.age}</td>
                  <td>{intake.gender}</td>
                  <td>{intake.country}</td>
                  <td>{date}</td>
                  <td>{time}</td>
                  <td>{intake.phone}</td>
                  <td>{session?.counselor_name || intake.student?.assigned_counselor_name || 'Not assigned'}</td>
                  <td>
                    <span className={`badge badge-${session ? 'documents_verified' : 'draft'}`}>
                      {session ? session.status.toUpperCase() : 'PENDING SCHEDULE'}
                    </span>
                  </td>
                  <td>
                    {intake.student ? (
                      <button
                        onClick={() => {
                          if (intake.student) {
                            setSelectedStudentIds([intake.student.id]);
                            setMeetingType('individual');
                            setShowScheduleModal(true);
                          }
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem' }}
                      >
                        <Video style={{ width: '12px', height: '12px' }} />
                        Schedule
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Profile intake</span>
                    )}
                  </td>
                </tr>
              ))}
              {counselingRegisterRows.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                    No student intake records are available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Grid: Student List & Scheduled Sessions */}
      <div className="dashboard-responsive-grid dashboard-responsive-grid-wide" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        
        {/* Left Column: Assigned Students */}
        <div id="counseling-students" className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>Assigned Students & Advising Profiles</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {students.map(std => (
              <div
                key={std.id}
                className="glass-panel glass-panel-interactive"
                style={{
                  padding: '14px',
                  background: selectedStudentIds.includes(std.id) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(18, 26, 43, 0.8)',
                  borderColor: selectedStudentIds.includes(std.id) ? '#60a5fa' : 'var(--border-color)',
                  cursor: 'pointer'
                }}
                onClick={() => handleToggleStudentSelection(std.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>{std.first_name} {std.last_name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>GPA: {std.gpa} • {std.country_of_residence}</span>
                  </div>
                  <span className="badge badge-submitted">Assigned</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStudentIds([std.id]);
                      setMeetingType('individual');
                      setShowScheduleModal(true);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                  >
                    <Video style={{ width: '12px', height: '12px' }} />
                    Schedule Meet
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerEscalation(`${std.first_name} ${std.last_name}`);
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                  >
                    <AlertTriangle style={{ width: '12px', height: '12px' }} />
                    Escalate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Google Meet Sessions & Timeline */}
        <div id="counseling-sessions" className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>
            {selectedStudent ? `Meeting Timeline: ${selectedStudent.first_name} ${selectedStudent.last_name}` : 'All Scheduled Counseling Sessions'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {visibleSessions.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                No counseling sessions scheduled yet.
              </div>
            ) : (
              visibleSessions.map(cs => (
                <div key={cs.id} className="glass-panel" style={{ padding: '14px', background: 'rgba(18, 26, 43, 0.9)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar style={{ color: '#60a5fa', width: '14px', height: '14px' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{cs.student_name}</span>
                    </div>
                    <span className="badge badge-documents_verified">{cs.status}</span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Time: {new Date(cs.scheduled_at).toLocaleString()} • Duration: {cs.duration_minutes}m
                  </p>

                  {/* Meeting Link */}
                  {(() => {
                    const isZoom = cs.google_meet_link.includes('zoom.us');
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isZoom ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                        <Video style={{ color: isZoom ? '#34d399' : '#60a5fa', width: '14px', height: '14px' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isZoom ? '#34d399' : '#60a5fa', textTransform: 'uppercase' }}>
                          {isZoom ? 'Zoom' : 'Google Meet'}:
                        </span>
                        <a href={cs.google_meet_link} target="_blank" rel="noreferrer" style={{ color: isZoom ? '#34d399' : '#60a5fa', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                          {cs.google_meet_link}
                        </a>
                      </div>
                    );
                  })()}

                  {/* Notes & Scholarship Recommendations */}
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                    <strong>Advising Notes:</strong> {cs.session_notes}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Student Documents Review Section */}
      <div id="counseling-student-documents" className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText style={{ color: '#3366FF' }} /> Student Documents Management & Verification
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Audit and verify student-uploaded documents. If any required file is missing or contains errors, flag the document and dispatch email instructions to the student.
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
            No student files are currently available.
          </p>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student Email</th>
                  <th>Student Name</th>
                  <th>Target University</th>
                  <th>Course Choice</th>
                  <th>Missing Count</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => {
                  const studentDocs = documents.filter(d => d.application_id === app.id);
                  const missingDocs = studentDocs.filter(d => d.is_missing);
                  return (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.student_email}</td>
                      <td>{app.student_name}</td>
                      <td>{app.target_university}</td>
                      <td>{app.degree_program}</td>
                      <td>
                        <span className={`badge badge-${missingDocs.length > 0 ? 'inactive' : 'active'}`}>
                          {missingDocs.length} Flagged Missing
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReviewApp(app);
                            setRevisionSubject(`Action Required: Document Review for Application ${app.application_number}`);
                            setRevisionBody(`Dear ${app.student_name},\n\nWe have reviewed the documents uploaded for your application (${app.application_number}) and noticed some discrepancies. Please check the feedback below and upload correct versions in your student portal:\n\n- [Specify details of incorrect or missing documents]\n\nBest regards,\nGlobe Scholars Counseling Department`);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <Eye size={12} style={{ marginRight: '4px' }} /> Review Files
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

      <div id="counseling-trash">
        <TrashBin departmentKey="counseling" />
      </div>

      {/* Modal: Review Student Documents */}
      {selectedReviewApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '600px', padding: '24px', background: '#0f172a', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.02rem', color: '#fff', fontWeight: 700 }}>
                Review Documents: {selectedReviewApp.student_name} ({selectedReviewApp.application_number})
              </h3>
              <button type="button" onClick={() => setSelectedReviewApp(null)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Documents List */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>Uploaded Files</h4>
                {(() => {
                  const appDocs = documents.filter(d => d.application_id === selectedReviewApp.id);
                  if (appDocs.length === 0) {
                    return (
                      <p style={{ fontSize: '0.78rem', color: '#f43f5e' }}>No documents uploaded by the student yet.</p>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {appDocs.map(doc => {
                        const { data: urlData } = supabase.storage.from('department-reports').getPublicUrl(doc.storage_path);
                        const publicUrl = urlData?.publicUrl || '';
                        const isPreviewOpen = previewDocUrl === publicUrl;
                        return (
                          <div key={doc.id} style={{ borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                            {/* Doc Header Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px' }}>
                              <div>
                                <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>{doc.document_type.replace(/_/g, ' ').toUpperCase()}</span>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>📄 {doc.file_name}</span>
                                {doc.is_missing && <span style={{ color: '#fca5a5', fontSize: '0.7rem', fontWeight: 700, display: 'block', marginTop: '4px' }}>⚠️ FLAGGED AS INCOMPLETE / MISTAKE</span>}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocUrl(isPreviewOpen ? null : publicUrl)}
                                  style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: isPreviewOpen ? '#1e293b' : '#0ea5e9', color: '#fff', fontWeight: 600 }}
                                >
                                  {isPreviewOpen ? '▲ Close' : '📄 View PDF'}
                                </button>
                                {publicUrl && (
                                  <a
                                    href={publicUrl}
                                    download={doc.file_name}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '5px', background: '#059669', color: '#fff', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    ⬇ Download
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleMissingDocFlag(doc.id, !doc.is_missing)}
                                  style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: doc.is_missing ? '#34d399' : '#fca5a5', fontWeight: 600 }}
                                >
                                  {doc.is_missing ? '✓ Resolve Flag' : '⚑ Flag Incomplete'}
                                </button>
                              </div>
                            </div>
                            {/* Inline PDF Viewer */}
                            {isPreviewOpen && publicUrl && (
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0f172a' }}>
                                <iframe
                                  src={publicUrl}
                                  title={doc.file_name}
                                  style={{ width: '100%', height: '520px', border: 'none', display: 'block' }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Email Notification Form */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '8px' }}>Send Direct Email Notification</h4>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!revisionBody.trim()) return;
                  setSendingRevision(true);
                  try {
                    await sendStudentEmail(
                      selectedReviewApp.student_id,
                      selectedReviewApp.student_email,
                      revisionSubject,
                      revisionBody,
                      `${currentProfile.full_name} (Counseling)`
                    );
                    alert(`Email notification sent successfully to ${selectedReviewApp.student_email}!`);
                  } catch (err) {
                    alert('Failed to send email notification.');
                  } finally {
                    setSendingRevision(false);
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Subject</label>
                    <input type="text" required value={revisionSubject} onChange={e => setRevisionSubject(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Email Content</label>
                    <textarea rows={6} required value={revisionBody} onChange={e => setRevisionBody(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem', lineHeight: 1.45 }} />
                  </div>
                  <button type="submit" disabled={sendingRevision} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} />
                    {sendingRevision ? 'Sending...' : 'Send Email Notification'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Schedule Google Meet Session */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '620px', maxHeight: '92vh', overflowY: 'auto', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Video size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                    Schedule Advisory & Counseling Session
                  </h3>
                  <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '2px 0 0' }}>
                    Select single individual or pick exact multiple students to invite to this meeting.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Meeting Type Switcher */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                  Meeting Format & Student Attendance
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMeetingType('individual');
                      if (selectedStudentIds.length > 1) {
                        setSelectedStudentIds([selectedStudentIds[0]]);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: meetingType === 'individual' ? '1.5px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                      background: meetingType === 'individual' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: meetingType === 'individual' ? '#60a5fa' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <UserCheck size={15} /> 1-on-1 Individual Session
                  </button>

                  <button
                    type="button"
                    onClick={() => setMeetingType('group')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: meetingType === 'group' ? '1.5px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                      background: meetingType === 'group' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: meetingType === 'group' ? '#c084fc' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Users size={15} /> Multi-Student / Cohort ({selectedStudentIds.length})
                  </button>
                </div>
              </div>

              {/* Student Selector Area */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
                      {meetingType === 'individual' ? 'Select Target Student:' : 'Select Students to Invite:'}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: selectedStudentIds.length > 0 ? '#1e3a8a' : '#334155', color: selectedStudentIds.length > 0 ? '#93c5fd' : '#94a3b8', fontWeight: 600 }}>
                      {selectedStudentIds.length} Selected
                    </span>
                  </div>

                  {meetingType === 'group' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = students.filter(s =>
                            s.first_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                            s.last_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                            s.email.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                            (s.country_of_residence && s.country_of_residence.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                          );
                          handleSelectAllFilteredStudents(filtered);
                        }}
                        style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearStudentSelection}
                        style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', color: '#f87171', border: 'none', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={e => setStudentSearchTerm(e.target.value)}
                    placeholder="Filter students by name, email, or country..."
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 32px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.76rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Selected Student Chips */}
                {selectedStudentIds.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px', maxHeight: '70px', overflowY: 'auto' }}>
                    {students
                      .filter(s => selectedStudentIds.includes(s.id))
                      .map(std => (
                        <span
                          key={std.id}
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: meetingType === 'individual' ? '#1e3a8a' : '#581c87',
                            color: meetingType === 'individual' ? '#93c5fd' : '#e9d5ff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {std.first_name} {std.last_name}
                          <button
                            type="button"
                            onClick={() => handleToggleStudentSelection(std.id)}
                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                {/* Scrollable Student Selection List */}
                <div style={{ maxHeight: '175px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
                  {students
                    .filter(s =>
                      s.first_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      s.last_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      s.email.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      (s.country_of_residence && s.country_of_residence.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                    )
                    .map(std => {
                      const isSelected = selectedStudentIds.includes(std.id);

                      return (
                        <div
                          key={std.id}
                          onClick={() => handleToggleStudentSelection(std.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.03)',
                            border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type={meetingType === 'individual' ? 'radio' : 'checkbox'}
                              checked={isSelected}
                              onChange={() => {}} // Handled by div onClick
                              style={{ cursor: 'pointer' }}
                            />
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? '#2563eb' : '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                              {std.first_name.slice(0, 1)}{std.last_name.slice(0, 1)}
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.8rem', color: '#fff', display: 'block' }}>
                                {std.first_name} {std.last_name}
                              </strong>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {std.email}
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                              {std.country_of_residence || 'International'}
                            </span>
                            {std.gpa && (
                              <div style={{ fontSize: '0.66rem', color: '#10b981', marginTop: '2px' }}>
                                GPA: {std.gpa}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Timing & Platform Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                    Meeting Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                    Meeting Platform *
                  </label>
                  <select
                    value={platform}
                    onChange={e => {
                      const plat = e.target.value as 'google_meet' | 'zoom';
                      setPlatform(plat);
                      setMeetLink(plat === 'google_meet' ? 'https://meet.google.com/gsp-advisory-2026' : 'https://zoom.us/j/9886326999');
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1e293b', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem', outline: 'none' }}
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom Meeting</option>
                  </select>
                </div>
              </div>

              {/* Meet URL */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                  {platform === 'google_meet' ? 'Google Meet Video URL *' : 'Zoom Invitation Link *'}
                </label>
                <input
                  type="url"
                  required
                  value={meetLink}
                  onChange={e => setMeetLink(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                  Advisory Agenda & Scholarship Recommendation Notes
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Record discussion agenda, academic goals, and scholarship recommendations to be shared with student(s)..."
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.78rem', resize: 'vertical' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingInProgress || selectedStudentIds.length === 0}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                >
                  <Video size={14} />
                  {schedulingInProgress
                    ? 'Dispatching Invitations...'
                    : `Dispatch Invites (${selectedStudentIds.length} Student${selectedStudentIds.length === 1 ? '' : 's'})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </DashboardLayout>
  );
};

