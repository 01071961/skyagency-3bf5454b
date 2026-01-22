import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, ArrowLeft, Users, Crown, Gift, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth';
import { supabase } from '@/integrations/supabase/client';
import GoogleLoginButton from '@/components/GoogleLoginButton';

type AuthView = 'portal-select' | 'login' | 'signup' | 'forgot-password';
type PortalType = 'affiliate' | 'admin' | null;

const WELCOME_BONUS = 5;

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, isAuthenticated, isLoading, user } = useAuth();
  
  const [view, setView] = useState<AuthView>('portal-select');
  const [portalType, setPortalType] = useState<PortalType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteProcessing, setInviteProcessing] = useState(false);
  const [inviteProcessed, setInviteProcessed] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Check for invite token in URL - CRITICAL FIX
  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) {
      console.log('[Auth] Invite token detected:', invite.substring(0, 8) + '...');
      setInviteToken(invite);
      setView('signup'); // Default to signup for invites
      setPortalType('admin'); // Invites are usually for admin roles
    }
  }, [searchParams]);

  // Check for referral code
  useEffect(() => {
    const storedRefCode = localStorage.getItem('affiliate_ref_code');
    if (storedRefCode && !inviteToken) {
      setReferralCode(storedRefCode);
      setPortalType('affiliate');
      setView('signup');
    }
  }, [inviteToken]);

  // Check URL param for portal type
  useEffect(() => {
    const portal = searchParams.get('portal');
    if (portal === 'affiliate' || portal === 'admin') {
      setPortalType(portal);
      setView('login');
    }
  }, [searchParams]);

  // Process invite after authentication - CRITICAL FIX
  const processInvite = useCallback(async (userId: string, token: string) => {
    if (inviteProcessed) return;
    
    setInviteProcessing(true);
    console.log('[Auth] Processing invite for user:', userId);
    
    try {
      const { data, error } = await supabase.functions.invoke('accept-invite', {
        body: { token, userId }
      });
      
      if (error) {
        console.error('[Auth] Invite processing error:', error);
        toast({
          title: 'Erro ao processar convite',
          description: error.message || 'Tente fazer login novamente.',
          variant: 'destructive',
        });
        return null;
      }
      
      console.log('[Auth] Invite accepted:', data);
      setInviteProcessed(true);
      
      toast({
        title: 'Convite aceito!',
        description: data.message || `Você agora é ${data.role}!`,
      });
      
      return data.role;
    } catch (err) {
      console.error('[Auth] Invite error:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o convite.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setInviteProcessing(false);
    }
  }, [toast, inviteProcessed]);

  // Handle redirect after authentication
  useEffect(() => {
    const handleAuthenticatedRedirect = async () => {
      if (!isAuthenticated || !user || isLoading) return;
      
      // If there's an invite token, process it first
      if (inviteToken && !inviteProcessed && !inviteProcessing) {
        const role = await processInvite(user.id, inviteToken);
        if (role === 'admin' || role === 'owner' || role === 'editor') {
          navigate('/admin');
          return;
        }
      }
      
      // Normal redirect based on portal type
      if (!inviteToken) {
        if (portalType === 'affiliate') {
          navigate('/vip/dashboard');
        } else if (portalType === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    };
    
    handleAuthenticatedRedirect();
  }, [isAuthenticated, isLoading, user, navigate, portalType, inviteToken, inviteProcessed, inviteProcessing, processInvite]);

  const handlePortalSelect = (type: PortalType) => {
    setPortalType(type);
    setView('login');
  };

  const handleBackToPortals = () => {
    setView('portal-select');
    setPortalType(null);
    setFormData({ email: '', password: '', confirmPassword: '' });
  };

  const processReferralBonus = async (email: string) => {
    if (!referralCode) return;
    
    try {
      const { data: affiliate } = await supabase
        .from('vip_affiliates')
        .select('id, user_id')
        .eq('referral_code', referralCode)
        .eq('status', 'approved')
        .single();

      if (!affiliate) return;

      await supabase
        .from('affiliate_referrals')
        .insert({
          referrer_id: affiliate.id,
          referred_email: email,
          status: 'pending',
        });

      await supabase.functions.invoke('referral-notifications', {
        body: {
          type: 'referral_signup',
          referrer_id: affiliate.id,
          referred_email: email,
          referred_name: email.split('@')[0],
        },
      });

      localStorage.setItem('pending_referral_bonus', JSON.stringify({
        referrer_id: affiliate.id,
        points: WELCOME_BONUS,
      }));
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe seu email.',
        variant: 'destructive',
      });
      return;
    }

    // Forgot password flow
    if (view === 'forgot-password') {
      setIsSubmitting(true);
      try {
        const { error } = await resetPassword(formData.email);
        if (error) {
          toast({
            title: 'Erro',
            description: error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Email enviado!',
            description: 'Verifique sua caixa de entrada para redefinir sua senha.',
          });
          setView('login');
        }
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Ocorreu um erro inesperado. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Login/Signup validation
    if (!formData.password) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (view === 'signup' && formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (view === 'login') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: 'Erro ao entrar',
            description: error === 'Invalid login credentials' 
              ? 'Email ou senha incorretos.' 
              : error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Bem-vindo!',
            description: inviteToken ? 'Processando convite...' : 'Login realizado com sucesso.',
          });
          // Redirect will be handled by useEffect
        }
      } else {
        const { error } = await signUp(formData.email, formData.password);
        if (error) {
          toast({
            title: 'Erro ao cadastrar',
            description: error.includes('already registered') 
              ? 'Este email já está cadastrado. Tente fazer login.' 
              : error,
            variant: 'destructive',
          });
          
          // If user already exists and has invite, switch to login
          if (error.includes('already registered') && inviteToken) {
            setView('login');
          }
        } else {
          if (referralCode) {
            await processReferralBonus(formData.email);
          }
          
          toast({
            title: 'Conta criada!',
            description: inviteToken 
              ? 'Processando convite...'
              : referralCode 
                ? `Você ganhou ${WELCOME_BONUS} pontos de boas-vindas!`
                : 'Você pode fazer login agora.',
          });
          
          // If no invite, switch to login
          if (!inviteToken) {
            setView('login');
          }
        }
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (inviteToken) return 'Aceitar Convite';
    if (view === 'portal-select') return 'Escolha seu portal';
    const portalLabel = portalType === 'affiliate' ? 'Afiliados' : 'Administrador';
    switch (view) {
      case 'login': return `Login - ${portalLabel}`;
      case 'signup': return `Cadastro - ${portalLabel}`;
      case 'forgot-password': return 'Recuperar senha';
    }
  };

  const getButtonText = () => {
    if (inviteProcessing) return 'Processando convite...';
    if (inviteToken && view === 'signup') return 'Criar Conta e Aceitar Convite';
    if (inviteToken && view === 'login') return 'Entrar e Aceitar Convite';
    switch (view) {
      case 'login': return 'Entrar';
      case 'signup': return 'Criar Conta';
      case 'forgot-password': return 'Enviar Link';
      default: return '';
    }
  };

  if (isLoading || inviteProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {inviteProcessing ? 'Processando convite...' : 'Verificando sessão...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card border border-border rounded-2xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              {inviteToken ? (
                <Gift className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Shield className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">SKY BRASIL</h1>
            <p className="text-muted-foreground mt-2">{getTitle()}</p>
            {inviteToken && (
              <p className="text-sm text-primary mt-2">
                Você foi convidado! Crie sua conta ou faça login para aceitar.
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {view === 'portal-select' && !inviteToken ? (
              <motion.div
                key="portal-select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => handlePortalSelect('affiliate')}
                  className="w-full p-6 rounded-xl border-2 border-border bg-muted/30 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        Portal Afiliados
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Acesse seu dashboard, comissões e indicações
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>

                <button
                  onClick={() => handlePortalSelect('admin')}
                  className="w-full p-6 rounded-xl border-2 border-border bg-muted/30 hover:border-secondary hover:bg-secondary/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Crown className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-secondary transition-colors">
                        Portal Administrador
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Gerencie produtos, comissões e afiliados
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                  </div>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 bg-muted/50 border-border focus:border-primary"
                      />
                    </div>
                  </div>

                  {view !== 'forgot-password' && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="pl-10 pr-10 bg-muted/50 border-border focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {view === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="pl-10 bg-muted/50 border-border focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {view === 'login' && !inviteToken && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setView('forgot-password')}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  )}

                  {view === 'forgot-password' && (
                    <p className="text-sm text-muted-foreground">
                      Informe seu email e enviaremos um link para você redefinir sua senha.
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || inviteProcessing}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {getButtonText()}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>

                  {/* Google OAuth Login */}
                  {view !== 'forgot-password' && (
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          ou continue com
                        </span>
                      </div>
                    </div>
                  )}

                  {view !== 'forgot-password' && (
                    <GoogleLoginButton
                      redirectTo={`${window.location.origin}/auth${inviteToken ? `?invite=${inviteToken}` : ''}`}
                      className="border-border hover:bg-muted/50"
                    />
                  )}
                </form>

                <div className="mt-6 text-center space-y-3">
                  {view === 'forgot-password' ? (
                    <button
                      onClick={() => setView('login')}
                      className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar para login
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {view === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
                      </button>
                      {!inviteToken && (
                        <button
                          onClick={handleBackToPortals}
                          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Trocar portal
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
