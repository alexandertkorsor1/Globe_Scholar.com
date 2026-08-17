import { DepartmentType, Application, CounselingSession, FinancialRecord, Student } from '../types/database';

export interface RLSPermissionResult<T> {
  allowed: boolean;
  data: T[] | null;
  denialReason?: string;
}

export class RLSSimulationEngine {
  /**
   * Application RLS Enforcement:
   * - Admin: Full access
   * - Marketing: Draft applications only; once handed off to Admissions, RLS hides them!
   * - Admissions: Access to all admitted/handed off applications
   * - Counseling, Data & Apps, Operations: Department view
   * - Country Directors: Scoped strictly to assigned country
   * - Finance: View applications for fee verification
   */
  static filterApplications(
    applications: Application[],
    userDepartment: DepartmentType,
    isAdmin: boolean,
    assignedCountries: string[] = []
  ): RLSPermissionResult<Application> {
    if (isAdmin || userDepartment === 'admin') {
      return { allowed: true, data: applications };
    }

    if (userDepartment === 'marketing') {
      // RLS Rule: Form submissions handed off to Admissions are HIDDEN from Marketing!
      const visible = applications.filter(app => !app.handed_off_to_admissions && app.status === 'draft');
      return {
        allowed: true,
        data: visible
      };
    }

    if (userDepartment === 'country_directors') {
      // RLS Rule: Filter strictly by assigned countries
      const visible = applications.filter(app => assignedCountries.includes(app.target_country));
      return {
        allowed: true,
        data: visible
      };
    }

    // Default department access (Admissions, Counseling, Data & Apps, Operations, Finance)
    return { allowed: true, data: applications };
  }

  /**
   * Counseling Sessions RLS Enforcement:
   * - Counseling: Full access
   * - Admin: Access
   * - Finance: STRICT ACCESS DENIAL! RLS default denies Finance from reading counseling notes.
   */
  static filterCounselingSessions(
    sessions: CounselingSession[],
    userDepartment: DepartmentType,
    isAdmin: boolean
  ): RLSPermissionResult<CounselingSession> {
    if (isAdmin || userDepartment === 'admin') {
      return { allowed: true, data: sessions };
    }

    if (userDepartment === 'finance') {
      // STRICT DENIAL!
      return {
        allowed: false,
        data: null,
        denialReason: 'RLS SECURITY VIOLATION: Department "finance" is explicitly denied read access to table "counseling_sessions" containing confidential advising notes.'
      };
    }

    if (userDepartment === 'counseling') {
      return { allowed: true, data: sessions };
    }

    // Other departments do not have default access to internal counseling notes
    return {
      allowed: false,
      data: null,
      denialReason: `RLS SECURITY VIOLATION: Department "${userDepartment}" does not possess RLS policy authorization for table "counseling_sessions".`
    };
  }

  /**
   * Financial Records RLS Enforcement:
   * - Finance & Admin: Access allowed
   * - Marketing & Counseling: STRICT ACCESS DENIAL!
   */
  static filterFinancialRecords(
    records: FinancialRecord[],
    userDepartment: DepartmentType,
    isAdmin: boolean
  ): RLSPermissionResult<FinancialRecord> {
    if (isAdmin || userDepartment === 'admin' || userDepartment === 'finance') {
      return { allowed: true, data: records };
    }

    return {
      allowed: false,
      data: null,
      denialReason: `RLS SECURITY VIOLATION: Department "${userDepartment}" is denied read/write access to table "financial_records".`
    };
  }

  /**
   * Students RLS Enforcement:
   * - Country Directors: Scoped to assigned country of residence
   */
  static filterStudents(
    students: Student[],
    userDepartment: DepartmentType,
    isAdmin: boolean,
    assignedCountries: string[] = []
  ): RLSPermissionResult<Student> {
    if (isAdmin || userDepartment === 'admin') {
      return { allowed: true, data: students };
    }

    if (userDepartment === 'country_directors') {
      const visible = students.filter(std => assignedCountries.includes(std.country_of_residence));
      return { allowed: true, data: visible };
    }

    return { allowed: true, data: students };
  }
}
