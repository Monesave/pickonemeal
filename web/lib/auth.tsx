"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session: currentSession }
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);
      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      }
      setLoading(false);
    };

    const loadProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (data) {
        setProfile({
          id: data.id,
          display_name: data.display_name,
          avatar_url: data.avatar_url
        });
      } else {
        setProfile(null);
      }
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        void loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    void init();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      setLoading(false);
      if (error) throw error;
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      setLoading(false);
      if (error) throw error;
    },
    []
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  }, []);

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}


