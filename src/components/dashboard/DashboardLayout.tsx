import React, { useState } from 'react';
import { FileUp } from 'lucide-react';
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
import { DepartmentReportModal } from '../reports/DepartmentReportModal';
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
  const { submitDepartmentReport } = useApplication();
  const settingsStorageKey = `report-com:${department
    .toLowerCase()
    .replace(/\s+/g, '-')}:settings`;
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showDepartmentReport, setShowDepartmentReport] = useState(false);
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
        items={navigation}
      />

      <div
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
          notificationCount={notificationCount}
          onNotifications={onNotifications}
          onMessages={onMessages}
          onLogout={onLogout}
          onSettings={() => {
            onSettings?.();
            setShowSettings(true);
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
        <main
          style={{
            flex: 1,
            padding: '28px',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>

      {settingsSaved && (
        <div className="workspace-settings-toast" role="status">
          Settings saved for this department workspace.
        </div>
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
    </div>
  );
};
