import React from 'react';
import {
  DashboardSidebar,
  DashboardNavigationItem,
} from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';

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

  return (
    <div
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
  	onSettings={onSettings}
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
    </div>
  );
};
