import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import AdminDashboard from './AdminDashboard';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading, isAuthenticated, error } = useAdminRole();
  
  // Track if we've already successfully authenticated and authorized
  // Use useState instead of useRef to trigger re-renders properly
  const [isAuthorized, setIsAuthorized] = useState(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Once authorized, stay authorized (prevent flicker on re-renders)
    if (!isLoading && isAuthenticated && isAdmin && !isAuthorized) {
      console.log('[AdminPage] User authorized, showing dashboard');
      setIsAuthorized(true);
    }
    
    // Only redirect if NOT loading, NOT authenticated, and haven't redirected yet
    if (!isLoading && !isAuthenticated && !hasRedirectedRef.current && !isAuthorized) {
      console.log('[AdminPage] User not authenticated, redirecting to auth');
      hasRedirectedRef.current = true;
      navigate('/auth');
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate, isAuthorized]);

  // If already authorized, always show dashboard (prevents flicker)
  if (isAuthorized) {
    return <AdminDashboard />;
  }

  // Show loading only on initial load, not during operations
  if (isLoading && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar o painel administrativo.
            Entre em contato com um administrador para solicitar acesso.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar ao Site
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
              Fazer Login com Outra Conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
};

export default AdminPage;
