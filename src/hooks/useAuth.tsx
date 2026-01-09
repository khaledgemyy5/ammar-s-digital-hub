import * as React from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const checkAdminStatus = React.useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      const adminStatus = data === true;
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch {
      return false;
    }
  }, []);

  React.useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential Supabase deadlock
          setTimeout(() => {
            checkAdminStatus();
          }, 0);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  const signIn = React.useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Unknown error') };
    }
  }, []);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  }, []);

  const value = React.useMemo(() => ({
    user,
    session,
    isAdmin,
    loading,
    signIn,
    signOut,
    checkAdminStatus,
  }), [user, session, isAdmin, loading, signIn, signOut, checkAdminStatus]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
