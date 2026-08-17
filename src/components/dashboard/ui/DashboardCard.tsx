import React from 'react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  children,
  action,
  noPadding = false,
}) => {
  return (
    <section
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        style={{
          padding: '20px 22px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 650,
              color: '#111827',
            }}
          >
            {title}
          </h3>

          {subtitle && (
            <p
              style={{
                margin: '5px 0 0',
                fontSize: '13px',
                color: '#9ca3af',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      <div
        style={
          noPadding ? {} : { padding: '22px' }
        }
      >
        {children}
      </div>
    </section>
  );
};
