import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { DollarSign, ShieldAlert, CheckCircle2, Lock, FileSpreadsheet, Plus, Receipt, ClipboardList } from 'lucide-react';
import { formatUsd, getApplicationIntake, getRegistrationFeeSummary, REGISTRATION_FEE_TARGET_USD } from '../../lib/department-registers';
import type { FinancialRecord } from '../../types/database';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import { TrashBin } from '../shared/TrashBin';

export const FinanceWorkspace: React.FC = () => {
  const {
    getScopedFinancialRecords,
    getScopedCounselingSessions,
    financialRecords,
    applications,
    students,
    paymentReceipts,
    createFinancialRecord,
    reviewRegistrationPayment,
    generatePaymentReceipt,
  } = useApplication();
  const { currentProfile, logout } = useAuth();

  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [dApplicationId, setDApplicationId] = useState('');
  const [dAmount, setDAmount] = useState(5000);
  const [dCategory, setDCategory] = useState<'scholarship_disbursement' | 'refund' | 'operational_spend'>('scholarship_disbursement');
  const [financeMessage, setFinanceMessage] = useState('');
  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const scopedFinancesResult = getScopedFinancialRecords();
  const visibleFinances = scopedFinancesResult.data || [];

  // Attempt to access counseling notes (Demonstrates RLS Security Barrier!)
  const scopedCounselingAttempt = getScopedCounselingSessions();

  const totalFeeRevenue = financialRecords
    .filter(f => f.record_type === 'registration_fee' && f.status === 'paid')
    .reduce((acc, f) => acc + f.amount, 0);
  const totalDisbursements = financialRecords.filter(f => f.record_type === 'scholarship_disbursement' && f.status === 'approved').reduce((acc, f) => acc + f.amount, 0);
  const studentFeeTypes: FinancialRecord['record_type'][] = ['registration_fee', 'tuition_fee', 'admission_fee'];
  const financeEligibleApplications = applications.filter((application) =>
    financialRecords.some((record) =>
      record.application_id === application.id &&
      studentFeeTypes.includes(record.record_type) &&
      record.status !== 'rejected'
    )
  );
  const receiptForRecord = (recordId?: string) =>
    recordId
      ? paymentReceipts.find((receipt) => receipt.financial_record_id === recordId && receipt.status === 'issued')
      : undefined;

  const handleCreateDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    const application = applications.find((item) => item.id === dApplicationId) || applications[0];
    if (!application) {
      setFinanceMessage('Choose an application before recording a financial item.');
      return;
    }

    try {
      await createFinancialRecord({
        application_id: application.id,
        application_number: application.application_number,
        student_id: application.student_id,
        student_name: application.student_name,
        record_type: dCategory,
        amount: Number(dAmount),
        currency: 'USD',
        status: 'approved',
        payment_reference: `FIN-${Date.now()}`,
        notes: 'Approved from the Finance ledger workspace.',
      });
      setShowDisburseModal(false);
      setFinanceMessage('Financial record created and added to the audit ledger.');
    } catch (error) {
      setFinanceMessage(error instanceof Error ? error.message : 'The financial record could not be saved.');
    }
  };

  const handlePaymentReview = async (recordId: string, approved: boolean) => {
    try {
      await reviewRegistrationPayment(recordId, approved);
      setFinanceMessage(approved ? 'Payment verified and receipt issued. The student can now download the PDF receipt.' : 'Payment was rejected and the student record has been updated.');
    } catch (error) {
      setFinanceMessage(error instanceof Error ? error.message : 'The payment review could not be saved.');
    }
  };

  const handleGenerateReceipt = async (recordId: string) => {
    try {
      const receipt = await generatePaymentReceipt(recordId);
      setFinanceMessage(`Receipt ${receipt.receipt_number} is ready for the student.`);
    } catch (error) {
      setFinanceMessage(error instanceof Error ? error.message : 'The receipt could not be generated.');
    }
  };

  const sidebarNav = [
    { label: 'Payment Register', icon: <FileSpreadsheet style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('finance-register') },
    { label: 'Ledger', icon: <DollarSign style={{ width: 18, height: 18 }} />, onClick: () => goTo('finance-ledger') },
    { label: 'Disbursements', icon: <Receipt style={{ width: 18, height: 18 }} />, onClick: () => setShowDisburseModal(true) },
    { label: 'Assigned Tasks', icon: <ClipboardList style={{ width: 18, height: 18 }} />, onClick: () => goTo('finance-assigned-tasks') },
  ];

  return (
    <DashboardLayout
      department="Finance"
      title="Finance & Scholarship Disbursement"
      subtitle="Fee verification, scholarship tranches, and financial audit"
      userName={currentProfile.full_name}
      userRole="Finance"
      navigation={sidebarNav}
      onLogout={logout}
    >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign style={{ color: '#3366FF' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>Finance & Scholarship Disbursement Platform</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              On-platform student registration fee verification, scholarship tranches, refunds, and financial audit reports.
            </p>
          </div>

          <button onClick={() => setShowDisburseModal(true)} className="btn btn-primary btn-sm">
            <Plus style={{ width: '14px', height: '14px' }} />
            Approve Financial Disbursement
          </button>
        </div>
      </div>

      <div id="finance-assigned-tasks">
        <DepartmentTaskInbox />
      </div>

      {/* RLS Strict Isolation Banner */}
      <div className="glass-panel" style={{ padding: '14px 18px', borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock style={{ color: '#34d399', width: '18px', height: '18px' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', color: '#fff' }}>Finance Department RLS Scope Active</h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {scopedCounselingAttempt.denialReason || 'Finance is explicitly restricted to financial tables only. Counseling notes are isolated via RLS.'}
              </p>
            </div>
          </div>
          <span className="badge badge-documents_verified">RLS STRICT ISOLATION</span>
        </div>
      </div>

      {financeMessage && (
        <div role="status" style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.28)', color: '#dbeafe', fontSize: '0.82rem' }}>
          {financeMessage}
        </div>
      )}

      {/* Financial Overview Stats */}
      <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Student Registration Fees Collected</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            ${totalFeeRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Verified by Finance</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Approved Scholarship Disbursements</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            ${totalDisbursements.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Tranche Funds Approved</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending Disbursements</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            $0.00
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>All Tranches Cleared</span>
        </div>
      </div>

      {/* Student Fee Register */}
      <div id="finance-register" className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#fff' }}>Finance Student Payment Register</h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              Finance sees students only after a registration-fee record exists. Balance is calculated against the {formatUsd(REGISTRATION_FEE_TARGET_USD)} registration fee.
            </p>
          </div>
          <span className="badge badge-submitted">{financeEligibleApplications.length} Payment Records</span>
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
                <th>Address</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Receipt</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {financeEligibleApplications.map((application) => {
                const intake = getApplicationIntake(application, students);
                const feeSummary = getRegistrationFeeSummary(application.id, financialRecords);
                const latestRecord = feeSummary.latestRecord;
                const receipt = receiptForRecord(latestRecord?.id);

                return (
                  <tr key={application.id}>
                    <td><strong style={{ color: '#34d399' }}>{application.application_number}</strong></td>
                    <td style={{ minWidth: '210px' }}>{intake.email}</td>
                    <td style={{ fontWeight: 600 }}>{intake.name}</td>
                    <td>{intake.age}</td>
                    <td>{intake.gender}</td>
                    <td style={{ minWidth: '220px' }}>{intake.currentAddress}</td>
                    <td style={{ fontWeight: 800, color: '#059669' }}>{formatUsd(feeSummary.verifiedAmount)}</td>
                    <td style={{ fontWeight: 800, color: feeSummary.balance === 0 ? '#059669' : '#d97706' }}>
                      {formatUsd(feeSummary.balance)}
                    </td>
                    <td>
                      <span className={`badge badge-${feeSummary.isCleared ? 'approved' : latestRecord?.status === 'pending' ? 'under_review' : 'draft'}`}>
                        {feeSummary.isCleared ? 'CLEARED' : latestRecord?.status === 'pending' ? 'PENDING VERIFY' : feeSummary.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{latestRecord?.payment_reference || 'Awaiting reference'}</td>
                    <td>
                      {receipt ? (
                        <span style={{ color: '#2563eb', fontWeight: 800 }}>{receipt.receipt_number}</span>
                      ) : latestRecord && ['paid', 'approved'].includes(latestRecord.status) ? (
                        <button onClick={() => void handleGenerateReceipt(latestRecord.id)} className="btn btn-secondary btn-sm">
                          <Receipt style={{ width: '12px', height: '12px' }} />
                          Generate
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending approval</span>
                      )}
                    </td>
                    <td>
                      {latestRecord && studentFeeTypes.includes(latestRecord.record_type) && latestRecord.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => void handlePaymentReview(latestRecord.id, true)} className="btn btn-primary btn-sm">Verify</button>
                          <button onClick={() => void handlePaymentReview(latestRecord.id, false)} className="btn btn-secondary btn-sm">Reject</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>No action</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {financeEligibleApplications.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                    No student payment records are ready for Finance yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Records Ledger Table */}
      <div id="finance-ledger" className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>Financial Transactions & Student Fee Ledger</h3>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Record Ref #</th>
                <th>App Number & Student</th>
                <th>Category Type</th>
                <th>Amount (USD)</th>
                <th>Approved By</th>
                <th>Status</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {visibleFinances.map(f => (
                <tr key={f.id}>
                  <td><strong style={{ color: '#34d399' }}>{f.payment_reference || 'REF-STD-FEE'}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{f.student_name}</div>
                    <span style={{ fontSize: '0.75rem', color: '#06b6d4' }}>{f.application_number}</span>
                  </td>
                  <td>
                    <span className="badge badge-submitted">
                      {f.record_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: f.record_type === 'registration_fee' ? '#34d399' : '#38bdf8' }}>
                    ${f.amount.toFixed(2)}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{f.approved_by_name || 'Finance Lead'}</td>
                  <td><span className={`badge badge-${f.status === 'paid' || f.status === 'approved' ? 'approved' : f.status === 'rejected' ? 'rejected' : 'under_review'}`}>{f.status.toUpperCase()}</span></td>
                  <td>
                    {studentFeeTypes.includes(f.record_type) && f.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => void handlePaymentReview(f.id, true)} className="btn btn-primary btn-sm">Verify</button>
                        <button onClick={() => void handlePaymentReview(f.id, false)} className="btn btn-secondary btn-sm">Reject</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{f.status === 'paid' ? 'Verified' : '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#fff' }}>Issued Receipt Register</h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              Receipts are generated by Finance after verified student payments and are visible to the student portal.
            </p>
          </div>
          <span className="badge badge-approved">{paymentReceipts.length} Receipts</span>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Student</th>
                <th>Application</th>
                <th>Amount</th>
                <th>Payment Reference</th>
                <th>Issued By</th>
                <th>Issued Date</th>
              </tr>
            </thead>
            <tbody>
              {paymentReceipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td><strong style={{ color: '#2563eb' }}>{receipt.receipt_number}</strong></td>
                  <td>{receipt.student_name}</td>
                  <td>{receipt.application_number}</td>
                  <td style={{ fontWeight: 800, color: '#059669' }}>{formatUsd(receipt.amount)}</td>
                  <td>{receipt.payment_reference || '—'}</td>
                  <td>{receipt.issued_by_name || 'Finance'}</td>
                  <td>{new Date(receipt.issued_at).toLocaleString()}</td>
                </tr>
              ))}
              {paymentReceipts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                    No receipts have been issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finance Recycle Bin */}
      <div id="finance-trash">
        <TrashBin departmentKey="finance" />
      </div>

      {/* Modal: Approve Financial Disbursement */}
      {showDisburseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '440px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Approve Financial Disbursement / Spend</h3>
            <form onSubmit={handleCreateDisbursement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target application</label>
                <select value={dApplicationId} onChange={e => setDApplicationId(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}>
                  <option value="">Select an application</option>
                  {applications.map(application => (
                    <option key={application.id} value={application.id}>{application.application_number} — {application.student_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Transaction Category</label>
                <select value={dCategory} onChange={e => setDCategory(e.target.value as typeof dCategory)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}>
                  <option value="scholarship_disbursement">Scholarship Disbursement</option>
                  <option value="refund">Student Fee Refund</option>
                  <option value="operational_spend">Operational Spend</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Amount (USD)</label>
                <input type="number" required value={dAmount} onChange={e => setDAmount(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowDisburseModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Sign & Authorize</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </DashboardLayout>
  );
};
