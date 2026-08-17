import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { User, Session } from '@supabase/supabase-js';
import { Profile, DepartmentType } from '../types/database';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;

  // A profile is guaranteed whenever the authenticated application
  // is rendered. The authentication gate in App.tsx handles null.
  currentProfile: Profile;

  activeDepartment: DepartmentType;

  availableProfiles: Profile[];

  switchProfile: (profileId: string) => void;

  isStudentMode: boolean;
  setStudentMode: (enabled: boolean) => void;

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

  const [isStudentMode, setIsStudentMode] =
    useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Load the Report.com profile belonging to the
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
        'Failed to load Report.com profile:',
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
   * Admins can load all Report.com profiles.
   */
  useEffect(() => {
    const loadAvailableProfiles = async () => {
      if (!currentProfile?.is_admin) {
        setAvailableProfiles([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', {
          ascending: true,
        });

      if (error) {
        console.error(
          'Failed to load profiles:',
          error
        );
        return;
      }

      setAvailableProfiles(
        (data || []) as Profile[]
      );
    };

    loadAvailableProfiles();
  }, [
    currentProfile?.id,
    currentProfile?.is_admin,
  ]);

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
          switchProfile,
          isStudentMode,
          setStudentMode:
            setIsStudentMode,
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
          switchProfile,
          isStudentMode,
          setStudentMode:
            setIsStudentMode,
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
