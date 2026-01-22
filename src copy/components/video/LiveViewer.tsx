import { useState, useEffect } from 'react';
import {
  Radio,
  Heart,
  Share2,
  Users,
  User,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { VideoPlayer } from './VideoPlayer';
import { LiveChatAdvanced } from './LiveChatAdvanced';

interface LiveData {
  id: string;
  title: string;
  description: string;
  storage_url: string;
  status: string;
  views_count: number;
  likes_count: number;
  live_started_at: string;
  user?: {
    name: string;
    avatar_url: string;
  };
}

interface LiveViewerProps {
  liveId: string;
}

export function LiveViewer({ liveId }: LiveViewerProps) {
  const { user } = useAuth();
  const [live, setLive] = useState<LiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
    fetchLive();
    recordView();
    subscribeToLiveUpdates();
  }, [liveId]);

  const fetchLive = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', liveId)
        .single();

      if (error) throw error;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', data.user_id)
        .single();

      setLive({
        ...data,
        user: profile || undefined,
      } as LiveData);

      // Check if liked
      if (user) {
        const { data: likeData } = await supabase
          .from('video_likes')
          .select('id')
          .eq('video_id', liveId)
          .eq('user_id', user.id)
          .single();
        
        setIsLiked(!!likeData);
      }
    } catch (error) {
      console.error('Error fetching live:', error);
      toast.error('Live não encontrada');
    } finally {
      setIsLoading(false);
    }
  };

  const recordView = async () => {
    try {
      await supabase
        .from('video_views')
        .insert({
          video_id: liveId,
          user_id: user?.id,
        });
    } catch (error) {
      // Ignore duplicate view errors
    }
  };

  const subscribeToLiveUpdates = () => {
    // Subscribe to live status updates only (chat is handled by LiveChatAdvanced)
    const liveChannel = supabase
      .channel(`live_status:${liveId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `id=eq.${liveId}`,
        },
        (payload) => {
          setLive(prev => prev ? { ...prev, ...payload.new } : null);
          if (payload.new.status === 'ended') {
            toast.info('A live foi encerrada');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(liveChannel);
    };
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Faça login para curtir');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', liveId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('video_likes')
          .insert({ video_id: liveId, user_id: user.id });
      }

      setIsLiked(!isLiked);
      setLive(prev => prev ? {
        ...prev,
        likes_count: prev.likes_count + (isLiked ? -1 : 1)
      } : null);
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: live?.title,
          url,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    
    if (hrs > 0) return `${hrs}h ${mins}min`;
    return `${mins}min`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!live) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-8 text-center">
        <p className="text-xl mb-4">Live não encontrada</p>
        <Button onClick={() => window.history.back()}>Voltar</Button>
      </div>
    );
  }

  const isLiveNow = live.status === 'live';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-3 gap-0">
          {/* Video Area */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video bg-black">
              {isLiveNow && live.storage_url ? (
                <video
                  src={live.storage_url}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : live.storage_url ? (
                <VideoPlayer src={live.storage_url} title={live.title} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white">Stream não disponível</p>
                </div>
              )}

              {/* Live Badge */}
              {isLiveNow && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Badge variant="destructive" className="animate-pulse gap-1">
                    <Radio className="h-3 w-3" />
                    AO VIVO
                  </Badge>
                  <Badge variant="secondary">
                    {formatDuration(live.live_started_at)}
                  </Badge>
                </div>
              )}

              {/* Viewer Count */}
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {live.views_count}
                </Badge>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-xl font-bold mb-2">{live.title}</h1>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={live.user?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{live.user?.name || 'Usuário'}</p>
                      <p className="text-sm text-muted-foreground">
                        {isLiveNow ? 'Transmitindo agora' : 'Gravação'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={isLiked ? 'default' : 'outline'}
                    onClick={handleLike}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {live.likes_count}
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                  <Button
                    variant="outline"
                    className="lg:hidden"
                    onClick={() => setIsChatOpen(!isChatOpen)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {live.description && (
                <p className="text-muted-foreground">{live.description}</p>
              )}
            </div>
          </div>

          {/* Chat Sidebar - Using Advanced Chat Component */}
          <div className={`lg:block ${isChatOpen ? 'block' : 'hidden'} lg:border-l`}>
            <LiveChatAdvanced
              liveId={liveId}
              isLive={isLiveNow}
              viewerCount={viewerCount}
              className="h-[600px] lg:h-screen"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
