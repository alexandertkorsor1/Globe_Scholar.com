import React, { useState } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ApplicationProvider } from './context/ApplicationContext';

import { CommunicationHub } from './components/communication/CommunicationHub';
import { RLSSecurityAuditPanel } from './components/security/RLSSecurityAuditPanel';
import { AuditLogViewer } from './components/audit/AuditLogViewer';

import { Login } from './components/auth/Login';

import { AdminWorkspace } from './components/workspaces/AdminWorkspace';
import { MarketingWorkspace } from './components/workspaces/MarketingWorkspace';
import { AdmissionsWorkspace } from './components/workspaces/AdmissionsWorkspace';
import { CounselingWorkspace } from './components/workspaces/CounselingWorkspace';
import { DataApplicationsWorkspace } from './components/workspaces/DataApplicationsWorkspace';
import { OperationsWorkspace } from './components/workspaces/OperationsWorkspace';
import { CountryDirectorsWorkspace } from './components/workspaces/CountryDirectorsWorkspace';
import { FinanceWorkspace } from './components/workspaces/FinanceWorkspace';

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
        Loading Globe Scholar Pathways...
      </div>
    );
  }

  if (!user || !currentProfile) {
    return <Login />;
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
        color: '#fff',
        textAlign: 'center',
        padding: '40px',
      }}
    >
      <h2>Access Restricted</h2>

      <p style={{ color: '#94a3b8' }}>
        Your account is not assigned to a valid department.
      </p>

      <p style={{ color: '#64748b', fontSize: '13px' }}>
        Please contact the administrator.
      </p>
    </div>
  );

    }
  };

return (
  <>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#0f172a',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
          }}
        >
          Globe Scholars Pathways, LLC.
        </div>

        <div
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: '2px',
          }}
        >
          {currentProfile.full_name} · {currentProfile.department}
        </div>
      </div>

      <button
        onClick={async () => {
          const confirmed = window.confirm(
            'Are you sure you want to sign out?'
          );

          if (!confirmed) return;

          await logout();
        }}
        style={{
          padding: '9px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(239,68,68,0.5)',
          background: 'rgba(239,68,68,0.1)',
          color: '#f87171',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>

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
