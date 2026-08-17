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
        return <AdminWorkspace />;
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
