import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  display_name: string | null;
  preferred_language: string | null;
  age_group: string | null;
  gender: string | null;
  context_info: string | null;
  onboarding_complete: boolean | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setState((s) => ({ ...s, user, loading: false }));
      if (user) {
        // Fetch or create profile
        fetchProfile(user.id);
      } else {
        setState((s) => ({ ...s, profile: null }));
      }
    });

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setState({ user, profile: null, loading: false });
      if (user) {
        fetchProfile(user.id);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(userId: string) {
    // Try to fetch existing profile
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error?.code === "PGRST116") {
      // No profile yet — create one
      const displayName =
        userId.slice(0, 8) ||
        "User";
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId, display_name: displayName })
        .select()
        .single();

      if (!insertError && newProfile) {
        setState((s) => ({
          ...s,
          profile: newProfile as Profile,
        }));
      }
    } else if (!error && data) {
      setState((s) => ({
        ...s,
        profile: data as Profile,
      }));
    }
  }

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return error?.message ?? null;
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      return error?.message ?? null;
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
  };
}