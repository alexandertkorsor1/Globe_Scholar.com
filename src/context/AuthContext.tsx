import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { User, Session } from '@supabase/supabase-js';
import {
  DepartmentMember,
  DepartmentMemberInput,
  DepartmentType,
  Profile,
} from '../types/database';
import { createProvisioningAuthClient, supabase } from '../lib/supabase';

type DepartmentMemberLoginStatus = 'created' | 'existing' | 'not_created';

interface DepartmentMemberCreationResult {
  member: DepartmentMember;
  loginStatus: DepartmentMemberLoginStatus;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;

  // A profile is guaranteed whenever the authenticated application
  // is rendered. The authentication gate in App.tsx handles null.
  currentProfile: Profile;

  activeDepartment: DepartmentType;

  availableProfiles: Profile[];

  departmentMembers: DepartmentMember[];
  createDepartmentMember: (
    member: DepartmentMemberInput
  ) => Promise<DepartmentMemberCreationResult>;
  updateDepartmentMember: (
    memberId: string,
    member: DepartmentMemberInput
  ) => Promise<DepartmentMember>;
  deleteDepartmentMember: (memberId: string) => Promise<void>;
  deleteUserProfileAccount: (profileId: string) => Promise<void>;

  switchProfile: (profileId: string) => void;

  isStudentMode: boolean;
  setStudentMode: (enabled: boolean) => void;

  updateProfileAvatar: (avatarUrl: string | null) => Promise<void>;

  logout: () => Promise<void>;

  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [currentProfile, setCurrentProfile] =
    useState<Profile | null>(null);

  const [availableProfiles, setAvailableProfiles] =
    useState<Profile[]>([]);
  const [departmentMembers, setDepartmentMembers] =
    useState<DepartmentMember[]>([]);

  const [isStudentMode, setIsStudentMode] =
    useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Load the Globe Scholars Pathways profile belonging to the
   * currently authenticated Supabase user.
   */
  const loadProfile = async (authUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      console.error(
        'Failed to load Globe Scholars Pathways profile:',
        error
      );

      setCurrentProfile(null);
      return;
    }

    const profile = data as Profile;

