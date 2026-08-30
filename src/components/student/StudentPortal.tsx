import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import brandLogo from '../../brand-logo.jpg';
import { drawLetterhead } from '../../lib/work-assignment-pdf';
import { useApplication } from '../../context/ApplicationContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Save,
  Send,
  Upload,
  CreditCard,
  Building,
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
  Download,
  X,
  Eye,
  BookOpen,
  Mail
} from 'lucide-react';
import { Application, ApplicationStatus, StudyLevel, FinancialRecord, VisaApplication, VisaDocument, StudentEmail } from '../../types/database';
import {
  DOCUMENT_REQUIREMENTS,
  STUDY_LEVEL_OPTIONS,
} from '../../lib/document-requirements';
import { ApplicationJourney } from './ApplicationJourney';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
import { checkPasswordStrength } from '../../lib/password-utils';
import {
  isPassportPhotoType,
  compressPassportPhotoFile,
  MAX_AVATAR_SIZE_BYTES,
  MAX_AVATAR_SIZE_LABEL,
} from '../../lib/image-utils';

export const StudentPortal: React.FC = () => {
  const {
    applications,
    documents,
    financialRecords,
    paymentReceipts,
    processFeePayment,
    handoffToAdmissions,
    addDocument,
    statusHistory,
    createApplication,
    studentApplicationsLoading,
    visaApplications,
    applyForVisa,
    loadVisaDocuments,
    uploadVisaDocument,
    deleteVisaDocument,
    partnerUniversities,
    universityCourses,
    scholarships,
    universityBrochures,
    studentEmails,
    systemBankDetails,
  } = useApplication();

  const { currentProfile, logout, updateProfileAvatar } = useAuth();

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
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [saveDraftMessage, setSaveDraftMessage] = useState('');

  const [degreeChoice, setDegreeChoice] = useState('');
  const [targetUni, setTargetUni] = useState('');
  const [studyLevel, setStudyLevel] = useState<StudyLevel>('postgraduate');
  const [scholarshipPref, setScholarshipPref] = useState(
    'GSP Merit Fellowship'
  );

  const [paymentProvider, setPaymentProvider] = useState('Bank transfer');
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardTermsAccepted, setCardTermsAccepted] = useState(false);
  const [paymentType, setPaymentType] = useState<
    'registration_fee' | 'tuition_fee' | 'admission_fee'
  >('registration_fee');
  const [paymentAmount, setPaymentAmount] = useState('150.00');
  const [paymentReference, setPaymentReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [feePaidSuccess, setFeePaidSuccess] = useState(false);
  const [feePaymentMessage, setFeePaymentMessage] = useState('');
  const [isSubmittingFee, setIsSubmittingFee] = useState(false);
  const [showCardOtpModal, setShowCardOtpModal] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
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
  const [uploadedVisaDocs, setUploadedVisaDocs] = useState<VisaDocument[]>([]);
  const [visaDocsLoading, setVisaDocsLoading] = useState(false);
  const [uploadingVisaDocType, setUploadingVisaDocType] = useState<string | null>(null);
  const [visaUploadError, setVisaUploadError] = useState('');
  const [initializingVisa, setInitializingVisa] = useState(false);

  const initialApplicationStartedRef = useRef(false);

  const myVisaApp = visaApplications.find(a => a.student_id === currentProfile?.id);

  React.useEffect(() => {
    if (activeStep === 6 && myVisaApp?.id) {
      setVisaDocsLoading(true);
      loadVisaDocuments(myVisaApp.id)
        .then(setUploadedVisaDocs)
        .catch(err => console.error(err))
        .finally(() => setVisaDocsLoading(false));
    }
  }, [activeStep, myVisaApp?.id]);

  const handleVisaFileUpload = async (docType: string, file: File) => {
    if (!myVisaApp?.id) return;
    if (file.type !== 'application/pdf') {
      setVisaUploadError('Only PDF files are allowed for visa submissions.');
      return;
    }
    
    setVisaUploadError('');
    setUploadingVisaDocType(docType);
    try {
      await uploadVisaDocument(myVisaApp.id, docType, file);
      const docs = await loadVisaDocuments(myVisaApp.id);
      setUploadedVisaDocs(docs);
    } catch (err: any) {
      setVisaUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploadingVisaDocType(null);
    }
  };

  const handleVisaFileDelete = async (docId: string, filePath: string) => {
    try {
      await deleteVisaDocument(docId, filePath);
      if (myVisaApp?.id) {
        const docs = await loadVisaDocuments(myVisaApp.id);
        setUploadedVisaDocs(docs);
      }
    } catch (err) {
      console.error('Failed to delete visa document:', err);
    }
  };

  const handleInitializeVisa = async () => {
    if (!myApp?.id) return;
    setInitializingVisa(true);
    try {
      await applyForVisa(myApp.id);
    } catch (err) {
      console.error(err);
    } finally {
      setInitializingVisa(false);
    }
  };

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
  const registrationFeeRecord = myApp
    ? financialRecords.find(
        (record) =>
          record.application_id === myApp.id &&
          record.record_type === 'registration_fee' &&
          record.status !== 'rejected'
      )
    : undefined;
  const registrationFeeReceipt = registrationFeeRecord
    ? paymentReceipts.find(
        (receipt) =>
          receipt.financial_record_id === registrationFeeRecord.id ||
          (
            receipt.application_id === myApp?.id &&
            receipt.status === 'issued'
          )
      )
    : undefined;
  const approvedRegistrationFeeReceipt =
    registrationFeeRecord?.status === 'paid'
      ? registrationFeeReceipt
      : undefined;
  const hasPaymentConfirmation = feePaidSuccess || Boolean(registrationFeeRecord);
  const formatPaymentType = (value: string) =>
    value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  // All financial records belonging to this student's application.
  // This includes registration fees and any future student payments.
  const studentPaymentRecords = myApp
    ? financialRecords
        .filter((record) => record.application_id === myApp.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
    : [];

  const selectedPartner = partnerUniversities.find(p => p.name === targetUni);
  const availableCourses = selectedPartner
    ? universityCourses.filter(c => c.university_id === selectedPartner.id)
    : [];
  const availableScholarships = selectedPartner
    ? scholarships.filter(s => s.university_id === selectedPartner.id)
    : [];
  const selectedCourseDetails = availableCourses.find(c => c.course_name === degreeChoice);

  const handleTargetUniChange = (uniName: string) => {
    setTargetUni(uniName);
    const partner = partnerUniversities.find(p => p.name === uniName);
    const firstCourse = partner
      ? universityCourses.find(c => c.university_id === partner.id)
      : null;
    setDegreeChoice(firstCourse ? firstCourse.course_name : '');
    
    const firstScholarship = partner
      ? scholarships.find(s => s.university_id === partner.id)
      : null;
    setScholarshipPref(firstScholarship ? firstScholarship.name : 'None');
  };

  const receiptForPayment = (recordId: string) =>
    paymentReceipts.find(
      (receipt) =>
        receipt.financial_record_id === recordId &&
        receipt.status === 'issued'
    );

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
        `gsp:student:${currentProfile?.id}:notifications`
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

  const handleFinalSubmit = async () => {
    if (!allRequiredDocumentsUploaded) {
      setActiveStep(2);
      setDocumentUploadMessage(
        'Please upload every required document before submitting your application.'
      );
      return;
    }

    if (!hasPaymentConfirmation) {
      setActiveStep(3);
      setFeePaymentMessage('Submit your payment confirmation before sending the application to Admissions.');
      return;
    }
    if (myApp.handed_off_to_admissions) {
      alert('Your application has already been sent to Admissions. You can follow its progress from your application journey.');
      return;
    }
    try {
      await handoffToAdmissions(myApp.id);
      alert('Your application has been sent to Admissions. Finance will verify your payment confirmation separately.');
    } catch (error) {
      console.error('Unable to route application to Admissions:', error);
      alert('Your application was submitted, but it could not be routed to Admissions. Please refresh the page and try again.');
    }
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
        `gsp:student:${currentProfile.id}:notifications`,
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

    const strength = checkPasswordStrength(newPassword);
    if (strength.isWeak) {
      setPasswordMessage(
        strength.warning ||
          'Password is weak. Please choose a stronger password with a mix of uppercase letters, numbers, and symbols.'
      );
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

  const handlePayFee = async (e: React.FormEvent) => {
    e.preventDefault();

    const isStep3 = activeStep === 3;
    const finalPaymentType = isStep3 ? 'registration_fee' : paymentType;
    const finalAmount = isStep3 ? 150.00 : Number(paymentAmount);

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      setFeePaymentMessage('Enter a valid payment amount greater than zero.');
      return;
    }

    const isCardPayment = paymentProvider === 'Card payment';

    if (isCardPayment) {
      const digitsOnly = cardNumber.replace(/\D/g, '');
      const expiryIsValid = /^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(cardExpiry.trim());
      const cvvIsValid = /^\d{3,4}$/.test(cardCvv.trim());

      if (digitsOnly.length < 12 || digitsOnly.length > 19) {
        setFeePaymentMessage('Enter a valid debit or credit card number.');
        return;
      }

      if (!expiryIsValid) {
        setFeePaymentMessage('Enter a valid card expiry date in MM / YY format.');
        return;
      }

      if (!cvvIsValid) {
        setFeePaymentMessage('Enter a valid CVV.');
        return;
      }

      if (!cardTermsAccepted) {
        setFeePaymentMessage('Please agree to the payment terms before continuing.');
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(code);
      setEnteredOtp('');
      setOtpError('');
      setShowCardOtpModal(true);
      return;
    }

    await executePaymentSubmit(finalPaymentType, finalAmount);
  };

  const executePaymentSubmit = async (type: 'registration_fee' | 'tuition_fee' | 'admission_fee', amount: number) => {
    const isCardPayment = paymentProvider === 'Card payment';
    let reference = paymentReference.trim();

    if (isCardPayment) {
      const digitsOnly = cardNumber.replace(/\D/g, '');
      reference = `${cardType.toUpperCase()} card ending ${digitsOnly.slice(-4)} - OTP verified - ${Date.now()}`;
    }

    setIsSubmittingFee(true);
    setFeePaymentMessage('');

    try {
      const record = await processFeePayment(
        myApp.id,
        amount,
        `${isCardPayment ? `Card payment (${cardType})` : paymentProvider}: ${reference}`,
        type,
        proofFile || undefined
      );

      setFeePaidSuccess(true);
      setPaymentReference('');
      setProofFile(null);
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardTermsAccepted(false);
      setShowCardOtpModal(false);

      setFeePaymentMessage(
        `${formatPaymentType(type)} payment of $${amount.toFixed(2)} submitted successfully. Finance must verify it before the PDF receipt is issued.`
      );

      console.log('Payment submitted:', record);
    } catch (error) {
      setFeePaymentMessage(
        error instanceof Error
          ? error.message
          : 'We could not submit your payment confirmation. Please try again.'
      );
    } finally {
      setIsSubmittingFee(false);
    }
  };

  const renderPaymentForm = (isStep3: boolean) => {
    const isCardPayment = paymentProvider === 'Card payment';
    return (
      <form onSubmit={handlePayFee} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Payment type</label>
            <select
              value={isStep3 ? 'registration_fee' : paymentType}
              disabled={isStep3}
              onChange={e => setPaymentType(e.target.value as any)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="registration_fee">Registration Fee</option>
              <option value="admission_fee">Admission Fee</option>
              <option value="tuition_fee">Tuition Fee</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Amount paid (USD)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              disabled={isStep3}
              value={isStep3 ? '150.00' : paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              placeholder="Enter amount paid"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Payment provider</label>
            <select value={paymentProvider} onChange={e => setPaymentProvider(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', outline: 'none' }}>
              <option value="Bank transfer">Bank transfer</option>
              <option value="Card payment">Card payment</option>
              <option value="Online payment provider">Online payment provider</option>
            </select>
          </div>
        </div>

        {isCardPayment && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', background: '#ffffff', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 800, background: '#f8fafc' }}>
              <CreditCard style={{ width: '18px', height: '18px', color: '#2563eb' }} />
              Card Payment Details
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px 14px', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: '10px', color: '#1e40af', fontSize: '0.82rem', background: 'rgba(37, 99, 235, 0.06)', fontWeight: 500 }}>
                Your transaction will require card OTP verification simulation. Globe Scholars Pathways, LLC. does not store CVV or passwords.
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { value: 'debit', label: 'Debit Card' },
                  { value: 'credit', label: 'Credit Card' },
                ].map((option) => (
                  <label key={option.value} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 650, cursor: 'pointer', fontSize: '0.86rem' }}>
                    <input
                      type="radio"
                      checked={cardType === option.value}
                      onChange={() => setCardType(option.value as 'debit' | 'credit')}
                      style={{ accentColor: '#2563eb' }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 700 }}>Card number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value.replace(/[^\d\s-]/g, '').slice(0, 23))}
                  placeholder="Enter card number"
                  autoComplete="cc-number"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 700 }}>Expiry date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(event) => setCardExpiry(event.target.value.replace(/[^\d/ ]/g, '').slice(0, 7))}
                    placeholder="MM / YY"
                    autoComplete="cc-exp"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 700 }}>CVV</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={cardCvv}
                    onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Enter CVV"
                    autoComplete="cc-csc"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.8rem', lineHeight: 1.5, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={cardTermsAccepted}
                  onChange={(event) => setCardTermsAccepted(event.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
                I agree to authorize this transaction. The receipt will be available in the system after verification.
              </label>
            </div>
          </div>
        )}

        {paymentProvider === 'Bank transfer' && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', background: '#ffffff', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 800, background: '#f8fafc' }}>
              <Building style={{ width: '18px', height: '18px', color: '#2563eb' }} />
              Organization Bank Account Details
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 20px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Bank Name</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{systemBankDetails?.bank_name || 'Global Executive Bank'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Account Name</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{systemBankDetails?.account_name || 'Globe Scholars Pathways, LLC'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Account Number</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{systemBankDetails?.account_number || '987654321098'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>SWIFT / BIC</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{systemBankDetails?.swift_code || 'GEBXXUS33XXX'}</strong>
                </div>
                {systemBankDetails?.iban && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>IBAN</span>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a', fontFamily: 'monospace' }}>{systemBankDetails.iban}</strong>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d97706', background: 'rgba(217, 119, 6, 0.06)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(217, 119, 6, 0.25)', fontWeight: 500 }}>
                ⚠️ <strong>Important Reference Note:</strong> Please use the following reference format when making your bank transfer: <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', color: '#b45309', fontWeight: 'bold' }}>{systemBankDetails?.reference_format || 'GSP-STUDENT-EMAIL (e.g. GSP-john@example.com)'}</code>
              </div>
            </div>
          </div>
        )}

        {!isCardPayment && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Payment reference</label>
              <input type="text" required value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="Enter transfer reference" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Upload Proof of Payment (Receipt PDF / Image)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexGrow: 1,
                    justifyContent: 'center'
                  }}
                >
                  <Upload size={14} style={{ color: '#2563eb' }} />
                  {proofFile ? proofFile.name.slice(0, 20) + (proofFile.name.length > 20 ? '...' : '') : 'Select payment receipt'}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
                {proofFile && (
                  <button
                    type="button"
                    onClick={() => setProofFile(null)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'none',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 650
                    }}
                    title="Remove selected file"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={isSubmittingFee} className="btn btn-primary" style={{ marginTop: '10px' }}>
          {isSubmittingFee ? 'Submitting confirmation…' : isCardPayment ? 'Initiate Card Payment' : 'Send payment confirmation'}
        </button>
      </form>
    );
  };

  const downloadPaymentReceiptPdf = (
    record: FinancialRecord,
    receipt?: (typeof paymentReceipts)[number]
  ) => {
    if (
      !receipt ||
      receipt.status !== 'issued' ||
      !['paid', 'approved'].includes(record.status)
    ) {
      setFeePaymentMessage(
        'The PDF receipt will be available after Finance approves the payment.'
      );
      return;
    }

    const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();

    // Compute Series Number
    const sortedReceipts = [...paymentReceipts]
      .sort((a, b) => new Date(a.created_at || a.issued_at).getTime() - new Date(b.created_at || b.issued_at).getTime());
    const index = sortedReceipts.findIndex((r) => r.id === receipt.id);
    const seriesStr = index !== -1 ? String(index + 1).padStart(3, '0') : '001';

    // Draw Letterhead
    drawLetterhead(pdf, 'finance', seriesStr);

    // Receipt number title
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT RECEIPT', 20, 52);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    let y = 63;

    const addRow = (label: string, value: string) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 116, 139);
      pdf.text(label, 20, y);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.text(value || 'N/A', 75, y);

      y += 11;
    };

    addRow('Receipt Number:', receipt.receipt_number);
    addRow('Student:', receipt.student_name);
    addRow('Application No.:', receipt.application_number);
    addRow(
      'Payment Type:',
      formatPaymentType(record.record_type)
    );
    addRow('Payment Reference:', receipt.payment_reference || record.payment_reference || 'N/A');
    addRow('Payment Status:', 'PAID / VERIFIED');
    addRow(
      'Payment Date:',
      new Date(receipt.issued_at).toLocaleString()
    );
    addRow(
      'Verified By:',
      receipt.issued_by_name || record.approved_by_name || 'Finance Department'
    );

    y += 6;

    // Amount box
    pdf.setFillColor(240, 247, 255);
    pdf.roundedRect(20, y, pageWidth - 40, 28, 4, 4, 'F');

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AMOUNT PAID', 30, y + 11);

    pdf.setTextColor(11, 58, 91);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(
      `${receipt.currency} ${Number(receipt.amount).toFixed(2)}`,
      30,
      y + 22
    );

    y += 45;

    pdf.setDrawColor(220, 229, 240);
    pdf.line(20, y, pageWidth - 20, y);

    y += 14;

    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    const note =
      receipt.notes ||
      record.notes ||
      'This receipt confirms that the payment has been verified by the Finance Department.';

    const wrappedNote = pdf.splitTextToSize(note, pageWidth - 40);
    pdf.text(wrappedNote, 20, y);

    y += wrappedNote.length * 5 + 15;

    pdf.setTextColor(100, 116, 139);
    pdf.text(
      'This is an electronically generated receipt from the Globe Scholars Pathways, LLC. student portal.',
      20,
      y
    );
    pdf.text(
      'Card details, PINs, CVV/CVC values, and passwords are never printed or stored on receipts.',
      20,
      y + 6
    );

    pdf.save(
      `${receipt.receipt_number}-${myApp?.application_number || 'payment'}.pdf`
        .replace(/[^a-z0-9._-]+/gi, '-')
    );
  };

  const downloadOfficialReceipt = () => {
    if (!approvedRegistrationFeeReceipt || registrationFeeRecord?.status !== 'paid') {
      setFeePaymentMessage('Your receipt will be available after Finance approves your payment.');
      return;
    }

    downloadPaymentReceiptPdf(registrationFeeRecord, approvedRegistrationFeeReceipt);
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
        <div className="student-portal-hero-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img className="student-portal-brand-logo" src={brandLogo} alt="Globe Scholars Pathways, LLC." />
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: 800 }}>
                Applicant Portal
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

        <div className="student-progress-steps" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
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
      <div className="student-portal-step-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {[
          { step: 1, label: '1. Program & Profile' },
          { step: 2, label: '2. Document Uploads' },
          { step: 3, label: '3. Registration Fee Payment' },
          { step: 4, label: '4. Review & Final Submit' },
          { step: 5, label: '5. Payments & Receipts' },
          { step: 6, label: '6. Visa Application' },
          { step: 7, label: '7. Direct Email Inbox' }
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

          <div className="student-program-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
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
              {partnerUniversities.length === 0 ? (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.82rem' }}>
                  No partner universities uploaded by admin yet.
                </div>
              ) : (
                <select
                  value={targetUni}
                  onChange={e => handleTargetUniChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  <option value="">Select Target Institution</option>
                  {partnerUniversities.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.country})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Degree Program / Course</label>
              {!targetUni ? (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                  Select university first
                </div>
              ) : availableCourses.length === 0 ? (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.82rem' }}>
                  No courses uploaded for this school
                </div>
              ) : (
                <select
                  value={degreeChoice}
                  onChange={e => setDegreeChoice(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  <option value="">Select Degree Course</option>
                  {availableCourses.map(c => (
                    <option key={c.id} value={c.course_name}>
                      {c.course_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {selectedCourseDetails && (
            <div style={{ padding: '12px 16px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '10px', display: 'flex', gap: '20px', color: '#fff', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Admission Fee:</span> <strong style={{ color: '#06b6d4' }}>USD {selectedCourseDetails.admission_fee.toFixed(2)}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Tuition Fee:</span> <strong style={{ color: '#10b981' }}>USD {selectedCourseDetails.tuition_fee.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Scholarship Requested</label>
            {!targetUni ? (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                Select university first
              </div>
            ) : availableScholarships.length === 0 ? (
              <select
                value={scholarshipPref}
                onChange={e => setScholarshipPref(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
              >
                <option value="None">None (No scholarships available for this school)</option>
              </select>
            ) : (
              <select
                value={scholarshipPref}
                onChange={e => setScholarshipPref(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', outline: 'none' }}
              >
                <option value="None">None (No scholarship requested)</option>
                {availableScholarships.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.coverage_percentage ? `(${s.coverage_percentage}% tuition coverage)` : `($${s.coverage_amount.toFixed(0)} value)`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Admissions Brochures List */}
          <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen style={{ width: '16px', height: '16px', color: '#6366f1' }} />
              Admissions Brochures & Application Guidelines
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '14px' }}>
              View and download brochures, prospectus guides, and visa checklists uploaded by our Admissions department to help you prepare your pathway application.
            </p>

            {universityBrochures.length === 0 ? (
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: '0.78rem', textAlign: 'center' }}>
                No admissions brochures published yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {universityBrochures.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <FileText style={{ width: '18px', height: '18px', color: '#60a5fa', marginTop: '3px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.82rem', display: 'block' }}>{b.title}</strong>
                        {b.description && <span style={{ color: '#cbd5e1', fontSize: '0.74rem', display: 'block', marginTop: '2px', lineHeight: 1.4 }}>{b.description}</span>}
                        <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', marginTop: '6px' }}>
                          Uploaded: {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'} • {b.file_name}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const { data } = supabase.storage.from('department-reports').getPublicUrl(b.storage_path);
                        if (data?.publicUrl) window.open(data.publicUrl, '_blank');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px', fontSize: '0.72rem', flexShrink: 0, marginLeft: '12px' }}
                    >
                      View / Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="student-form-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
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
          <div className="student-document-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
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

                const isPassportPhoto = isPassportPhotoType(nextRequiredDocument.type) || isPassportPhotoType(nextRequiredDocument.title);

                // Handle Passport Photo 50KB limit
                if (isPassportPhoto) {
                  if (file.size > MAX_AVATAR_SIZE_BYTES) {
                    if (file.type.startsWith('image/')) {
                      try {
                        setIsUploadingDocument(true);
                        setDocumentUploadMessage('Optimizing passport photo to fit under 50 KB limit...');
                        const compressed = await compressPassportPhotoFile(file);
                        await addDocument(
                          myApp.id,
                          nextRequiredDocument.type,
                          compressed.file
                        );
                        setDocumentUploadMessage(
                          `${nextRequiredDocument.title} optimized & uploaded (${compressed.sizeKb} KB).`
                        );
                        setIsUploadingDocument(false);
                        e.target.value = '';
                        return;
                      } catch (compressErr) {
                        setDocumentUploadMessage(
                          `Passport photo exceeds strict 50 KB limit (${(file.size / 1024).toFixed(1)} KB). Please select an image under 50 KB.`
                        );
                        setIsUploadingDocument(false);
                        e.target.value = '';
                        return;
                      }
                    } else {
                      setDocumentUploadMessage(
                        `Passport photo exceeds strict 50 KB limit (${(file.size / 1024).toFixed(1)} KB). Please upload an image under 50 KB.`
                      );
                      e.target.value = '';
                      return;
                    }
                  }
                } else if (file.size > 10 * 1024 * 1024) {
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
                } catch (error) {
                  console.error(
                    'STUDENT DOCUMENT UPLOAD ERROR:',
                    error
                  );

                  alert(
                    `Document upload failed:\n\n${
                      error instanceof Error ? error.message : 'Unknown error'
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

          <div className="student-form-actions student-form-actions-end" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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

      {/* Step 3: Registration fee confirmation */}
      {activeStep === 3 && (
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard style={{ color: '#10b981' }} />
              Registration Fee Confirmation
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Select the type of payment you are making, enter the amount you paid, and provide the payment reference. Finance will verify the payment before it is marked as paid and a receipt is issued.
            </p>
          </div>

          {hasPaymentConfirmation ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <CheckCircle2 style={{ color: '#34d399', width: '36px', height: '36px', margin: '0 auto 8px auto' }} />
              <h4 style={{ fontSize: '1rem', color: '#fff' }}>
                {registrationFeeRecord?.status === 'paid' ? 'Registration Fee Verified' : 'Payment Confirmation Received'}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                Reference: <span style={{ color: '#06b6d4', fontFamily: 'monospace' }}>{registrationFeeRecord?.payment_reference || paymentReference}</span>
              </p>
              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '8px' }}>
                {registrationFeeRecord?.status === 'paid'
                  ? 'Finance has verified this payment. Admissions can see the cleared status.'
                  : 'Finance verification is pending. Admissions can see the payment status in the application queue.'}
              </p>
              {approvedRegistrationFeeReceipt && (
                <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.75)', color: '#0f172a', border: '1px solid rgba(16,185,129,0.35)' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#047857', fontWeight: 800 }}>
                    Official Receipt Issued
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginTop: '3px' }}>
                    {approvedRegistrationFeeReceipt.receipt_number}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '4px' }}>
                    Amount: {approvedRegistrationFeeReceipt.currency} {approvedRegistrationFeeReceipt.amount.toFixed(2)} • Issued: {new Date(approvedRegistrationFeeReceipt.issued_at).toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={downloadOfficialReceipt}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '12px' }}
                  >
                    <Download style={{ width: '14px', height: '14px' }} />
                    Download receipt
                  </button>
                </div>
              )}
            </div>
          ) : (
            renderPaymentForm(true)
          )}

          {feePaymentMessage && (
            <div style={{ fontSize: '0.8rem', color: feePaymentMessage.includes('successfully') ? '#34d399' : '#fbbf24' }}>
              {feePaymentMessage}
            </div>
          )}

          <div className="student-form-actions student-form-actions-end" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => setActiveStep(4)} disabled={!hasPaymentConfirmation} className="btn btn-primary">
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
            <div className="student-review-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#94a3b8' }}>Student Name:</span> <strong>{myApp.student_name}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Target Institution:</span> <strong>{myApp.target_university}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Degree Program:</span> <strong>{myApp.degree_program}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Registration Fee:</span> <strong style={{ color: hasPaymentConfirmation ? '#34d399' : '#f43f5e' }}>{registrationFeeRecord?.status === 'paid' ? 'VERIFIED ($150.00)' : hasPaymentConfirmation ? 'CONFIRMATION SUBMITTED' : 'NOT SUBMITTED'}</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Receipt Number:</span> <strong style={{ color: approvedRegistrationFeeReceipt ? '#34d399' : '#f59e0b' }}>{approvedRegistrationFeeReceipt?.receipt_number || 'Pending Finance approval'}</strong></div>
            </div>
          </div>

          {approvedRegistrationFeeReceipt && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={downloadOfficialReceipt} className="btn btn-secondary">
                <Download style={{ width: '15px', height: '15px' }} />
                Download approved receipt
              </button>
            </div>
          )}

          <div className="student-form-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button onClick={() => void handleSaveDraft()} disabled={isSavingDraft} className="btn btn-secondary">
              <Save style={{ width: '14px', height: '14px' }} />
              Save Draft
            </button>
            <button onClick={() => void handleFinalSubmit()} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
              <Send style={{ width: '16px', height: '16px' }} />
              Send Application to Admissions
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

            <div className="student-account-summary" style={{ flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center' }}>
              <ProfileAvatar
                avatarUrl={currentProfile.avatar_url}
                name={currentProfile.full_name}
                size={84}
                editable={true}
                showDetails={true}
                onAvatarChange={updateProfileAvatar}
              />
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#fff', display: 'block' }}>{currentProfile.full_name}</strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{currentProfile.email}</span>
              </div>
              <span className="student-account-status">Active student account</span>
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

              {newPassword.length > 0 && (
                <PasswordStrengthMeter password={newPassword} />
              )}

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

      {/* Step 5: Payments & Receipts */}
      {activeStep === 5 && (
        <div
          className="glass-panel"
          style={{
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>
              Payments & Receipts
            </h3>

            <p
              style={{
                fontSize: '0.8rem',
                color: '#94a3b8',
                marginTop: '6px'
              }}
            >
              View all payments recorded against your application. Official
              receipts become available after Finance verifies the payment.
            </p>
          </div>

          {studentPaymentRecords.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.03)',
                color: '#94a3b8'
              }}
            >
              <CreditCard
                style={{
                  width: '32px',
                  height: '32px',
                  margin: '0 auto 10px'
                }}
              />

              <div style={{ color: '#fff', fontWeight: 700 }}>
                No payments recorded
              </div>

              <div style={{ fontSize: '0.78rem', marginTop: '5px' }}>
                Your payment history will appear here when Finance records a
                payment.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {studentPaymentRecords.map((record) => {
                const receipt = receiptForPayment(record.id);
                const isApproved =
                  record.status === 'paid' || record.status === 'approved';

                const statusLabel =
                  record.status === 'paid'
                    ? 'Verified'
                    : record.status === 'approved'
                      ? 'Approved'
                      : record.status === 'pending'
                        ? 'Pending Finance'
                        : 'Rejected';

                return (
                  <div
                    key={record.id}
                    style={{
                      padding: '18px',
                      borderRadius: '14px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '16px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.95rem'
                          }}
                        >
                          {record.record_type
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </div>

                        <div
                          style={{
                            color: '#94a3b8',
                            fontSize: '0.75rem',
                            marginTop: '5px'
                          }}
                        >
                          {new Date(record.created_at).toLocaleString()}
                        </div>
                      </div>

                      <span
                        className={`badge ${
                          record.status === 'paid' ||
                          record.status === 'approved'
                            ? 'badge-approved'
                            : record.status === 'rejected'
                              ? 'badge-rejected'
                              : 'badge-pending'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px',
                        marginTop: '16px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div>
                        <div style={{ color: '#94a3b8' }}>Amount</div>
                        <strong style={{ color: '#fff' }}>
                          {record.currency} {Number(record.amount).toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        <div style={{ color: '#94a3b8' }}>
                          Payment Reference
                        </div>
                        <strong
                          style={{
                            color: '#06b6d4',
                            fontFamily: 'monospace'
                          }}
                        >
                          {record.payment_reference || 'N/A'}
                        </strong>
                      </div>

                      <div>
                        <div style={{ color: '#94a3b8' }}>
                          Receipt
                        </div>
                        <strong
                          style={{
                            color: receipt ? '#34d399' : '#fbbf24'
                          }}
                        >
                          {receipt?.receipt_number ||
                            (isApproved
                              ? 'Receipt pending'
                              : 'Available after approval')}
                        </strong>
                      </div>
                    </div>

                    {receipt && isApproved && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          marginTop: '14px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            downloadPaymentReceiptPdf(record, receipt)
                          }
                          className="btn btn-primary btn-sm"
                        >
                          <Download
                            style={{
                              width: '14px',
                              height: '14px'
                            }}
                          />
                          Download PDF Receipt
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeStep === 6 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!registrationFeeRecord || registrationFeeRecord.status !== 'paid' ? (
            <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
              <LockKeyhole style={{ width: 48, height: 48, margin: '0 auto 16px', color: '#ef4444' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Visa Application Restricted</h3>
              <p style={{ maxWidth: '500px', margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Access to the visa application module is locked. You must pay and verify your registration fee ($150.00) first to unlock this section.
              </p>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                Go to Payment Portal <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ) : !myVisaApp ? (
            <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
              <ShieldCheck style={{ width: 48, height: 48, margin: '0 auto 16px', color: '#3366FF' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Start Your Visa Application</h3>
              <p style={{ maxWidth: '500px', margin: '0 auto 20px', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Your registration fee payment has been verified. You can now initialize and submit your visa application dossier for admissions review.
              </p>
              <button
                type="button"
                onClick={handleInitializeVisa}
                disabled={initializingVisa}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {initializingVisa ? 'Initializing...' : 'Initialize Visa Application Dossier'}
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>Student Visa Application Dossier</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                    Prepare and upload your visa compliance files. Uploads are strictly limited to PDF format.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Dossier Status:</span>
                  <span
                    className={`dept-badge ${
                      myVisaApp.status === 'approved'
                        ? 'dept-badge-active'
                        : myVisaApp.status === 'rejected'
                        ? 'dept-badge-inactive'
                        : 'dept-badge-pending'
                    }`}
                    style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  >
                    {myVisaApp.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Admissions Guidance Message Box */}
              <div
                style={{
                  background: 'rgba(51, 102, 255, 0.05)',
                  border: '1px solid rgba(51, 102, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '24px'
                }}
              >
                <h4 style={{ fontSize: '0.85rem', color: '#3366FF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell style={{ width: 14, height: 14 }} /> Admissions Department Guidance
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '8px', lineHeight: 1.5 }}>
                  {myVisaApp.admissions_instructions || 'Please upload the requested files for review.'}
                </p>
              </div>

              {visaUploadError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '8px', color: '#f87171', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle style={{ width: 16, height: 16 }} />
                  {visaUploadError}
                </div>
              )}

              {/* Visa Document Requirements List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Required Visa Documents (PDF Only)</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { type: 'passport', label: 'Biometric Passport Page', desc: 'Valid photo-information page of your passport.' },
                    { type: 'proof_of_funds', label: 'Proof of Financial Support', desc: 'Bank statement or certified sponsor letter showing sufficient balance.' },
                    { type: 'visa_form', label: 'Visa Application Form', desc: 'Completed, dated, and signed official visa form.' },
                    { type: 'offer_letter', label: 'Acceptance / Offer Letter', desc: 'Official letter of admission issued to you.' },
                    { type: 'other', label: 'Other Supporting Files', desc: 'Any additional files requested by Admissions.' }
                  ].map((docReq) => {
                    const uploadedFile = uploadedVisaDocs.find(d => d.document_type === docReq.type);
                    const isUploading = uploadingVisaDocType === docReq.type;
                    
                    return (
                      <div
                        key={docReq.type}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '16px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{docReq.label}</span>
                            {uploadedFile ? (
                              <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                                <CheckCircle2 style={{ width: 12, height: 12 }} /> UPLOADED
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                                <Clock style={{ width: 12, height: 12 }} /> PENDING
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{docReq.desc}</p>
                          
                          {uploadedFile && (
                            <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <FileText style={{ width: 12, height: 12, color: '#3366FF' }} />
                              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {uploadedFile.file_name}
                              </span>
                              <span style={{ fontSize: '0.7' + 'rem', color: '#64748b' }}>
                                ({(uploadedFile.file_size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {uploadedFile ? (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  const { data } = supabase.storage
                                    .from('department-reports')
                                    .getPublicUrl(uploadedFile.file_path);
                                  if (data?.publicUrl) {
                                    window.open(data.publicUrl, '_blank');
                                  }
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Eye style={{ width: 12, height: 12 }} /> View
                              </button>
                              
                              {myVisaApp.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleVisaFileDelete(uploadedFile.id, uploadedFile.file_path)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <X style={{ width: 12, height: 12 }} /> Remove
                                </button>
                              )}
                            </>
                          ) : (
                            <div style={{ position: 'relative' }}>
                              <button
                                type="button"
                                disabled={isUploading || myVisaApp.status === 'approved'}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Upload style={{ width: 12, height: 12 }} /> {isUploading ? 'Uploading...' : 'Upload PDF'}
                              </button>
                              <input
                                type="file"
                                accept="application/pdf"
                                disabled={isUploading || myVisaApp.status === 'approved'}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleVisaFileUpload(docReq.type, file);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  opacity: 0,
                                  width: '100%',
                                  height: '100%',
                                  cursor: 'pointer'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 7: Direct Email Inbox */}
      {activeStep === 7 && (
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail style={{ color: '#6366f1' }} /> Direct Student Email Inbox (Simulation)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              This inbox displays official email invitations, advisories, and counseling notifications sent directly to your registered email address (<strong>{currentProfile?.email}</strong>).
            </p>
          </div>

          {(() => {
            const myEmails = studentEmails.filter((e: StudentEmail) => e.student_id === currentProfile?.id || e.recipient_email === currentProfile?.email);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '20px', minHeight: '400px' }}>
                {/* Left side: emails list */}
                <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '16px', maxHeight: '500px', overflowY: 'auto' }}>
                  {myEmails.length === 0 ? (
                    <div style={{ padding: '40px 10px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                      No emails received yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {myEmails.map((email: StudentEmail) => {
                        const isSelected = selectedEmailId === email.id;
                        return (
                          <div
                            key={email.id}
                            onClick={() => setSelectedEmailId(email.id)}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                              border: '1px solid ' + (isSelected ? '#6366f1' : 'rgba(255,255,255,0.05)'),
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <strong style={{ color: '#fff', fontSize: '0.82rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{email.subject}</strong>
                            <span style={{ color: '#cbd5e1', fontSize: '0.74rem', display: 'block', marginTop: '4px' }}>From: {email.sender_name}</span>
                            <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block', marginTop: '6px' }}>
                              {email.created_at ? new Date(email.created_at).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right side: email body reader */}
                <div style={{ paddingLeft: '8px' }}>
                  {(() => {
                    const activeEmail = myEmails.find((e: StudentEmail) => e.id === selectedEmailId) || myEmails[0];
                    if (!activeEmail) {
                      return (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                          Select an email from the left pane to read its content.
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                          <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, marginBottom: '8px' }}>{activeEmail.subject}</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem', color: '#cbd5e1' }}>
                            <span><strong>From:</strong> {activeEmail.sender_name}</span>
                            <span><strong>To:</strong> {activeEmail.recipient_email}</span>
                            <span><strong>Date:</strong> {activeEmail.created_at ? new Date(activeEmail.created_at).toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          {activeEmail.body}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Simulated Card OTP Verification Dialog */}
      {showCardOtpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '420px', padding: '24px', background: '#0e1726', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck style={{ width: '18px', height: '18px', color: '#10b981' }} />
                <h3 style={{ fontSize: '0.98rem', color: '#fff', margin: 0, fontWeight: 800 }}>Card Payment Security Shield</h3>
              </div>
              <button onClick={() => setShowCardOtpModal(false)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '12px', borderRadius: '8px', color: '#34d399', fontSize: '0.78rem', marginBottom: '14px', textAlign: 'center' }}>
              Simulated notification warning sent to cardholder's device: <br />
              <strong>Your GSP authorization code is: <span style={{ fontSize: '0.95rem', color: '#fff', textDecoration: 'underline' }}>{simulatedOtp}</span></strong>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '14px', lineHeight: 1.45 }}>
              Please enter the 6-digit confirmation code below to authorize this payment of <strong>USD {(activeStep === 3 ? 150 : Number(paymentAmount)).toFixed(2)}</strong>.
            </p>

            {otpError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.75rem', marginBottom: '12px' }}>
                <AlertCircle style={{ width: '14px', height: '14px' }} />
                <span>{otpError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={enteredOtp}
                onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 800 }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowCardOtpModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button
                  type="button"
                  onClick={async () => {
                    if (enteredOtp !== simulatedOtp) {
                      setOtpError('Invalid authorization code. Please enter the correct code shown above.');
                      return;
                    }
                    const isStep3 = activeStep === 3;
                    const finalType = isStep3 ? 'registration_fee' : paymentType;
                    const finalAmount = isStep3 ? 150.00 : Number(paymentAmount);
                    await executePaymentSubmit(finalType, finalAmount);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Verify & Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
