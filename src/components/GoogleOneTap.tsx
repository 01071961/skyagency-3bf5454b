import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface GoogleOneTapProps {
  onSuccess?: () => void;
  className?: string;
}

/**
 * Google One Tap component for automatic inline login prompt
 * Shows Google's native One Tap popup when user is not authenticated
 */
const GoogleOneTap = ({ onSuccess, className }: GoogleOneTapProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't show if already authenticated or still loading
    if (isAuthenticated || isLoading || isInitialized) return;

    const initGoogleOneTap = async () => {
      try {
        // Check if Google Identity Services script is loaded
        if (typeof window.google === 'undefined') {
          // Load Google Identity Services script
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => initializeOneTap();
          script.onerror = () => {
            console.warn('[GoogleOneTap] Failed to load Google Identity Services');
            setError('Failed to load Google services');
          };
          document.head.appendChild(script);
        } else {
          initializeOneTap();
        }
      } catch (err) {
        console.error('[GoogleOneTap] Error:', err);
        setError('Error initializing Google One Tap');
      }
    };

    const initializeOneTap = () => {
      if (!window.google?.accounts?.id) {
        console.warn('[GoogleOneTap] Google Identity Services not available');
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleCredentialResponse,
          auto_select: true,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true,
        });

        // Display the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('[GoogleOneTap] Prompt not displayed:', notification.getNotDisplayedReason());
          } else if (notification.isSkippedMoment()) {
            console.log('[GoogleOneTap] Prompt skipped:', notification.getSkippedReason());
          } else if (notification.isDismissedMoment()) {
            console.log('[GoogleOneTap] Prompt dismissed:', notification.getDismissedReason());
          }
        });

        setIsInitialized(true);
      } catch (err) {
        console.error('[GoogleOneTap] Initialization error:', err);
        setError('Failed to initialize One Tap');
      }
    };

    const handleCredentialResponse = async (response: any) => {
      if (!response.credential) {
        console.error('[GoogleOneTap] No credential received');
        return;
      }

      try {
        console.log('[GoogleOneTap] Credential received, signing in with Supabase...');
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error('[GoogleOneTap] Supabase auth error:', error);
          setError(error.message);
          return;
        }

        console.log('[GoogleOneTap] Successfully signed in:', data.user?.email);
        onSuccess?.();
      } catch (err) {
        console.error('[GoogleOneTap] Error during sign in:', err);
        setError('Failed to sign in with Google');
      }
    };

    initGoogleOneTap();

    // Cleanup
    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [isAuthenticated, isLoading, isInitialized, onSuccess]);

  // Don't render anything visible - One Tap shows as a popup
  if (error) {
    console.warn('[GoogleOneTap]', error);
  }

  return <div className={className} id="google-one-tap-container" />;
};

// Add type declaration for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export default GoogleOneTap;
