import React from 'react';

interface DashboardTopbarProps {
  title: string;
  subtitle?: string;
  userName?: string;
  onNotifications?: () => void;
  onMessages?: () => void;
  onLogout?: () => void;
}

export const DashboardTopbar: React.FC<DashboardTopbarProps> = ({
  title,
  subtitle,
  userName,
  onNotifications,
  onMessages,
  onLogout,
}) => {
  return (
    <header
      style={{
        height: '78px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxSizing: 'border-box',
      }}
    >
      {/* Page title */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              margin: '4px 0 0',
              color: '#9ca3af',
              fontSize: '13px',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right side */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        {/* Search */}
        <div
          style={{
            width: '220px',
            height: '38px',
            borderRadius: '10px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            padding: '0 13px',
            color: '#9ca3af',
            fontSize: '13px',
          }}
        >
          Search...
        </div>

        {/* Messages */}
        <button
          type="button"
          onClick={onMessages}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '18px',
          }}
          aria-label="Messages"
        >
          💬
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onNotifications}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '18px',
          }}
          aria-label="Notifications"
        >
          🔔
        </button>

        {/* User profile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#111827',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {userName
              ? userName
                  .split(' ')
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'U'}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            style={{
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#374151',
              borderRadius: '8px',
              padding: '9px 13px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
