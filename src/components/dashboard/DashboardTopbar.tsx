import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';

interface DashboardTopbarProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  avatarUrl?: string | null;
  notificationCount?: number;
  onNotifications?: () => void;
  onMessages?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
}

export const DashboardTopbar: React.FC<
  DashboardTopbarProps
> = ({
  title,
  subtitle,
  userName,
  userRole = 'Staff',
  avatarUrl,
  notificationCount = 0,
  onNotifications,
  onMessages,
  onLogout,
  onSettings,
  primaryAction,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
  }, []);

  const initials = userName
    ? userName
        .split(' ')
        .map((name) => name[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header
      className="dashboard-topbar"
      style={{
        height: '72px',
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
      <div className="dashboard-topbar-title">
        <h1
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              margin: '2px 0 0',
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
        className="dashboard-topbar-actions"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="dashboard-primary-action"
            aria-label={primaryAction.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              border: 'none',
              borderRadius: '9px',
              padding: '10px 13px',
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)',
            }}
          >
            {primaryAction.icon}
            {primaryAction.label}
          </button>
        )}

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onNotifications}
          style={{
            position: 'relative',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Notifications"
        >
          <Bell
            style={{
              width: '20px',
              height: '20px',
              color: '#6b7280',
            }}
          />

          {notificationCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #fff',
              }}
            >
              {notificationCount > 9
                ? '9+'
                : notificationCount}
            </span>
          )}
        </button>

        {/* User Profile + Dropdown */}
        <div
          className="dashboard-profile-menu"
          ref={menuRef}
          style={{ position: 'relative' }}
        >
          <button
            type="button"
            onClick={() =>
              setShowUserMenu(!showUserMenu)
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '10px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                overflow: 'hidden',
                background:
                  'linear-gradient(135deg, #3366FF, #6366f1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                flexShrink: 0,
                border: '2px solid #e5e7eb',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName || 'User'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                initials
              )}
            </div>

            {/* Name + Role */}
            <div
              className="dashboard-user-details"
              style={{
                textAlign: 'left',
                lineHeight: 1.3,
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                  whiteSpace: 'nowrap',
                }}
              >
                {userName || 'User'}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  whiteSpace: 'nowrap',
                }}
              >
                {userRole}
              </div>
            </div>

            <ChevronDown
              style={{
                width: '16px',
                height: '16px',
                color: '#9ca3af',
                transition: 'transform 0.2s',
                transform: showUserMenu
                  ? 'rotate(180deg)'
                  : 'rotate(0)',
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '220px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow:
                  '0 10px 32px rgba(0, 0, 0, 0.12)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onSettings?.();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <User
                  style={{
                    width: '16px',
                    height: '16px',
                    color: '#2563eb',
                  }}
                />
                Profile &amp; Photo (50KB)
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onSettings?.();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Settings
                  style={{
                    width: '16px',
                    height: '16px',
                    color: '#9ca3af',
                  }}
                />
                Security &amp; Password
              </button>

              <div
                style={{
                  height: '1px',
                  background: '#f3f4f6',
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  const confirmed = window.confirm(
                    'Are you sure you want to sign out?'
                  );
                  if (!confirmed) return;
                  onLogout?.();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#dc2626',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <LogOut
                  style={{
                    width: '16px',
                    height: '16px',
                  }}
                />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
