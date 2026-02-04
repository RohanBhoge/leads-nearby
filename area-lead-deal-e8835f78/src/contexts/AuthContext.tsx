import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Define explicit type for service_type from Database definition or fallback to string
type ServiceType = Database['public']['Enums']['service_type'] | string;

interface Profile {
  id: string;
  user_name: string;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: string;
  location_lat: number | null;
  location_long: number | null;
  service_radius_km: number;
  service_type: ServiceType | null;
  is_subscribed: boolean;
  subscription_expires_at: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  role: 'admin' | 'user' | 'provider';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone?: string, category_id?: string | null, sub_category_id?: string | null, role?: 'user' | 'provider') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as unknown as Profile;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Delay to ensure trigger has run if it's a new signup
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 1000);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then((profileData) => {
          setProfile(profileData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, phone?: string, category_id?: string | null, sub_category_id?: string | null, role: 'user' | 'provider' = 'user') => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('auth-handler', {
        body: {
          action: 'register',
          email,
          password,
          name,
          phone,
          category_id,
          sub_category_id,
          role
        }
      });

      if (fnError) {
        console.error('Edge Function Error Object:', fnError);
        throw fnError;
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      return { error: null };

    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.message && err.message.includes('User already registered')) {
        return { error: new Error('This email is already registered. Please login.') };
      }
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      console.error('Signin error', error);
    }
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      await refreshProfile();
    } else {
      console.error('Profile update error:', error);
    }

    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
