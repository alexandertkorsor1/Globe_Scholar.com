import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { ShieldCheck, History, X, Search, FileSpreadsheet } from 'lucide-react';

interface AuditLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ isOpen, onClose }) => {
  const { auditLogs, statusHistory } = useApplication();
  const [activeSubTab, setActiveSubTab] = useState<'audit_logs' | 'status_history'>('status_history');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter(l =>
    l.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = statusHistory.filter(h =>
    h.changed_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.to_status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 220,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '900px', maxHeight: '85vh', background: '#0b0f19', padding: '24px',
        display: 'flex', flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck style={{ color: '#10b981' }} />
              Immutable System Audit Log & Application Lifecycle Trail
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Traceability record of all status transitions, financial updates, and admissions decisions.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Sub-tabs & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveSubTab('status_history')}
              className={`btn btn-sm ${activeSubTab === 'status_history' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <History style={{ width: '14px', height: '14px' }} />
              Application Status History ({statusHistory.length})
            </button>
            <button
              onClick={() => setActiveSubTab('audit_logs')}
              className={`btn btn-sm ${activeSubTab === 'audit_logs' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <ShieldCheck style={{ width: '14px', height: '14px' }} />
              Database Audit Logs ({auditLogs.length})
            </button>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '6px 12px 6px 32px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.8rem'
              }}
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="custom-table-container glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
          {activeSubTab === 'status_history' ? (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>App Number</th>
                  <th>Changed By</th>
                  <th>Department</th>
                  <th>Transition</th>
                  <th>Audit Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                    <td><strong style={{ color: '#06b6d4' }}>{h.application_id}</strong></td>
                    <td style={{ fontWeight: 600 }}>{h.changed_by_name}</td>
                    <td><span className="badge badge-submitted">{h.department}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                        <span className={`badge badge-${h.from_status || 'draft'}`}>{h.from_status || 'Draft'}</span>
                        <span>→</span>
                        <span className={`badge badge-${h.to_status}`}>{h.to_status}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{h.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Department</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>State Delta</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>{l.actor_name}</td>
                    <td><span className="badge badge-under_review">{l.department}</span></td>
                    <td><strong style={{ color: '#34d399' }}>{l.action}</strong></td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.entity_type}</td>
                    <td style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#818cf8' }}>
                      {JSON.stringify(l.after_state || l.before_state)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Close Audit Trail</button>
        </div>

      </div>
    </div>
  );
};
