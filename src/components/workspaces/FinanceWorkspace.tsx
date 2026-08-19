import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { DollarSign, ShieldAlert, CheckCircle2, Lock, FileSpreadsheet, Plus, Receipt } from 'lucide-react';

export const FinanceWorkspace: React.FC = () => {
  const {
    getScopedFinancialRecords,
    getScopedCounselingSessions,
    financialRecords,
    applications,
    createFinancialRecord,
    reviewRegistrationPayment,
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
      setFinanceMessage(approved ? 'Payment verified. Admissions can now see the cleared status.' : 'Payment was rejected and Admissions has been notified.');
    } catch (error) {
      setFinanceMessage(error instanceof Error ? error.message : 'The payment review could not be saved.');
    }
  };

  const sidebarNav = [
    { label: 'Ledger', icon: <DollarSign style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('finance-ledger') },
    { label: 'Disbursements', icon: <Receipt style={{ width: 18, height: 18 }} />, onClick: () => setShowDisburseModal(true) },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
                    {f.record_type === 'registration_fee' && f.status === 'pending' ? (
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
                <select value={dCategory} onChange={e => setDCategory(e.target.value as any)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}>
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
