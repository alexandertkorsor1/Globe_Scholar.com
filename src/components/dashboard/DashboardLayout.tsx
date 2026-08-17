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
  navigation: DashboardNavigationItem[];
  children: React.ReactNode;
  onNotifications?: () => void;
  onMessages?: () => void;
  onLogout?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  department,
  title,
  subtitle,
  userName,
  navigation,
  children,
  onNotifications,
  onMessages,
  onLogout,
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
  	onNotifications={onNotifications}
  	onMessages={onMessages}
  	onLogout={onLogout}
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
