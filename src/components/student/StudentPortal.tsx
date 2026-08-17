import React, { useRef, useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Save,
  Send,
  Upload,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ApplicationStatus, DocType } from '../../types/database';

export const StudentPortal: React.FC = () => {
  const {
    applications,
    documents,
    processFeePayment,
    addDocument,
    updateApplicationStatus,
    statusHistory
  } = useApplication();
  const { currentProfile } = useAuth();
  const documentFileInputRef = useRef<HTMLInputElement | null>(null);

  // Find applicant's active application (or default sample application Arjun Patel)
  const myApp = applications.find(a => a.student_email === currentProfile.email) || applications[0];
  const myDocs = documents.filter(d => d.application_id === myApp.id);
  const myHistory = statusHistory.filter(h => h.application_id === myApp.id);

  const [activeStep, setActiveStep] = useState<number>(1);
  const [saveDraftMessage, setSaveDraftMessage] = useState('');

  // Form step state
  const [degreeChoice, setDegreeChoice] = useState(myApp.degree_program);
  const [targetUni, setTargetUni] = useState(myApp.target_university);
  const [scholarshipPref, setScholarshipPref] = useState(myApp.scholarship_requested || 'GSP Merit Fellowship');

  // Inline Fee Payment state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('992');
  const [feePaidSuccess, setFeePaidSuccess] = useState(myApp.student_id === 'std-001');

  const handleSaveDraft = () => {
    myApp.degree_program = degreeChoice;
    myApp.target_university = targetUni;
    myApp.scholarship_requested = scholarshipPref;
    setSaveDraftMessage('Application draft saved successfully at ' + new Date().toLocaleTimeString());
    setTimeout(() => setSaveDraftMessage(''), 4000);
  };

  const handleFinalSubmit = () => {
    if (!feePaidSuccess) {
      alert('Please complete the inline registration fee payment step before final application submission.');
      return;
    }
    updateApplicationStatus(myApp.id, 'submitted', 'Final application submitted by student via portal wizard.');
    alert('Congratulations! Your application has been officially submitted and routed to Data & Admissions.');
  };

  const handlePayFee = (e: React.FormEvent) => {
    e.preventDefault();
    processFeePayment(myApp.id, 150.00, `PAY-PORTAL-${Date.now()}`);
    setFeePaidSuccess(true);
    alert('Payment of $150.00 USD verified! Receipt generated.');
  };

  // Milestone Progress Tracker Logic
  const getStepStatusClass = (stepNum: number) => {
    const statusMap: Record<ApplicationStatus, number> = {
      draft: 1,
      submitted: 2,
      documents_missing: 2,
      documents_verified: 3,
      under_review: 3,
      admissions_review: 4,
      ready_for_processing: 4,
      submitted_to_institution: 4,
      decision_pending: 4,
      approved: 5,
      rejected: 5
    };
    const currentLevel = statusMap[myApp.status] || 1;
    if (currentLevel > stepNum) return 'completed';
    if (currentLevel === stepNum) return 'active';
    return 'pending';
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Student Portal Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 32px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GraduationCap style={{ color: '#6366f1', width: '28px', height: '28px' }} />
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: 800 }}>
                Applicant Portal — Globe Scholar Pathways
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
              Welcome back, <strong style={{ color: '#f8fafc' }}>{myApp.student_name}</strong>! Application Ref: <strong style={{ color: '#06b6d4' }}>{myApp.application_number}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`badge badge-${myApp.status}`} style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
              Current Status: {myApp.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Application Progress Tracker (Milestone Bar) */}
      <div className="glass-panel" style={{ padding: '20px 28px' }}>
        <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          Live Application Progress Milestones
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {[
            { num: 1, title: 'Drafting' },
            { num: 2, title: 'Submission' },
            { num: 3, title: 'Doc Verification' },
            { num: 4, title: 'Admissions Review' },
            { num: 5, title: 'Final Decision' }
          ].map((m, idx) => {
            const st = getStepStatusClass(m.num);
            const isComp = st === 'completed';
            const isActive = st === 'active';

            return (
              <div key={m.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isComp ? '#10b981' : isActive ? '#6366f1' : 'rgba(255,255,255,0.06)',
                  color: isComp || isActive ? '#fff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  boxShadow: isActive ? '0 0 16px rgba(99, 102, 241, 0.6)' : 'none',
                  border: '2px solid ' + (isComp ? '#34d399' : isActive ? '#818cf8' : 'rgba(255,255,255,0.1)')
                }}>
                  {isComp ? <Check style={{ width: '18px', height: '18px' }} /> : m.num}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#f8fafc' : '#94a3b8' }}>
                  {m.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Step Form Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {[
          { step: 1, label: '1. Program & Profile' },
          { step: 2, label: '2. Document Uploads' },
          { step: 3, label: '3. Registration Fee Payment' },
          { step: 4, label: '4. Review & Final Submit' }
        ].map(s => (
          <button
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            className={`btn ${activeStep === s.step ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Step 1: Personal & Program Choice */}
      {activeStep === 1 && (
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Target Institution & Degree Choice</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Target University</label>
              <select
                value={targetUni}
                onChange={e => setTargetUni(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
              >
                <option value="University of Oxford">University of Oxford (United Kingdom)</option>
                <option value="University of Cambridge">University of Cambridge (United Kingdom)</option>
                <option value="Harvard University">Harvard University (United States)</option>
                <option value="University of Melbourne">University of Melbourne (Australia)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Degree Program</label>
              <input
                type="text"
                value={degreeChoice}
                onChange={e => setDegreeChoice(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Scholarship Requested</label>
            <input
              type="text"
              value={scholarshipPref}
              onChange={e => setScholarshipPref(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: '#34d399' }}>{saveDraftMessage}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSaveDraft} className="btn btn-secondary">
                <Save style={{ width: '14px', height: '14px' }} />
                Save Draft
              </button>
              <button onClick={() => setActiveStep(2)} className="btn btn-primary">
                Next: Document Uploads →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Document Upload Step */}
      {activeStep === 2 && (
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Applicant Document Repository</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Upload high-resolution scans of required documents. Files are stored securely on Supabase Storage.
              </p>
            </div>
            <input
              ref={documentFileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];

                if (!file) {
                  return;
                }

                try {
                  await addDocument(
                    myApp.id,
                    'passport',
                    file
                  );
                } catch (error: any) {
                  console.error(
                    'STUDENT DOCUMENT UPLOAD ERROR:',
                    error
                  );

                  alert(
                    `Document upload failed:\n\n${
                      error?.message || 'Unknown error'
                    }`
                  );
                } finally {
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={() => documentFileInputRef.current?.click()}
              className="btn btn-primary btn-sm"
            >
              <Upload style={{ width: '14px', height: '14px' }} />
              Upload Document File
            </button>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>File Name</th>
                  <th>Version</th>
                  <th>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {myDocs.map(d => (
                  <tr key={d.id}>
                    <td><span className="badge badge-submitted">{d.document_type}</span></td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{d.file_name}</td>
                    <td><span className="badge badge-under_review">v{d.current_version}</span></td>
                    <td>
                      {d.is_verified ? (
                        <span className="badge badge-documents_verified">✓ Verified</span>
                      ) : (
                        <span className="badge badge-documents_missing">Pending Review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => setActiveStep(3)} className="btn btn-primary">
              Next: Registration Fee Payment →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Inline Fee Payment Gateway */}
      {activeStep === 3 && (
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard style={{ color: '#10b981' }} />
              Inline Portal Registration Fee Payment
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Standard application processing fee: <strong style={{ color: '#34d399' }}>$150.00 USD</strong>. Paid directly to Finance ledger.
            </p>
          </div>

          {feePaidSuccess ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <CheckCircle2 style={{ color: '#34d399', width: '36px', height: '36px', margin: '0 auto 8px auto' }} />
              <h4 style={{ fontSize: '1rem', color: '#fff' }}>Registration Fee Cleared</h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                Transaction Receipt: <span style={{ color: '#06b6d4', fontFamily: 'monospace' }}>PAY-PORTAL-STRIPE-8912039</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handlePayFee} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '480px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Card Number</label>
                <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Expiry (MM/YY)</label>
                  <input type="text" value={expiry} onChange={e => setExpiry(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>CVC</label>
                  <input type="text" value={cvc} onChange={e => setCvc(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                Pay $150.00 Registration Fee & Verify
              </button>
            </form>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => setActiveStep(4)} className="btn btn-primary">
              Next: Review & Submit →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Final Review & Submit */}
      {activeStep === 4 && (
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Final Application Review & Authorization</h3>

          <div style={{ background: 'rgba(18, 26, 43, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#94a3b8' }}>Student Name:</span> <strong>{myApp.student_name}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Target Institution:</span> <strong>{myApp.target_university}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Degree Program:</span> <strong>{myApp.degree_program}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Registration Fee:</span> <strong style={{ color: feePaidSuccess ? '#34d399' : '#f43f5e' }}>{feePaidSuccess ? 'PAID ($150.00)' : 'UNPAID'}</strong></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button onClick={handleSaveDraft} className="btn btn-secondary">
              <Save style={{ width: '14px', height: '14px' }} />
              Save Draft
            </button>
            <button onClick={handleFinalSubmit} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
              <Send style={{ width: '16px', height: '16px' }} />
              Submit Application to GSP Portal
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
