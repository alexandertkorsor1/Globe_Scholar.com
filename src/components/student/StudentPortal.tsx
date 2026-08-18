import React, { useRef, useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { supabase } from '../../lib/supabase';
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
  Check,
  LogOut,
  UserRound,
  Settings,
  LockKeyhole,
  Bell,
  X
} from 'lucide-react';
import { Application, ApplicationStatus, StudyLevel } from '../../types/database';
import {
  DOCUMENT_REQUIREMENTS,
  STUDY_LEVEL_OPTIONS,
} from '../../lib/document-requirements';
import { ApplicationJourney } from './ApplicationJourney';

export const StudentPortal: React.FC = () => {
  const {
    applications,
    documents,
    processFeePayment,
    addDocument,
    updateApplicationStatus,
    statusHistory,
    createApplication,
    studentApplicationsLoading,
  } = useApplication();

  const { currentProfile, logout } = useAuth();

  const documentFileInputRef = useRef<HTMLInputElement | null>(null);

  // Find the student's application.
  // Prefer the authenticated student's ID, with email as a fallback.
  const myApp = applications.find(
    a =>
      a.student_id === currentProfile?.id ||
      a.student_email?.toLowerCase() === currentProfile?.email?.toLowerCase()
  );

  // IMPORTANT:
  // All hooks must execute on every render, BEFORE any conditional return.
  const [activeStep, setActiveStep] = useState<number>(1);
  const [saveDraftMessage, setSaveDraftMessage] = useState('');

  const [degreeChoice, setDegreeChoice] = useState('');
  const [targetUni, setTargetUni] = useState('');
  const [studyLevel, setStudyLevel] = useState<StudyLevel>('postgraduate');
  const [scholarshipPref, setScholarshipPref] = useState(
    'GSP Merit Fellowship'
  );

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('992');
  const [feePaidSuccess, setFeePaidSuccess] = useState(false);
  const [creatingInitialApplication, setCreatingInitialApplication] =
    useState(false);
  const [applicationCreationError, setApplicationCreationError] =
    useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentUploadMessage, setDocumentUploadMessage] = useState('');
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [studentNotifications, setStudentNotifications] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const initialApplicationStartedRef = useRef(false);

  const myDocs = myApp
    ? documents.filter((document) => document.application_id === myApp.id)
    : [];
  const requiredDocuments = DOCUMENT_REQUIREMENTS[studyLevel];
  const uploadedDocumentFor = (documentType: string) =>
    myDocs.find((document) => document.document_type === documentType);
  const uploadedRequirementCount = requiredDocuments.filter((requirement) =>
    uploadedDocumentFor(requirement.type)
  ).length;
  const nextRequiredDocument = requiredDocuments.find(
    (requirement) => !uploadedDocumentFor(requirement.type)
  );
  const allRequiredDocumentsUploaded =
    uploadedRequirementCount === requiredDocuments.length;

  // A database trigger creates the draft during signup. This client-side
  // fallback covers student accounts created before that migration was run.
  React.useEffect(() => {
    initialApplicationStartedRef.current = false;
    setApplicationCreationError('');
  }, [currentProfile?.id]);

  React.useEffect(() => {
    setProfileFullName(currentProfile?.full_name || '');

    try {
      const savedPreference = window.localStorage.getItem(
        `report-com:student:${currentProfile?.id}:notifications`
      );
      setStudentNotifications(savedPreference !== 'false');
    } catch {
      setStudentNotifications(true);
    }
  }, [currentProfile?.id, currentProfile?.full_name]);

  React.useEffect(() => {
    if (
      studentApplicationsLoading ||
      myApp ||
      !currentProfile?.id ||
      initialApplicationStartedRef.current
    ) {
      return;
    }

    initialApplicationStartedRef.current = true;
    setCreatingInitialApplication(true);

    const createInitialApplication = async () => {
      try {
        await createApplication({
          status: 'draft',
        });
      } catch (error) {
        console.error('Unable to create the student draft application:', error);
        setApplicationCreationError(
          'We could not prepare your application. Please refresh the page and try again.'
        );
      } finally {
        setCreatingInitialApplication(false);
      }
    };

    createInitialApplication();
  }, [
    createApplication,
    currentProfile?.id,
    myApp,
    studentApplicationsLoading,
  ]);

  // Keep form state synchronized when the application becomes available.
  React.useEffect(() => {
    if (!myApp) return;

    setDegreeChoice(myApp.degree_program || '');
    setTargetUni(myApp.target_university || '');
    setStudyLevel(myApp.study_level || 'postgraduate');
    setScholarshipPref(
      myApp.scholarship_requested || 'GSP Merit Fellowship'
    );
    setFeePaidSuccess(
      myApp.student_id === 'std-001'
    );
  }, [
    myApp?.id,
    myApp?.degree_program,
    myApp?.target_university,
    myApp?.scholarship_requested,
    myApp?.student_id,
  ]);

  // Now it is safe to conditionally render.
  if (!myApp) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div
          className="glass-panel"
          style={{
            maxWidth: '600px',
            width: '100%',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <GraduationCap
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 20px',
              color: '#06b6d4',
            }}
          />

          <h2 style={{ color: '#fff', marginBottom: '12px' }}>
            Preparing your student dashboard
          </h2>

          <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
            {applicationCreationError ||
              (studentApplicationsLoading || creatingInitialApplication
                ? 'Your application is being set up. This will only take a moment.'
                : 'Your application is being prepared.')}
          </p>
        </div>
      </div>
    );
  }

  const myHistory = statusHistory.filter(
    h => h.application_id === myApp.id
  );

  // ...rest of your existing component

  // Form step state

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setSaveDraftMessage('');

    const { data, error } = await supabase
      .from('applications')
      .update({
        target_university: targetUni,
        degree_program: degreeChoice,
        study_level: studyLevel,
        scholarship_requested: scholarshipPref,
      })
      .eq('id', myApp.id)
      .eq('student_id', currentProfile.id)
      .select('*')
      .single();

    setIsSavingDraft(false);

    if (error) {
      console.error('Unable to save application draft:', error);
      setSaveDraftMessage('Could not save your changes. Please try again.');
      return false;
    }

    Object.assign(myApp, data as Application);
    setSaveDraftMessage(
      'Application draft saved successfully at ' +
        new Date().toLocaleTimeString()
    );
    setTimeout(() => setSaveDraftMessage(''), 4000);
    return true;
  };

  const handleFinalSubmit = () => {
    if (!allRequiredDocumentsUploaded) {
      setActiveStep(2);
      setDocumentUploadMessage(
        'Please upload every required document before submitting your application.'
      );
      return;
    }

    if (!feePaidSuccess) {
      alert('Please complete the inline registration fee payment step before final application submission.');
      return;
    }
    updateApplicationStatus(myApp.id, 'submitted', 'Final application submitted by student via portal wizard.');
    alert('Congratulations! Your application has been officially submitted and routed to Data & Admissions.');
  };

  const handleSaveProfile = async () => {
    const fullName = profileFullName.trim();

    if (!fullName) {
      setProfileMessage('Enter your full name before saving.');
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage('');

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', currentProfile.id)
      .select('*')
      .single();

    setIsSavingProfile(false);

    if (error) {
      console.error('Unable to update student profile:', error);
      setProfileMessage('We could not update your profile. Please try again.');
      return;
    }

    Object.assign(currentProfile, data);

    try {
      window.localStorage.setItem(
        `report-com:student:${currentProfile.id}:notifications`,
        String(studentNotifications)
      );
    } catch {
      // The profile update remains successful if browser storage is unavailable.
    }

    setProfileMessage('Profile and notification preferences saved.');
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');

    if (newPassword.length < 8) {
      setPasswordMessage('Use at least 8 characters for your new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('Your new passwords do not match.');
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsChangingPassword(false);

    if (error) {
      console.error('Unable to change password:', error);
      setPasswordMessage(error.message);
      return;
    }

    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordMessage('Password changed successfully. Keep it private and secure.');
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
    <div className="student-portal" style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Student Portal Header Banner */}
      <div className="glass-panel student-portal-hero" style={{ padding: '24px 32px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <span
              className={`badge badge-${myApp.status}`}
              style={{
                fontSize: '0.75rem',
                padding: '6px 14px',
                whiteSpace: 'nowrap',
              }}
            >
              Current Status: {myApp.status.toUpperCase()}
            </span>

            <button
              type="button"
              onClick={() => {
                setProfileMessage('');
                setPasswordMessage('');
                setShowProfileSettings(true);
              }}
              className="student-profile-trigger"
            >
              <UserRound size={16} />
              Profile & settings
            </button>
          </div>
        </div>
      </div>

      {/* Application Progress Tracker (Milestone Bar) */}
      <div className="glass-panel student-progress-card" style={{ padding: '20px 28px' }}>
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
                <span className="student-progress-label" style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#f8fafc' : '#94a3b8' }}>
                  {m.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ApplicationJourney
        application={myApp}
        statusHistory={myHistory}
      />

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Study Level</label>
              <select
                value={studyLevel}
                onChange={e => setStudyLevel(e.target.value as StudyLevel)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
              >
                {STUDY_LEVEL_OPTIONS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

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
              <button onClick={() => void handleSaveDraft()} disabled={isSavingDraft} className="btn btn-secondary">
                <Save style={{ width: '14px', height: '14px' }} />
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={async () => {
                  if (await handleSaveDraft()) setActiveStep(2);
                }}
                disabled={isSavingDraft}
                className="btn btn-primary"
              >
                Next: Document Uploads →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Document Upload Step */}
      {activeStep === 2 && (
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Required Documents</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {STUDY_LEVEL_OPTIONS.find((level) => level.value === studyLevel)?.label}: {uploadedRequirementCount} of {requiredDocuments.length} required documents uploaded.
              </p>
            </div>
            <input
              ref={documentFileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];

                if (!file || !nextRequiredDocument) {
                  return;
                }

                if (file.size > 10 * 1024 * 1024) {
                  setDocumentUploadMessage('Choose a file smaller than 10 MB.');
                  e.target.value = '';
                  return;
                }

                try {
                  setIsUploadingDocument(true);
                  setDocumentUploadMessage('');
                  await addDocument(
                    myApp.id,
                    nextRequiredDocument.type,
                    file
                  );
                  setDocumentUploadMessage(
                    `${nextRequiredDocument.title} uploaded successfully.`
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
                  setIsUploadingDocument(false);
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={() => documentFileInputRef.current?.click()}
              disabled={!nextRequiredDocument || isUploadingDocument}
              className="btn btn-primary btn-sm"
            >
              <Upload style={{ width: '14px', height: '14px' }} />
              {isUploadingDocument
                ? 'Uploading...'
                : nextRequiredDocument
                  ? `Upload: ${nextRequiredDocument.title}`
                  : 'All documents uploaded'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {requiredDocuments.map((requirement, index) => {
              const uploadedDocument = uploadedDocumentFor(requirement.type);
              const isNext = nextRequiredDocument?.id === requirement.id;

              return (
                <div
                  key={requirement.id}
                  className="student-document-requirement"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: `1px solid ${uploadedDocument ? '#10b981' : isNext ? '#6366f1' : 'var(--border-color)'}`,
                    background: uploadedDocument
                      ? 'rgba(16, 185, 129, 0.08)'
                      : isNext
                        ? 'rgba(99, 102, 241, 0.12)'
                        : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: uploadedDocument ? '#10b981' : isNext ? '#6366f1' : 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700, flexShrink: 0,
                  }}>
                    {uploadedDocument ? <Check style={{ width: '16px', height: '16px' }} /> : index + 1}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="student-document-requirement-title" style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{requirement.title}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '3px' }}>{requirement.description}</div>
                    {uploadedDocument && <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '5px' }}>Uploaded: {uploadedDocument.file_name}</div>}
                  </div>
                  <span className={`badge badge-${uploadedDocument ? 'documents_verified' : isNext ? 'under_review' : 'draft'}`}>
                    {uploadedDocument ? 'Uploaded' : isNext ? 'Upload next' : 'Locked'}
                  </span>
                </div>
              );
            })}
          </div>

          {documentUploadMessage && (
            <div style={{ color: documentUploadMessage.startsWith('Please') || documentUploadMessage.startsWith('Choose') ? '#fbbf24' : '#34d399', fontSize: '0.85rem' }}>
              {documentUploadMessage}
            </div>
          )}

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
            <button
              onClick={() => {
                if (allRequiredDocumentsUploaded) {
                  setActiveStep(3);
                } else {
                  setDocumentUploadMessage('Please upload every required document before continuing.');
                }
              }}
              disabled={!allRequiredDocumentsUploaded}
              className="btn btn-primary"
            >
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

          <div className="student-review-card" style={{ background: 'rgba(18, 26, 43, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#94a3b8' }}>Student Name:</span> <strong>{myApp.student_name}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Target Institution:</span> <strong>{myApp.target_university}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Degree Program:</span> <strong>{myApp.degree_program}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Registration Fee:</span> <strong style={{ color: feePaidSuccess ? '#34d399' : '#f43f5e' }}>{feePaidSuccess ? 'PAID ($150.00)' : 'UNPAID'}</strong></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button onClick={() => void handleSaveDraft()} disabled={isSavingDraft} className="btn btn-secondary">
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

      {showProfileSettings && (
        <div className="modal-overlay student-profile-modal" role="presentation">
          <section
            className="modal-content student-profile-settings"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-profile-settings-title"
          >
            <header className="student-settings-header">
              <div>
                <span className="settings-eyebrow">Student account</span>
                <h2 id="student-profile-settings-title">Profile & settings</h2>
                <p>Manage your account details, updates, and account security.</p>
              </div>
              <button
                type="button"
                className="settings-close-button"
                onClick={() => setShowProfileSettings(false)}
                aria-label="Close profile settings"
              >
                <X size={20} />
              </button>
            </header>

            <div className="student-account-summary">
              <div className="student-account-avatar">
                {currentProfile.full_name
                  .split(' ')
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <strong>{currentProfile.full_name}</strong>
                <span>{currentProfile.email}</span>
              </div>
              <span className="student-account-status">Active account</span>
            </div>

            <div className="student-settings-section">
              <div className="settings-section-title">
                <UserRound size={18} />
                <div>
                  <h3>Personal details</h3>
                  <p>Keep your account information accurate.</p>
                </div>
              </div>

              <label className="form-label" htmlFor="student-profile-name">
                Full name
              </label>
              <input
                id="student-profile-name"
                className="form-input"
                value={profileFullName}
                onChange={(event) => setProfileFullName(event.target.value)}
                autoComplete="name"
              />

              <label className="form-label" htmlFor="student-profile-email">
                Email address
              </label>
              <input
                id="student-profile-email"
                className="form-input"
                value={currentProfile.email}
                disabled
                aria-describedby="student-email-help"
              />
              <p id="student-email-help" className="student-settings-help">
                Your sign-in email is protected. Contact support if it needs to change.
              </p>

              <label className="student-notification-toggle">
                <span>
                  <Bell size={18} />
                  <span>
                    <strong>Application updates</strong>
                    <small>Show alerts when your application status or documents change.</small>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={studentNotifications}
                  onChange={(event) => setStudentNotifications(event.target.checked)}
                  aria-label="Application updates"
                />
              </label>

              {profileMessage && (
                <p className="student-settings-message" role="status">
                  {profileMessage}
                </p>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleSaveProfile()}
                disabled={isSavingProfile}
              >
                <Save size={16} />
                {isSavingProfile ? 'Saving profile...' : 'Save profile'}
              </button>
            </div>

            <div className="student-settings-section">
              <div className="settings-section-title">
                <LockKeyhole size={18} />
                <div>
                  <h3>Account security</h3>
                  <p>Use a strong, private password that you do not reuse elsewhere.</p>
                </div>
              </div>

              <label className="form-label" htmlFor="student-new-password">
                New password
              </label>
              <input
                id="student-new-password"
                className="form-input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />

              <label className="form-label" htmlFor="student-confirm-password">
                Confirm new password
              </label>
              <input
                id="student-confirm-password"
                className="form-input"
                type="password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
              />

              {passwordMessage && (
                <p className="student-settings-message" role="status">
                  {passwordMessage}
                </p>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void handleChangePassword()}
                disabled={isChangingPassword}
              >
                <ShieldCheck size={16} />
                {isChangingPassword ? 'Updating password...' : 'Change password'}
              </button>
            </div>

            <footer className="student-settings-footer">
              <div>
                <strong>Sign out</strong>
                <span>End this session on the current device.</span>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Student logout failed:', error);
                    alert('Logout failed. Please try again.');
                  }
                }}
              >
                <LogOut size={16} />
                Log out
              </button>
            </footer>
          </section>
        </div>
      )}

    </div>
  );
};
