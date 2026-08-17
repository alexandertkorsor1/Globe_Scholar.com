import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

type AuthMode = 'login' | 'student-signup';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error('Login failed:', error);
      setError(error.message);
    }

    setLoading(false);
  };

  const handleStudentSignup = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters long.'
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const { data, error } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            account_type: 'student',
          },
        },
      });

    if (error) {
      console.error('Student registration failed:', error);
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log('Student registration successful:', data);

    setSuccess(
      'Student account created successfully. You can now sign in.'
    );

    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');

    setMode('login');
    setLoading(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background:
          'linear-gradient(135deg, #0b1020 0%, #111827 50%, #172033 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#ffffff',
          borderRadius: '18px',
          padding: '40px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '28px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: 800,
              color: '#111827',
            }}
          >
            Report.com
          </h1>

          <p
            style={{
              marginTop: '8px',
              marginBottom: 0,
              color: '#6b7280',
              fontSize: '15px',
            }}
          >
            {mode === 'login'
              ? 'Staff & Student Portal'
              : 'Student Registration'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@report.com"
              autoComplete="email"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 14px',
                marginBottom: '20px',
                border: '1px solid #d1d5db',
                borderRadius: '9px',
                fontSize: '15px',
                outline: 'none',
              }}
            />

            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 14px',
                marginBottom: '20px',
                border: '1px solid #d1d5db',
                borderRadius: '9px',
                fontSize: '15px',
                outline: 'none',
              }}
            />

            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: '20px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                style={{
                  marginBottom: '20px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#047857',
                  fontSize: '14px',
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: '9px',
                background: loading
                  ? '#9ca3af'
                  : '#111827',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {loading
                ? 'Signing in...'
                : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() =>
                switchMode('student-signup')
              }
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '9px',
                background: '#ffffff',
                color: '#111827',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create Student Account
            </button>
          </form>
        ) : (
          <form onSubmit={handleStudentSignup}>
            <label
              htmlFor="fullName"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Full name
            </label>

            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="Enter your full name"
              autoComplete="name"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 14px',
                marginBottom: '18px',
                border: '1px solid #d1d5db',
                borderRadius: '9px',
                fontSize: '15px',
                outline: 'none',
              }}
            />

            <label
              htmlFor="student-email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Email address
            </label>

            <input
              id="student-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="student@example.com"
              autoComplete="email"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 14px',
                marginBottom: '18px',
                border: '1px solid #d1d5db',
                borderRadius: '9px',
                fontSize: '15px',
                outline: 'none',
              }}
            />

            <label
              htmlFor="student-password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Password
            </label>

            <input
              id="student-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Create a password"
              autoComplete="new-password"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 14px',
                marginBottom: '18px',
                border: '1px solid #d1d5db',
                borderRadius: '9px',
                fontSize: '15px',
                outline: 'none',
              }}
            />

            <label
              htmlFor="confirm-password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Confirm password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 14px',
                marginBottom: '20px',
                border: '1px solid #d1d5db',
                borderRadius: '9px',
                fontSize: '15px',
                outline: 'none',
              }}
            />

            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: '20px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                style={{
                  marginBottom: '20px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#047857',
                  fontSize: '14px',
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: '9px',
                background: loading
                  ? '#9ca3af'
                  : '#111827',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {loading
                ? 'Creating account...'
                : 'Create Student Account'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '9px',
                background: '#ffffff',
                color: '#111827',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Sign In
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: '28px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '13px',
          }}
        >
          {mode === 'login'
            ? 'Authorized staff and student access'
            : 'Student accounts only'}
        </div>
      </div>
    </div>
  );
};
