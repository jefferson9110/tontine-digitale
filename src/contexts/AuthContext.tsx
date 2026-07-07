import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  session:     Session | null;
  supaUser:    SupabaseUser | null;
  profile:     User | null;
  loading:     boolean;
  signIn:      (email: string, password: string) => Promise<void>;
  signUp:      (email: string, password: string, meta: Partial<User>) => Promise<void>;
  signOut:     () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session,   setSession]   = useState<Session | null>(null);
  const [supaUser,  setSupaUser]  = useState<SupabaseUser | null>(null);
  const [profile,   setProfile]   = useState<User | null>(null);
  const [loading,   setLoading]   = useState(true);

  // Charger le profil depuis la table `profiles`
  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) setProfile(data as User);
  }

  async function refreshProfile() {
    if (supaUser) await loadProfile(supaUser.id);
  }

  useEffect(() => {
    // Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupaUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    // Écoute les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setSupaUser(session?.user ?? null);
        if (session?.user) await loadProfile(session.user.id);
        else setProfile(null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, meta: Partial<User>) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{
      session, supaUser, profile, loading,
      signIn, signUp, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
