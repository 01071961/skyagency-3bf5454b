import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Facebook,
  Instagram,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  Send,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/auth/context/AuthContext';

interface SocialConnection {
  id: string;
  platform: 'facebook' | 'instagram' | 'whatsapp';
  platform_name: string;
  platform_username?: string;
  profile_picture_url?: string;
  page_name?: string;
  permissions: string[];
  connected_at: string;
  last_sync_at?: string;
}

interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  timestamp: string;
  permalink: string;
}

// WhatsApp icon component (green)
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const SocialConnections = () => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [instagramFeed, setInstagramFeed] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const { toast } = useToast();
  const { session } = useAuthContext();

  const platformConfig = {
    facebook: {
      icon: Facebook,
      name: 'Facebook',
      displayName: 'Sky Streamer',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
      description: 'Publique em páginas e gerencie posts automaticamente',
    },
    instagram: {
      icon: Instagram,
      name: 'Instagram',
      displayName: '@skystreamer.online',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-500/30',
      permissions: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
      description: 'Publique fotos, vídeos e stories no seu perfil profissional',
    },
    whatsapp: {
      icon: WhatsAppIcon,
      name: 'WhatsApp Business',
      displayName: 'Daniel Moreira - Sky Agencya',
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      permissions: ['whatsapp_business_messaging', 'whatsapp_business_management'],
      description: 'Envie mensagens e notificações via WhatsApp Business',
    },
  };

  const loadConnections = useCallback(async () => {
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('social-oauth', {
        body: { action: 'get_connections' },
      });

      if (error) throw error;
      setConnections(data.connections || []);
      
      // Check if WhatsApp has stored credentials
      const hasWhatsapp = data.connections?.some((c: SocialConnection) => c.platform === 'whatsapp');
      setWhatsappConnected(hasWhatsapp);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const loadInstagramFeed = async () => {
    if (!session?.access_token) return;

    setLoadingFeed(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-oauth', {
        body: { action: 'get_instagram_feed' },
      });

      if (error) throw error;
      setInstagramFeed(data.feed || []);
    } catch (error) {
      console.error('Error loading Instagram feed:', error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleConnect = async (platform: 'facebook' | 'instagram' | 'whatsapp') => {
    if (!session?.access_token) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para conectar contas.',
        variant: 'destructive',
      });
      return;
    }

    setConnectingPlatform(platform);

    try {
      // Use pre-configured System User Token for all platforms
      const { data, error } = await supabase.functions.invoke('social-oauth', {
        body: { 
          action: 'connect_system_user', 
          platform,
        },
      });

      if (error) {
        console.error('Connection error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Conta conectada!',
        description: `${platformConfig[platform].name} conectado com sucesso${data.user?.name ? ` como ${data.user.name}` : ''}`,
      });

      if (platform === 'whatsapp') {
        setWhatsappConnected(true);
      }

      // Reload connections
      loadConnections();

      // Load Instagram feed if connected
      if (platform === 'instagram') {
        loadInstagramFeed();
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      toast({
        title: 'Erro ao conectar',
        description: error.message || 'Não foi possível conectar. Verifique as configurações.',
        variant: 'destructive',
      });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleOAuthCallback = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const isCallback = urlParams.get('oauth_callback');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      const errorDesc = urlParams.get('error_description');
      window.history.replaceState({}, document.title, '/admin');
      toast({
        title: 'Conexão cancelada',
        description: errorDesc || 'O usuário cancelou a autorização.',
        variant: 'destructive',
      });
      return;
    }

    if (!code || !isCallback) return;

    const savedState = localStorage.getItem('oauth_state');
    const platform = localStorage.getItem('oauth_platform') as 'facebook' | 'instagram';
    const redirectUri = localStorage.getItem('oauth_redirect_uri');

    // Clean URL immediately
    window.history.replaceState({}, document.title, '/admin');

    if (state !== savedState) {
      toast({
        title: 'Erro de segurança',
        description: 'O estado da requisição não corresponde. Tente novamente.',
        variant: 'destructive',
      });
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_platform');
      localStorage.removeItem('oauth_redirect_uri');
      return;
    }

    setConnectingPlatform(platform);

    try {
      const { data, error } = await supabase.functions.invoke('social-oauth', {
        body: { 
          action: 'exchange_token', 
          platform,
          code,
          redirectUri,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Erro ao conectar',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Conta conectada!',
        description: `${platformConfig[platform].name} conectado com sucesso como ${data.user?.name || data.user?.username}`,
      });

      // Reload connections
      loadConnections();

      // Load Instagram feed if connected
      if (platform === 'instagram') {
        loadInstagramFeed();
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível completar a conexão. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setConnectingPlatform(null);
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_platform');
      localStorage.removeItem('oauth_redirect_uri');
    }
  }, [loadConnections, toast]);

  useEffect(() => {
    handleOAuthCallback();
  }, [handleOAuthCallback]);

  const handleDisconnect = async (platform: string) => {
    try {
      const { error } = await supabase.functions.invoke('social-oauth', {
        body: { action: 'disconnect', platform },
      });

      if (error) throw error;

      if (platform === 'whatsapp') {
        setWhatsappConnected(false);
      }

      toast({
        title: 'Desconectado',
        description: `${platformConfig[platform as keyof typeof platformConfig].name} foi desconectado.`,
      });

      loadConnections();
      if (platform === 'instagram') {
        setInstagramFeed([]);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível desconectar a conta.',
        variant: 'destructive',
      });
    }
  };

  const getConnection = (platform: string) => 
    connections.find(c => c.platform === platform);

  const renderPlatformCard = (platform: 'facebook' | 'instagram' | 'whatsapp') => {
    const config = platformConfig[platform];
    const connection = getConnection(platform);
    const Icon = config.icon;
    const isConnecting = connectingPlatform === platform;
    const isConnected = connection || (platform === 'whatsapp' && whatsappConnected);

    return (
      <motion.div
        key={platform}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: platform === 'facebook' ? 0 : platform === 'instagram' ? 0.1 : 0.2 }}
        className="w-full"
      >
        <GlassCard className={`p-4 sm:p-6 ${isConnected ? 'border-green-500/30' : config.borderColor}`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl ${config.bgColor} shrink-0`}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold flex flex-wrap items-center gap-2">
                  <span className="truncate">{config.name}</span>
                  {isConnected && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {isConnected 
                    ? (connection?.platform_name || connection?.platform_username || config.displayName)
                    : config.description
                  }
                </p>
              </div>
            </div>
            {connection?.profile_picture_url && (
              <img
                src={connection.profile_picture_url}
                alt={connection.platform_name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/20 shrink-0 self-start"
              />
            )}
          </div>

          {/* Permissions */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Permissões necessárias:</p>
            <div className="flex flex-wrap gap-1">
              {config.permissions.map(perm => (
                <Badge 
                  key={perm} 
                  variant="outline" 
                  className={`text-xs ${isConnected ? 'border-green-500/30 text-green-400' : ''}`}
                >
                  {isConnected && <CheckCircle className="h-2 w-2 mr-1" />}
                  {perm}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadConnections()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden xs:inline">Sincronizar</span>
                </Button>
                {platform === 'instagram' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadInstagramFeed}
                    disabled={loadingFeed}
                    className="gap-2"
                  >
                    {loadingFeed ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    <span className="hidden xs:inline">Ver Posts</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(platform)}
                  className="text-destructive hover:text-destructive"
                >
                  Desconectar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleConnect(platform)}
                disabled={isConnecting}
                className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
                size="lg"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                Conectar
              </Button>
            )}
          </div>

          {/* WhatsApp special instructions */}
          {platform === 'whatsapp' && !isConnected && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-2">
                <Smartphone className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                <p className="text-xs text-green-400">
                  Clique em Conectar para vincular automaticamente sua conta WhatsApp Business via API oficial da Meta.
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <GlassCard className="p-3 sm:p-4 text-center">
          <Facebook className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-xs text-muted-foreground">Facebook</p>
          <p className="text-sm font-semibold text-blue-400">
            {getConnection('facebook') ? 'Conectado' : 'Desconectado'}
          </p>
        </GlassCard>
        <GlassCard className="p-3 sm:p-4 text-center">
          <Instagram className="h-5 w-5 mx-auto mb-1 text-pink-500" />
          <p className="text-xs text-muted-foreground">Instagram</p>
          <p className="text-sm font-semibold text-pink-400">
            {getConnection('instagram') ? 'Conectado' : 'Desconectado'}
          </p>
        </GlassCard>
        <GlassCard className="p-3 sm:p-4 text-center">
          <WhatsAppIcon className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-xs text-muted-foreground">WhatsApp</p>
          <p className="text-sm font-semibold text-green-400">
            {whatsappConnected || getConnection('whatsapp') ? 'Conectado' : 'Desconectado'}
          </p>
        </GlassCard>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {renderPlatformCard('facebook')}
        {renderPlatformCard('instagram')}
        {renderPlatformCard('whatsapp')}
      </div>

      {/* Instagram Feed Preview */}
      {instagramFeed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              Últimos Posts do Instagram
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {instagramFeed.slice(0, 12).map(post => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <img
                    src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                    alt={post.caption?.slice(0, 50) || 'Instagram post'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  {post.media_type === 'VIDEO' && (
                    <div className="absolute top-2 right-2 bg-black/50 rounded px-1">
                      <span className="text-xs text-white">▶</span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Help Card */}
      <GlassCard className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h4 className="font-medium">Configuração Segura</h4>
            <p className="text-sm text-muted-foreground mt-1">
              O App ID e App Secret são armazenados de forma segura no servidor. 
              Nenhuma credencial sensível é exposta no frontend.
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Tokens são renovados automaticamente antes de expirar</li>
              <li>Conexões podem ser revogadas a qualquer momento</li>
              <li>Dados são criptografados em trânsito e em repouso</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SocialConnections;
