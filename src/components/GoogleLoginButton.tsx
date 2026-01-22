import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleLoginButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  redirectTo?: string;
}

/**
 * Google Login Button component
 * Initiates OAuth flow with Google through Supabase
 */
const GoogleLoginButton = ({
  className = '',
  variant = 'outline',
  size = 'default',
  redirectTo,
}: GoogleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      // Use current page as redirect, or specified redirectTo
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = redirectTo || `${window.location.origin}${currentPath}`;
      
      console.log('[GoogleLogin] Starting OAuth flow, redirect to:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[GoogleLogin] OAuth error:', error);
        toast({
          title: 'Erro ao conectar com Google',
          description: error.message === 'Provider not enabled' 
            ? 'Login com Google não está configurado. Entre em contato com o administrador.'
            : error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      console.log('[GoogleLogin] OAuth initiated:', data);
      // User will be redirected to Google
    } catch (err) {
      console.error('[GoogleLogin] Error:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar login com Google.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-3 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      {isLoading ? 'Conectando...' : 'Continuar com Google'}
    </Button>
  );
};

export default GoogleLoginButton;
