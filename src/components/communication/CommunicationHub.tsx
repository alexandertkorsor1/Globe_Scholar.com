import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckSquare,
  AlertTriangle,
  MessageSquare,
  Flame,
  X,
  Plus,
  Send,
  CheckCheck
} from 'lucide-react';
import { CommunicationType, PriorityLevel, DepartmentType } from '../../types/database';

interface CommunicationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

type CommunicationTab = CommunicationType | 'all';

export const CommunicationHub: React.FC<CommunicationHubProps> = ({ isOpen, onClose }) => {
  const { communications, addCommunication, markCommunicationRead } = useApplication();
  const { currentProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<CommunicationTab>('all');
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);

  // New message form state
  const [msgType, setMsgType] = useState<CommunicationType>('message');
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgPriority, setMsgPriority] = useState<PriorityLevel>('medium');
  const [targetDept, setTargetDept] = useState<DepartmentType | 'all'>('operations');
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const filteredComms = communications.filter(c => {
    if (activeTab === 'all') return true;
    return c.type === activeTab;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle || !msgBody) return;

    setIsSending(true);
    setSendError('');
    try {
      await addCommunication(msgType, msgTitle, msgBody, msgPriority, targetDept);
      setMsgTitle('');
      setMsgBody('');
      setShowNewMsgModal(false);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'The communication could not be sent.');
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkRead = async (communicationId: string) => {
    try {
      await markCommunicationRead(communicationId);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'The message could not be marked as read.');
    }
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'critical':
        return <span className="badge badge-rejected" style={{ fontSize: '0.6rem' }}><Flame style={{ width: '10px', height: '10px' }} /> CRITICAL</span>;
      case 'high':
        return <span className="badge badge-documents_missing" style={{ fontSize: '0.6rem' }}>HIGH</span>;
      case 'medium':
        return <span className="badge badge-under_review" style={{ fontSize: '0.6rem' }}>MEDIUM</span>;
      default:
        return <span className="badge badge-draft" style={{ fontSize: '0.6rem' }}>LOW</span>;
    }
  };

  const getTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case 'notification': return <Bell style={{ color: '#38bdf8', width: '16px', height: '16px' }} />;
      case 'task': return <CheckSquare style={{ color: '#fbbf24', width: '16px', height: '16px' }} />;
      case 'alert': return <AlertTriangle style={{ color: '#f97316', width: '16px', height: '16px' }} />;
      case 'message': return <MessageSquare style={{ color: '#c084fc', width: '16px', height: '16px' }} />;
      case 'escalation': return <Flame style={{ color: '#f43f5e', width: '16px', height: '16px' }} />;
    }
  };

  const communicationTabs: Array<{
    id: CommunicationTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'all', label: 'All', icon: <Bell style={{ width: '14px', height: '14px' }} /> },
    { id: 'notification', label: 'Notifications', icon: <Bell style={{ width: '14px', height: '14px' }} /> },
    { id: 'task', label: 'Tasks', icon: <CheckSquare style={{ width: '14px', height: '14px' }} /> },
    { id: 'alert', label: 'Alerts', icon: <AlertTriangle style={{ width: '14px', height: '14px' }} /> },
    { id: 'message', label: 'Messages', icon: <MessageSquare style={{ width: '14px', height: '14px' }} /> },
    { id: 'escalation', label: 'Escalations', icon: <Flame style={{ width: '14px', height: '14px' }} /> },
  ];

  return (
    <div className="department-communications-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 200,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div className="glass-panel animate-fade-in department-communications-drawer" style={{
        width: '520px',
        height: '100%',
        borderRadius: 0,
        background: '#0b0f19',
        borderLeft: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Hub Header */}
        <div className="department-communications-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell style={{ color: '#6366f1' }} />
              Staff Communication Center
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Notifications, tasks, alerts, messages, and cross-department escalations
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="department-communications-tabs" style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '0 16px', gap: '4px', overflowX: 'auto' }}>
          {communicationTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 14px',
                background: 'none',
                border: 'none',
                color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Toolbar */}
        <div className="department-communications-toolbar" style={{ padding: '12px 24px', background: 'rgba(18, 26, 43, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Showing {filteredComms.length} items
          </span>
          <button
            onClick={() => setShowNewMsgModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            New Cross-Dept Communication
          </button>
        </div>

        {/* List of Communications */}
        <div className="department-communications-list" style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {filteredComms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <CheckCheck style={{ width: '36px', height: '36px', margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p style={{ fontSize: '0.85rem' }}>No communications found in this filter.</p>
            </div>
          ) : (
            filteredComms.map(item => {
              const isRecipient =
                item.department === currentProfile.department ||
                item.department === 'all';
              const canMarkRead =
                isRecipient &&
                item.sender_id !== currentProfile.id &&
                !item.is_read;

              return (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  marginBottom: '12px',
                  borderLeft: `4px solid ${item.priority === 'critical' ? '#f43f5e' : item.priority === 'high' ? '#f59e0b' : '#6366f1'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getTypeIcon(item.type)}
                    <h3 style={{ fontSize: '0.88rem', color: '#ffffff' }}>{item.title}</h3>
                  </div>
                  {getPriorityBadge(item.priority)}
                </div>

                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '10px', lineHeight: 1.4 }}>
                  {item.body}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>From: <strong style={{ color: '#94a3b8' }}>{item.sender_name}</strong></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span>{item.department === 'all' ? 'All departments' : `To: ${item.department?.replace('_', ' ') || 'Admin'}`}</span>
                    {canMarkRead ? (
                      <button type="button" onClick={() => void handleMarkRead(item.id)} style={{ border: 0, borderRadius: '6px', padding: '4px 7px', background: 'rgba(99,102,241,.2)', color: '#c7d2fe', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Mark read</button>
                    ) : (
                      <span>{item.is_read ? 'Read' : new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>

      </div>

      {/* New Communication Modal */}
      {showNewMsgModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel animate-fade-in department-communication-compose-modal" style={{ width: '480px', padding: '24px', background: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', color: '#ffffff' }}>Create Cross-Department Communication</h3>
              <button onClick={() => setShowNewMsgModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Type</label>
                <select
                  value={msgType}
                  onChange={e => setMsgType(e.target.value as CommunicationType)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                >
                  <option value="message">Message (Cross-Department)</option>
                  <option value="task">Task (Actionable Item)</option>
                  <option value="alert">Alert (Time-Sensitive)</option>
                  <option value="escalation">Escalation (Requires Higher Level Review)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target Department</label>
                <select
                  value={targetDept}
                  onChange={e => setTargetDept(e.target.value as DepartmentType | 'all')}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                >
                  <option value="admissions">Admissions</option>
                  <option value="marketing">Marketing</option>
                  <option value="operations">Operations</option>
                  <option value="finance">Finance</option>
                  <option value="counseling">Counseling</option>
                  <option value="data_applications">Data & Applications</option>
                  <option value="country_directors">Country Directors</option>
                  <option value="admin">Admin</option>
                  {currentProfile.is_admin && <option value="all">All departments</option>}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finance -> Operations: Payment confirmed"
                  value={msgTitle}
                  onChange={e => setMsgTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Priority</label>
                <select
                  value={msgPriority}
                  onChange={e => setMsgPriority(e.target.value as PriorityLevel)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Body Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed message text..."
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                />
              </div>

              {sendError && (
                <div role="alert" style={{ borderRadius: '8px', padding: '10px 12px', background: 'rgba(239,68,68,.14)', color: '#fecaca', fontSize: '0.78rem' }}>{sendError}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowNewMsgModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" disabled={isSending} className="btn btn-primary btn-sm">
                  <Send style={{ width: '14px', height: '14px' }} />
                  {isSending ? 'Sending…' : 'Send communication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
