import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { checkPasswordStrength } from '../../lib/password-utils';

interface PasswordStrengthMeterProps {
  password: string;
  showRules?: boolean;
  compact?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showRules = true,
  compact = false,
}) => {
  if (!password) {
    return null;
  }

  const { score, label, color, isWeak, warning, rules } = checkPasswordStrength(password);

  const getScoreColor = (index: number) => {
    if (index > score) return 'rgba(255, 255, 255, 0.12)';
    if (score === 1 || score === 0) return '#ef4444'; // Red (Weak)
    if (score === 2) return '#f59e0b'; // Amber (Fair)
    if (score === 3) return '#3b82f6'; // Blue (Good)
    return '#10b981'; // Green (Strong)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
      
      {/* Strength Bar and Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              style={{
                height: '5px',
                flex: 1,
                borderRadius: '3px',
                background: getScoreColor(step),
                transition: 'background-color 0.25s ease, width 0.25s ease',
              }}
            />
          ))}
        </div>

        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {isWeak ? (
            <ShieldAlert size={13} style={{ color }} />
          ) : score >= 3 ? (
            <ShieldCheck size={13} style={{ color }} />
          ) : (
            <AlertTriangle size={13} style={{ color }} />
          )}
          {label}
        </span>
      </div>

      {/* Weak Password Warning Banner */}
      {isWeak && warning && (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            color: '#fca5a5',
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: 1.4,
          }}
        >
          <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', color: '#f87171', fontWeight: 650 }}>
              Weak Password Warning
            </strong>
            <span>{warning}</span>
          </div>
        </div>
      )}

      {/* Password Rule Checklist */}
      {showRules && !compact && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '4px 10px',
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.72rem',
          }}
        >
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: rule.passed ? '#34d399' : '#94a3b8',
                transition: 'color 0.2s',
              }}
            >
              {rule.passed ? (
                <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0 }} />
              ) : (
                <Circle size={10} style={{ color: '#64748b', flexShrink: 0 }} />
              )}
              <span style={{ textDecoration: rule.passed ? 'none' : 'none' }}>
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
