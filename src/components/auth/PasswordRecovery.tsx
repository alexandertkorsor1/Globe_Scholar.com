import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
import { checkPasswordStrength } from '../../lib/password-utils';

interface PasswordRecoveryProps {
  onComplete: () => void;
}

export const PasswordRecovery: React.FC<PasswordRecoveryProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }

    const strength = checkPasswordStrength(password);
    if (strength.isWeak) {
      setError(
        strength.warning ||
          'Password is weak. Please choose a stronger password with a mix of uppercase letters, numbers, and symbols.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Your password has been updated. Taking you back to sign in…');
    window.setTimeout(onComplete, 1000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '12px 70px 12px 14px',
    border: '1px solid #d7deea', borderRadius: '10px', fontSize: '14px',
    color: '#111827', background: '#f9fafb', outline: 'none',
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f6f7f9' }}>
      <section style={{ width: 'min(430px, 100%)', padding: '42px 38px', borderRadius: '20px', background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '14px', display: 'grid', placeItems: 'center', marginBottom: '18px', background: 'linear-gradient(135deg, #3366FF, #6366f1)', color: '#fff' }}><KeyRound size={23} /></div>
        <h1 style={{ margin: 0, color: '#111827', fontSize: '26px' }}>Choose a new password</h1>
        <p style={{ margin: '9px 0 25px', color: '#64748b', fontSize: '14px', lineHeight: 1.55 }}>Use a strong password you do not reuse elsewhere.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#374151', fontWeight: 650, fontSize: '13px' }}>New password
            <span style={{ position: 'relative' }}><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required style={inputStyle} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', top: '10px', right: '9px', display: 'inline-flex', gap: '4px', alignItems: 'center', border: 0, background: 'transparent', color: '#315cc8', fontWeight: 700, cursor: 'pointer' }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}{showPassword ? 'Hide' : 'Show'}</button>
            </span>
          </label>
          {password.length > 0 && (
            <PasswordStrengthMeter password={password} />
          )}
          <label style={{ display: 'grid', gap: '6px', color: '#374151', fontWeight: 650, fontSize: '13px' }}>Confirm new password
            <span style={{ position: 'relative' }}><input type={showConfirmation ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required style={inputStyle} />
              <button type="button" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'} style={{ position: 'absolute', top: '10px', right: '9px', display: 'inline-flex', gap: '4px', alignItems: 'center', border: 0, background: 'transparent', color: '#315cc8', fontWeight: 700, cursor: 'pointer' }}>{showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}{showConfirmation ? 'Hide' : 'Show'}</button>
            </span>
          </label>
          {error && <div role="alert" style={{ padding: '11px 13px', borderRadius: '9px', background: '#fef2f2', color: '#b91c1c', fontSize: '13px' }}>{error}</div>}
          {message && <div role="status" style={{ padding: '11px 13px', borderRadius: '9px', background: '#ecfdf5', color: '#047857', fontSize: '13px' }}>{message}</div>}
          <button type="submit" disabled={saving || Boolean(message)} style={{ marginTop: '4px', padding: '13px', border: 0, borderRadius: '10px', background: saving || message ? '#93c5fd' : '#3366ff', color: '#fff', fontSize: '15px', fontWeight: 750, cursor: saving || message ? 'not-allowed' : 'pointer' }}>{saving ? 'Updating password…' : 'Update password'}</button>
        </form>
      </section>
    </main>
  );
};
