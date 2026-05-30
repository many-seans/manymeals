import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User, AuthChangeEvent, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthErrorType = {
  message: string;
  type: 'login' | 'signup' | 'general';
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initializing: boolean;
  error: AuthErrorType | null;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthErrorType | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileError && data) {
      setProfile(data);
    } else if (profileError) {
      console.error('Error loading profile:', profileError.message);
    }
  }, []);

  const ensureProfile = useCallback(async (u: User) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', u.id)
      .maybeSingle();

    if (!existing) {
      const metadata = u.user_metadata ?? {};
      const { error: insertError } = await supabase.from('profiles').insert({
        id: u.id,
        full_name: metadata.full_name ?? metadata.name ?? '',
        avatar_url: metadata.avatar_url ?? metadata.picture ?? '',
      });
      if (insertError) {
        console.error('Error creating profile:', insertError.message);
      }
    }

    await loadProfile(u.id);
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError.message);
          if (mounted) setInitializing(false);
          return;
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            await ensureProfile(initialSession.user);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setInitializing(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!mounted) return;

        // Update session state
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Handle specific auth events
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newSession?.user) {
          setLoading(true);
          try {
            await ensureProfile(newSession.user);
          } finally {
            if (mounted) setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          // Session refreshed, state already updated
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const getErrorMessage = (err: AuthError): string => {
    const message = err.message?.toLowerCase() || '';
    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return 'Invalid email or password. Please try again.';
    }
    if (message.includes('user not found') || message.includes('no user found')) {
      return 'No account found with this email. Please sign up first.';
    }
    if (message.includes('email not confirmed')) {
      return 'Please check your email to confirm your account.';
    }
    if (message.includes('already registered') || message.includes('already exists')) {
      return 'An account with this email already exists. Please login instead.';
    }
    if (message.includes('password') && message.includes('weak')) {
      return 'Password is too weak. Please use at least 6 characters.';
    }
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    return err.message || 'An unexpected error occurred. Please try again.';
  };

  async function signInWithEmail(email: string, password: string) {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        const message = getErrorMessage(authError);
        setError({ message, type: 'login' });
        return { success: false, error: message };
      }

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        await ensureProfile(data.user);
        return { success: true };
      }

      return { success: false, error: 'Login failed. Please try again.' };
    } catch (err) {
      const message = 'An unexpected error occurred during login.';
      setError({ message, type: 'login' });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithEmail(email: string, password: string, fullName?: string) {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (authError) {
        const message = getErrorMessage(authError);
        setError({ message, type: 'signup' });
        return { success: false, error: message };
      }

      // Check if user needs email confirmation
      if (data.user && !data.session) {
        return {
          success: true,
          error: 'Account created! Please check your email to confirm your account.',
        };
      }

      // Auto-confirmed (when email confirmation is disabled)
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        await ensureProfile(data.user);
        return { success: true };
      }

      return { success: true };
    } catch (err) {
      const message = 'An unexpected error occurred during signup.';
      setError({ message, type: 'signup' });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError) {
        const message = getErrorMessage(authError);
        setError({ message, type: 'general' });
        setLoading(false);
        return { success: false, error: message };
      }

      // User will be redirected to Google, loading stays true
      return { success: true };
    } catch (err) {
      const message = 'Google login not available. Please use email login.';
      setError({ message, type: 'general' });
      setLoading(false);
      return { success: false, error: message };
    }
  }

  async function signOut() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading: initializing || loading,
        initializing,
        error,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
