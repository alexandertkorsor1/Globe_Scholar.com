import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff, Lock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
import { checkPasswordStrength } from '../../lib/password-utils';
import type { Profile } from '../../types/database';

interface UserSettingsModalProps {
  user: Profile;
  onClose: () => void;
  initialTab?: 'password' | 'profile';
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  user,
  onClose,
  initialTab = 'profile',
}) => {
  const { updateProfileAvatar, currentProfile } = useAuth();
  const activeUser = currentProfile || user;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'password' | 'profile'>(initialTab);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword.trim()) {
      setError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    if (strength.isWeak) {
      setError(
        strength.warning ||
          'Your password is weak. Please choose a stronger password with a mix of uppercase letters, numbers, and special characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setSaving(true);

    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setSaving(false);
        setError('Current password is incorrect.');
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return;
      }

      setSaving(false);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    }
  };

  return (
    <div className="modal-overlay" role="presentation">
      <section
        className="modal-content user-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-settings-modal-title"
        style={{
          maxWidth: '550px',
          padding: 0,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: 600,
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Settings
            </span>
            <h2
              id="user-settings-modal-title"
              style={{
                margin: 0,
                fontSize: '1.25rem',
                color: '#111827',
                fontWeight: 700,
              }}
            >
              Account Settings
            </h2>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              Manage your account details and security preferences.
            </p>
          </div>
          <button
            type="button"
            className="settings-close-button"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#6b7280',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </header>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            borderBottom: '1px solid #e5e7eb',
            background: '#fff',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'profile' ? '#1d4ed8' : '#6b7280',
              borderBottom: activeTab === 'profile' ? '2px solid #1d4ed8' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <User size={16} style={{ marginRight: '6px', display: 'inline' }} />
            Profile & Photo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'password' ? '#1d4ed8' : '#6b7280',
              borderBottom: activeTab === 'password' ? '2px solid #1d4ed8' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Lock size={16} style={{ marginRight: '6px', display: 'inline' }} />
            Change Password
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Current Password */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827',
                        boxSizing: 'border-box',
                        background: '#fff',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827',
                        boxSizing: 'border-box',
                        background: '#fff',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <PasswordStrengthMeter password={newPassword} />
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827',
                        boxSizing: 'border-box',
                        background: '#fff',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    role="alert"
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      fontSize: '13px',
                      border: '1px solid #fecaca',
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div
                    role="status"
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#dcfce7',
                      color: '#166534',
                      fontSize: '13px',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    marginTop: '8px',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: saving ? '#93c5fd' : '#1d4ed8',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <KeyRound size={16} />
                  {saving ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* Profile Info Tab */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Profile Avatar Card */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <ProfileAvatar
                  avatarUrl={activeUser.avatar_url}
                  name={activeUser.full_name}
                  size={96}
                  editable={true}
                  showDetails={true}
                  onAvatarChange={updateProfileAvatar}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748b',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Full Name
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#0f172a',
                      fontWeight: 600,
                    }}
                  >
                    {activeUser.full_name}
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748b',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Department
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#2563eb',
                      fontWeight: 700,
                    }}
                  >
                    {(activeUser.department || 'Admissions').replace(/_/g, ' ').toUpperCase()}
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748b',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Email Address
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#0f172a',
                      fontWeight: 500,
                      wordBreak: 'break-all',
                    }}
                  >
                    {activeUser.email}
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748b',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Job Title / Role
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#0f172a',
                      fontWeight: 500,
                    }}
                  >
                    {activeUser.job_title || 'Department Officer'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
