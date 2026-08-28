/**
 * Password Strength & Weak Password Detection Utilities
 */

export interface PasswordRule {
  id: string;
  label: string;
  passed: boolean;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  percentage: number;
  color: string;
  isWeak: boolean;
  warning?: string;
  rules: PasswordRule[];
}

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '123456',
  '12345678',
  '123456789',
  'admin',
  'admin123',
  'globescholar',
  'scholar',
  'student',
  'student123',
  'welcome',
  'welcome123',
  'qwerty',
  'letmein',
  'monkey',
  'iloveyou',
  'login',
  'login123',
  'pass1234',
  'test1234',
  'changeme',
]);

/**
 * Check if a password contains repetitive characters (e.g., 'aaaa', '1111')
 * or sequential characters (e.g., '12345', 'abcdef')
 */
const hasRepeatsOrSequences = (pwd: string): boolean => {
  if (/(.)\1{2,}/i.test(pwd)) return true; // 3 or more identical characters in a row
  const lower = pwd.toLowerCase();
  const sequences = ['12345', '23456', '34567', '45678', '56789', '67890', 'abcdef', 'qwerty', 'asdfgh'];
  return sequences.some((seq) => lower.includes(seq));
};

/**
 * Evaluate password strength and detect if it is weak.
 */
export const checkPasswordStrength = (password: string): PasswordStrengthResult => {
  const pwd = password || '';
  const trimmed = pwd.trim();

  const hasMinLength = trimmed.length >= 8;
  const hasStrongLength = trimmed.length >= 12;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd);
  const isCommon = COMMON_WEAK_PASSWORDS.has(trimmed.toLowerCase());
  const hasSeq = hasRepeatsOrSequences(pwd);

  const rules: PasswordRule[] = [
    {
      id: 'length',
      label: 'At least 8 characters long',
      passed: hasMinLength,
    },
    {
      id: 'uppercase',
      label: 'At least 1 uppercase letter (A-Z)',
      passed: hasUppercase,
    },
    {
      id: 'lowercase',
      label: 'At least 1 lowercase letter (a-z)',
      passed: hasLowercase,
    },
    {
      id: 'number',
      label: 'At least 1 number (0-9)',
      passed: hasNumber,
    },
    {
      id: 'special',
      label: 'At least 1 special character (!@#$%^&*)',
      passed: hasSpecial,
    },
    {
      id: 'notCommon',
      label: 'Not a common weak word or sequence',
      passed: !isCommon && !hasSeq && trimmed.length > 0,
    },
  ];

  if (trimmed.length === 0) {
    return {
      score: 0,
      label: 'Very Weak',
      percentage: 0,
      color: '#94a3b8',
      isWeak: true,
      warning: 'Please enter a password.',
      rules,
    };
  }

  // If matches common dictionary word or length < 6
  if (isCommon || trimmed.length < 6) {
    return {
      score: 0,
      label: 'Very Weak',
      percentage: 15,
      color: '#ef4444',
      isWeak: true,
      warning: 'This password is too common and easily guessed. Please change it to a more secure password.',
      rules,
    };
  }

  // Calculate score based on criteria
  let criteriaCount = 0;
  if (hasMinLength) criteriaCount++;
  if (hasUppercase) criteriaCount++;
  if (hasLowercase) criteriaCount++;
  if (hasNumber) criteriaCount++;
  if (hasSpecial) criteriaCount++;
  if (hasStrongLength) criteriaCount++;
  if (!hasSeq) criteriaCount++;

  let score: 0 | 1 | 2 | 3 | 4 = 1;
  let label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  let color = '#ef4444';
  let percentage = 25;
  let isWeak = true;
  let warning: string | undefined;

  if (criteriaCount <= 2 || !hasMinLength) {
    score = 1;
    label = 'Weak';
    color = '#ef4444';
    percentage = 25;
    isWeak = true;
    warning = '⚠️ Weak password detected: Add uppercase letters, numbers, or symbols to protect your account.';
  } else if (criteriaCount === 3 || criteriaCount === 4) {
    score = 2;
    label = 'Fair';
    color = '#f59e0b';
    percentage = 50;
    isWeak = false;
    warning = '⚠️ Moderate password: Add symbols or more length for better security.';
  } else if (criteriaCount === 5) {
    score = 3;
    label = 'Good';
    color = '#3b82f6';
    percentage = 75;
    isWeak = false;
    warning = undefined;
  } else {
    score = 4;
    label = 'Strong';
    color = '#10b981';
    percentage = 100;
    isWeak = false;
    warning = undefined;
  }

  return {
    score,
    label,
    percentage,
    color,
    isWeak,
    warning,
    rules,
  };
};
