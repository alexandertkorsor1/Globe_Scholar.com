import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError('');

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
            marginBottom: '32px',
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
            Staff Management Portal
          </p>
        </div>

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
            onChange={(event) => setEmail(event.target.value)}
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
            onChange={(event) => setPassword(event.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '9px',
              background: loading ? '#9ca3af' : '#111827',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            marginTop: '28px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '13px',
          }}
        >
          Authorized staff access only
        </div>
      </div>
    </div>
  );
};
