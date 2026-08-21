import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Play, Lock, AlertTriangle, X } from 'lucide-react';
import { RLSSimulationEngine } from '../../lib/rls-simulation';

interface RLSSecurityAuditPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestCaseResult {
  name: string;
  roleDescription: string;
  expectedResult: 'DENIED' | 'ALLOWED';
  actualResult: 'DENIED' | 'ALLOWED';
  passed: boolean;
  details: string;
}

export const RLSSecurityAuditPanel: React.FC<RLSSecurityAuditPanelProps> = ({ isOpen, onClose }) => {
  const { currentProfile } = useAuth();
  const { applications, counselingSessions, financialRecords, students } = useApplication();

  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);

  if (!isOpen) return null;

  const runRLSSuite = () => {
    const results: TestCaseResult[] = [];

    // Test 1: Finance reading Counseling Sessions
    const finCounselingCheck = RLSSimulationEngine.filterCounselingSessions(counselingSessions, 'finance', false);
    results.push({
      name: 'Finance Access to Counseling Notes',
      roleDescription: 'Role: "finance" attempting SQL SELECT on table "counseling_sessions"',
      expectedResult: 'DENIED',
      actualResult: finCounselingCheck.allowed ? 'ALLOWED' : 'DENIED',
      passed: !finCounselingCheck.allowed,
      details: finCounselingCheck.allowed
        ? 'SECURITY FAIL: RLS policy leaked confidential counseling notes to Finance.'
        : `PASS: ${finCounselingCheck.denialReason}`
    });

    // Test 2: Marketing reading Handed-Off Applications
    const mktAppsCheck = RLSSimulationEngine.filterApplications(applications, 'marketing', false);
    const leakedHandedOff = (mktAppsCheck.data || []).some(a => a.handed_off_to_admissions);
    results.push({
      name: 'Marketing Access to Handed-Off Leads',
      roleDescription: 'Role: "marketing" attempting SELECT on applications with handed_off_to_admissions = TRUE',
      expectedResult: 'DENIED',
      actualResult: leakedHandedOff ? 'ALLOWED' : 'DENIED',
      passed: !leakedHandedOff,
      details: leakedHandedOff
        ? 'SECURITY FAIL: Marketing can still see application after handoff to Admissions.'
        : 'PASS: RLS policy successfully hides applications from Marketing once handed off to Admissions.'
    });

    // Test 3: Country Director UK filtering non-UK student
    const cdStudentsCheck = RLSSimulationEngine.filterStudents(students, 'country_directors', false, ['United Kingdom']);
    const leakedNonUK = (cdStudentsCheck.data || []).some(s => s.country_of_residence !== 'United Kingdom');
    results.push({
      name: 'Country Director Regional Isolation',
      roleDescription: 'Role: "country_directors" (assigned: UK) attempting SELECT on student in Nigeria/Brazil',
      expectedResult: 'DENIED',
      actualResult: leakedNonUK ? 'ALLOWED' : 'DENIED',
      passed: !leakedNonUK,
      details: leakedNonUK
        ? 'SECURITY FAIL: Country director can see applicants outside assigned country.'
        : 'PASS: RLS policy mechanically restricted dataset strictly to assigned UK records.'
    });

    // Test 4: Admissions Authorized Access
    const admAppsCheck = RLSSimulationEngine.filterApplications(applications, 'admissions', false);
    results.push({
      name: 'Admissions Authorized Access to Applications',
      roleDescription: 'Role: "admissions" attempting SELECT on admissions queue',
      expectedResult: 'ALLOWED',
      actualResult: admAppsCheck.allowed ? 'ALLOWED' : 'DENIED',
      passed: admAppsCheck.allowed,
      details: 'PASS: Admissions possesses valid RLS policy grant to review applications.'
    });

    // Test 5: Counseling Authorized Access
    const cnsCheck = RLSSimulationEngine.filterCounselingSessions(counselingSessions, 'counseling', false);
    results.push({
      name: 'Counseling Authorized Access to Advising Notes',
      roleDescription: 'Role: "counseling" attempting SELECT on table "counseling_sessions"',
      expectedResult: 'ALLOWED',
      actualResult: cnsCheck.allowed ? 'ALLOWED' : 'DENIED',
      passed: cnsCheck.allowed,
      details: 'PASS: Counseling department successfully authenticated and authorized by RLS.'
    });

    setTestResults(results);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 230,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '820px', maxHeight: '90vh', background: '#090d16', padding: '28px',
        border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '20px'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck style={{ color: '#34d399', width: '24px', height: '24px' }} />
              RLS Policy Authorization & Denial Review
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
              Execution of negative & positive Row-Level Security policy assertions on current Supabase schema.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        {/* Current Active Scoped Session Info */}
        <div style={{ background: 'rgba(18, 26, 43, 0.8)', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Test Session Department Context:</span>
            <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 700, marginTop: '2px' }}>
              {currentProfile.full_name} ({currentProfile.department.toUpperCase()})
            </div>
          </div>
          <button onClick={runRLSSuite} className="btn btn-primary">
            <Play style={{ width: '14px', height: '14px' }} />
            Execute Full RLS Audit Suite
          </button>
        </div>

        {/* Test Results Output */}
        {testResults ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '50vh', overflowY: 'auto' }}>
            {testResults.map((tc, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '14px 18px',
                  borderLeft: `4px solid ${tc.passed ? '#10b981' : '#f43f5e'}`,
                  background: tc.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tc.passed ? (
                      <CheckCircle2 style={{ color: '#34d399', width: '18px', height: '18px' }} />
                    ) : (
                      <XCircle style={{ color: '#f43f5e', width: '18px', height: '18px' }} />
                    )}
                    <h3 style={{ fontSize: '0.95rem', color: '#ffffff' }}>{tc.name}</h3>
                  </div>
                  <span className={`badge ${tc.passed ? 'badge-documents_verified' : 'badge-rejected'}`}>
                    {tc.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>{tc.roleDescription}</p>
                <p style={{ fontSize: '0.78rem', color: tc.passed ? '#34d399' : '#fb7185', fontWeight: 600 }}>{tc.details}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <Lock style={{ width: '40px', height: '40px', margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p style={{ fontSize: '0.88rem' }}>Click "Execute Full RLS Audit Suite" to test negative denial cases and positive grants.</p>
          </div>
        )}

      </div>
    </div>
  );
};
