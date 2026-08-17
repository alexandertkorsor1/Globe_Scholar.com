import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  description,
  icon,
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '18px',
        padding: '22px',
        minHeight: '145px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: 500,
          }}
        >
          {title}
        </span>

        {icon && (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: '30px',
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      {(change || description) && (
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            fontSize: '12px',
          }}
        >
          {change && (
            <span
              style={{
                color: '#059669',
                fontWeight: 600,
              }}
            >
              {change}
            </span>
          )}

          {description && (
            <span style={{ color: '#9ca3af' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
