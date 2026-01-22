import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Eye, Heart, Share2, ArrowLeft, Loader2, AlertCircle, Users, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { VIPLiveChat } from '@/components/vip/social/VIPLiveChat';
import { useViewer } from '@/hooks/useWebRTCLive';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface LivePost {
  id: string;
  title: string;
  content: string | null;
  author_id: string;
  views_count: number;
  likes_count: number;
  is_live: boolean;
  live_started_at: string | null;
  media_url: string | null;
  author?: {
    name: string | null;
    avatar_url: string | null;
  };
}

export default function VIPNetworkLiveWatch() {
  const { liveId } = useParams<{ liveId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [live, setLive] = useState<LivePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // WebRTC viewer hook
  const { remoteStream, isConnecting, isConnected, error, connect, disconnect } = useViewer(liveId || '');

  useEffect(() => {
    if (liveId) {
      fetchLive();
      recordView();
    }
  }, [liveId]);

  // Connect video element to remote stream
  useEffect(() => {
    if (remoteStream && videoRef.current) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto-connect when live is active
  useEffect(() => {
    if (live?.is_live && !isConnected && !isConnecting) {
      connect();
    }
  }, [live?.is_live, isConnected, isConnecting, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const fetchLive = async () => {
    if (!liveId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('vip_posts')
        .select('*')
        .eq('id', liveId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Fetch author profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .eq('user_id', data.author_id)
          .single();

        setLive({
          ...data,
          author: profile || null,
        });

        // Check if user liked
        if (user) {
          const { data: likeData } = await supabase
            .from('vip_reactions')
            .select('id')
            .eq('post_id', liveId)
            .eq('user_id', user.id)
            .single();

          setLiked(!!likeData);
        }
      }
    } catch (err) {
      console.error('Error fetching live:', err);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async () => {
    if (!liveId) return;

    try {
      // Increment view count directly
      await supabase
        .from('vip_posts')
        .update({ views_count: (live?.views_count || 0) + 1 })
        .eq('id', liveId);
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  const handleLike = async () => {
    if (!user || !liveId) {
      toast.error('Faça login para curtir');
      return;
    }

    try {
      if (liked) {
        await supabase
          .from('vip_reactions')
          .delete()
          .eq('post_id', liveId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('vip_reactions')
          .insert({
            post_id: liveId,
            user_id: user.id,
            reaction_type: 'like'
          });
      }
      setLiked(!liked);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const handleRetry = () => {
    disconnect();
    setTimeout(() => connect(), 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!live) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Live não encontrada</h2>
        <p className="text-muted-foreground mb-4">
          Esta transmissão pode ter sido encerrada ou removida.
        </p>
        <Button onClick={() => navigate('/vip/network/live')}>
          Ver outras lives
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/vip/network/live')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20">
          <Radio className="h-6 w-6 text-red-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold line-clamp-1">{live.title}</h1>
          <p className="text-sm text-muted-foreground">
            {live.author?.name || 'Usuário'}
          </p>
        </div>
        {live.is_live && (
          <Badge variant="destructive" className="animate-pulse gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            AO VIVO
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black">
                {live.is_live ? (
                  <>
                    {isConnected && remoteStream ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white">
                        {isConnecting ? (
                          <>
                            <Loader2 className="h-12 w-12 animate-spin mb-4" />
                            <p>Conectando à transmissão...</p>
                          </>
                        ) : error ? (
                          <>
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <p className="text-red-400 mb-4">{error}</p>
                            <Button onClick={handleRetry} variant="outline">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Tentar novamente
                            </Button>
                          </>
                        ) : (
                          <>
                            <Radio className="h-12 w-12 text-red-500 mb-4 animate-pulse" />
                            <p className="mb-4">Aguardando transmissão...</p>
                            <Button onClick={connect} variant="secondary">
                              Conectar
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Live badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge variant="destructive" className="animate-pulse gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        AO VIVO
                      </Badge>
                      {live.live_started_at && (
                        <Badge variant="secondary">
                          {formatDistanceToNow(new Date(live.live_started_at), { locale: ptBR })}
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="gap-1">
                        <Eye className="h-3 w-3" />
                        {live.views_count}
                      </Badge>
                    </div>
                  </>
                ) : live.media_url ? (
                  // Recorded video playback
                  <video
                    src={live.media_url}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white">
                    <Radio className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Esta live foi encerrada</p>
                    {live.media_url && (
                      <p className="text-sm text-muted-foreground mt-2">
                        A gravação estará disponível em breve
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={live.author?.avatar_url || ''} />
              <AvatarFallback>
                {(live.author?.name || 'U')[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{live.title}</h2>
              <p className="text-muted-foreground text-sm">
                {live.author?.name || 'Usuário'}
              </p>
              {live.content && (
                <p className="text-sm mt-2">{live.content}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant={liked ? 'default' : 'outline'} 
                size="sm" 
                className="gap-2"
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                {live.likes_count}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <VIPLiveChat postId={live.id} isHost={live.author_id === user?.id} />
        </div>
      </div>
    </motion.div>
  );
}
