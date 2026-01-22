import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface UseAnonymousAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  ensureAuthenticated: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

/**
 * Hook to manage anonymous authentication for chat visitors.
 * Automatically signs in users anonymously if not already authenticated.
 */
export const useAnonymousAuth = (): UseAnonymousAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AnonymousAuth] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Ensures the user is authenticated (anonymously if needed).
   * Returns the user if authenticated, null otherwise.
   */
  const ensureAuthenticated = useCallback(async (): Promise<User | null> => {
    // Check current session first
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession?.user) {
      console.log('[AnonymousAuth] Already authenticated:', currentSession.user.id);
      return currentSession.user;
    }

    // Sign in anonymously
    console.log('[AnonymousAuth] Signing in anonymously...');
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('[AnonymousAuth] Anonymous sign-in failed:', error);
      return null;
    }

    console.log('[AnonymousAuth] Anonymous sign-in successful:', data.user?.id);
    return data.user;
  }, []);

  /**
   * Signs out the current user (both anonymous and regular users).
   */
  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    ensureAuthenticated,
    signOut,
  };
};