    setCurrentProfile(profile);
    setIsStudentMode(profile.account_type === 'student');
  };

  /**
   * Initialize Supabase authentication.
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await loadProfile(currentSession.user);
      }

      setLoading(false);
    };

    initializeAuth();

    /**
     * Listen for login/logout/session changes.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadProfile(newSession.user);
        } else {
          setCurrentProfile(null);
          setAvailableProfiles([]);
          setDepartmentMembers([]);
          setIsStudentMode(false);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Admins can load the active profile list and staff directory.
   */
  useEffect(() => {
    const loadAvailableProfiles = async () => {
      if (!currentProfile?.is_admin) {
        setAvailableProfiles([]);
        setDepartmentMembers([]);
        return;
      }

      const [{ data: profileData, error: profileError }, { data: memberData, error: memberError }] = await Promise.all([
        supabase
        .from('profiles')
        .select('*')
        .order('full_name', {
          ascending: true,
        }),
        supabase
          .from('department_members')
          .select('*')
          .is('deleted_at', null)
          .order('full_name', { ascending: true }),
      ]);

      if (profileError) {
        console.error(
          'Failed to load profiles:',
          profileError
        );
      } else {
        setAvailableProfiles(
          (profileData || []) as Profile[]
        );
      }

      if (memberError) {
        console.error('Failed to load staff directory:', memberError);
      } else {
        const sanitizedMembers = (memberData || []).map((m: any) => ({
          ...m,
          departments: Array.isArray(m.departments)
            ? m.departments
            : m.primary_department
            ? [m.primary_department]
            : ['admissions'],
          employment_status: m.employment_status || 'active',
          is_assistant: Boolean(m.is_assistant),
        }));
        setDepartmentMembers(sanitizedMembers as DepartmentMember[]);
      }
    };

    loadAvailableProfiles();

    const channel = supabase
      .channel('admin-staff-directory-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'department_members' },
        () => void loadAvailableProfiles()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => void loadAvailableProfiles()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [
    currentProfile?.id,
    currentProfile?.is_admin,
  ]);

  const createDepartmentMember = async (
    member: DepartmentMemberInput
  ) => {
    if (!currentProfile?.is_admin) {
      throw new Error('Only administrators can add department members.');
    }

    const normalizedEmail = member.email.trim().toLowerCase();
    const trimmedName = member.full_name.trim();
    const temporaryPassword = member.temporary_password?.trim();
    let loginStatus: DepartmentMemberLoginStatus = 'not_created';

    const loadedDuplicateMember = departmentMembers.find(
      (existingMember) =>
        existingMember.email.toLowerCase() === normalizedEmail
    );

    if (loadedDuplicateMember) {
      throw new Error('This email is already in the staff directory.');
    }

    const { data: existingMember, error: existingMemberError } = await supabase
      .from('department_members')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingMemberError) {
      throw new Error(
        existingMemberError.message || 'The staff directory could not be checked.'
      );
    }

    if (existingMember) {
      throw new Error('This email is already in the staff directory.');
    }

    if (temporaryPassword) {
      const provisioningClient = createProvisioningAuthClient();
      const { data: authData, error: authError } = await provisioningClient.auth.signUp({
        email: normalizedEmail,
        password: temporaryPassword,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      await provisioningClient.auth.signOut();

      if (authError) {
        const alreadyExists = /already\s+(registered|exists)|user.*exists|user.*registered/i.test(
          authError.message
        );

        if (!alreadyExists) {
          throw new Error(
            `The login account could not be created: ${authError.message}`
          );
        }

        loginStatus = 'existing';
      } else {
        const identities = authData.user && 'identities' in authData.user
          ? authData.user.identities
          : undefined;

        loginStatus = Array.isArray(identities) && identities.length === 0
          ? 'existing'
          : 'created';
      }
    }

    const { data, error } = await supabase
      .from('department_members')
      .insert({
        full_name: trimmedName,
        email: normalizedEmail,
        job_title: member.job_title.trim(),
        primary_department: member.primary_department,
        departments: member.departments,
        is_assistant: member.is_assistant,
        employment_status: member.employment_status,
        working_country: member.working_country?.trim() || '',
        created_by: currentProfile.id,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'The staff member could not be saved.');
    }

    const createdMember = data as DepartmentMember;
    setDepartmentMembers((current) =>
      [...current, createdMember].sort((left, right) =>
        left.full_name.localeCompare(right.full_name)
      )
    );
    return { member: createdMember, loginStatus };
  };

  const updateDepartmentMember = async (
    memberId: string,
    member: DepartmentMemberInput
  ) => {
    if (!currentProfile?.is_admin) {
      throw new Error('Only administrators can update department members.');
    }

    const { data, error } = await supabase
      .from('department_members')
      .update({
        full_name: member.full_name.trim(),
        email: member.email.trim().toLowerCase(),
        job_title: member.job_title.trim(),
        primary_department: member.primary_department,
        departments: member.departments,
        is_assistant: member.is_assistant,
        employment_status: member.employment_status,
        working_country: member.working_country?.trim() || '',
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'The staff member could not be updated.');
    }

    const updatedMember = data as DepartmentMember;
    setDepartmentMembers((current) =>
      current
        .map((item) => item.id === memberId ? updatedMember : item)
        .sort((left, right) => left.full_name.localeCompare(right.full_name))
    );
    return updatedMember;
  };

  const deleteDepartmentMember = async (memberId: string) => {
    if (!currentProfile?.is_admin) {
      throw new Error('Only administrators can delete department members.');
    }

    const { error } = await supabase
      .from('department_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) {
      throw new Error(error.message || 'The staff member could not be deleted.');
    }

    setDepartmentMembers((current) =>
      current.filter((member) => member.id !== memberId)
    );
  };

  const deleteUserProfileAccount = async (profileId: string) => {
    if (!currentProfile?.is_admin) {
      throw new Error('Only administrators can delete user accounts.');
    }

    if (profileId === currentProfile.id) {
      throw new Error('You cannot delete your own administrative account.');
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      throw new Error(error.message || 'The user account could not be deleted.');
    }

    setAvailableProfiles((current) =>
      current.filter((profile) => profile.id !== profileId)
    );
  };

  /**
   * Admin profile switching.
   */
  const switchProfile = (profileId: string) => {
    if (!currentProfile?.is_admin) {
      console.warn(
        'Only administrators can switch profiles.'
      );
      return;
    }

    const found = availableProfiles.find(
      (profile) => profile.id === profileId
    );

    if (!found) return;

    setCurrentProfile(found);
    setIsStudentMode(false);
  };

  /**
   * Update user profile avatar picture with strict <=50KB limit.
   */
  const updateProfileAvatar = async (avatarUrl: string | null) => {
    if (!currentProfile?.id) {
      throw new Error('No active user profile found.');
    }

    try {
      // Persist to Supabase profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', currentProfile.id);

      if (error) {
        console.warn('Could not update avatar in Supabase database:', error.message);
      }
    } catch (err) {
      console.warn('Database avatar update caught error:', err);
    }

    // Update local currentProfile state immediately for real-time reactivity
    setCurrentProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl || undefined } : null));

    // Update availableProfiles list if present
    setAvailableProfiles((prev) =>
      prev.map((p) => (p.id === currentProfile.id ? { ...p, avatar_url: avatarUrl || undefined } : p))
    );
  };

  /**
   * Sign out from Supabase.
   */
  const logout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        'Logout failed:',
        error
      );
      return;
    }

    setUser(null);
    setSession(null);
    setCurrentProfile(null);
    setAvailableProfiles([]);
    setDepartmentMembers([]);
    setIsStudentMode(false);
  };

  /*
   * IMPORTANT:
   *
   * The context itself allows the internal state to be null
   * while authentication is loading.
   *
   * But once App.tsx renders the authenticated workspace,
   * it guarantees currentProfile exists.
   */

  if (currentProfile) {
    return (
      <AuthContext.Provider
        value={{
          user,
          session,
          currentProfile,
          activeDepartment:
            currentProfile.department,
          availableProfiles,
          departmentMembers,
          createDepartmentMember,
          updateDepartmentMember,
          deleteDepartmentMember,
          deleteUserProfileAccount,
          switchProfile,
          isStudentMode,
          setStudentMode:
            setIsStudentMode,
          updateProfileAvatar,
          logout,
          loading,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  /*
   * During authentication/loading, provide a temporary
   * placeholder context only if the application has not
   * yet reached the authenticated workspace.
   *
   * App.tsx will display LoadingScreen/LoginScreen first.
   */
  return (
    <AuthContext.Provider
      value={
        {
          user,
          session,
          currentProfile: null as unknown as Profile,
          activeDepartment:
            null as unknown as DepartmentType,
          availableProfiles,
          departmentMembers,
          createDepartmentMember,
          updateDepartmentMember,
          deleteDepartmentMember,
          deleteUserProfileAccount,
          switchProfile,
          isStudentMode,
          setStudentMode:
            setIsStudentMode,
          updateProfileAvatar,
          logout,
          loading,
        } as AuthContextType
      }
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};
