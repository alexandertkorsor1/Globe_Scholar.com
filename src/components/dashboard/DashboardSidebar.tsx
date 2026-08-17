import React from 'react';

export interface DashboardNavigationItem {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface DashboardSidebarProps {
  department: string;
  items: DashboardNavigationItem[];
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  department,
  items,
}) => {
  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        minHeight: '100vh',
        padding: '22px 14px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          padding: '0 12px 28px',
          borderBottom: '1px solid #f3f4f6',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#111827',
          }}
        >
          GSP
        </div>

        <div
          style={{
            marginTop: '5px',
            fontSize: '12px',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {department}
        </div>
      </div>

      <nav>
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 12px',
              marginBottom: '5px',
              border: 'none',
              borderRadius: '10px',
              background: item.active ? '#111827' : 'transparent',
              color: item.active ? '#ffffff' : '#4b5563',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: item.active ? 600 : 500,
            }}
          >
            {item.icon && (
              <span
                style={{
                  width: '20px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </span>
            )}

            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
