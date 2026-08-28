import React, { useState } from 'react';
import { ArrowRight, FileUp, MessageSquare, Calendar, CalendarOff } from 'lucide-react';
import { MonthlyMeetingsView } from '../shared/MonthlyMeetingsView';
import { StaffLeavePortalView } from '../shared/StaffLeavePortalView';
import {
  DashboardSidebar,
  DashboardNavigationItem,
} from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';
import {
  DEFAULT_DEPARTMENT_SETTINGS,
  DepartmentSettingsModal,
  DepartmentSettingsPreferences,
} from './DepartmentSettingsModal';
import { UserSettingsModal } from './UserSettingsModal';
import { DepartmentReportModal } from '../reports/DepartmentReportModal';
import { CommunicationHub } from '../communication/CommunicationHub';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';

interface DashboardLayoutProps {
  department: string;
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  notificationCount?: number;
  navigation: DashboardNavigationItem[];
  children: React.ReactNode;
  onNotifications?: () => void;
  onMessages?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  department,
  title,
  subtitle,
  userName,
  userRole,
  notificationCount,
  navigation,
  children,
  onNotifications,
  onMessages,
  onLogout,
  onSettings,
}) => {
  const { currentProfile } = useAuth();
  const [currentView, setCurrentView] = useState<'workspace' | 'meetings' | 'leave'>('workspace');

  const modifiedNavigation = [
    ...navigation.map((item) => ({
      ...item,
      active: currentView === 'workspace' && item.active,
      onClick: () => {
        setCurrentView('workspace');
        item.onClick?.();
      },
    })),
    {
      label: 'Leave Applications',
      icon: <CalendarOff style={{ width: 18, height: 18 }} />,
      active: currentView === 'leave',
      onClick: () => {
        setCurrentView('leave');
      },
    },
    {
      label: 'Monthly Meetings',
      icon: <Calendar style={{ width: 18, height: 18 }} />,
      active: currentView === 'meetings',
      onClick: () => {
        setCurrentView('meetings');
      },
    },
  ];

  const { submitDepartmentReport, communications } = useApplication();
  const settingsStorageKey = `gsp:${department
    .toLowerCase()
    .replace(/\s+/g, '-')}:settings`;
  const [showSettings, setShowSettings] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showDepartmentReport, setShowDepartmentReport] = useState(false);
  const [showCommunications, setShowCommunications] = useState(false);
  const [preferences, setPreferences] =
    useState<DepartmentSettingsPreferences>(() => {
      try {
        const saved = window.localStorage.getItem(settingsStorageKey);
        return saved
          ? { ...DEFAULT_DEPARTMENT_SETTINGS, ...JSON.parse(saved) }
          : DEFAULT_DEPARTMENT_SETTINGS;
      } catch {
        return DEFAULT_DEPARTMENT_SETTINGS;
      }
    });

  const savePreferences = (nextPreferences: DepartmentSettingsPreferences) => {
    setPreferences(nextPreferences);
    window.localStorage.setItem(
      settingsStorageKey,
      JSON.stringify(nextPreferences)
    );
    setShowSettings(false);
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 3500);
  };

  const canSubmitDepartmentReport =
    currentProfile.account_type === 'staff' &&
    !currentProfile.is_admin &&
    currentProfile.department !== 'admin';
  const unreadCommunications = communications.filter(
    (communication) =>
      !communication.is_read &&
      communication.sender_id !== currentProfile.id &&
      (communication.department === currentProfile.department || communication.department === 'all')
  ).length;
  const workflowDestinations: Partial<Record<typeof currentProfile.department, string>> = {
    marketing: 'Counseling and Admissions',
    counseling: 'Data & Applications',
    data_applications: 'Admissions',
    admissions: 'Finance and Operations',
    finance: 'Admissions',
    operations: 'Country Directors',
    country_directors: 'Admin',
    admin: 'All departments',
  };
  const nextWorkflowTeam = workflowDestinations[currentProfile.department] || 'Admin';

  return (
    <div
      className="workspace-shell"
      data-density={preferences.compactMode ? 'compact' : 'standard'}
      data-contrast={preferences.highContrast ? 'high' : 'standard'}
      style={{
        minHeight: '100vh',
        background: '#f6f7f9',
        display: 'flex',
        color: '#111827',
      }}
    >
      <DashboardSidebar
        department={department}
        items={modifiedNavigation}
      />

      <div
        className="workspace-main-shell"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        <DashboardTopbar
          title={title}
          subtitle={subtitle}
          userName={userName}
          userRole={userRole}
          avatarUrl={currentProfile.avatar_url}
          notificationCount={notificationCount ?? unreadCommunications}
          onNotifications={() => {
            onNotifications?.();
            setShowCommunications(true);
          }}
          onMessages={() => {
            onMessages?.();
            setShowCommunications(true);
          }}
          onLogout={onLogout}
          onSettings={() => {
            onSettings?.();
            setShowUserSettings(true);
          }}
          primaryAction={
            canSubmitDepartmentReport
              ? {
                  label: 'Submit report',
                  icon: <FileUp size={16} />,
                  onClick: () => setShowDepartmentReport(true),
                }
              : undefined
          }
        />
        <div className="dashboard-workflow-banner" style={{ margin: '14px 28px 0', padding: '11px 14px', border: '1px solid #dbe5fa', borderRadius: '10px', background: '#f8fbff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div className="dashboard-workflow-banner-copy" style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <MessageSquare size={17} color="#2f62e8" />
            <span style={{ color: '#465675', fontSize: '12px' }}><strong style={{ color: '#193572' }}>Connected workflow:</strong> {department} works next with {nextWorkflowTeam}.</span>
          </div>
          <button type="button" onClick={() => setShowCommunications(true)} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px', border: 0, background: 'transparent', color: '#2858c5', fontSize: '12px', fontWeight: 750, cursor: 'pointer' }}>Open team inbox <ArrowRight size={14} /></button>
        </div>
        <main
          className="workspace-content"
          style={{
            flex: 1,
            padding: '28px',
            boxSizing: 'border-box',
          }}
        >
          {currentView === 'meetings' ? (
            <MonthlyMeetingsView />
          ) : currentView === 'leave' ? (
            <StaffLeavePortalView />
          ) : (
            children
          )}
        </main>
      </div>

      {settingsSaved && (
        <div className="workspace-settings-toast" role="status">
          Settings saved for this department workspace.
        </div>
      )}

      {showUserSettings && currentProfile && (
        <UserSettingsModal
          user={currentProfile}
          onClose={() => setShowUserSettings(false)}
        />
      )}

      {showSettings && (
        <DepartmentSettingsModal
          department={department}
          userName={userName}
          preferences={preferences}
          onClose={() => setShowSettings(false)}
          onSave={savePreferences}
        />
      )}

      {showDepartmentReport && (
        <DepartmentReportModal
          department={currentProfile.department}
          onClose={() => setShowDepartmentReport(false)}
          onSubmit={submitDepartmentReport}
        />
      )}

      <CommunicationHub
        isOpen={showCommunications}
        onClose={() => setShowCommunications(false)}
      />
    </div>
  );
};
