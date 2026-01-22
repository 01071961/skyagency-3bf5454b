import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function GoogleDriveCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Conectando Google Drive...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Get return path from session storage
      const returnPath = sessionStorage.getItem('drive_oauth_return') || '/files';

      if (error) {
        setStatus('error');
        setMessage('Acesso negado pelo usuário');
        setTimeout(() => navigate(returnPath), 2000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Código de autorização não encontrado');
        setTimeout(() => navigate(returnPath), 2000);
        return;
      }

      let userId = user?.id;

      // Try to get user_id from state
      if (state) {
        try {
          const parsed = JSON.parse(decodeURIComponent(state));
          userId = parsed.user_id || userId;
        } catch (e) {
          console.error('Error parsing state:', e);
        }
      }

      if (!userId) {
        setStatus('error');
        setMessage('Usuário não identificado');
        setTimeout(() => navigate(returnPath), 2000);
        return;
      }

      try {
        const redirectUri = `${window.location.origin.replace(/\/+$/, '')}/drive-callback`;
        
        const { data, error: invokeError } = await supabase.functions.invoke('google-drive-manager', {
          body: {
            action: 'exchange-code',
            user_id: userId,
            code,
            redirect_uri: redirectUri,
          },
        });

        if (invokeError) throw invokeError;
        
        if (data?.success) {
          setStatus('success');
          setMessage('Google Drive conectado com sucesso!');
          
          // Clear session storage
          sessionStorage.removeItem('drive_oauth_return');
          
          // Redirect back to files page
          setTimeout(() => navigate(returnPath), 1500);
        } else {
          throw new Error(data?.error || 'Failed to exchange code');
        }
      } catch (err: any) {
        console.error('Error exchanging code:', err);
        setStatus('error');
        setMessage(err.message || 'Erro ao conectar Google Drive');
        setTimeout(() => navigate(returnPath), 3000);
      }
    };

    handleCallback();
  }, [searchParams, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg text-green-600">{message}</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecionando...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg text-destructive">{message}</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecionando...</p>
          </>
        )}
      </div>
    </div>
  );
}
