import { Application, FinancialRecord, Student } from '../types/database';

export const INTAKE_NOT_PROVIDED = 'Not provided';
export const REGISTRATION_FEE_TARGET_USD = 150;

const clean = (value?: string | null) => value?.trim() || '';

export const present = (value?: string | number | null) => {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : INTAKE_NOT_PROVIDED;
  return clean(value) || INTAKE_NOT_PROVIDED;
};

export const formatRegisterDate = (value?: string | null) => {
  if (!value) return INTAKE_NOT_PROVIDED;

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatRegisterTime = (value?: string | null) => {
  if (!value) return INTAKE_NOT_PROVIDED;

  return new Date(value).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatUsd = (amount: number) =>
  amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

export const findStudentForApplication = (
  application: Application,
  students: Student[]
) => {
  const email = clean(application.student_email).toLowerCase();

  return students.find((student) =>
    student.id === application.student_id ||
    student.profile_id === application.student_id ||
    clean(student.email).toLowerCase() === email
  );
};

export const getStudentDisplayName = (student?: Student) =>
  student ? `${student.first_name} ${student.last_name}`.trim() : '';

export const getApplicationIntake = (
  application: Application,
  students: Student[]
) => {
  const student = findStudentForApplication(application, students);

  return {
    student,
    email: present(application.student_email || student?.email),
    name: present(application.student_name || getStudentDisplayName(student)),
    phone: present(application.student_phone || student?.phone),
    age: present(application.student_age ?? student?.age),
    gender: present(application.student_gender || student?.gender),
    country: present(
      application.student_country ||
      student?.country_of_residence ||
      application.target_country
    ),
    currentAddress: present(
      application.student_current_address ||
      student?.current_address
    ),
    applicationDate: formatRegisterDate(application.created_at),
  };
};

export const getRegistrationFeeSummary = (
  applicationId: string,
  records: FinancialRecord[]
) => {
  const registrationRecords = records.filter(
    (record) =>
      record.application_id === applicationId &&
      record.record_type === 'registration_fee'
  );

  const verifiedAmount = registrationRecords
    .filter((record) => record.status === 'paid' || record.status === 'approved')
    .reduce((total, record) => total + record.amount, 0);

  const submittedAmount = registrationRecords
    .filter((record) => record.status !== 'rejected')
    .reduce((total, record) => total + record.amount, 0);

  const latestRecord = registrationRecords[0];
  const balance = Math.max(0, REGISTRATION_FEE_TARGET_USD - verifiedAmount);

  return {
    latestRecord,
    submittedAmount,
    verifiedAmount,
    balance,
    status: latestRecord?.status || 'not_submitted',
    isCleared: balance === 0,
  };
};
