
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  userType: 'buyer' | 'seller';
  businessName?: string;
  description?: string;
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
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          console.log('User authenticated, fetching profile...');
          // Use setTimeout to defer the async profile fetch to avoid blocking the auth state change
          setTimeout(async () => {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profile && !error) {
              console.log('Profile loaded:', profile);
              setUser({
                id: profile.id,
                name: profile.name,
                email: profile.email,
                userType: profile.user_type as 'buyer' | 'seller',
                businessName: profile.business_name || undefined,
                description: profile.description || undefined,
              });
            } else {
              console.error("Error fetching profile:", error);
              // If no profile exists, create a basic user object from auth data
              setUser({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email || 'User',
                email: session.user.email || '',
                userType: 'buyer', // default type
              });
            }
          }, 0);
        } else {
          console.log('No session, clearing user');
          setUser(null);
        }
        
        // Always set loading to false after processing auth state
        setLoading(false);
      }
    );

    // Check for existing session
    console.log('Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session:', session?.user?.id);
      // The auth state change listener will handle the session, just ensure loading is set to false if no session
      if (!session) {
        setLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error.message);
        setLoading(false);
        return { error: error.message };
      }
      
      console.log("Login successful:", data?.user?.id);
      // Don't set loading to false here, let the auth state change handle it
      return {};
    } catch (error: any) {
      console.error("Unexpected login error:", error);
      setLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const register = async (userData: any) => {
    try {
      console.log('Attempting registration for:', userData.email);
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
        console.error("Registration error:", error.message);
        return { error: error.message };
      }
      
      console.log("Registration successful");
      return {};
    } catch (error: any) {
      console.error("Unexpected registration error:", error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    console.log('Logging out...');
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
