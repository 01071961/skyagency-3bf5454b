import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AuthContextType } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_CACHE_KEY = 'auth_session_cache';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Retry helper with exponential backoff
  const withRetry = useCallback(async <T,>(
    fn: () => Promise<T>,
    maxAttempts = MAX_RETRY_ATTEMPTS
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        console.warn(`[Auth] Attempt ${attempt}/${maxAttempts} failed:`, err.message);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1))
          );
        }
      }
    }
    
    throw lastError;
  }, []);

  // Clear invalid session
  const clearSession = useCallback(() => {
    console.log('[Auth] Clearing session');
    setSession(null);
    setUser(null);
    try {
      localStorage.removeItem(SESSION_CACHE_KEY);
    } catch (e) {
      // localStorage might not be available
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        
        console.log('[Auth] State change:', event);
        
        switch (event) {
          case 'SIGNED_OUT':
            clearSession();
            break;
          case 'TOKEN_REFRESHED':
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
          case 'USER_UPDATED':
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setRetryCount(0);
            break;
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session with error handling and retry
    const initSession = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.warn('[Auth] Session error:', error.message);
          
          // Handle specific error types
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('refresh_token_not_found') ||
              error.message.includes('invalid_grant')) {
            await supabase.auth.signOut();
            clearSession();
          } else if (retryCount < MAX_RETRY_ATTEMPTS) {
            setRetryCount(prev => prev + 1);
            setTimeout(initSession, RETRY_DELAY_MS * Math.pow(2, retryCount));
            return;
          }
        } else {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
        }
      } catch (err: any) {
        console.error('[Auth] Init error:', err);
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          setRetryCount(prev => prev + 1);
          setTimeout(initSession, RETRY_DELAY_MS * Math.pow(2, retryCount));
          return;
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearSession, retryCount]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await withRetry(() => 
        supabase.auth.signInWithPassword({ email, password })
      );
      return { error: error?.message };
    } catch (err: any) {
      console.error('[Auth] Sign in error:', err);
      return { error: err.message || 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    try {
      const { error } = await withRetry(() =>
        supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        })
      );
      return { error: error?.message };
    } catch (err: any) {
      console.error('[Auth] Sign up error:', err);
      return { error: err.message || 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const signOut = async () => {
    // Clear state immediately for responsive UI
    clearSession();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error: supabaseError } = await withRetry(() =>
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        })
      );

      if (supabaseError) {
        return { error: supabaseError.message };
      }

      // Also send custom styled email via edge function
      try {
        await supabase.functions.invoke('send-password-reset', {
          body: {
            email,
            resetLink: redirectUrl,
            userName: email.split('@')[0],
          },
        });
      } catch (edgeFnError) {
        // If edge function fails, that's okay - Supabase already sent the email
        console.warn('[Auth] Custom email failed, but Supabase email was sent:', edgeFnError);
      }

      return { error: undefined };
    } catch (err: any) {
      console.error('[Auth] Reset password error:', err);
      return { error: 'Erro ao enviar email de recuperação. Tente novamente.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
