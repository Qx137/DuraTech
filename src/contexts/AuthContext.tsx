
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: 'buyer' | 'seller' | 'driver';
  businessName?: string;
  description?: string;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (userData: any) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (session?.user) {
          // Use setTimeout to defer the async profile fetch to avoid blocking the auth state change
          setTimeout(async () => {
            // Fetch both profile and user role
            const [profileResult, rolesResult] = await Promise.all([
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .limit(1)
                .single()
            ]);

            if (profileResult.data && !profileResult.error) {
              // Determine user type from user_roles table (primary source)
              // Fall back to profile.user_type for backwards compatibility
              const userType = rolesResult.data?.role || profileResult.data.user_type;

              setUser({
                id: profileResult.data.id,
                name: profileResult.data.name,
                email: profileResult.data.email,
                phone: (profileResult.data as any).phone || undefined,
                userType: userType as 'buyer' | 'seller' | 'driver',
                businessName: profileResult.data.business_name || undefined,
                description: profileResult.data.description || undefined,
                kycStatus: (profileResult.data as any).kyc_status || 'none',
              });
            } else {
              console.error("Error fetching profile:", profileResult.error);
              // If no profile exists, create a basic user object from auth data
              setUser({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email || 'User',
                email: session.user.email || '',
                phone: session.user.phone || undefined,
                userType: 'buyer', // default type
                kycStatus: 'none',
              });
            }
          }, 0);
        } else {
          setUser(null);
        }

        // Always set loading to false after processing auth state
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // The auth state change listener will handle the session, just ensure loading is set to false if no session
      if (!session) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      console.error("Unexpected login error:", error);
      setLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const register = async (userData: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            user_type: userData.userType,
            business_name: userData.businessName,
            description: userData.description,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      console.error("Unexpected registration error:", error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    login,
    register,
    logout,
    isAuthenticated: !!session,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
