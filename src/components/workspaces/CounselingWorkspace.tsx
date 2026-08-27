import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Video, Calendar, Clock, Plus, Award, AlertTriangle, FileText, CheckCircle, Users, ClipboardList, Trash2 } from 'lucide-react';
import { TrashBin } from '../shared/TrashBin';
import { Student } from '../../types/database';
import { formatRegisterDate, formatRegisterTime, getApplicationIntake } from '../../lib/department-registers';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';

export const CounselingWorkspace: React.FC = () => {
  const {
    applications,
    students,
    counselingSessions,
    scheduleCounselingSession,
    addCommunication,
    getScopedCounselingSessions
  } = useApplication();
  const { currentProfile, logout } = useAuth();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Meet form state
  const [scheduledAt, setScheduledAt] = useState('2026-03-25T14:00');
  const [meetLink, setMeetLink] = useState('https://meet.google.com/gsp-advisory-2026');
  const [sessionNotes, setSessionNotes] = useState('');
  const [platform, setPlatform] = useState<'google_meet' | 'zoom'>('google_meet');
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

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    scheduleCounselingSession(selectedStudent.id, scheduledAt, meetLink, sessionNotes);
    setShowScheduleModal(false);
    setSessionNotes('');
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
    { label: 'Students', icon: <Users style={{ width: 18, height: 18 }} />, onClick: () => goTo('counseling-students') },
    { label: 'Assigned Tasks', icon: <ClipboardList style={{ width: 18, height: 18 }} />, onClick: () => goTo('counseling-assigned-tasks') },
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
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
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
        </div>
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
                          setSelectedStudent(intake.student || null);
                          setShowScheduleModal(true);
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
                  background: selectedStudent?.id === std.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(18, 26, 43, 0.8)',
                  borderColor: selectedStudent?.id === std.id ? '#60a5fa' : 'var(--border-color)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedStudent(std)}
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
                      setSelectedStudent(std);
                      setShowScheduleModal(true);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                  >
                    <Video style={{ width: '12px', height: '12px' }} />
                    Schedule Google Meet
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

      <div id="counseling-trash">
        <TrashBin departmentKey="counseling" />
      </div>

      {/* Modal: Schedule Google Meet Session */}
      {showScheduleModal && selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '460px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>
              Schedule Google Meet Session with {selectedStudent.first_name} {selectedStudent.last_name}
            </h3>

            <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Meeting Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Online Platform</label>
                  <select
                    value={platform}
                    onChange={e => {
                      const plat = e.target.value as 'google_meet' | 'zoom';
                      setPlatform(plat);
                      setMeetLink(plat === 'google_meet' ? 'https://meet.google.com/gsp-advisory-2026' : 'https://zoom.us/j/9886326999');
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    <option value="google_meet" style={{ background: '#0f172a', color: '#fff' }}>Google Meet</option>
                    <option value="zoom" style={{ background: '#0f172a', color: '#fff' }}>Zoom Meeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  {platform === 'google_meet' ? 'Google Meet URL' : 'Zoom Invitation Link'}
                </label>
                <input
                  type="url"
                  required
                  value={meetLink}
                  onChange={e => setMeetLink(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Advisory & Scholarship Fitting Notes</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record scholarship recommendations and counseling goals..."
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Dispatch Calendar Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </DashboardLayout>
  );
};
