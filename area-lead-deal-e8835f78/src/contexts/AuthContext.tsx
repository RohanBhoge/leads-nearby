import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface Profile {
  id: string;
  user_name: string;
  name?: string; // Alias for user_name for easier access
  phone: string | null;
  avatar_url: string | null;
  preferred_language: string;
  location_lat: number | null;
  location_long: number | null;
  service_radius_km: number;
  is_subscribed: boolean;
  subscription_expires_at: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  credit_balance: number;
  referral_code: string | null;
  role: 'admin' | 'user' | 'provider';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
    phone?: string,
    category_id?: string | null,
    sub_category_id?: string | null,
    role?: 'user' | 'provider',
    location_lat?: number | null,
    location_long?: number | null,
    service_radius_km?: number
  ) => Promise<{ error: Error | null }>;
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

    // Map user_name to name for easier access in components
    if (data) {
      return {
        ...(data as any),
        name: (data as any).user_name
      } as Profile;
    }

    return null;
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

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    category_id?: string | null,
    sub_category_id?: string | null,
    role: 'user' | 'provider' = 'user',
    location_lat?: number | null,
    location_long?: number | null,
    service_radius_km: number = 10,
    referral_code?: string
  ) => {
    try {
      // Use standard signUp instead of Edge Function for reliability
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            category_id,
            sub_category_id,
            role,
            location_lat,
            location_long,
            service_radius_km,
            referral_code: referral_code || null // Pass to metadata
          }
        }
      });

      if (signUpError) throw signUpError;

      // Auto sign-in is handled by signUp if email confirmation is disabled or unnecessary
      // But if we need to sign in explicitly (e.g. if signUp returned a session):
      if (data.session) {
        // Session exists, we are logged in
      } else if (data.user && !data.session) {
        // User created but validation required
        // We can't auto-login.
        // But the UI handles this by showing "check email" usually?
        // Our Auth.tsx handles "Account created successfully" then navigates.
        // If email confirmation is required, the user won't be able to login immediately.
      }

      // If signUp successful, we might need to handle profile update explicitly if trigger failed? 
      // No, trigger should handle it. 
      // If session is missing (email confirm needed), we can't update profile via RLS anyway.

      // If we have a session, we are good.
      if (data.session) {
        // Logged in
      }

      // If location was provided, update profile immediately after signup
      if (location_lat !== null && location_lat !== undefined && location_long !== null && location_long !== undefined) {
        await updateProfile({
          location_lat,
          location_long,
          service_radius_km
        });
      }

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

  const updateProfile = async (updates: {
    name?: string;
    phone?: string;
    location_lat?: number | null;
    location_long?: number | null;
    service_radius_km?: number;
    category_id?: string | null;
    sub_category_id?: string | null;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update({
        user_name: updates.name,
        ...updates,
      })
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
