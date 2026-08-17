import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { Award, Calendar, CheckCircle2, XCircle, Plus, Eye, FileText, Filter } from 'lucide-react';
import { DocumentManager } from '../documents/DocumentManager';
import { Application } from '../../types/database';

export const AdmissionsWorkspace: React.FC = () => {
  const { applications, makeAdmissionsDecision } = useApplication();

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionChoice, setDecisionChoice] = useState<'conditional_offer' | 'unconditional_offer' | 'rejected'>('unconditional_offer');
  const [decisionNotes, setDecisionNotes] = useState('');

  const [showNewWindowModal, setShowNewWindowModal] = useState(false);
  const [wTitle, setWTitle] = useState('');
  const [wCountry, setWCountry] = useState('United Kingdom');
  const [wStart, setWStart] = useState('2026-01-01');
  const [wEnd, setWEnd] = useState('2026-09-30');

  const [admissionWindows, setAdmissionWindows] = useState([
    { id: 'w1', title: 'Fall 2026 UK Excellence Scholarships', target_country: 'United Kingdom', intake_period: 'Fall 2026', start_date: '2026-01-01', end_date: '2026-09-30', is_active: true },
    { id: 'w2', title: 'North America STEM Pathway 2026', target_country: 'United States', intake_period: 'Fall 2026', start_date: '2026-02-01', end_date: '2026-10-15', is_active: true }
  ]);

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !decisionNotes) return;
    makeAdmissionsDecision(selectedApp.id, decisionChoice, decisionNotes);
    setShowDecisionModal(false);
    setDecisionNotes('');
  };

  const handleCreateWindow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wTitle) return;
    setAdmissionWindows(prev => [
      ...prev,
      {
        id: `w-${Date.now()}`,
        title: wTitle,
        target_country: wCountry,
        intake_period: 'Fall 2026',
        start_date: wStart,
        end_date: wEnd,
        is_active: true
      }
    ]);
    setShowNewWindowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(18, 26, 43, 0.9) 100%)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award style={{ color: '#c084fc' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>Admissions & Eligibility Workspace</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
              Admission windows setup, eligibility screening, document review, and formal offer decisions.
            </p>
          </div>

          <button onClick={() => setShowNewWindowModal(true)} className="btn btn-primary btn-sm">
            <Calendar style={{ width: '14px', height: '14px' }} />
            Configure Admission Window
          </button>
        </div>
      </div>

      {/* Active Admission Windows List */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar style={{ color: '#c084fc', width: '16px', height: '16px' }} />
          Active Admission Windows & Eligibility Thresholds
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {admissionWindows.map(w => (
            <div key={w.id} style={{ background: 'rgba(18, 26, 43, 0.8)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#fff' }}>{w.title}</h4>
                <span className="badge badge-documents_verified">ACTIVE</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                Target: {w.target_country} • Window: {w.start_date} to {w.end_date}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Admissions Review Queue Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>Admissions Decisions & Applicant Review Queue</h3>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>App #</th>
                <th>Student Name</th>
                <th>Target University</th>
                <th>Program & Country</th>
                <th>Missing Docs</th>
                <th>Admissions Decision</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id}>
                  <td><strong style={{ color: '#c084fc' }}>{app.application_number}</strong></td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{app.student_name}</td>
                  <td>{app.target_university}</td>
                  <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {app.degree_program} ({app.target_country})
                  </td>
                  <td>
                    {app.missing_documents_count > 0 ? (
                      <span className="badge badge-documents_missing">{app.missing_documents_count} Missing</span>
                    ) : (
                      <span className="badge badge-documents_verified">0 Missing</span>
                    )}
                  </td>
                  <td>
                    {app.admissions_decision ? (
                      <span className={`badge ${app.admissions_decision === 'rejected' ? 'badge-rejected' : 'badge-approved'}`}>
                        {app.admissions_decision.replace('_', ' ').toUpperCase()}
                      </span>
                    ) : (
                      <span className="badge badge-under_review">PENDING REVIEW</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem' }}
                      >
                        <Eye style={{ width: '12px', height: '12px' }} />
                        Review Docs
                      </button>

                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowDecisionModal(true);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem' }}
                      >
                        Make Decision
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Manager Drawer for Selected Application */}
      {selectedApp && (
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(192, 132, 252, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff' }}>
              Document Review for {selectedApp.student_name} ({selectedApp.application_number})
            </h3>
            <button onClick={() => setSelectedApp(null)} className="btn btn-secondary btn-sm">Close Inspector</button>
          </div>

          <DocumentManager applicationId={selectedApp.id} />
        </div>
      )}

      {/* Modal: Make Admissions Decision */}
      {showDecisionModal && selectedApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '480px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>
              Render Formal Admissions Decision: {selectedApp.application_number}
            </h3>

            <form onSubmit={handleCreateDecision} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Decision Verdict</label>
                <select
                  value={decisionChoice}
                  onChange={e => setDecisionChoice(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                >
                  <option value="unconditional_offer">Grant Unconditional Offer</option>
                  <option value="conditional_offer">Grant Conditional Offer (Subject to missing items)</option>
                  <option value="rejected">Reject Application</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Committee Rational & Decision Notes</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record formal committee rationale for audit trail..."
                  value={decisionNotes}
                  onChange={e => setDecisionNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowDecisionModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Sign & Log Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Admission Window */}
      {showNewWindowModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '440px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Configure New Admission Window</h3>
            <form onSubmit={handleCreateWindow} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Window Title</label>
                <input type="text" required value={wTitle} onChange={e => setWTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target Country</label>
                <input type="text" required value={wCountry} onChange={e => setWCountry(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Start Date</label>
                  <input type="date" value={wStart} onChange={e => setWStart(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>End Date</label>
                  <input type="date" value={wEnd} onChange={e => setWEnd(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowNewWindowModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Window</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
