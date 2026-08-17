import React, { useState } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ApplicationProvider } from './context/ApplicationContext';

import { Header } from './components/common/Header';
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


/**
 * Displays the correct workspace according to
 * the authenticated user's department.
 */
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


  /**
   * Authentication/profile information is still loading.
   */
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#ffffff',
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Loading Report.com...
      </div>
    );
  }


  /**
   * No authenticated user or no profile.
   * Send the user to the login screen.
   */
  if (!user || !currentProfile) {
    return <Login />;
  }


  /**
   * Select the workspace based on department.
   */
  const renderActiveWorkspace = () => {

    /**
     * Student portal
     */
    if (isStudentMode) {
      return <StudentPortal />;
    }


    /**
     * Staff workspaces
     */
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
      }}
    >

      {/* Header */}
      <Header
        onOpenComms={() => setShowComms(true)}
        onOpenRLSAudit={() => setShowRLSAudit(true)}
        onOpenAuditLogs={() => setShowAuditLogs(true)}
      />


      {/* Main workspace */}
      <main
        style={{
          flex: 1,
          padding: '0 28px 40px 28px',
        }}
      >
        {renderActiveWorkspace()}
      </main>


      {/* Communication system */}
      <CommunicationHub
        isOpen={showComms}
        onClose={() => setShowComms(false)}
      />


      {/* RLS security audit */}
      <RLSSecurityAuditPanel
        isOpen={showRLSAudit}
        onClose={() => setShowRLSAudit(false)}
      />


      {/* Audit logs */}
      <AuditLogViewer
        isOpen={showAuditLogs}
        onClose={() => setShowAuditLogs(false)}
      />

    </div>
  );
};


/**
 * Root application component.
 *
 * Provider hierarchy:
 *
 * AuthProvider
 *      ↓
 * ApplicationProvider
 *      ↓
 * WorkspaceContainer
 */
export function App() {
  return (
    <AuthProvider>
      <ApplicationProvider>
        <WorkspaceContainer />
      </ApplicationProvider>
    </AuthProvider>
  );
}


/**
 * Default export required by main.tsx
 */
export default App;
