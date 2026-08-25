import React, { useState } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ApplicationProvider } from './context/ApplicationContext';

import { CommunicationHub } from './components/communication/CommunicationHub';
import { RLSSecurityAuditPanel } from './components/security/RLSSecurityAuditPanel';
import { AuditLogViewer } from './components/audit/AuditLogViewer';

import { Login } from './components/auth/Login';
import { PasswordRecovery } from './components/auth/PasswordRecovery';
import { PublicLanding } from './components/public/PublicLanding';

import { AdminWorkspace } from './components/workspaces/AdminWorkspace';
import { MarketingWorkspace } from './components/workspaces/MarketingWorkspace';
import { AdmissionsWorkspace } from './components/workspaces/AdmissionsWorkspace';
import { CounselingWorkspace } from './components/workspaces/CounselingWorkspace';
import { DataApplicationsWorkspace } from './components/workspaces/DataApplicationsWorkspace';
import { OperationsWorkspace } from './components/workspaces/OperationsWorkspace';
import { CountryDirectorsWorkspace } from './components/workspaces/CountryDirectorsWorkspace';
import { FinanceWorkspace } from './components/workspaces/FinanceWorkspace';
import { ManagementWorkspace } from './components/workspaces/ManagementWorkspace';
import { InstitutionalRelationsWorkspace } from './components/workspaces/InstitutionalRelationsWorkspace';
import { HrWorkspace } from './components/workspaces/HrWorkspace';

import { StudentPortal } from './components/student/StudentPortal';

const WorkspaceContainer: React.FC = () => {
  const {
    activeDepartment,
    isStudentMode,
    user,
    currentProfile,
    loading,
    logout,
  } = useAuth();
  const [showComms, setShowComms] = useState(false);
  const [showRLSAudit, setShowRLSAudit] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [publicView, setPublicView] = useState<'landing' | 'login' | 'student-signup'>('landing');
  const isPasswordRecovery = new URLSearchParams(window.location.search).has('reset-password');

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f6f7f9',
          color: '#111827',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#3366FF',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading Globe Scholars Pathways, LLC...
        </div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <PasswordRecovery
        onComplete={() => {
          window.history.replaceState({}, '', window.location.pathname);
          void logout();
          setPublicView('login');
        }}
      />
    );
  }

  if (!user || !currentProfile) {
    if (publicView === 'landing') {
      return (
        <PublicLanding
          onSignIn={() => setPublicView('login')}
          onApply={() => setPublicView('student-signup')}
        />
      );
    }

    return (
      <Login
        initialMode={publicView}
        onBack={() => setPublicView('landing')}
      />
    );
  }

  if (currentProfile.account_type === 'unassigned') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px',
          color: '#111827',
          textAlign: 'center',
          padding: '40px',
          background: '#f6f7f9',
        }}
      >
        <h2>Account setup in progress</h2>
        <p style={{ color: '#6b7280', maxWidth: '480px' }}>
          Your account has been created, but a Globe Scholars Pathways, LLC. administrator still needs to activate your department access.
        </p>
        <button type="button" className="btn btn-secondary" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    );
  }

  const renderActiveWorkspace = () => {
    if (isStudentMode) {
      return <StudentPortal />;
    }

    switch (activeDepartment) {
      case 'admin':
        return <AdminWorkspace />;

      case 'marketing':
        return <MarketingWorkspace />;

      case 'admissions':
        return <AdmissionsWorkspace />;

      case 'counseling':
        return <CounselingWorkspace />;

      case 'data_applications':
        return <DataApplicationsWorkspace />;

      case 'operations':
        return <OperationsWorkspace />;

      case 'country_directors':
        return <CountryDirectorsWorkspace />;

      case 'finance':
        return <FinanceWorkspace />;

      case 'management':
        return <ManagementWorkspace />;

      case 'institutional_relations':
        return <InstitutionalRelationsWorkspace />;

      case 'human_resources':
        return <HrWorkspace />;

      default:
        return (
          <div
            style={{
              minHeight: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '12px',
              color: '#111827',
              textAlign: 'center',
              padding: '40px',
            }}
          >
            <h2>
              {currentProfile.account_type === 'unassigned'
                ? 'Account setup in progress'
                : 'Access Restricted'}
            </h2>

            <p style={{ color: '#6b7280' }}>
              {currentProfile.account_type === 'unassigned'
                ? 'Your sign-in has been created, but an administrator still needs to assign your department and access level.'
                : 'Your account is not assigned to a valid department.'}
            </p>

            <p style={{ color: '#9ca3af', fontSize: '13px' }}>
              Please contact the administrator.
            </p>
          </div>
        );
    }
  };

return (
  <>
    {renderActiveWorkspace()}

    <CommunicationHub  	
        isOpen={showComms}
        onClose={() => setShowComms(false)}
      />

      <RLSSecurityAuditPanel
        isOpen={showRLSAudit}
        onClose={() => setShowRLSAudit(false)}
      />

      <AuditLogViewer
        isOpen={showAuditLogs}
        onClose={() => setShowAuditLogs(false)}
      />
    </>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ApplicationProvider>
        <WorkspaceContainer />
      </ApplicationProvider>
    </AuthProvider>
  );
}

export default App;
