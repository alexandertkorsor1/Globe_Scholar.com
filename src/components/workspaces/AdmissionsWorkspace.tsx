import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Award, Calendar, CheckCircle2, XCircle, Plus, Eye, FileText, Filter, LayoutDashboard, ClipboardList, ShieldCheck, Clock, AlertCircle, Bell, X, Upload } from 'lucide-react';
import { DocumentManager } from '../documents/DocumentManager';
import { Application, VisaApplication, VisaDocument } from '../../types/database';
import { getApplicationIntake } from '../../lib/department-registers';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import { supabase } from '../../lib/supabase';

export const AdmissionsWorkspace: React.FC = () => {
  const { applications, students, financialRecords, makeAdmissionsDecision, visaApplications, loadVisaDocuments, reviewVisaApplication } = useApplication();
  const { currentProfile, logout } = useAuth();

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionChoice, setDecisionChoice] = useState<'conditional_offer' | 'unconditional_offer' | 'rejected'>('unconditional_offer');
  const [decisionNotes, setDecisionNotes] = useState('');

  const [showNewWindowModal, setShowNewWindowModal] = useState(false);
  const [wTitle, setWTitle] = useState('');
  const [wCountry, setWCountry] = useState('United Kingdom');
  const [wStart, setWStart] = useState('2026-01-01');
  const [wEnd, setWEnd] = useState('2026-09-30');

  const [selectedVisaApp, setSelectedVisaApp] = useState<VisaApplication | null>(null);
  const [visaInstructions, setVisaInstructions] = useState('');
  const [visaStatusChoice, setVisaStatusChoice] = useState<'pending' | 'under_review' | 'approved' | 'rejected'>('under_review');
  const [visaDocs, setVisaDocs] = useState<VisaDocument[]>([]);
  const [loadingVisaDocs, setLoadingVisaDocs] = useState(false);
  const [reviewingVisa, setReviewingVisa] = useState(false);

  React.useEffect(() => {
    if (selectedVisaApp?.id) {
      setLoadingVisaDocs(true);
      loadVisaDocuments(selectedVisaApp.id)
        .then(setVisaDocs)
        .catch(err => console.error(err))
        .finally(() => setLoadingVisaDocs(false));
      
      setVisaStatusChoice(selectedVisaApp.status);
      setVisaInstructions(selectedVisaApp.admissions_instructions || '');
    }
  }, [selectedVisaApp?.id]);

  const handleReviewVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisaApp) return;
    setReviewingVisa(true);
    try {
      await reviewVisaApplication(selectedVisaApp.id, visaStatusChoice, visaInstructions);
      setSelectedVisaApp(null);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewingVisa(false);
    }
  };

  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

  const sidebarNav = [
    { label: 'Applications', icon: <ClipboardList style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('admissions-queue') },
    { label: 'Admission Windows', icon: <Calendar style={{ width: 18, height: 18 }} />, onClick: () => goTo('admission-windows') },
    { label: 'Assigned Tasks', icon: <FileText style={{ width: 18, height: 18 }} />, onClick: () => goTo('admissions-assigned-tasks') },
    { label: 'Visa Applications', icon: <ShieldCheck style={{ width: 18, height: 18 }} />, onClick: () => goTo('admissions-visa-applications') },
  ];

  // Admissions only works applications formally handed into its queue. This
  // prevents drafts and incomplete marketing leads appearing in decisions.
  const admissionsQueue = applications.filter((application) =>
    application.handed_off_to_admissions ||
    ['admissions_review', 'decision_pending', 'approved', 'rejected'].includes(application.status)
  );
  const registrationFeeFor = (applicationId: string) =>
    financialRecords.find(
      (record) =>
        record.application_id === applicationId &&
        record.record_type === 'registration_fee'
    );

  return (
    <DashboardLayout
      department="Admissions"
      title="Admissions & Eligibility"
      subtitle="Admission windows, eligibility screening, and offer decisions"
      userName={currentProfile.full_name}
      userRole="Admissions"
      navigation={sidebarNav}
      onLogout={logout}
    >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award style={{ color: '#3366FF' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>Admissions & Eligibility Workspace</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              Admission windows, eligibility screening, document review, formal offer decisions, and live Finance payment status.
            </p>
          </div>

          <button onClick={() => setShowNewWindowModal(true)} className="btn btn-primary btn-sm">
            <Calendar style={{ width: '14px', height: '14px' }} />
            Configure Admission Window
          </button>
        </div>
      </div>

      <div id="admissions-assigned-tasks">
        <DepartmentTaskInbox />
      </div>

      {/* Active Admission Windows List */}
      <div id="admission-windows" className="glass-panel" style={{ padding: '16px 20px' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar style={{ color: '#c084fc', width: '16px', height: '16px' }} />
          Active Admission Windows & Eligibility Thresholds
        </h3>
        <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
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
      <div id="admissions-queue" className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#fff' }}>Admissions Eligibility Register</h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              Only students that Data & Applications has cleared or formally routed appear in this admissions sheet.
            </p>
          </div>
          <span className="badge badge-under_review">{admissionsQueue.length} Eligible</span>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>App #</th>
                <th>Email</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Current Address</th>
                <th>Target Institution</th>
                <th>Program</th>
                <th>Fee Status</th>
                <th>Admissions Decision</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissionsQueue.map(app => {
                const registrationFee = registrationFeeFor(app.id);
                const intake = getApplicationIntake(app, students);
                return (
                <tr key={app.id}>
                  <td><strong style={{ color: '#c084fc' }}>{app.application_number}</strong></td>
                  <td style={{ minWidth: '210px' }}>{intake.email}</td>
                  <td style={{ fontWeight: 600 }}>{intake.name}</td>
                  <td>{intake.age}</td>
                  <td>{intake.gender}</td>
                  <td>{intake.phone}</td>
                  <td>{intake.country}</td>
                  <td style={{ minWidth: '220px' }}>{intake.currentAddress}</td>
                  <td>{app.target_university}</td>
                  <td style={{ fontSize: '0.8rem' }}>{app.degree_program}</td>
                  <td>
                    {registrationFee ? (
                      <span className={`badge badge-${registrationFee.status === 'paid' ? 'approved' : registrationFee.status === 'rejected' ? 'rejected' : 'under_review'}`}>
                        {registrationFee.status === 'paid' ? 'VERIFIED' : registrationFee.status === 'rejected' ? 'REJECTED' : 'AWAITING FINANCE'}
                      </span>
                    ) : (
                      <span className="badge badge-draft">NOT SUBMITTED</span>
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
                );
              })}
              {admissionsQueue.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                    No completed applications have been routed to Admissions yet.
                  </td>
                </tr>
              )}
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
      {/* Visa Applications Control Section */}
      <div id="admissions-visa-applications" className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck style={{ color: '#3366FF' }} /> Student Visa Application Auditing
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Audit visa dossier submissions, review compliance documents, and update student status.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
            {visaApplications.length} Submissions
          </span>
        </div>

        {visaApplications.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
            No visa applications have been initialized yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visaApplications.map((visaApp) => (
              <div
                key={visaApp.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{visaApp.student_name}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>({visaApp.student_email})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                    <span>Application ID: {visaApp.application_id ? visaApp.application_id.substring(0, 8) + '...' : 'N/A'}</span>
                    <span>Created: {new Date(visaApp.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    className={`dept-badge ${
                      visaApp.status === 'approved'
                        ? 'dept-badge-active'
                        : visaApp.status === 'rejected'
                        ? 'dept-badge-inactive'
                        : 'dept-badge-pending'
                    }`}
                    style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}
                  >
                    {visaApp.status.replace('_', ' ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedVisaApp(visaApp)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye style={{ width: 12, height: 12 }} /> Audit Dossier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  onChange={e => setDecisionChoice(e.target.value as typeof decisionChoice)}
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
      )}      {/* Modal: New Admission Window */}
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
              <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

      {/* Modal: Audit Visa Dossier */}
      {selectedVisaApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '540px', padding: '24px', background: '#0f172a', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                Audit Visa Dossier: {selectedVisaApp.student_name}
              </h3>
              <button type="button" onClick={() => setSelectedVisaApp(null)} className="btn btn-secondary btn-sm">Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>Uploaded Documents (PDFs)</h4>
                {loadingVisaDocs ? (
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Loading visa files...</p>
                ) : visaDocs.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: '#f43f5e' }}>No documents uploaded by the student yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {visaDocs.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-color)',
                          padding: '10px 14px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: '#fff', textTransform: 'capitalize' }}>
                            {doc.document_type.replace('_', ' ')}:
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginLeft: '6px', display: 'inline-block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.file_name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const { data } = supabase.storage
                              .from('department-reports')
                              .getPublicUrl(doc.file_path);
                            if (data?.publicUrl) {
                              window.open(data.publicUrl, '_blank');
                            }
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye style={{ width: 12, height: 12 }} /> View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleReviewVisa} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Dossier Verdict</label>
                  <select
                    value={visaStatusChoice}
                    onChange={(e) => setVisaStatusChoice(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                  >
                    <option value="pending">Pending Document Submission</option>
                    <option value="under_review">Mark Under Review</option>
                    <option value="approved">Approve Visa Dossier</option>
                    <option value="rejected">Request Revisions / Reject Dossier</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Document Requirements & Feedback (Message Student)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter instructions on which documents are needed or why changes are requested..."
                    value={visaInstructions}
                    onChange={(e) => setVisaInstructions(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setSelectedVisaApp(null)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" disabled={reviewingVisa} className="btn btn-primary btn-sm">
                    {reviewingVisa ? 'Saving...' : 'Save & Message Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};
