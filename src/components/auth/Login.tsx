import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import brandLogo from '../../brand-logo.jpg';

export type AuthMode = 'login' | 'student-signup' | 'forgot-password';

interface LoginProps {
  initialMode?: AuthMode;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({
  initialMode = 'login',
  onBack,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!phone.trim() || !age.trim() || !gender.trim() || !country.trim() || !currentAddress.trim()) {
      setError('Please complete your phone, age, gender, country, and current address.');
      setLoading(false);
      return;
    }

    const studentAge = Number(age);

    if (!Number.isInteger(studentAge) || studentAge < 10 || studentAge > 90) {
      setError('Please enter a valid student age between 10 and 90.');
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

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || fullName.trim();
    const lastName = nameParts.slice(1).join(' ');

    const { data, error } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            first_name: firstName,
            last_name: lastName,
            phone: phone.trim(),
            age: studentAge,
            gender: gender.trim(),
            country_of_residence: country.trim(),
            current_address: currentAddress.trim(),
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

    // When email confirmation is disabled in Supabase, signUp returns an
    // authenticated session and AuthContext will route the student directly
    // to their portal. If it is enabled, make one automatic sign-in attempt
    // so installations that allow it still get the same seamless flow.
    let hasSession = Boolean(data.session);

    if (!hasSession) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      hasSession = Boolean(signInData.session);

      if (signInError || !hasSession) {
        setError(
          'Your account was created, but email confirmation is enabled. Turn off "Confirm email" in Supabase Auth settings to sign students in immediately after registration.'
        );
        setLoading(false);
        return;
      }
    }

    setSuccess(
      'Student account created. Opening your dashboard...'
    );

    setFullName('');
    setPhone('');
    setAge('');
    setGender('');
    setCountry('');
    setCurrentAddress('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');

    setLoading(false);
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const resetUrl = `${window.location.origin}${window.location.pathname}?reset-password=true`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: resetUrl }
    );

    setLoading(false);

    if (resetError) {
      console.error('Password reset request failed:', resetError);
      setError(resetError.message);
      return;
    }

    setSuccess('If this email has an account, a secure password-reset link has been sent. Check your inbox and spam folder.');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setAge('');
    setGender('');
    setCountry('');
    setCurrentAddress('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    marginBottom: '18px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    color: '#111827',
    background: '#f9fafb',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  };

  return (
    <div
      className="auth-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f6f7f9',
      }}
    >
      {onBack && (
        <button
          className="auth-back-button"
          type="button"
          onClick={onBack}
          style={{
            position: 'fixed',
            top: '20px',
            left: '24px',
            border: '1px solid #d7deea',
            borderRadius: '9px',
            background: '#ffffff',
            color: '#244486',
            padding: '9px 12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← Back to site
        </button>
      )}
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '44px 40px',
          boxShadow:
            '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
        }}
      >
        {/* Logo */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <img className="auth-brand-logo" src={brandLogo} alt="Globe Scholars Pathways, LLC." />

          {mode !== 'login' && (
            <p
              style={{
                marginTop: '6px',
                marginBottom: 0,
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              {mode === 'student-signup'
                ? 'Student Registration'
                : 'Password Recovery'}
            </p>
          )}
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <label htmlFor="email" style={labelStyle}>
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Email"
              autoComplete="email"
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = '#3366FF';
                e.target.style.boxShadow =
                  '0 0 0 3px rgba(51, 102, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />

            <label
              htmlFor="password"
              style={labelStyle}
            >
              Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                style={{ ...inputStyle, paddingRight: '70px' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3366FF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(51, 102, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', top: '10px', right: '9px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: 0, background: 'transparent', color: '#315cc8', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button type="button" onClick={() => switchMode('forgot-password')} style={{ display: 'block', margin: '-5px 0 18px auto', padding: 0, border: 0, background: 'transparent', color: '#315cc8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Forgot password?
            </button>

            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: '18px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '13px',
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                style={{
                  marginBottom: '18px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#047857',
                  fontSize: '13px',
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
                padding: '13px',
                border: 'none',
                borderRadius: '10px',
                background: loading
                  ? '#93c5fd'
                  : '#3366FF',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
                fontFamily: 'var(--font-body)',
                boxShadow:
                  '0 2px 8px rgba(51, 102, 255, 0.25)',
                transition:
                  'background 0.2s, box-shadow 0.2s',
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
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'background 0.15s',
              }}
            >
              Create Student Account
            </button>
          </form>
        ) : mode === 'student-signup' ? (
          <form onSubmit={handleStudentSignup}>
            <label
              htmlFor="fullName"
              style={labelStyle}
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
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = '#3366FF';
                e.target.style.boxShadow =
                  '0 0 0 3px rgba(51, 102, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />

            <label
              htmlFor="student-email"
              style={labelStyle}
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
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = '#3366FF';
                e.target.style.boxShadow =
                  '0 0 0 3px rgba(51, 102, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />

            <label htmlFor="student-phone" style={labelStyle}>
              Phone number
            </label>
            <input
              id="student-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+1 555 0100"
              autoComplete="tel"
              required
              style={inputStyle}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="student-age" style={labelStyle}>
                  Age
                </label>
                <input
                  id="student-age"
                  type="number"
                  min={10}
                  max={90}
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="Age"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="student-gender" style={labelStyle}>
                  Gender
                </label>
                <select
                  id="student-gender"
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  required
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <label htmlFor="student-country" style={labelStyle}>
              Country
            </label>
            <select
              id="student-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Select country of residence</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Denmark">Denmark</option>
              <option value="Germany">Germany</option>
              <option value="India">India</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="Kenya">Kenya</option>
              <option value="South Africa">South Africa</option>
              <option value="Other">Other</option>
            </select>

            <label htmlFor="student-address" style={labelStyle}>
              Current address
            </label>
            <textarea
              id="student-address"
              value={currentAddress}
              onChange={(event) => setCurrentAddress(event.target.value)}
              placeholder="Street, city, state/province"
              autoComplete="street-address"
              required
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />

            <label
              htmlFor="student-password"
              style={labelStyle}
            >
              Password
            </label>

            <div style={{ position: 'relative' }}>
              <input id="student-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" autoComplete="new-password" required style={{ ...inputStyle, paddingRight: '70px' }} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', top: '10px', right: '9px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: 0, background: 'transparent', color: '#315cc8', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}{showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <label
              htmlFor="confirm-password"
              style={labelStyle}
            >
              Confirm password
            </label>

            <div style={{ position: 'relative' }}>
              <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm your password" autoComplete="new-password" required style={{ ...inputStyle, paddingRight: '70px' }} />
              <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} style={{ position: 'absolute', top: '10px', right: '9px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: 0, background: 'transparent', color: '#315cc8', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}{showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: '18px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '13px',
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                style={{
                  marginBottom: '18px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#047857',
                  fontSize: '13px',
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
                padding: '13px',
                border: 'none',
                borderRadius: '10px',
                background: loading
                  ? '#93c5fd'
                  : '#3366FF',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
                fontFamily: 'var(--font-body)',
                boxShadow:
                  '0 2px 8px rgba(51, 102, 255, 0.25)',
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
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <p style={{ margin: '0 0 20px', color: '#5b677a', fontSize: '14px', lineHeight: 1.55 }}>
              Enter your account email and we will send a secure link to choose a new password.
            </p>

            <label htmlFor="reset-email" style={labelStyle}>Email address</label>
            <input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required style={inputStyle} />

            {error && <div role="alert" style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px' }}>{error}</div>}
            {success && <div role="status" style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '13px', lineHeight: 1.45 }}>{success}</div>}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: '10px', background: loading ? '#93c5fd' : '#3366FF', color: '#ffffff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 2px 8px rgba(51, 102, 255, 0.25)' }}>
              {loading ? 'Sending reset link...' : 'Send password reset link'}
            </button>
            <button type="button" onClick={() => switchMode('login')} style={{ width: '100%', marginTop: '12px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Back to Sign In
            </button>
          </form>
        )}

        {mode !== 'login' && (
          <div
            style={{
              marginTop: '28px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '12px',
            }}
          >
            {mode === 'student-signup'
              ? 'Student accounts only'
              : 'Secure account recovery'}
          </div>
        )}
      </div>
    </div>
  );
};
