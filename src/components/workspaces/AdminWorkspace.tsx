import React, { useState } from 'react';
import type { Application } from '../../types/database';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Users,
  FileCheck,
  TrendingUp,
  AlertOctagon,
  Award,
  Globe,
  Plus,
  ChevronRight,
  Send,
  FileText,
  X,
  Upload,
  Eye
} from 'lucide-react';

export const AdminWorkspace: React.FC = () => {
  const { currentProfile, logout } = useAuth();
  const {
  applications,
  students,
  toggleMissingDocFlag,
  verifyDocument,
  documents,
  financialRecords,
  partnerUniversities,
  addPartnerUniversity,
  uploadPartnerAgreement,
  addCommunication,
  updateApplicationStatus,
  statusHistory
} = useApplication();
  const { availableProfiles } = useAuth();

  const [activeTab, setActiveTab] = useState<'kpis' | 'drilldown' | 'partnerships' | 'staff'>('kpis');
  const [selectedDeptDrill, setSelectedDeptDrill] = useState<string>('admissions');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showGlobalNotifyModal, setShowGlobalNotifyModal] = useState(false);

  // New partner state
  const [pName, setPName] = useState('');
  const [pCountry, setPCountry] = useState('United Kingdom');
  const [pEmail, setPEmail] = useState('');
  const [pScholarships, setPScholarships] = useState(10);

  // Partner agreement upload state
  const [uploadingPartnerId, setUploadingPartnerId] = useState<string | null>(null);
  const [agreementExpiry, setAgreementExpiry] = useState<Record<string, string>>({});

  // Global notice state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  // Key KPI Calculations
  const totalApps = applications.length;
  const activeStudents = students.length;
  const pendingApps = applications.filter(a => ['submitted', 'under_review', 'documents_missing', 'admissions_review'].includes(a.status)).length;
  const missingDocsCount = applications.reduce((acc, a) => acc + a.missing_documents_count, 0);
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const urgentItems = [
    ...applications.filter(a => a.missing_documents_count > 0).map(a => `Application ${a.application_number} (${a.student_name}) has ${a.missing_documents_count} missing document(s)`),
    ...financialRecords.filter(f => f.status === 'pending').map(f => `Pending financial disbursement approval: ${f.application_number} ($${f.amount})`)
  ];

  const handleSaveApplicationReview = () => {
    if (!selectedApplication) return;

    const note =
      reviewNote.trim() ||
      selectedApplication.admissions_notes ||
      'Admin review updated.';

    try {
      updateApplicationStatus(
        selectedApplication.id,
        selectedApplication.status,
        note
      );

      setSelectedApplication(prev =>
        prev
          ? {
              ...prev,
              admissions_notes: note,
              updated_at: new Date().toISOString()
            }
          : null
      );

      setReviewNote(note);
      alert('Application review saved successfully.');
    } catch (error) {
      console.error('Failed to save application review:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save application review.'
      );
    }
  };


    const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pName.trim() || !pCountry.trim() || !pEmail.trim()) {
      return;
    }

    try {
      await addPartnerUniversity({
        name: pName.trim(),
        country: pCountry.trim(),
        contact_email: pEmail.trim(),
        scholarships_offered: pScholarships,
        active_agreement: true,
        agreements: []
      });

      setShowAddPartnerModal(false);
      setPName('');
      setPCountry('United Kingdom');
      setPEmail('');
      setPScholarships(10);
    } catch (error) {
      console.error('Failed to add partner university:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to add partner university.'
      );
    }
  };


  const handleUploadAgreement = async (
    partnerId: string,
    file: File
  ) => {
    const expiryDate = agreementExpiry[partnerId];

    if (!expiryDate) {
      alert('Please select an agreement expiry date first.');
      return;
    }

    try {
      setUploadingPartnerId(partnerId);

      await uploadPartnerAgreement(
        partnerId,
        file,
        expiryDate
      );

      setAgreementExpiry(prev => ({
        ...prev,
        [partnerId]: ''
      }));

      alert('Agreement uploaded successfully.');
    } catch (error) {
      console.error('Agreement upload failed:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to upload agreement.'
      );
    } finally {
      setUploadingPartnerId(null);
    }
  };

  const handleGlobalNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeBody) return;
    addCommunication('alert', noticeTitle, noticeBody, 'high');
    setShowGlobalNotifyModal(false);
    setNoticeTitle('');
    setNoticeBody('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(18, 26, 43, 0.9) 100%)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 style={{ color: '#ef4444' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>Admin System Oversight & Executive Platform</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
              Full cross-department oversight, performance analytics, partner university listings, and global staff communications.
            </p>
          </div>

		
		<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  <button
    onClick={() => setShowGlobalNotifyModal(true)}
    className="btn btn-secondary btn-sm"
    style={{
      color: '#f87171',
      borderColor: 'rgba(248, 113, 113, 0.4)'
    }}
  >
    <Send style={{ width: '14px', height: '14px' }} />
    Broadcast Global Staff Notice
  </button>

  <button
    onClick={() => setShowAddPartnerModal(true)}
    className="btn btn-primary btn-sm"
  >
    <Plus style={{ width: '14px', height: '14px' }} />
    Add Partner University
  </button>

</div>

        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
          {[
            { id: 'kpis', label: 'Executive Dashboard' },
            { id: 'drilldown', label: 'Department Drill-Down' },
            { id: 'partnerships', label: 'Partner Universities & Agreements' },
            { id: 'staff', label: 'Staff Accounts & RBAC' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Executive KPI Dashboard */}
      {activeTab === 'kpis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Executive Stat Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Applications</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>{totalApps}</div>
              <span style={{ fontSize: '0.7rem', color: '#34d399' }}>Across 8 departments</span>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Active Students</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>{activeStudents}</div>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Registered on Portal</span>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Pending Reviews</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{pendingApps}</div>
              <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Requires Department Action</span>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Approved / Rejected</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {approvedCount} <span style={{ fontSize: '1rem', color: '#f43f5e' }}>/ {rejectedCount}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Final Decisions Rendered</span>
            </div>
          </div>

          {/* Open Applications */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px'
            }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', color: '#fff', margin: 0 }}>
                  Open Applications
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Applications currently requiring departmental action
                </span>
              </div>

              <span className="badge badge-documents_verified">
                {pendingApps} Open
              </span>
            </div>

            {applications.filter(app =>
              ['submitted', 'under_review', 'documents_missing', 'admissions_review']
                .includes(app.status)
            ).length === 0 ? (
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                color: '#64748b',
                fontSize: '0.8rem'
              }}>
                No open applications at the moment.
              </div>
            ) : (
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Application #</th>
                      <th>Student</th>
                      <th>Institution</th>
                      <th>Status</th>
                      <th>Country</th>
                    </tr>
                  </thead>

                  <tbody>
                    {applications
                      .filter(app =>
                        ['submitted', 'under_review', 'documents_missing', 'admissions_review']
                          .includes(app.status)
                      )
                      .map(app => (
                        <tr key={app.id}>
                          <td>
                            <strong style={{ color: '#6366f1' }}>
                              {app.application_number}
                            </strong>
                          </td>

                          <td>{app.student_name}</td>

                          <td>{app.target_university}</td>

                          <td>
                            <span className={`badge badge-${app.status}`}>
                              {app.status.replace('_', ' ')}
                            </span>
                          </td>

                          <td>{app.target_country}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Urgent Items & Operational Alert Panel */}
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertOctagon style={{ width: '18px', height: '18px' }} />
              Admin Urgent Attention Items ({urgentItems.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {urgentItems.map((item, idx) => (
                <div key={idx} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>•</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Department Drill-Down */}
      {activeTab === 'drilldown' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>
            Multi-Department Drill-Down Engine (Department → Staff → Student → Application → Activity)
          </h3>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto' }}>
            {['marketing', 'counseling', 'admissions', 'data_applications', 'operations', 'country_directors', 'finance'].map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDeptDrill(dept)}
                className={`btn btn-sm ${selectedDeptDrill === dept ? 'btn-primary' : 'btn-secondary'}`}
              >
                {dept.toUpperCase().replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Application #</th>
                  <th>Student Name</th>
                  <th>Target Institution</th>
                  <th>Status</th>
                  <th>Last Handled By</th>
                  <th>Activity History Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => {
                  const lastHist = statusHistory.find(h => h.application_id === app.id);
                  return (
                    <tr key={app.id}>
                      <td><strong style={{ color: '#6366f1' }}>{app.application_number}</strong></td>
                      <td>{app.student_name}</td>
                      <td>{app.target_university} ({app.target_country})</td>
                      <td><span className={`badge badge-${app.status}`}>{app.status}</span></td>
                      <td>{lastHist?.changed_by_name || 'System Engine'}</td>
                      <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{lastHist?.note || 'Initial record registered.'}</td>
                      <td>
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="btn btn-primary btn-sm"
                        >
                          Open Application
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Open Application Detail */}
      {selectedApplication && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            inset: '0',
            zIndex: 1000,
            background: 'rgba(5, 10, 20, 0.96)',
            padding: '30px',
            overflowY: 'auto'
          }}
        >
          <div style={{
            maxWidth: '1100px',
            margin: '0 auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ color: '#fff', marginBottom: '6px' }}>
                  Application Details
                </h2>
                <span style={{ color: '#94a3b8' }}>
                  {selectedApplication.application_number}
                </span>
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px'
            }}>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <h3 style={{ color: '#6366f1', marginBottom: '12px' }}>
                  Student Information
                </h3>
                <p><strong>Name:</strong> {selectedApplication.student_name}</p>
                <p><strong>Email:</strong> {selectedApplication.student_email}</p>
                <p><strong>Student ID:</strong> {selectedApplication.student_id}</p>
              </div>

              <div className="glass-panel" style={{ padding: '18px' }}>
                <h3 style={{ color: '#06b6d4', marginBottom: '12px' }}>
                  Application Information
                </h3>
                <p><strong>Status:</strong> {selectedApplication.status}</p>
                <p><strong>Country:</strong> {selectedApplication.target_country}</p>
                <p><strong>University:</strong> {selectedApplication.target_university}</p>
                <p><strong>Program:</strong> {selectedApplication.degree_program}</p>
                <p><strong>Intake:</strong> {selectedApplication.intake_period}</p>
                <p>
                  <strong>Scholarship:</strong>{' '}
                  {selectedApplication.scholarship_requested || 'Not specified'}
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '18px' }}>
                <h3 style={{ color: '#f59e0b', marginBottom: '12px' }}>
                  Documents
                </h3>
                <p>
                  <strong>Missing Documents:</strong>{' '}
                  {selectedApplication.missing_documents_count}
                </p>
                <p>
                  <strong>Handed to Admissions:</strong>{' '}
                  {selectedApplication.handed_off_to_admissions ? 'Yes' : 'No'}
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '18px' }}>
                <h3 style={{ color: '#10b981', marginBottom: '12px' }}>
                  Admissions
                </h3>
                <p>
                  <strong>Decision:</strong>{' '}
                  {selectedApplication.admissions_decision || 'Pending'}
                </p>
                <p>
                  <strong>Notes:</strong>{' '}
                  {selectedApplication.admissions_notes || 'No admissions notes yet.'}
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px', marginTop: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px', marginTop: '16px' }}>
          <div className="glass-panel" style={{ padding: '18px', marginTop: '16px' }}>
            <h3 style={{ color: '#f59e0b', marginBottom: '14px' }}>
              Documents
            </h3>

            {(() => {
              const applicationDocuments = documents.filter(
                doc => doc.application_id === selectedApplication.id
              );

              if (applicationDocuments.length === 0) {
                return (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(148, 163, 184, 0.08)',
                    color: '#94a3b8'
                  }}>
                    No documents have been uploaded for this application.
                  </div>
                );
              }

              return (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {applicationDocuments.map(doc => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: '#fff',
                          fontWeight: 700,
                          marginBottom: '4px'
                        }}>
                          {doc.file_name}
                        </div>

                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8'
                        }}>
                          Type: {String(doc.document_type).replace(/_/g, ' ')}
                          {' • '}
                          Version: {doc.current_version}
                        </div>

                        <div style={{
                          marginTop: '6px',
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span className={`badge ${doc.is_verified ? 'badge-approved' : 'badge-pending'}`}>
                            {doc.is_verified ? 'Verified' : 'Not Verified'}
                          </span>

                          {doc.is_missing && (
                            <span className="badge badge-rejected">
                              Missing
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        {doc.signed_url && (
                          <a
                            href={doc.signed_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            <Eye style={{ width: '14px', height: '14px' }} />
                            View
                          </a>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            toggleMissingDocFlag(doc.id, !doc.is_missing)
                          }
                        >
                          {doc.is_missing ? 'Mark Complete' : 'Mark Missing'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            verifyDocument(doc.id, !doc.is_verified)
                          }
                        >
                          {doc.is_verified ? 'Unverify' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

              <h3 style={{ color: '#fff', marginBottom: '16px' }}>
                Application Review
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    marginBottom: '6px'
                  }}>
                    Application Status
                  </label>

                  <select
                    value={selectedApplication.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as Application['status'];

                      setSelectedApplication(prev =>
                        prev
                          ? {
                              ...prev,
                              status: newStatus
                            }
                          : null
                      );
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: '#111827',
                      color: '#fff'
                    }}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="documents_missing">Documents Missing</option>
                    <option value="admissions_review">Admissions Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    marginBottom: '6px'
                  }}>
                    Review Note
                  </label>

                  <textarea
                    value={reviewNote || selectedApplication.admissions_notes || ''}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter an administrative review note..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: '#111827',
                      color: '#fff',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '14px'
              }}>
                <button
                  onClick={handleSaveApplicationReview}
                  className="btn btn-primary"
                >
                  Save Review
                </button>
              </div>
            </div>

            <h3 style={{ color: '#fff', marginBottom: '12px' }}>
                Application Timeline
              </h3>
              <p style={{ color: '#94a3b8' }}>
                Created: {new Date(selectedApplication.created_at).toLocaleString()}
              </p>
              <p style={{ color: '#94a3b8' }}>
                Last Updated: {new Date(selectedApplication.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Partner Universities & Agreements File */}
      {activeTab === 'partnerships' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff' }}>Partner Universities & Agreement Files Directory</h3>
            <button onClick={() => setShowAddPartnerModal(true)} className="btn btn-primary btn-sm">
              <Plus style={{ width: '14px', height: '14px' }} />
              Add Partner
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {partnerUniversities.map(p => (
              <div key={p.id} className="glass-panel" style={{ padding: '16px', background: 'rgba(18, 26, 43, 0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>{p.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#06b6d4' }}>{p.country} • {p.contact_email}</span>
                  </div>
                  <span className="badge badge-documents_verified">{p.scholarships_offered} Scholarships</span>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                    Agreement Files:
                  </span>

                  {p.agreements.length === 0 ? (
                    <div style={{
                      padding: '10px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#64748b',
                      fontSize: '0.75rem',
                      marginBottom: '10px'
                    }}>
                      No agreement files uploaded yet.
                    </div>
                  ) : (
                    p.agreements.map(a => (
                      <div
                        key={a.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          marginBottom: '6px'
                        }}
                      >
                        <span style={{
                          color: '#cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <FileText style={{
                            width: '12px',
                            height: '12px',
                            color: '#6366f1'
                          }} />
                          {a.document_name}
                        </span>

                        <span style={{
                          color: '#34d399',
                          fontWeight: 600
                        }}>
                          Expires: {a.expiry_date}
                        </span>
                      </div>
                    ))
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    marginTop: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <input
                      type="date"
                      value={agreementExpiry[p.id] || ''}
                      onChange={e =>
                        setAgreementExpiry(prev => ({
                          ...prev,
                          [p.id]: e.target.value
                        }))
                      }
                      style={{
                        padding: '7px 9px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.75rem'
                      }}
                    />

                    <label
                      className="btn btn-primary btn-sm"
                      style={{
                        cursor: uploadingPartnerId === p.id
                          ? 'not-allowed'
                          : 'pointer',
                        opacity: uploadingPartnerId === p.id
                          ? 0.6
                          : 1
                      }}
                    >
                      <FileText style={{
                        width: '14px',
                        height: '14px'
                      }} />

                      {uploadingPartnerId === p.id
                        ? 'Uploading...'
                        : 'Upload Agreement'}

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        disabled={uploadingPartnerId === p.id}
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];

                          if (file) {
                            handleUploadAgreement(
                              p.id,
                              file
                            );
                          }

                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Staff Accounts & RBAC Matrix */}
      {activeTab === 'staff' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>Staff Accounts & Department Role Assignments</h3>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Email</th>
                  <th>Department Scope</th>
                  <th>System Role</th>
                  <th>Account Status</th>
                </tr>
              </thead>
              <tbody>
                {availableProfiles.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{p.full_name}</td>
                    <td>{p.email}</td>
                    <td><span className="badge badge-under_review">{p.department}</span></td>
                    <td>{p.is_admin ? <span style={{ color: '#ef4444', fontWeight: 700 }}>Admin (Oversight)</span> : 'Staff Member'}</td>
                    <td><span className="badge badge-documents_verified">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Partner University */}
      {showAddPartnerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '440px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Add New Partner University</h3>
            <form onSubmit={handleAddPartner} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>University Name</label>
                <input type="text" required placeholder="e.g. Stanford University" value={pName} onChange={e => setPName(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Country</label>
                <input type="text" required value={pCountry} onChange={e => setPCountry(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Contact Email</label>
                <input type="email" required placeholder="admissions@stanford.edu" value={pEmail} onChange={e => setPEmail(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddPartnerModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Add Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Global Staff Notice */}
      {showGlobalNotifyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '460px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Broadcast Global Staff Notice</h3>
            <form onSubmit={handleGlobalNotify} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Subject</label>
                <input type="text" required placeholder="e.g. Q3 Admission Deadline Policy Update" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Message Body</label>
                <textarea required rows={4} placeholder="Announcement text for all department staff..." value={noticeBody} onChange={e => setNoticeBody(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowGlobalNotifyModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Broadcast Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
