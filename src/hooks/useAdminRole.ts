import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT_MS = 5000;
const CACHE_DURATION_MS = 300000; // Cache role for 5 minutes (increased from 1 minute)

// Global cache to persist role state across hook instances and re-renders
const roleCache = new Map<string, { isAdmin: boolean; timestamp: number }>();

// Track if we've ever done a successful check (prevents re-checking on every render)
let globalHasChecked = false;
let globalUserId: string | null = null;

export const useAdminRole = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const hasCheckedRef = useRef(false);

  // Check cache first
  const getCachedRole = useCallback((userId: string): boolean | null => {
    const cached = roleCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.isAdmin;
    }
    return null;
  }, []);

  // Set cache
  const setCachedRole = useCallback((userId: string, isAdminValue: boolean) => {
    roleCache.set(userId, { isAdmin: isAdminValue, timestamp: Date.now() });
    globalHasChecked = true;
    globalUserId = userId;
  }, []);

  useEffect(() => {
    // If user is the same as global and we've already checked globally, use cached value immediately
    if (globalHasChecked && globalUserId === user?.id && user?.id) {
      const cachedValue = getCachedRole(user.id);
      if (cachedValue !== null) {
        console.log('[useAdminRole] Using global cached role immediately');
        setIsAdmin(cachedValue);
        setIsCheckingRole(false);
        hasCheckedRef.current = true;
        return;
      }
    }

    // If user changed, reset the check flag
    if (hasCheckedRef.current && globalUserId !== user?.id) {
      hasCheckedRef.current = false;
      globalHasChecked = false;
    }

    // Cleanup previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const checkAdminRole = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setIsCheckingRole(false);
        setError(null);
        hasCheckedRef.current = true;
        return;
      }

      // Check cache first - if cached, use it immediately without async check
      const cachedValue = getCachedRole(user.id);
      if (cachedValue !== null) {
        console.log('[useAdminRole] Using cached role for user:', user.id.substring(0, 8), '-> isAdmin:', cachedValue);
        setIsAdmin(cachedValue);
        setIsCheckingRole(false);
        setError(null);
        hasCheckedRef.current = true;
        return;
      }

      // Create abort controller for timeout
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, TIMEOUT_MS);

      try {
        console.log('[useAdminRole] Checking role for user:', user.id.substring(0, 8));
        
        const { data, error: queryError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'owner', 'editor'])
          .maybeSingle();

        clearTimeout(timeoutId);

        if (queryError) {
          // Handle auth-related errors gracefully
          if (queryError.message?.includes('JWT') || 
              queryError.code === 'PGRST301' ||
              queryError.message?.includes('infinite recursion')) {
            console.warn('[useAdminRole] Auth/RLS error, defaulting to non-admin:', queryError.message);
            setIsAdmin(false);
            setError('session_error');
            hasCheckedRef.current = true;
          } else if (retryCountRef.current < MAX_RETRIES) {
            // Retry with exponential backoff
            retryCountRef.current++;
            console.log(`[useAdminRole] Retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCountRef.current));
            checkAdminRole();
            return;
          } else {
            console.error('[useAdminRole] Max retries reached:', queryError);
            setIsAdmin(false);
            setError(queryError.message);
            hasCheckedRef.current = true;
          }
        } else {
          const hasAdminRole = !!data && ['admin', 'owner', 'editor'].includes(data.role);
          console.log('[useAdminRole] Role check result:', hasAdminRole ? data.role : 'none');
          setIsAdmin(hasAdminRole);
          setCachedRole(user.id, hasAdminRole);
          setError(null);
          retryCountRef.current = 0;
          hasCheckedRef.current = true;
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        
        if (err.name === 'AbortError') {
          console.warn('[useAdminRole] Request timed out after', TIMEOUT_MS, 'ms');
          setError('timeout');
        } else {
          console.error('[useAdminRole] Unexpected error:', err);
          setError(err.message);
        }
        setIsAdmin(false);
        hasCheckedRef.current = true;
      } finally {
        setIsCheckingRole(false);
      }
    };

    if (!authLoading) {
      // If we already have valid cached data, skip async check
      if (user?.id) {
        const cachedValue = getCachedRole(user.id);
        if (cachedValue !== null) {
          setIsAdmin(cachedValue);
          setIsCheckingRole(false);
          hasCheckedRef.current = true;
          return;
        }
      }
      
      // Only set isCheckingRole to true if we haven't checked yet
      if (!hasCheckedRef.current) {
        setIsCheckingRole(true);
        retryCountRef.current = 0;
        checkAdminRole();
      } else {
        setIsCheckingRole(false);
      }
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user?.id, authLoading, getCachedRole, setCachedRole]);

  // Never return isLoading true if we have a cached value
  const effectiveIsLoading = user?.id && getCachedRole(user.id) !== null 
    ? false 
    : authLoading || (isCheckingRole && !hasCheckedRef.current);

  return {
    isAdmin: user?.id ? (getCachedRole(user.id) ?? isAdmin) : isAdmin,
    isLoading: effectiveIsLoading,
    isAuthenticated,
    user,
    error,
  };
};
