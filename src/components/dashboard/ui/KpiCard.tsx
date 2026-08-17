import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeDirection?: 'up' | 'down';
  secondaryChange?: string;
  secondaryDirection?: 'up' | 'down';
  description?: string;
  icon?: React.ReactNode;
  chart?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  changeDirection = 'up',
  secondaryChange,
  secondaryDirection = 'down',
  description,
  icon,
  chart,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-title">{title}</div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div className="stat-card-value">{value}</div>

        {icon && (
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}

        {chart && (
          <div style={{ flexShrink: 0 }}>{chart}</div>
        )}
      </div>

      {(change || description) && (
        <div className="stat-card-footer">
          {change && (
            <span
              className={
                changeDirection === 'up'
                  ? 'stat-change-up'
                  : 'stat-change-down'
              }
            >
              {changeDirection === 'up' ? (
                <TrendingUp
                  style={{ width: '14px', height: '14px' }}
                />
              ) : (
                <TrendingDown
                  style={{ width: '14px', height: '14px' }}
                />
              )}
              {change}
            </span>
          )}

          {secondaryChange && (
            <span
              className={
                secondaryDirection === 'up'
                  ? 'stat-change-up'
                  : 'stat-change-down'
              }
            >
              {secondaryDirection === 'up' ? (
                <TrendingUp
                  style={{ width: '14px', height: '14px' }}
                />
              ) : (
                <TrendingDown
                  style={{ width: '14px', height: '14px' }}
                />
              )}
              {secondaryChange}
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
