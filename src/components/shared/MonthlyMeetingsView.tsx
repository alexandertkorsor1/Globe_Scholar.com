import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Video, Plus, Trash2, Clock, FileText, ExternalLink, RefreshCw, X, AlertCircle } from 'lucide-react';
import { MonthlyMeeting } from '../../types/database';

export const MonthlyMeetingsView: React.FC = () => {
  const { monthlyMeetings, scheduleMonthlyMeeting, deleteMonthlyMeeting } = useApplication();
  const { currentProfile } = useAuth();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('2026-09-01T10:00');
  const [platform, setPlatform] = useState<'google_meet' | 'zoom'>('google_meet');
  const [meetLink, setMeetLink] = useState('https://meet.google.com/gsp-all-hands-meeting');
  const [agenda, setAgenda] = useState('');

  // Permission Check
  const canSchedule =
    currentProfile?.is_admin ||
    ['admin', 'operations', 'management'].includes(currentProfile?.department || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSchedule) return;

    try {
      setLoading(true);
      setError(null);
      await scheduleMonthlyMeeting({
        title: title.trim(),
        scheduled_at: scheduledAt,
        duration_minutes: 60,
        platform,
        meeting_link: meetLink.trim(),
        agenda: agenda.trim() || null
      });
      setShowScheduleModal(false);
      setTitle('');
      setAgenda('');
    } catch (err) {
      console.error('Failed to schedule monthly meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel and remove this meeting? It will be sent to the Recycle Bin.')) {
      return;
    }
    try {
      await deleteMonthlyMeeting(id);
    } catch (err) {
      console.error('Failed to cancel meeting:', err);
      alert('Failed to cancel the meeting.');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar style={{ color: '#3366FF', width: '20px', height: '20px' }} />
            <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Monthly Joint Meetings</h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', marginBottom: 0 }}>
            Scheduled monthly joint syncs and briefings for all organization departments.
          </p>
        </div>

        {canSchedule && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            Schedule Meeting
          </button>
        )}
      </div>

      {monthlyMeetings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
          <Calendar style={{ width: '32px', height: '32px', color: '#475569', marginBottom: '8px' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>No Meetings Scheduled</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            Joint meeting sessions will appear here when scheduled by Admin, Operations, or Management.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {monthlyMeetings.map((meeting) => {
            const meetingDate = new Date(meeting.scheduled_at);
            const isUpcoming = meetingDate.getTime() > Date.now();
            const isZoom = meeting.meeting_link.includes('zoom.us') || meeting.platform === 'zoom';

            return (
              <div
                key={meeting.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  background: 'rgba(18, 26, 43, 0.7)',
                  borderLeft: isUpcoming ? '4px solid #60a5fa' : '4px solid #475569',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>{meeting.title}</h4>
                      <span className={`badge badge-${isUpcoming ? 'documents_verified' : 'draft'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        {isUpcoming ? 'UPCOMING' : 'PAST'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock style={{ width: '12px', height: '12px' }} />
                        {meetingDate.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>Duration: {meeting.duration_minutes} mins</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a
                      href={meeting.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isZoom ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        borderColor: isZoom ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: isZoom ? '#34d399' : '#60a5fa'
                      }}
                    >
                      <Video style={{ width: '12px', height: '12px' }} />
                      Join {isZoom ? 'Zoom' : 'Meet'}
                      <ExternalLink style={{ width: '10px', height: '10px' }} />
                    </a>

                    {canSchedule && (
                      <button
                        onClick={() => handleCancel(meeting.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                        title="Cancel meeting"
                      >
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                      </button>
                    )}
                  </div>
                </div>

                {meeting.agenda && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.78rem', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: 600, color: '#94a3b8' }}>
                      <FileText style={{ width: '12px', height: '12px' }} /> Agenda & Sync Notes
                    </div>
                    {meeting.agenda}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: SCHEDULE MONTHLY JOINT MEETING */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '480px', padding: '24px', background: '#0f172a', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Schedule Joint Monthly Meeting</h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.78rem', marginBottom: '12px' }}>
                <AlertCircle style={{ width: '14px', height: '14px' }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. September Executive Briefing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Meeting Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => {
                      const plat = e.target.value as 'google_meet' | 'zoom';
                      setPlatform(plat);
                      setMeetLink(plat === 'google_meet' ? 'https://meet.google.com/gsp-monthly-sync' : 'https://zoom.us/j/9886326000');
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    <option value="google_meet" style={{ background: '#0f172a' }}>Google Meet</option>
                    <option value="zoom" style={{ background: '#0f172a' }}>Zoom</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Meeting Invitation Link *</label>
                <input
                  type="url"
                  required
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Agenda & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Summarize meeting agenda, guidelines, or requirements..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                  {loading ? <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
