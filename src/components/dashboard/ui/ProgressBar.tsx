import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = '#3366FF',
  height = 8,
  label,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontSize: '12px',
          }}
        >
          <span style={{ color: '#6b7280', fontWeight: 500 }}>
            {label}
          </span>
          <span style={{ color: '#111827', fontWeight: 600 }}>
            {clampedValue}%
          </span>
        </div>
      )}

      <div
        className="progress-track"
        style={{ height: `${height}px` }}
      >
        <div
          className="progress-fill"
          style={{
            width: `${clampedValue}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
};
