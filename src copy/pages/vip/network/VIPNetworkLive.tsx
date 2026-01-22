import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Eye, MessageCircle, Heart, Share2, Plus, Users, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { VIPLiveChat } from '@/components/vip/social/VIPLiveChat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LivePost {
  id: string;
  title: string;
  content: string | null;
  author_id: string;
  views_count: number;
  likes_count: number;
  live_started_at: string | null;
  author?: {
    name: string | null;
    avatar_url: string | null;
  };
}

export default function VIPNetworkLive() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lives, setLives] = useState<LivePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLive, setSelectedLive] = useState<LivePost | null>(null);

  useEffect(() => {
    fetchLives();

    // Realtime subscription for lives
    const channel = supabase
      .channel('live-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vip_posts', filter: 'is_live=eq.true' },
        () => {
          fetchLives();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLives = async () => {
    try {
      const { data, error } = await supabase
        .from('vip_posts')
        .select('*')
        .eq('is_live', true)
        .order('live_started_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch author profiles
        const authorIds = [...new Set(data.map(p => p.author_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', authorIds);

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const livesWithAuthors = data.map(post => ({
          ...post,
          author: profilesMap.get(post.author_id) || null,
        }));

        setLives(livesWithAuthors);
        if (!selectedLive && livesWithAuthors.length > 0) {
          setSelectedLive(livesWithAuthors[0]);
        }
      } else {
        setLives([]);
      }
    } catch (error) {
      console.error('Error fetching lives:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 animate-pulse">
            <Radio className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Ao Vivo
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </h1>
            <p className="text-muted-foreground">Transmissões acontecendo agora</p>
          </div>
        </div>

        <Button 
          onClick={() => navigate('/vip/network/live/create')}
          className="bg-red-500 hover:bg-red-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Iniciar Live
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : lives.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Radio className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma live ativa</h3>
            <p className="text-muted-foreground mb-6">
              Não há transmissões ao vivo no momento. Seja o primeiro a iniciar uma!
            </p>
            <Button 
              onClick={() => navigate('/vip/network/live/create')}
              className="bg-red-500 hover:bg-red-600"
            >
              <Radio className="h-4 w-4 mr-2" />
              Iniciar Minha Live
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  {selectedLive ? (
                    <>
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/30 to-pink-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <Radio className="h-12 w-12 text-red-500" />
                        </div>
                        <p className="text-white font-medium text-lg">{selectedLive.title}</p>
                        <p className="text-white/50 text-sm">Transmissão em andamento</p>
                      </div>
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge variant="destructive" className="gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          AO VIVO
                        </Badge>
                        {selectedLive.live_started_at && (
                          <Badge variant="secondary">
                            {formatDistanceToNow(new Date(selectedLive.live_started_at), { locale: ptBR })}
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="gap-1">
                          <Eye className="h-3 w-3" />
                          {selectedLive.views_count}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <Radio className="h-16 w-16 text-red-500 mb-4 mx-auto" />
                      <p className="text-white/70">Selecione uma live para assistir</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live Info */}
            {selectedLive && (
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedLive.author?.avatar_url || ''} />
                  <AvatarFallback>
                    {(selectedLive.author?.name || 'U')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-semibold text-lg">{selectedLive.title}</h2>
                  <p className="text-muted-foreground text-sm">
                    {selectedLive.author?.name || 'Usuário'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Heart className="h-4 w-4" />
                    {selectedLive.likes_count}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>
              </div>
            )}

            {/* Other Lives */}
            {lives.length > 1 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Outras Lives</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lives.filter(l => l.id !== selectedLive?.id).map(live => (
                    <Card 
                      key={live.id}
                      className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
                      onClick={() => setSelectedLive(live)}
                    >
                      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                        <Radio className="h-8 w-8 text-red-500/50" />
                        <Badge variant="destructive" className="absolute top-2 left-2 text-[10px] px-1.5 py-0 animate-pulse">
                          AO VIVO
                        </Badge>
                        <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1.5 py-0 gap-1">
                          <Eye className="h-2.5 w-2.5" />
                          {live.views_count}
                        </Badge>
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs font-medium line-clamp-1">{live.title}</p>
                        <p className="text-[10px] text-muted-foreground">{live.author?.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            {selectedLive ? (
              <VIPLiveChat postId={selectedLive.id} isHost={selectedLive.author_id === user?.id} />
            ) : (
              <Card className="h-[600px]">
                <div className="p-4 border-b flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Chat ao Vivo</span>
                </div>
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                  <div>
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">
                      Selecione uma live para participar do chat
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
